import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { corsMiddleware, rateLimitMiddleware, securityHeadersMiddleware } from './middleware/security';
import {
  validateRegister,
  validateLogin,
  validateProject,
  validateAccount,
  validatePost
} from './middleware/validation';

const prisma = new PrismaClient();
const app = express();

// Security and middleware setup
app.use(securityHeadersMiddleware);
app.use(corsMiddleware);
app.use(rateLimitMiddleware);
app.use(express.json({ limit: '10mb' }));

/* ===== JWT / Auth ===== */

type JwtUser = { id: number; email: string };

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}

const auth = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'unauthorized' });
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtUser;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
};

/* ===== Routes ===== */

// register
app.post('/api/register', validateRegister, async (req, res) => {
  const { email, password } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'email_taken' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashed } });
    res.json({ id: user.id, email: user.email });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

// login
app.post('/api/login', validateLogin, async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'invalid_credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'invalid_credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret');
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

// current user
app.get('/api/me', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ error: 'user_not_found' });
    res.json({ id: user.id, email: user.email, name: user.name, username: user.username });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

// projects
app.post('/api/projects', auth, validateProject, async (req, res) => {
  const { name, description } = req.body;
  
  try {
    const project = await prisma.project.create({
      data: { name, description, userId: req.user!.id }
    });
    res.json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

app.get('/api/projects', auth, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({ where: { userId: req.user!.id } });
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

// accounts (platform = string)
app.post('/api/projects/:projectId/accounts', auth, validateAccount, async (req, res) => {
  const { platform, handle } = req.body;
  const projectId = Number(req.params.projectId);

  try {
    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.user!.id }
    });
    if (!project) return res.status(404).json({ error: 'project_not_found' });

    const account = await prisma.socialAccount.create({
      data: { platform, handle, projectId }
    });

    res.json(account);
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

app.get('/api/projects/:projectId/accounts', auth, async (req, res) => {
  const projectId = Number(req.params.projectId);
  
  try {
    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.user!.id }
    });
    if (!project) return res.status(404).json({ error: 'project_not_found' });

    const accounts = await prisma.socialAccount.findMany({ where: { projectId } });
    res.json(accounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

// create post
app.post('/api/projects/:projectId/posts', auth, validatePost, async (req, res) => {
  const { caption, status, accountIds } = req.body;
  const projectId = Number(req.params.projectId);

  try {
    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.user!.id }
    });
    if (!project) return res.status(404).json({ error: 'project_not_found' });

    const post = await prisma.post.create({
      data: { caption, status: status || 'DRAFT', projectId, accountIds }
    });
    res.json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});
// alle posts zu einem projekt
app.get('/api/projects/:projectId/posts', auth, async (req, res) => {
  const projectId = Number(req.params.projectId);
  
  try {
    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.user!.id }
    });
    if (!project) return res.status(404).json({ error: 'project_not_found' });

    const posts = await prisma.post.findMany({ where: { projectId } });
    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

// ein einzelnes projekt abrufen
app.get('/api/projects/:projectId', auth, async (req, res) => {
  const projectId = Number(req.params.projectId);

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.user!.id },
      include: {
        posts: true,
        accounts: true,
      },
    });

    if (!project) return res.status(404).json({ error: 'project_not_found' });
    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});
// ... deine ganzen imports, middlewares und anderen routes oben

// health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// error-handler kommt danach
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'internal_error' });
});
// === Delete Post ===
app.delete('/api/projects/:projectId/posts/:postId', auth, async (req, res) => {
  const projectId = Number(req.params.projectId);
  const postId = Number(req.params.postId);

  try {
    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.user!.id }
    });
    if (!project) return res.status(404).json({ error: 'project_not_found' });

    const post = await prisma.post.findFirst({ where: { id: postId, projectId } });
    if (!post) return res.status(404).json({ error: 'post_not_found' });

    await prisma.post.delete({ where: { id: postId } });
    res.json({ deleted: true });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

// === Delete Account ===
app.delete('/api/projects/:projectId/accounts/:accountId', auth, async (req, res) => {
  const projectId = Number(req.params.projectId);
  const accountId = Number(req.params.accountId);

  try {
    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.user!.id }
    });
    if (!project) return res.status(404).json({ error: 'project_not_found' });

    const account = await prisma.socialAccount.findFirst({ where: { id: accountId, projectId } });
    if (!account) return res.status(404).json({ error: 'account_not_found' });

    await prisma.socialAccount.delete({ where: { id: accountId } });
    res.json({ deleted: true });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

// === Delete Project ===
app.delete('/api/projects/:projectId', auth, async (req, res) => {
  const projectId = Number(req.params.projectId);

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.user!.id }
    });
    if (!project) return res.status(404).json({ error: 'project_not_found' });

    // Delete in correct order (cascading)
    await prisma.post.deleteMany({ where: { projectId } });
    await prisma.socialAccount.deleteMany({ where: { projectId } });
    await prisma.project.delete({ where: { id: projectId } });

    res.json({ deleted: true });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});
// server start block
if (require.main === module) {
  const serverPort = process.env.PORT || 3000;
  const serverHost = process.env.HOST || '127.0.0.1';
  app.listen(serverPort, () => {
    console.log(`🚀 Server running at http://${serverHost}:${serverPort}`);
  });
}

export default app;