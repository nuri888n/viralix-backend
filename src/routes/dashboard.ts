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

// GET /api/dashboard/stats - Main dashboard statistics
router.get('/stats', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const [
      totalAccounts,
      activeAccounts,
      totalPosts,
      scheduledPosts,
      postedPosts,
      failedPosts
    ] = await Promise.all([
      prisma.socialAccount.count({
        where: { userId }
      }),
      prisma.socialAccount.count({
        where: { userId, status: 'ACTIVE' }
      }),
      prisma.post.count({
        where: { userId }
      }),
      prisma.post.count({
        where: { userId, status: 'SCHEDULED' }
      }),
      prisma.post.count({
        where: { userId, status: 'POSTED' }
      }),
      prisma.post.count({
        where: { userId, status: 'FAILED' }
      })
    ]);

    const nextScheduledPosts = await prisma.post.findMany({
      where: {
        userId,
        status: 'SCHEDULED',
        scheduledAt: {
          gte: new Date()
        }
      },
      include: {
        account: {
          select: {
            platform: true,
            username: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      },
      take: 5
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentActivity = await prisma.post.findMany({
      where: {
        userId,
        createdAt: {
          gte: weekAgo
        }
      },
      include: {
        account: {
          select: {
            platform: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    const platformStats = await prisma.socialAccount.groupBy({
      by: ['platform'],
      where: { userId },
      _count: {
        platform: true
      }
    });

    const postStatusStats = await prisma.post.groupBy({
      by: ['status'],
      where: { userId },
      _count: {
        status: true
      }
    });

    res.json({
      stats: {
        accounts: {
          total: totalAccounts,
          active: activeAccounts,
          inactive: totalAccounts - activeAccounts
        },
        posts: {
          total: totalPosts,
          scheduled: scheduledPosts,
          posted: postedPosts,
          failed: failedPosts
        },
        platforms: platformStats.reduce((acc: any, stat) => {
          acc[stat.platform] = stat._count.platform;
          return acc;
        }, {}),
        postsByStatus: postStatusStats.reduce((acc: any, stat) => {
          acc[stat.status] = stat._count.status;
          return acc;
        }, {})
      },
      nextScheduledPosts,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;