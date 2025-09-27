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

// GET /api/accounts - List all social accounts for user
router.get('/', requireAuth, async (req: any, res) => {
  try {
    const accounts = await prisma.socialAccount.findMany({
      where: {
        userId: req.user.id
      },
      select: {
        id: true,
        platform: true,
        username: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    res.json({
      accounts: accounts.map(account => ({
        ...account,
        postsCount: account._count.posts
      }))
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// POST /api/accounts - Add new social account
router.post('/', requireAuth, async (req: any, res) => {
  try {
    const { platform, username } = req.body;

    if (!platform || !username) {
      return res.status(400).json({ error: 'Platform and username are required' });
    }

    // Check if account already exists
    const existingAccount = await prisma.socialAccount.findFirst({
      where: {
        userId: req.user.id,
        platform,
        username
      }
    });

    if (existingAccount) {
      return res.status(400).json({ error: 'Account already exists' });
    }

    const account = await prisma.socialAccount.create({
      data: {
        platform,
        username,
        userId: req.user.id,
        status: 'ACTIVE'
      }
    });

    res.json({
      ok: true,
      account: {
        id: account.id,
        platform: account.platform,
        username: account.username,
        status: account.status,
        createdAt: account.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// DELETE /api/accounts/:id - Remove social account
router.delete('/:id', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;

    const account = await prisma.socialAccount.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await prisma.socialAccount.delete({
      where: { id }
    });

    res.json({ ok: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// PUT /api/accounts/:id - Update account status
router.put('/:id', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'PAUSED', 'ERROR'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const account = await prisma.socialAccount.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const updatedAccount = await prisma.socialAccount.update({
      where: { id },
      data: { status }
    });

    res.json({
      ok: true,
      account: updatedAccount
    });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

export default router;