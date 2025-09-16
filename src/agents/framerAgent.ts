// FILE: src/agents/framerAgent.ts
import Anthropic from "@anthropic-ai/sdk";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export interface FramerAgentInput {
  description: string;
  inputs?: Record<string, unknown>;
}

export interface FramerAgentResult {
  files: string[];
}

const systemPrompt =
  "Integrations-Engineer. Antworte mit einem Codeblock, der mehrere Dateien enthält. Für jede Datei eigener // FILE: Header. Enthält src/routes/pay.ts + README_FRAMER.md mit Instruktionen (Redirect zu /thank-you, Webhook URL /api/pay/webhook, SSO-Flow).";

const codeBlockRegex = /```(?:md|markdown|ts|typescript)?\n([\s\S]*?)```/i;
const headerRegex = /^\/\/\s*FILE:\s*(.+)$/m;
const whitelistPatterns = [
  /^src\/routes\/.+\.ts$/,
  /^README_FRAMER\.md$/,
];

const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

const anthropicModel = process.env.ANTHROPIC_MODEL || "claude-3-7-sonnet-20250219";
const mockMode = process.env.AGENT_MOCK_MODE === "1";

function ensureAllowedPath(relativePath: string) {
  const normalized = path.posix.normalize(relativePath.trim());
  if (!normalized || path.isAbsolute(normalized) || normalized.startsWith("../")) {
    throw new Error(`Ungültiger Pfad: ${relativePath}`);
  }
  const isAllowed = whitelistPatterns.some((pattern) => pattern.test(normalized));
  if (!isAllowed) {
    throw new Error(`Pfad nicht erlaubt: ${normalized}`);
  }
  return normalized;
}

async function persistFile(relativePath: string, contents: string) {
  const absolute = path.join(process.cwd(), relativePath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, contents.endsWith("\n") ? contents : `${contents}\n`, "utf8");
}

interface ExtractedFile {
  relativePath: string;
  contents: string;
}

function extractFiles(raw: string): ExtractedFile[] {
  const match = raw.match(codeBlockRegex);
  if (!match) throw new Error("Antwort enthielt keinen Codeblock");
  const block = match[1];
  const sections = block.split(/\n(?=\/\/\s*FILE:)/).map((section) => section.trim()).filter(Boolean);
  const files: ExtractedFile[] = [];
  for (const section of sections) {
    const headerMatch = section.match(headerRegex);
    if (!headerMatch) {
      throw new Error("Abschnitt ohne // FILE:-Header gefunden");
    }
    const relativePath = ensureAllowedPath(headerMatch[1]);
    const contents = section.split(/\r?\n/).slice(1).join("\n");
    files.push({ relativePath, contents });
  }
  return files;
}

export async function framerAgent(input: FramerAgentInput): Promise<FramerAgentResult> {
  if (mockMode) {
    console.log("framerAgent (mock): würde Zahlungsintegration erzeugen");
    return { files: ["mock://framer/pay", "mock://framer/readme"] };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Framer-Agent benötigt ANTHROPIC_API_KEY");
  }

  const response = await anthropicClient.messages.create({
    model: anthropicModel,
    max_tokens: 2048,
    temperature: 0.3,
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

  const files = extractFiles(rawText);
  const written: string[] = [];
  for (const file of files) {
    await persistFile(file.relativePath, file.contents);
    written.push(file.relativePath);
  }
  return { files: written };
}
