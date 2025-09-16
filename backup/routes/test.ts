// FILE: src/routes/test.ts
import { Router } from "express";

type JsonRecord = Record<string, unknown>;

const router = Router();

function baseUrlFromRequest(req: any): string {
  const protocol = req.protocol || "http";
  const host = req.get?.("host") || "localhost:3000";
  return `${protocol}://${host}`;
}

async function httpPost(base: string, path: string, body: JsonRecord) {
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch (error) {
    throw new Error(`Antwort von ${path} war kein JSON: ${text}`);
  }
  if (!response.ok) {
    throw new Error(`Request ${path} fehlgeschlagen (${response.status}): ${text}`);
  }
  return { json, headers: response.headers };
}

async function httpGet(base: string, path: string) {
  const response = await fetch(`${base}${path}`);
  const text = await response.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch (error) {
    throw new Error(`Antwort von ${path} war kein JSON: ${text}`);
  }
  if (!response.ok) {
    throw new Error(`Request ${path} fehlgeschlagen (${response.status}): ${text}`);
  }
  return json;
}

router.post("/test/e2e", async (req, res) => {
  const base = baseUrlFromRequest(req);
  const goal =
    typeof req.body?.goal === "string"
      ? req.body.goal
      : "Implementiere captions tool + tools page + payments webhook.";

  const summary: Record<string, unknown> = { base, goal };

  try {
    // Schritt 1: Planner enqueuen
    const plannerResponse = await httpPost(base, "/api/ai/plan/enqueue", { goal });
    summary.planner = plannerResponse.json;
    const jobId = (plannerResponse.json as JsonRecord | undefined)?.jobId as string | undefined;
    if (!jobId) throw new Error("Planner-Response enthielt keine jobId");

    // Schritt 2: Jobstatus poll
    let jobData: unknown = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      jobData = await httpGet(base, `/api/jobs/${jobId}`);
      summary.job = jobData;
      const state = (jobData as JsonRecord | undefined)?.state;
      if (state === "completed" || state === "failed") break;
    }

    // Schritt 3: Captions-Tool
    const captionsResponse = await httpPost(base, "/api/tools/captions", {
      topic: "Leg day pump",
      tone: "fun",
    });
    summary.captions = captionsResponse.json;

    // Schritt 4: Payment-Webhook
    const webhookResponse = await httpPost(base, "/api/pay/webhook", {
      type: "checkout.completed",
      data: { userId: 123, plan: "pro" },
    });
    summary.webhook = webhookResponse.json;

    // Schritt 5: Session-Issue
    const sessionResponse = await httpPost(base, "/api/session/issue", {
      userId: 123,
      email: "test@example.com",
    });
    summary.session = {
      response: sessionResponse.json,
      setCookie: sessionResponse.headers.get("set-cookie") ?? null,
    };

    res.json({ ok: true, summary });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : String(error), summary });
  }
});

export default router;
