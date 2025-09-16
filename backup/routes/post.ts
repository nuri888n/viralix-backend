import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

const CreatePostSchema = z.object({
  caption: z.string().optional(),
  projectId: z.number().int().positive(),
});

const UpdatePostSchema = z.object({
  caption: z.string().optional(),
});

const LinkAccountsSchema = z.object({
  accountIds: z.array(z.number().int().positive()),
  mode: z.enum(["append", "replace"]).default("append"),
});

// GET /api/post - List user's posts (across all projects)
router.get("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        project: {
          userId: req.user!.userId
        }
      },
      include: {
        project: true,
        accounts: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ ok: true, posts });
  } catch (error) {
    console.error("List posts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/post - Create new post
router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { caption, projectId } = CreatePostSchema.parse(req.body);

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: req.user!.userId
      }
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const post = await prisma.post.create({
      data: {
        caption,
        projectId,
      },
      include: {
        project: true,
        accounts: true,
      },
    });

    res.json({ ok: true, post });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.issues });
    }
    console.error("Create post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/post/:id - Get specific post
router.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        project: {
          userId: req.user!.userId
        }
      },
      include: {
        project: true,
        accounts: true,
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ ok: true, post });
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/post/:id - Update post
router.put("/:id", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    const updateData = UpdatePostSchema.parse(req.body);

    // Check if post exists and belongs to user
    const existingPost = await prisma.post.findFirst({
      where: {
        id: postId,
        project: {
          userId: req.user!.userId
        }
      },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    const post = await prisma.post.update({
      where: { id: postId },
      data: updateData,
      include: {
        project: true,
        accounts: true,
      },
    });

    res.json({ ok: true, post });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.issues });
    }
    console.error("Update post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/post/:id/accounts - Link/unlink accounts to post
router.post("/:id/accounts", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    const { accountIds, mode } = LinkAccountsSchema.parse(req.body);

    // Check if post exists and belongs to user
    const existingPost = await prisma.post.findFirst({
      where: {
        id: postId,
        project: {
          userId: req.user!.userId
        }
      },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Verify all accounts belong to the user
    const accounts = await prisma.account.findMany({
      where: {
        id: { in: accountIds },
        userId: req.user!.userId
      }
    });

    if (accounts.length !== accountIds.length) {
      return res.status(400).json({ error: "One or more accounts not found or don't belong to you" });
    }

    // Update post-account relationships
    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        accounts: mode === "replace"
          ? { set: accountIds.map(id => ({ id })) }
          : { connect: accountIds.map(id => ({ id })) }
      },
      include: {
        project: true,
        accounts: true,
      },
    });

    res.json({ ok: true, post });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.issues });
    }
    console.error("Link accounts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/post/:id/accounts - Remove all account links from post
router.delete("/:id/accounts", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    // Check if post exists and belongs to user
    const existingPost = await prisma.post.findFirst({
      where: {
        id: postId,
        project: {
          userId: req.user!.userId
        }
      },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        accounts: { set: [] }
      },
      include: {
        project: true,
        accounts: true,
      },
    });

    res.json({ ok: true, post });
  } catch (error) {
    console.error("Unlink accounts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/post/:id - Delete post
router.delete("/:id", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    // Check if post exists and belongs to user
    const existingPost = await prisma.post.findFirst({
      where: {
        id: postId,
        project: {
          userId: req.user!.userId
        }
      },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Delete post (M:N relations will be handled automatically)
    await prisma.post.delete({
      where: { id: postId },
    });

    res.json({ ok: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;