import { Router } from "express";
import { agentQueue } from "../queues/agentQueue";

const r = Router();

r.post("/ai/plan/enqueue", async (req, res) => {
  const goal = (req.body?.goal as string) ?? "Ship captions tool + tools page + payments webhook";
  const job = await agentQueue.add("planner", { goal }, { removeOnComplete: false });
  res.json({ ok: true, jobId: job.id });
});

export default r;
