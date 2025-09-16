// FILE: src/agents/plannerAgent.ts
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const StepSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["codegen", "frontend", "framer", "content"] as const),
  description: z.string().min(1),
  inputs: z.record(z.string(), z.unknown()).optional(),
});

const PlanSchema = z.object({
  steps: z.array(StepSchema).min(1, "Planner must return at least one step"),
});

export type PlanStep = z.infer<typeof StepSchema>;
export type Plan = z.infer<typeof PlanSchema>;

const anthropicModel = process.env.ANTHROPIC_MODEL || "claude-3-7-sonnet-20250219";
const mockMode = process.env.AGENT_MOCK_MODE === "1";

const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

const systemPrompt =
  "Du bist ein Workflow-Planner. Liefere nur JSON { steps:[ {id, type in (codegen|frontend|framer|content), description, inputs?} ] }. Keine Erklärungen.";

function fallbackPlan(goal: string): Plan {
  return {
    steps: [
      {
        id: "codegen:bootstrap-tool",
        type: "codegen",
        description: `Erstelle notwendigen Code, um Ziel \"${goal}\" zu unterstützen (Tool/Backend).`,
      },
      {
        id: "frontend:update-ui",
        type: "frontend",
        description: `Aktualisiere Frontend-Views, damit Ziel \"${goal}\" erreichbar wird.`,
      },
      {
        id: "framer:sync-payments",
        type: "framer",
        description: "Stelle Zahlungs- und Framer-Integration sicher (Webhook + Dokumentation).",
      },
    ],
  };
}

function extractJsonBlock(text: string): string | null {
  const fence = text.match(/```(?:json)?\n([\s\S]*?)```/i);
  if (fence) return fence[1];

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return null;
}

export async function plannerAgent(goal: string): Promise<Plan> {
  if (mockMode) {
    console.log("plannerAgent: Mock-Modus aktiv – liefere statischen Plan.");
    return fallbackPlan(goal);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("plannerAgent: Missing ANTHROPIC_API_KEY, using fallback plan.");
    return fallbackPlan(goal);
  }

  try {
    const response = await anthropicClient.messages.create({
      model: anthropicModel,
      max_tokens: 1024,
      temperature: 0,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Goal: ${goal}`,
        },
      ],
    });

    const rawText = response.content
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("\n")
      .trim();

    const jsonCandidate = extractJsonBlock(rawText);
    if (!jsonCandidate) {
      throw new Error("Planner response did not contain JSON block");
    }

    const parsed = JSON.parse(jsonCandidate);
    const result = PlanSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`Invalid planner schema: ${result.error.message}`);
    }

    return result.data;
  } catch (error) {
    console.error("plannerAgent error:", error);
    return fallbackPlan(goal);
  }
}
