---
name: kasahouse-deployment
description: KasaHouse hosting decisions — Neon DB, Railway/Render for the API, not Vercel
metadata:
  type: project
---

Decided 2026-09-06 with the user:

- **Database: Neon** (serverless Postgres), provisioned directly at neon.tech (not via Vercel's marketplace). `schema.prisma` uses `url` = pooled string (`DATABASE_URL`) + `directUrl` = direct string (`DIRECT_URL`) for migrations.
- **API host: Railway or Render**, NOT Vercel. The user initially wanted Vercel but NestJS is a long-lived server and Phase 2 needs Socket.io/WebSockets, which Vercel serverless can't do. Scaffolding added: `apps/backend/Dockerfile` (build context = repo root), `railway.json`, `render.yaml`. Container runs `prisma migrate deploy` on boot via `docker-entrypoint.sh`, health check `GET /api/v1/health`.
- **Mobile: not server-hosted** — EAS Build → App Store / Play Store.

**Why:** the user asked to reconsider hosting; picking the wrong API host would break Phase 2 chat. **How to apply:** when building Phase 2 chat, assume a persistent Node process (Railway/Render), not serverless. See [[kasahouse-overview]] and [[user-prefers-neon]].
