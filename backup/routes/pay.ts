// FILE: src/routes/pay.ts
import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

interface WebhookPayload {
  event: string;
  payload: unknown;
}

router.post("/pay/webhook", async (req, res) => {
  const body = req.body as WebhookPayload;
  console.log("💳 Framer Webhook eingegangen:", body.event);
  res.json({ ok: true });
});

router.post("/session/issue", (req, res) => {
  const { userId } = req.body ?? {};
  if (!userId) {
    return res.status(400).json({ error: "userId erforderlich" });
  }

  const token = jwt.sign({ userId }, process.env.JWT_SECRET || "dev-secret", {
    expiresIn: "7d",
  });

  const origin = process.env.PUBLIC_ORIGIN || "http://localhost:5173";
  let domain: string | undefined;
  try {
    const parsed = new URL(origin);
    domain = parsed.hostname;
  } catch (error) {
    console.warn("Konnte PUBLIC_ORIGIN nicht parsen:", error);
  }

  res.cookie("viralix_sso", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    ...(domain ? { domain } : {}),
  });

  res.json({ ok: true });
});

export default router;
