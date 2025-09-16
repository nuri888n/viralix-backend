// FILE: src/routes/tools.ts
import { Router } from "express";
import { ZodError } from "zod";
import { run as runCaptions } from "../tools/captions";

const router = Router();

router.post("/tools/captions", async (req, res) => {
  try {
    const result = await runCaptions(req.body ?? {});
    res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.issues.map((issue) => issue.message).join(", ") });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(400).json({ error: "Unbekannter Fehler" });
  }
});

export default router;
