import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, Prisma, Platform } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

// ===== JWT / Auth =====
type JwtUser = { id: number; email: string };

// Express-Request um "user" erweitern, damit TS meckert nicht
declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function signToken(u: JwtUser) {
  return jwt.sign(u, JWT_SECRET, { expiresIn: '7d' });
}

function auth(req: Request, res: Response, next: NextFunction) {
  const h = req.header('Authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtUser;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'unauthorized' });
  }
}

// ===== Health =====
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ===== Auth =====
app.post('/api/register', async (req, res, next) => {
  try {
    const { email, name, password } = req.body as { email: string; name?: string; password: string };
    if (!email || !password) return res.status(400).json({ error: 'email_and_password_required' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'email_taken' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name: name ?? null, password: passwordHash },
      select: { id: true, email: true, name: true, username: true, createdAt: true },
    });
    const token = signToken({ id: user.id, email: user.email });
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

app.post('/api/login', async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return res.status(401).json({ error: 'invalid_credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

    const token = signToken({ id: user.id, email: user.email });
    res.json({ token });
  } catch (err) {
    next(err);
  }
});

app.get('/api/me', auth, async (req, res, next) => {
  try {
    const me = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, username: true, createdAt: true },
    });
    res.json(me);
  } catch (err) {
    next(err);
  }
});

// ===== Projects =====
app.post('/api/projects', auth, async (req, res, next) => {
  try {
    const { name, description } = req.body as { name: string; description?: string | null };
    const project = await prisma.project.create({
      data: {
        userId: req.user!.id,
        name,
        description: description ?? null,
      },
    });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

app.get('/api/projects', auth, async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

app.delete('/api/projects/:projectId', auth, async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    // optional: ownership check
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== req.user!.id) return res.status(404).json({ error: 'not_found' });

    await prisma.project.delete({ where: { id: projectId } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ===== Social Accounts =====
app.post('/api/projects/:projectId/accounts', auth, async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const { platform, handle } = req.body as { platform: string; handle: string };

    // verify project belongs to user
    const p = await prisma.project.findUnique({ where: { id: projectId } });
    if (!p || p.userId !== req.user!.id) return res.status(404).json({ error: 'not_found' });

    const upper = String(platform || '').toUpperCase();
    if (!(upper in Platform)) return res.status(400).json({ error: `invalid platform: ${platform}` });

    const account = await prisma.socialAccount.create({
      data: { projectId, platform: upper as Platform, handle },
    });
    res.status(201).json(account);
  } catch (err) {
    next(err);
  }
});

app.get('/api/projects/:projectId/accounts', auth, async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const p = await prisma.project.findUnique({ where: { id: projectId } });
    if (!p || p.userId !== req.user!.id) return res.status(404).json({ error: 'not_found' });

    const accounts = await prisma.socialAccount.findMany({ where: { projectId } });
    res.json(accounts);
  } catch (err) {
    next(err);
  }
});

app.delete('/api/projects/:projectId/accounts/:accountId', auth, async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const accountId = Number(req.params.accountId);

    // ownership guard
    const account = await prisma.socialAccount.findUnique({ where: { id: accountId } });
    if (!account) return res.status(404).json({ error: 'not_found' });

    const p = await prisma.project.findUnique({ where: { id: projectId } });
    if (!p || p.userId !== req.user!.id || account.projectId !== p.id) {
      return res.status(404).json({ error: 'not_found' });
    }

    await prisma.socialAccount.delete({ where: { id: accountId } });
    res.status(204).end();
  } catch (err: any) {
    if (err?.code === 'P2025') return res.status(404).json({ error: 'not_found' });
    next(err);
  }
});

// ===== Posts =====
app.post('/api/projects/:projectId/posts', auth, async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const p = await prisma.project.findUnique({ where: { id: projectId } });
    if (!p || p.userId !== req.user!.id) return res.status(404).json({ error: 'not_found' });

    const body = req.body as {
      caption: string;
      accountIds?: number[];
      mediaUrl?: string | null;
      scheduledAt?: string | null;
      status?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
    };

    const post = await prisma.post.create({
      data: {
        projectId,
        caption: body.caption,
        mediaUrl: body.mediaUrl ?? null,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        status: (body.status ?? 'DRAFT') as any,
        accountIds: (body.accountIds ?? []) as Prisma.InputJsonValue, // JSON-Spalte
      },
    });
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

app.get('/api/projects/:projectId/posts', auth, async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const p = await prisma.project.findUnique({ where: { id: projectId } });
    if (!p || p.userId !== req.user!.id) return res.status(404).json({ error: 'not_found' });

    const posts = await prisma.post.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

app.patch('/api/projects/:projectId/posts/:postId', auth, async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const postId = Number(req.params.postId);

    // ownership guard
    const p = await prisma.project.findUnique({ where: { id: projectId } });
    if (!p || p.userId !== req.user!.id) return res.status(404).json({ error: 'not_found' });

    const body = req.body as {
      caption?: string;
      mediaUrl?: string | null;
      scheduledAt?: string | null;
      status?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
      accountIds?: number[];
    };

    const data: any = {};
    if (typeof body.caption === 'string') data.caption = body.caption;
    if ('mediaUrl' in body) data.mediaUrl = body.mediaUrl ?? null;
    if ('scheduledAt' in body) data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    if ('status' in body) data.status = body.status;
    if (Array.isArray(body.accountIds)) data.accountIds = body.accountIds as Prisma.InputJsonValue;

    const updated = await prisma.post.update({ where: { id: postId }, data });
    res.json(updated);
  } catch (err: any) {
    if (err?.code === 'P2025') return res.status(404).json({ error: 'not_found' });
    next(err);
  }
});

app.delete('/api/projects/:projectId/posts/:postId', auth, async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const postId = Number(req.params.postId);

    const p = await prisma.project.findUnique({ where: { id: projectId } });
    if (!p || p.userId !== req.user!.id) return res.status(404).json({ error: 'not_found' });

    await prisma.post.delete({ where: { id: postId } });
    res.status(204).end();
  } catch (err: any) {
    if (err?.code === 'P2025') return res.status(404).json({ error: 'not_found' });
    next(err);
  }
});

// ===== Error Handler =====
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Server Error' });
});

// ===== Start =====
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
});