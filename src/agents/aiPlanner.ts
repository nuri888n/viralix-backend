// src/agents/aiPlanner.ts
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { enqueuePublish } from "../queues/agentQueue";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = process.env.ANTHROPIC_MODEL || "claude-4-opus-20240229";
const MAX_STEPS = Number(process.env.MAX_TOOL_STEPS || 3);

// --------- kompatible lokale Typen (wie bei dir) ----------
type ToolInputSchema =
  | {
      type: "object";
      properties: Record<string,
        | { type: "string" | "number" | "boolean" }
        | { type: "array"; items: { type: "number" | "string" } }
      >;
      required?: string[];
      additionalProperties?: boolean;
    }
  | any;

type Tool = { name: string; description: string; input_schema: ToolInputSchema };
type TextBlock = { type: "text"; text: string };
type ToolUseBlock = { type: "tool_use"; id: string; name: string; input: unknown };
type ContentBlock = TextBlock | ToolUseBlock;
type MessageParam = { role: "user" | "assistant"; content: ContentBlock[] | { type: "text"; text: string } | string };

// ---------------- Zod Schemas ----------------
const CreateProjectInput = z.object({ name: z.string() });
const CreateAccountInput = z.object({
  handle: z.string(),
  platform: z.enum(["INSTAGRAM", "TIKTOK"]),
  userId: z.number().default(1),
});
const ListAccountsInput = z.object({ userId: z.number().default(1) });

const CreatePostInput = z.object({ caption: z.string(), projectId: z.number() });
const LinkAccountsInput = z.object({
  postId: z.number(),
  accountIds: z.array(z.number()),
  mode: z.enum(["append", "replace"]).default("append"),
});

const DraftCaptionInput = z.object({
  topic: z.string(),
  tone: z.enum(["neutral", "fun", "serious"]).default("neutral"),
  maxChars: z.number().default(200),
});

const SchedulePostInput = z.object({
  postId: z.number(),
  runAtISO: z.string(), // ISO String
});

// -------- JSON Schemas für Tools ------------
const jsonObj = (properties: ToolInputSchema["properties"], required: string[]): ToolInputSchema =>
  ({ type: "object", properties, required, additionalProperties: false });

const CreateProjectSchema = jsonObj({ name: { type: "string" } }, ["name"]);
const CreateAccountSchema = jsonObj(
  { handle: { type: "string" }, platform: { type: "string" }, userId: { type: "number" } },
  ["handle", "platform"]
);
const ListAccountsSchema   = jsonObj({ userId: { type: "number" } }, []);
const CreatePostSchema     = jsonObj({ caption: { type: "string" }, projectId: { type: "number" } }, ["caption","projectId"]);
const LinkAccountsSchema   = jsonObj({ postId: { type: "number" },
                                      accountIds: { type: "array", items: { type: "number" } },
                                      mode: { type: "string" } }, ["postId", "accountIds"]);
const DraftCaptionSchema   = jsonObj({ topic: { type: "string" }, tone: { type: "string" }, maxChars: { type: "number" } }, ["topic"]);
const SchedulePostSchema   = jsonObj({ postId: { type: "number" }, runAtISO: { type: "string" } }, ["postId","runAtISO"]);

