import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

const CreateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
});

const UpdateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").optional(),
});

// GET /api/project - List user's projects
router.get("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.userId },
      include: {
        _count: {
          select: { posts: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ ok: true, projects });
  } catch (error) {
    console.error("List projects error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/project - Create new project
router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { name } = CreateProjectSchema.parse(req.body);

    const project = await prisma.project.create({
      data: {
        name,
        userId: req.user!.userId,
      },
    });

    res.json({ ok: true, project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.issues });
    }
    console.error("Create project error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/project/:id - Get specific project
router.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: "Invalid project ID" });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: req.user!.userId
      },
      include: {
        posts: {
          include: {
            accounts: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ ok: true, project });
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/project/:id - Update project
router.put("/:id", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: "Invalid project ID" });
    }

    const updateData = UpdateProjectSchema.parse(req.body);

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: req.user!.userId
      },
    });

    if (!existingProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    res.json({ ok: true, project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.issues });
    }
    console.error("Update project error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/project/:id - Delete project
router.delete("/:id", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: "Invalid project ID" });
    }

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: req.user!.userId
      },
    });

    if (!existingProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Delete project (cascade will handle posts)
    await prisma.project.delete({
      where: { id: projectId },
    });

    res.json({ ok: true, message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;