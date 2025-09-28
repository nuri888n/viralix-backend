# Database Setup für Viralix Backend

## Option 1: Neon (Empfohlen)
1. Gehe zu https://neon.tech
2. Sign up kostenlos
3. Create new database: `viralix-backend`
4. Copy Connection String (sieht so aus):
   ```
   postgresql://username:password@ep-something-123456.us-east-1.aws.neon.tech/viralix-backend?sslmode=require
   ```

## Option 2: Supabase
1. Gehe zu https://supabase.com
2. New project: `viralix-backend`
3. Copy Database URL from Settings → Database

## Option 3: Railway PostgreSQL
1. Railway Dashboard → + New → Database → PostgreSQL
2. Copy generated DATABASE_URL

## Nächste Schritte:
1. DATABASE_URL in Railway Environment Variables setzen
2. Railway deployt automatisch mit neuer Database
3. Prisma Tables werden automatisch erstellt

## Test Commands:
```bash
# Lokal testen:
npm run db:push

# Migration erstellen:
npx prisma db push
```