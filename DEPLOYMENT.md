# Railway Deployment Guide - Simplified Backend

## Quick Deployment

This is a **minimal Express.js backend** ready for Railway deployment.

### Required Environment Variables

Set only these in your Railway dashboard:

```bash
# Required
PORT=3000

# Optional
NODE_ENV=production
FRONTEND_ORIGIN=https://your-frontend-domain.com
```

## What's included

✅ **Simple Express server** with CORS
✅ **Health check endpoint**: `/health`
✅ **Status endpoint**: `/api/status`
✅ **TypeScript compilation** to `dist/`
✅ **Error handling** and graceful shutdown
✅ **No database dependencies**
✅ **No external service dependencies**

## Endpoints

- `GET /` - Welcome message with endpoints list
- `GET /health` - Health check for Railway monitoring
- `GET /api/status` - API status information
- `404` - All other routes return "Route not found"

## Deployment Process

Railway will automatically:
1. `npm install` - Install dependencies (express, cors, dotenv)
2. `npm run build` - Compile TypeScript (`src/index.ts` → `dist/index.js`)
3. `npm start` - Start server (`node dist/index.js`)

## Testing Locally

```bash
npm install
npm run build
npm start
```

Server runs on `http://localhost:3000`

## Complex Features (Temporarily Removed)

All complex features have been moved to the `backup/` folder:
- Prisma database integration
- Authentication & JWT
- AI agents and tools
- Background job queues
- Route handlers

These can be added back once the basic deployment is working.

## Next Steps

1. Deploy to Railway and verify it works
2. Test health check endpoint
3. Gradually add back features from backup/