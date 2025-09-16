// FILE: src/queues/processors/frontendProcessor.ts
import { Worker } from "bullmq";
import { agentConnection } from "../agentQueue";
import { frontendAgent } from "../../agents/frontendAgent";

const mockMode = process.env.AGENT_MOCK_MODE === "1";

export const frontendWorker = new Worker(
  "agentQueue",
  async (job) => {
    if (job.name !== "frontend") return;
    try {
      const { description, inputs } = job.data as {
        description: string;
        inputs?: Record<string, unknown>;
      };
      const files = await frontendAgent({ description, inputs });
      files.forEach((file) =>
        console.log(
          `🖥️  [frontend] ${mockMode ? "(simuliert) " : ""}Datei ${mockMode ? "würde" : "geschrieben"}: ${file.file}`
        )
      );
      return { files };
    } catch (error) {
      console.error("🖥️  [frontend] Fehler:", error);
      throw error;
    }
  },
  { connection: agentConnection, concurrency: 2 }
);