// ---------------- Haupt-Agent ----------------
export async function runPlanningAgent(
  prisma: PrismaClient,
  params: { goal: string; projectId: number }
) {
  const { goal, projectId } = params;

  const tools: Tool[] = [
    { name: "create_project",     description: "Create a project", input_schema: CreateProjectSchema },
    { name: "create_account",     description: "Create a social account for user", input_schema: CreateAccountSchema },
    { name: "list_accounts",      description: "List user accounts", input_schema: ListAccountsSchema },
    { name: "create_post",        description: "Create a new post in a project", input_schema: CreatePostSchema },
    { name: "link_post_accounts", description: "Attach/replace accounts to a post", input_schema: LinkAccountsSchema },
    { name: "draft_caption",      description: "Suggest a caption", input_schema: DraftCaptionSchema },
    { name: "schedule_post",      description: "Schedule post publish job", input_schema: SchedulePostSchema },
  ];

  const system = "You are Viralix planner. Only call provided tools. Never invent IDs. \
Prefer append linking unless explicitly asked to replace. Ask for missing info briefly.";

  const messages: MessageParam[] = [
    { role: "user", content: [{ type: "text", text: system }] },
    { role: "user", content: [{ type: "text", text: `Plan this task: ${goal} for project ${projectId}` }] },
  ];

  let last: any = null;

  for (let i = 0; i < MAX_STEPS; i++) {
    const resp: any = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      tools: tools as any,
      messages: messages as any,
    });

    last = resp;
    const content: ContentBlock[] = Array.isArray(resp?.content) ? resp.content : [];
    const toolCalls = content.filter((c): c is ToolUseBlock => (c as any)?.type === "tool_use");

    if (!toolCalls.length) {
      const text = content.filter((c): c is TextBlock => (c as any)?.type === "text")
                          .map(t => t.text).join("\n");
      return { done: true, response: text, raw: resp };
    }

    const results: any[] = [];
    for (const call of toolCalls) {
      const out = await executeTool(prisma, call.name, call.input);
      results.push({ type: "tool_result", tool_use_id: call.id,
                     content: [{ type: "text", text: JSON.stringify(out) }] });
    }

    messages.push({ role: "assistant", content });
    messages.push({ role: "user", content: results as any });
  }

  return { done: false, response: "Max tool iterations reached.", raw: last };
}

// ---------------- Tool-Handler (DB + Worker) ----------------
async function executeTool(prisma: PrismaClient, name: string, args: unknown) {
  switch (name) {
    case "create_project": {
      const input = CreateProjectInput.parse(args);
      const project = await prisma.project.create({ data: { name: input.name, userId: 1 } });
      return { ok: true, project };
    }
    case "create_account": {
      const input = CreateAccountInput.parse(args);
      const account = await prisma.account.create({
        data: { handle: input.handle, platform: input.platform, userId: input.userId },
      });
      return { ok: true, account };
    }
    case "list_accounts": {
      const input = ListAccountsInput.parse(args);
      const accounts = await prisma.account.findMany({ where: { userId: input.userId } });
      return { ok: true, accounts };
    }
    case "create_post": {
      const input = CreatePostInput.parse(args);
      const post = await prisma.post.create({ data: { caption: input.caption, projectId: input.projectId } });
      return { ok: true, post };
    }
    case "link_post_accounts": {
      const input = LinkAccountsInput.parse(args);
      const post = await prisma.post.update({
        where: { id: input.postId },
        data: {
          accounts: input.mode === "replace"
            ? { set: input.accountIds.map((id) => ({ id })) }
            : { connect: input.accountIds.map((id) => ({ id })) },
        },
        include: { accounts: true, project: true },
      });
      return { ok: true, post };
    }
    case "draft_caption": {
      const input = DraftCaptionInput.parse(args);
      const prompt = `Write a ${input.tone} social caption about "${input.topic}" in max ${input.maxChars} characters. No hashtags.`;
      const resp: any = await client.messages.create({
        model: MODEL,
        max_tokens: 200,
        messages: [{ role: "user", content: [{ type: "text", text: prompt }] }] as any,
      });
      const text = Array.isArray(resp?.content) ? resp.content.filter((c: any) => c.type === "text").map((t: any) => t.text).join("\n") : "";
      return { ok: true, caption: text.trim() };
    }
    case "schedule_post": {
      const input = SchedulePostInput.parse(args);
      const job = await enqueuePublish(input.postId, input.runAtISO);
      return { ok: true, jobId: job.id };
    }
    default:
      return { ok: false, error: `Unknown tool: ${name}` };
  }
}