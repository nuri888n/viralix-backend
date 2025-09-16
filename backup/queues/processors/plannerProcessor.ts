import { Worker } from "bullmq";
import { agentConnection, agentQueue, PlannerPayload } from "../agentQueue";
import { plannerAgent } from "../../agents/plannerAgent";

export const plannerWorker = new Worker(
  "agentQueue",
  async (job) => {
    if (job.name !== "planner") return;
    const { goal } = job.data as PlannerPayload;

    console.log(`🧠 [planner] starte Planung für: ${goal}`);
    const plan = await plannerAgent(goal);
    console.log(`🧠 [planner] ${plan.steps.length} Schritte erhalten`);

    for (const step of plan.steps) {
      console.log(`➡️  [planner] enqueue ${step.type} (${step.id})`);
      await agentQueue.add(step.type, step, {
        removeOnComplete: true,
        attempts: 1,
      });
    }

    return { planned: plan.steps.length };
  },
  { connection: agentConnection, concurrency: 1 }
);
