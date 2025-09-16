import { Worker } from "bullmq";
import { agentConnection, ContentPayload } from "../agentQueue";

const mockMode = process.env.AGENT_MOCK_MODE === "1";

export const contentWorker = new Worker(
  "agentQueue",
  async (job) => {
    if (job.name !== "content") return;
    const { description, inputs } = job.data as ContentPayload;

    console.log(`📝 [content] processing: ${description}`);

    if (mockMode) {
      console.log("📝 [content] Mock-Modus aktiv");
      return {
        ok: true,
        content: `Mock content for: ${description}`,
        inputs: inputs || {}
      };
    }

    // In real implementation, this would:
    // 1. Generate content based on description
    // 2. Use AI models or templates
    // 3. Save content to database if needed
    // 4. Return structured content data

    try {
      // Placeholder implementation
      const generatedContent = {
        type: "content",
        title: `Generated: ${description}`,
        body: `This is generated content based on: ${description}`,
        metadata: inputs || {}
      };

      console.log(`📝 [content] generated content successfully`);

      return {
        ok: true,
        content: generatedContent,
        description,
        inputs: inputs || {}
      };
    } catch (error) {
      console.error(`📝 [content] error:`, error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        description,
        inputs: inputs || {}
      };
    }
  },
  { connection: agentConnection, concurrency: 2 }
);