// FILE: src/orchestration/runAgent.ts
import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/messages.js";

export interface RunAgentRequest {
  system: string;
  messages: MessageParam[];
  maxOutputTokens?: number;
  temperature?: number;
}

export interface RunAgentResponse {
  text: string;
}

const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

const defaultModel = process.env.ANTHROPIC_MODEL || "claude-3-7-sonnet-20250219";

export async function runAgent({
  system,
  messages,
  maxOutputTokens = 1024,
  temperature = 0,
}: RunAgentRequest): Promise<RunAgentResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("runAgent erfordert ANTHROPIC_API_KEY");
  }

  const response = await anthropicClient.messages.create({
    model: defaultModel,
    system,
    messages,
    max_tokens: maxOutputTokens,
    temperature,
  });

  const text = response.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("\n")
    .trim();

  return { text };
}
