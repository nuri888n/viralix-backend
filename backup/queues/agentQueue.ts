import { Queue } from "bullmq";
import IORedis from "ioredis";

export type AgentJobName = "planner" | "codegen" | "frontend" | "framer" | "publish" | "content";

export interface PlannerPayload { goal: string; }
export interface CodegenPayload { description: string; inputs?: Record<string, unknown>; }
export interface FrontendPayload { description: string; inputs?: Record<string, unknown>; }
export interface FramerPayload { description: string; inputs?: Record<string, unknown>; }
export interface ContentPayload { description: string; inputs?: Record<string, unknown>; }
export interface PublishPayload { postId: number; }

export type AgentPayload =
  | PlannerPayload
  | CodegenPayload
  | FrontendPayload
  | FramerPayload
  | ContentPayload
  | PublishPayload;

  const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
export const agentConnection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

export const agentQueue = new Queue<AgentPayload, unknown, AgentJobName>("agentQueue", {
  connection: agentConnection,
});

export async function enqueuePublish(postId: number, runAtISO: string) {
  const runAt = new Date(runAtISO);
  return await agentQueue.add("publish", { postId }, {
    delay: Math.max(0, runAt.getTime() - Date.now()),
    removeOnComplete: true,
    attempts: 3,
  });
}