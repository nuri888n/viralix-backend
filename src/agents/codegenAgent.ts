// FILE: src/agents/codegenAgent.ts
import Anthropic from "@anthropic-ai/sdk";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export interface CodegenAgentInput {
  description: string;
  inputs?: Record<string, unknown>;
}

export interface CodegenAgentResult {
  file: string;
}

const systemPrompt =
  "Senior TypeScript Engineer. Antworte nur mit ts Codeblock. Erste Zeile: // FILE: relative/path.ts. Kompletter Dateiinhalt. Keine zusätzlichen Texte.";

const codeBlockRegex = /```(?:ts|typescript|tsx)?\n([\s\S]*?)```/i;
const headerRegex = /^\/\/\s*FILE:\s*(.+)$/;

const whitelistPatterns = [
  /^src\/(queues|agents|orchestration|routes|tools|auth)\/.+\.(ts|tsx)$/,
  /^frontend\/src\/.+\.(ts|tsx)$/,
];

const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

const anthropicModel = process.env.ANTHROPIC_MODEL || "claude-3-7-sonnet-20250219";
const mockMode = process.env.AGENT_MOCK_MODE === "1";

function mockFilePath(description: string): string {
  return `mock://${description.substring(0, 32).replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "codegen"}`;
}

function ensureAllowedPath(relativePath: string) {
  const normalized = path.posix.normalize(relativePath.trim());
  if (!normalized || normalized.startsWith("../") || normalized.includes("..//")) {
    throw new Error(`Ungültiger Pfad aus Antwort: ${relativePath}`);
  }
  if (path.isAbsolute(normalized)) {
    throw new Error("Absoluter Pfad ist nicht erlaubt");
  }

  const isAllowed = whitelistPatterns.some((pattern) => pattern.test(normalized));
  if (!isAllowed) {
    throw new Error(`Pfad nicht in Whitelist: ${normalized}`);
  }
  return normalized;
}

async function persistFile(relativePath: string, contents: string) {
  const absolute = path.join(process.cwd(), relativePath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, contents, "utf8");
}

function extractFileFromResponse(raw: string) {
  const match = raw.match(codeBlockRegex);
  if (!match) {
    throw new Error("Antwort enthielt keinen ts-Codeblock");
  }
  const block = match[1].trim();
  const lines = block.split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error("Codeblock ist zu kurz");
  }
  const headerMatch = lines[0].match(headerRegex);
  if (!headerMatch) {
    throw new Error("Erste Zeile fehlt oder nutzt nicht // FILE:");
  }
  const relativePath = ensureAllowedPath(headerMatch[1]);
  const fileContents = lines.slice(1).join("\n");
  return { relativePath, fileContents };
}

export async function codegenAgent(input: CodegenAgentInput): Promise<CodegenAgentResult> {
  if (mockMode) {
    const file = mockFilePath(input.description);
    console.log(`codegenAgent (mock): würde Datei schreiben -> ${file}`);
    return { file };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Codegen-Agent benötigt ANTHROPIC_API_KEY");
  }

  const response = await anthropicClient.messages.create({
    model: anthropicModel,
    max_tokens: 2048,
    temperature: 0.2,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Aufgabe: ${input.description}\nInputs: ${JSON.stringify(input.inputs ?? {}, null, 2)}`,
          },
        ],
      },
    ],
  });

  const rawText = response.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("\n")
    .trim();

  const { relativePath, fileContents } = extractFileFromResponse(rawText);
  await persistFile(relativePath, fileContents.endsWith("\n") ? fileContents : `${fileContents}\n`);
  return { file: relativePath };
}
