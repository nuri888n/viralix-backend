// FILE: src/agents/frontendAgent.ts
import Anthropic from "@anthropic-ai/sdk";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export interface FrontendAgentInput {
  description: string;
  inputs?: Record<string, unknown>;
}

export interface FrontendAgentResult {
  file: string;
}

const systemPrompt =
  "Senior React/Vite Engineer. Antworte nur mit tsx/ts. // FILE: Header. Nutze fetch gegen /api in frontend/src/lib/api.ts.";

const codeBlockRegex = /```(?:tsx|ts|typescript)?\n([\s\S]*?)```/i;
const headerRegex = /^\/\/\s*FILE:\s*(.+)$/;
const whitelistPattern = /^frontend\/src\/.+\.(ts|tsx)$/;

const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

const anthropicModel = process.env.ANTHROPIC_MODEL || "claude-3-7-sonnet-20250219";
const mockMode = process.env.AGENT_MOCK_MODE === "1";

function mockFile(description: string, index: number): string {
  const slug = description.substring(0, 32).replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "frontend";
  return `mock://${slug}-${index}`;
}

function ensureAllowedPath(relativePath: string) {
  const normalized = path.posix.normalize(relativePath.trim());
  if (!normalized || path.isAbsolute(normalized) || normalized.startsWith("../")) {
    throw new Error(`Ungültiger Pfad: ${relativePath}`);
  }
  if (!whitelistPattern.test(normalized)) {
    throw new Error(`Pfad nicht erlaubt: ${normalized}`);
  }
  return normalized;
}

async function persistFile(relativePath: string, contents: string) {
  const absolute = path.join(process.cwd(), relativePath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, contents.endsWith("\n") ? contents : `${contents}\n`, "utf8");
}

function extractFileFromResponse(raw: string) {
  const match = raw.match(codeBlockRegex);
  if (!match) throw new Error("Antwort enthielt keinen tsx-Codeblock");
  const block = match[1].trim();
  const lines = block.split(/\r?\n/);
  if (lines.length < 2) throw new Error("Codeblock zu kurz");
  const headerMatch = lines[0].match(headerRegex);
  if (!headerMatch) throw new Error("Header-Zeile fehlt (// FILE: ...)");
  const relativePath = ensureAllowedPath(headerMatch[1]);
  const fileContents = lines.slice(1).join("\n");
  return { relativePath, fileContents };
}

export async function frontendAgent(input: FrontendAgentInput): Promise<FrontendAgentResult[]> {
  if (mockMode) {
    console.log("frontendAgent (mock): würde Frontend-Dateien generieren");
    return [mockFile(input.description, 0)].map((file) => ({ file }));
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Frontend-Agent benötigt ANTHROPIC_API_KEY");
  }

  const response = await anthropicClient.messages.create({
    model: anthropicModel,
    max_tokens: 2048,
    temperature: 0.2,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Aufgabe: ${input.description}\nInputs: ${JSON.stringify(input.inputs ?? {}, null, 2)}`,
      },
    ],
  });

  const rawText = response.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("\n")
    .trim();

  const blocks = rawText
    .split(/```(?:tsx|ts|typescript)?/i)
    .filter((segment) => segment.trim().length > 0)
    .map((segment) => "```" + segment);

  if (blocks.length === 0) {
    throw new Error("Frontend-Antwort enthielt keinen Codeblock");
  }

  const results: FrontendAgentResult[] = [];
  for (const block of blocks) {
    const { relativePath, fileContents } = extractFileFromResponse(block);
    await persistFile(relativePath, fileContents);
    results.push({ file: relativePath });
  }
  return results;
}
