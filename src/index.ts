// FILE: src/index.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

// ✅ BullMQ-Queue NUR für Job-Inspection (kein Import aus ./worker -> vermeidet Zyklen)
import { Queue } from "bullmq";
import IORedis from "ioredis";

// ✅ Enqueue-Routen (POST /api/ai/plan/enqueue) aus Step 1
import aiRoutes from "./routes/ai";
import payRoutes from "./routes/pay";
import toolsRoutes from "./routes/tools";
import testRoutes from "./routes/test";

// ✅ Core API Routen
import authRoutes from "./routes/auth";
import projectRoutes from "./routes/project";
import accountRoutes from "./routes/account";
import postRoutes from "./routes/post";

// ✅ Auth Middleware
import { requireAuth, AuthedRequest } from "./middleware/auth";

// --- Init ---
const prisma = new PrismaClient();
const app = express();

// --- CORS ---
const ORIGIN =
  process.env.PUBLIC_ORIGIN ||
  process.env.FRONTEND_ORIGIN ||
  "http://localhost:5173";

app.use(
  cors({
    origin: ORIGIN,
    credentials: true,
  })
);

// --- Middleware ---
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// --- BullMQ Verbindung nur für Job-Reads (agentQueue) ---
const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const redis = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
const agentQueueReader = new Queue("agentQueue", { connection: redis });

// --- Auth Middleware ist jetzt aus ./middleware/auth importiert ---

// --- Debug Route für Token (unter /api) ---
app.get("/api/debug/token/:id", async (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  const token = jwt.sign({ userId }, process.env.JWT_SECRET || "dev-secret", {
    expiresIn: "1h",
  });
  res.json({ token });
});

// --- AI Planner (deine bestehende Route bleibt identisch) ---
import { runPlanningAgent } from "./agents/aiPlanner";
app.post("/ai/plan", requireAuth, async (req: AuthedRequest, res: Response) => {
  const { goal, projectId } = req.body;
  if (!goal || !projectId) {
    return res.status(400).json({ error: "goal and projectId required" });
  }
  try {
    const result = await runPlanningAgent(prisma, {
      goal: String(goal),
      projectId: Number(projectId),
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message || "AI error" });
  }
});

// --- Core API Routen ---
app.use("/api/auth", authRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/post", postRoutes);

// --- Agent-Enqueue-Routen (damit /api/ai/plan/enqueue funktioniert) ---
app.use("/api", aiRoutes);
app.use("/api", payRoutes);
app.use("/api", toolsRoutes);
app.use("/api", testRoutes);

// --- Jobs-Status (ohne ./worker zu importieren) ---
app.get("/api/jobs/:id", async (req: Request, res: Response) => {
  const job = await agentQueueReader.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: "not found" });
  const state = await job.getState();
  res.json({
    id: job.id,
    state,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason,
  });
});

// --- Health ---
app.get("/health", (_req: Request, res: Response) => res.json({ ok: true }));

console.log("Anthropic model:", process.env.ANTHROPIC_MODEL);

// --- Start ---
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`🚀 Server ready at http://localhost:${port}`);
});

// --- Graceful Shutdown ---
process.on("SIGINT", async () => {
  await prisma.$disconnect().catch(() => {});
  await redis.quit().catch(() => {});
  process.exit(0);
});
