import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import Stripe from 'stripe';

// Import routes
import authRouter from './routes/auth';
import accountsRouter from './routes/accounts';
import postsRouter from './routes/posts';
import dashboardRouter from './routes/dashboard';

// Load environment variables
dotenv.config();

// RAILWAY BUILD FIX: This comment forces rebuild - no test files exist
console.log('✅ Viralix Backend starting - Build timestamp:', new Date().toISOString());

const app = express();
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));

app.post(
  '/api/pay/webhook',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const sig = req.headers['stripe-signature'];
    if (!sig || Array.isArray(sig)) {
      console.error('⚠️ Webhook verification failed: missing or invalid signature header');
      return res.sendStatus(400);
    }
    if (!stripe) {
      console.error('⚠️ Stripe not configured');
      return res.sendStatus(400);
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('⚠️ Webhook verification failed:', message);
      return res.sendStatus(400);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        console.log('✅ Payment success:', event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.sendStatus(200);
  }
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/posts', postsRouter);
app.use('/api/dashboard', dashboardRouter);

// API Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    api: 'Viralix Backend',
    version: '1.0.0',
    status: 'running',
    routes: {
      auth: '/api/auth/*',
      accounts: '/api/accounts/*',
      posts: '/api/posts/*',
      dashboard: '/api/dashboard/*'
    },
    timestamp: new Date().toISOString()
  });
});

// Root endpoint with available routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Viralix Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      status: 'GET /api/status',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me'
      },
      accounts: {
        list: 'GET /api/accounts',
        create: 'POST /api/accounts',
        update: 'PUT /api/accounts/:id',
        delete: 'DELETE /api/accounts/:id'
      },
      posts: {
        list: 'GET /api/posts',
        create: 'POST /api/posts',
        get: 'GET /api/posts/:id',
        delete: 'DELETE /api/posts/:id'
      },
      dashboard: {
        stats: 'GET /api/dashboard/stats'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    availableRoutes: [
      'GET /health',
      'GET /api/status',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'GET /api/accounts',
      'POST /api/accounts',
      'GET /api/posts',
      'POST /api/posts',
      'GET /api/dashboard/stats'
    ]
  });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Global error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Viralix Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 API status: http://localhost:${PORT}/api/status`);
  console.log(`🎯 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

export default app;
