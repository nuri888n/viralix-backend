import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

// Auth Middleware
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /api/posts - List all posts for user
router.get('/', requireAuth, async (req: any, res) => {
  try {
    const { limit = 20, status, accountId } = req.query;

    const whereClause: any = {
      userId: req.user.id
    };

    if (status) {
      whereClause.status = status;
    }

    if (accountId) {
      whereClause.accountId = accountId;
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      include: {
        account: {
          select: {
            platform: true,
            username: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'desc'
      },
      take: parseInt(limit as string)
    });

    res.json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// POST /api/posts - Schedule a new post
router.post('/', requireAuth, async (req: any, res) => {
  try {
    const { content, mediaUrl, scheduledAt, accountIds } = req.body;

    if (!content || !scheduledAt || !accountIds || accountIds.length === 0) {
      return res.status(400).json({
        error: 'Content, scheduledAt, and accountIds are required'
      });
    }

    // Verify all accounts belong to user
    const accounts = await prisma.socialAccount.findMany({
      where: {
        id: { in: accountIds },
        userId: req.user.id,
        status: 'ACTIVE'
      }
    });

    if (accounts.length !== accountIds.length) {
      return res.status(400).json({
        error: 'Some accounts not found or inactive'
      });
    }

    // Create posts for each account
    const posts = await Promise.all(
      accountIds.map((accountId: string) =>
        prisma.post.create({
          data: {
            content,
            mediaUrl,
            scheduledAt: new Date(scheduledAt),
            userId: req.user.id,
            accountId,
            status: 'SCHEDULED'
          },
          include: {
            account: {
              select: {
                platform: true,
                username: true
              }
            }
          }
        })
      )
    );

    res.json({
      ok: true,
      posts,
      message: `Scheduled ${posts.length} posts`
    });
  } catch (error) {
    console.error('Error scheduling posts:', error);
    res.status(500).json({ error: 'Failed to schedule posts' });
  }
});

// GET /api/posts/:id - Get specific post
router.get('/:id', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findFirst({
      where: {
        id,
        userId: req.user.id
      },
      include: {
        account: {
          select: {
            platform: true,
            username: true
          }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ post });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// DELETE /api/posts/:id - Cancel/delete a post
router.delete('/:id', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.status === 'POSTED') {
      return res.status(400).json({ error: 'Cannot delete already posted content' });
    }

    await prisma.post.delete({
      where: { id }
    });

    res.json({ ok: true, message: 'Post cancelled successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;