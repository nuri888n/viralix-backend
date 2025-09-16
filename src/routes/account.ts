import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

const CreateAccountSchema = z.object({
  handle: z.string().min(1, "Handle is required"),
  platform: z.enum(["INSTAGRAM", "TIKTOK", "YOUTUBE", "TWITTER"]),
});

const UpdateAccountSchema = z.object({
  handle: z.string().min(1, "Handle is required").optional(),
  platform: z.enum(["INSTAGRAM", "TIKTOK", "YOUTUBE", "TWITTER"]).optional(),
});

// GET /api/account - List user's accounts
router.get("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user!.userId },
      include: {
        _count: {
          select: { posts: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ ok: true, accounts });
  } catch (error) {
    console.error("List accounts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/account - Create new account
router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { handle, platform } = CreateAccountSchema.parse(req.body);

    // Check if handle already exists
    const existingAccount = await prisma.account.findUnique({
      where: { handle }
    });

    if (existingAccount) {
      return res.status(400).json({ error: "Handle already exists" });
    }

    const account = await prisma.account.create({
      data: {
        handle,
        platform,
        userId: req.user!.userId,
      },
    });

    res.json({ ok: true, account });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.issues });
    }
    console.error("Create account error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/account/:id - Get specific account
router.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const accountId = parseInt(req.params.id);
    if (isNaN(accountId)) {
      return res.status(400).json({ error: "Invalid account ID" });
    }

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: req.user!.userId
      },
      include: {
        posts: {
          include: {
            project: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json({ ok: true, account });
  } catch (error) {
    console.error("Get account error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/account/:id - Update account
router.put("/:id", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const accountId = parseInt(req.params.id);
    if (isNaN(accountId)) {
      return res.status(400).json({ error: "Invalid account ID" });
    }

    const updateData = UpdateAccountSchema.parse(req.body);

    // Check if account exists and belongs to user
    const existingAccount = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: req.user!.userId
      },
    });

    if (!existingAccount) {
      return res.status(404).json({ error: "Account not found" });
    }

    // If updating handle, check for conflicts
    if (updateData.handle && updateData.handle !== existingAccount.handle) {
      const handleExists = await prisma.account.findUnique({
        where: { handle: updateData.handle }
      });

      if (handleExists) {
        return res.status(400).json({ error: "Handle already exists" });
      }
    }

    const account = await prisma.account.update({
      where: { id: accountId },
      data: updateData,
    });

    res.json({ ok: true, account });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.issues });
    }
    console.error("Update account error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/account/:id - Delete account
router.delete("/:id", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const accountId = parseInt(req.params.id);
    if (isNaN(accountId)) {
      return res.status(400).json({ error: "Invalid account ID" });
    }

    // Check if account exists and belongs to user
    const existingAccount = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: req.user!.userId
      },
    });

    if (!existingAccount) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Delete account (M:N relations will be handled automatically)
    await prisma.account.delete({
      where: { id: accountId },
    });

    res.json({ ok: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;