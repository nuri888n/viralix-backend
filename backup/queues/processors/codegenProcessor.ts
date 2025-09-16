// FILE: src/queues/processors/codegenProcessor.ts
import { Worker } from "bullmq";
import { agentConnection } from "../agentQueue";
import { codegenAgent } from "../../agents/codegenAgent";

const mockMode = process.env.AGENT_MOCK_MODE === "1";

export const codegenWorker = new Worker(
  "agentQueue",
  async (job) => {
    if (job.name !== "codegen") return;
    try {
      const { description, inputs } = job.data as {
        description: string;
        inputs?: Record<string, unknown>;
      };
      const result = await codegenAgent({ description, inputs });
      console.log(
        `🧰 [codegen] ${mockMode ? "(simuliert) " : ""}Datei ${mockMode ? "würde" : "geschrieben"}: ${result.file}`
      );
      return result;
    } catch (error) {
      console.error("🧰 [codegen] Fehler:", error);
      throw error;
    }
  },
  { connection: agentConnection, concurrency: 2 }
);
