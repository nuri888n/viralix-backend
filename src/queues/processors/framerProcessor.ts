// FILE: src/queues/processors/framerProcessor.ts
import { Worker } from "bullmq";
import { agentConnection } from "../agentQueue";
import { framerAgent } from "../../agents/framerAgent";

const mockMode = process.env.AGENT_MOCK_MODE === "1";

export const framerWorker = new Worker(
  "agentQueue",
  async (job) => {
    if (job.name !== "framer") return;
    try {
      const { description, inputs } = job.data as {
        description: string;
        inputs?: Record<string, unknown>;
      };
      const result = await framerAgent({ description, inputs });
      result.files.forEach((file) =>
        console.log(
          `💳 [framer] ${mockMode ? "(simuliert) " : ""}Datei ${mockMode ? "würde" : "geschrieben"}: ${file}`
        )
      );
      return result;
    } catch (error) {
      console.error("💳 [framer] Fehler:", error);
      throw error;
    }
  },
  { connection: agentConnection, concurrency: 1 }
);
