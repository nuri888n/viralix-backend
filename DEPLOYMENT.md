# Railway Deployment Guide

## Required Environment Variables

Set these in your Railway dashboard:

```bash
# Database
DATABASE_URL=your_production_postgresql_url

# Anthropic AI
ANTHROPIC_API_KEY=your_anthropic_api_key

# Redis (for BullMQ)
REDIS_URL=your_redis_url

# JWT
JWT_SECRET=your_secret_jwt_key

# CORS
PUBLIC_ORIGIN=https://your-frontend-domain.com

# Optional
PORT=3000
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

## Deployment Commands

Railway will automatically run:
1. `npm install` (install dependencies)
2. `npm run build` (TypeScript compilation)
3. `prisma generate` (via postinstall hook)
4. `npm start` (start production server)

## Database Migration

After deployment, run migrations manually:
```bash
railway run npm run db:migrate
```

## Health Check

Railway will monitor: `https://your-app.railway.app/health`

## Services

- **Web**: Main API server (port 3000)
- **Worker**: Background job processor (BullMQ)

## Build Output

- TypeScript compiles from `src/` to `dist/`
- Main entry point: `dist/index.js`
- Worker entry point: `dist/worker.js`