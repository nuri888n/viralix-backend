# Viralix Backend

[![CI: Smoke Test](https://github.com/nuri888n/viralix-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/nuri888n/viralix-backend/actions/workflows/ci.yml)

Kleines Express + Prisma Backend mit Auth, Projekten, Accounts und Posts.  
Enthält einen automatischen **Smoke-Test** (GitHub Actions), der bei jedem Push läuft.

## 🔒 Security Features
- **Input Validation**: Comprehensive validation for all API endpoints
- **Rate Limiting**: 100 requests per 15-minute window per IP
- **CORS Protection**: Configurable cross-origin resource sharing
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication

## 📚 API Documentation
See [API.md](./API.md) for complete API documentation with examples.

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
```

## 🧪 Testing & Quality

```bash
# Tests ausführen
npm run test

# Code-Linting
npm run lint

# Linting mit Auto-Fix
npm run lint:fix

# Smoke-Test (API E2E)
npm run smoke:local
```
