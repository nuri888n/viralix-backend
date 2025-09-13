# Viralix Backend

[![CI: Smoke Test](https://github.com/nuri888n/viralix-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/nuri888n/viralix-backend/actions/workflows/ci.yml)

Kleines Express + Prisma Backend mit Auth, Projekten, Accounts und Posts.  
Enthält einen automatischen **Smoke-Test** (GitHub Actions), der bei jedem Push läuft.

---

## 🚀 Quickstart (lokal)

```bash
# 1) Dependencies
npm install

# 2) Prisma Client generieren
npx prisma generate

# 3) DB-Migrationen anwenden (lokal)
npx prisma migrate dev --name init_core_models

# 4) Demodaten seeden
npx prisma db seed

# 5) Server starten
npm run dev
# → http://127.0.0.1:3000  (Health: /health)
