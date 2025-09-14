import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from './db';
import { authenticate, AuthRequest } from './middleware/auth';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// User signup
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash } });
  res.json(user);
});

// User login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Create project
app.post('/projects', authenticate, async (req: AuthRequest, res) => {
  const { name } = req.body;
  const project = await prisma.project.create({
    data: { name, userId: req.user!.id },
  });
  res.json(project);
});

// List projects
app.get('/projects', authenticate, async (req: AuthRequest, res) => {
  const projects = await prisma.project.findMany({
    where: { userId: req.user!.id },
  });
  res.json(projects);
});

// Create post
app.post('/posts', authenticate, async (req: AuthRequest, res) => {
  const { projectId, caption } = req.body;
  const post = await prisma.post.create({
    data: { caption, projectId },
  });
  res.json(post);
});

// List posts
app.get('/posts', authenticate, async (req: AuthRequest, res) => {
  const posts = await prisma.post.findMany({
    where: { project: { userId: req.user!.id } },
  });
  res.json(posts);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
