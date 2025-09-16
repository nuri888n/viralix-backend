// FILE: src/tools/captions.ts
import { z } from "zod";

export const inputSchema = z.object({
  topic: z.string().min(3, "Topic muss mindestens 3 Zeichen haben"),
  tone: z.enum(["neutral", "fun", "serious"]).optional().default("neutral"),
});

export type CaptionsInput = z.infer<typeof inputSchema>;

export interface CaptionsResult {
  caption: string;
}

function buildCaption({ topic, tone }: CaptionsInput): string {
  const tonePrefix: Record<string, string> = {
    neutral: "Quick take",
    fun: "Let’s go",
    serious: "Deep focus",
  };
  const prefix = tonePrefix[tone] || tonePrefix.neutral;
  return `${prefix}: ${topic} — ${tone === "fun" ? "🔥" : tone === "serious" ? "💪" : "✅"}`;
}

export async function run(rawInput: unknown): Promise<CaptionsResult> {
  const input = inputSchema.parse(rawInput);
  return { caption: buildCaption(input) };
}
