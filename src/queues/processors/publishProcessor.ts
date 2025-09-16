import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { agentConnection, PublishPayload } from "../agentQueue";

const prisma = new PrismaClient();
const mockMode = process.env.AGENT_MOCK_MODE === "1";

export const publishWorker = new Worker(
  "agentQueue",
  async (job) => {
    if (job.name !== "publish") return;
    const { postId } = job.data as PublishPayload;

    console.log(`🚀 [publish] processing post ID: ${postId}`);

    if (mockMode) {
      console.log("🚀 [publish] Mock-Modus aktiv");
      return {
        ok: true,
        postId,
        published: true,
        mockMode: true,
        publishedAt: new Date().toISOString()
      };
    }

    try {
      // Get post with related data
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          project: true,
          accounts: true
        }
      });

      if (!post) {
        throw new Error(`Post with ID ${postId} not found`);
      }

      if (!post.accounts.length) {
        throw new Error(`Post ${postId} has no linked accounts`);
      }

      console.log(`🚀 [publish] publishing to ${post.accounts.length} accounts`);

      // In real implementation, this would:
      // 1. Connect to social media APIs (Instagram, TikTok, etc.)
      // 2. Upload content to each platform
      // 3. Handle rate limiting and errors
      // 4. Update post status in database
      // 5. Store publish results/links

      const publishResults = [];

      for (const account of post.accounts) {
        console.log(`🚀 [publish] publishing to ${account.platform}: ${account.handle}`);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100));

        const result = {
          accountId: account.id,
          platform: account.platform,
          handle: account.handle,
          success: true,
          publishedAt: new Date().toISOString(),
          // In real implementation, these would come from actual API responses
          externalId: `mock_${account.platform.toLowerCase()}_${Date.now()}`,
          url: `https://${account.platform.toLowerCase()}.com/post/mock_${Date.now()}`
        };

        publishResults.push(result);
      }

      console.log(`🚀 [publish] successfully published to all ${publishResults.length} accounts`);

      return {
        ok: true,
        postId,
        published: true,
        publishResults,
        totalAccounts: post.accounts.length,
        successCount: publishResults.filter(r => r.success).length,
        publishedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`🚀 [publish] error:`, error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        postId,
        published: false
      };
    }
  },
  { connection: agentConnection, concurrency: 1 } // Lower concurrency for publish jobs to avoid rate limiting
);