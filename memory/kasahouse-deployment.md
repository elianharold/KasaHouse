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
- **Web (`apps/web`, Next.js 16): Vercel.** Only thing on Vercel. Needs `NEXT_PUBLIC_API_BASE_URL` = Railway API URL + `NEXT_PUBLIC_SITE_URL`. Neon org is Vercel-managed ("WebApps"), DB provisioned via Vercel Storage.
- **Vercel pnpm-12 wrapper bug ("the installed pnpm wrapper is missing"):** caused by `packageManager: pnpm@12.3.4` in root package.json → Vercel's broken pnpm bootstrap. FIX APPLIED 2026-09-07: removed the `packageManager` field entirely (Vercel falls back to its built-in pnpm 9, compatible with lockfile v9); added root `.npmrc` (`node-linker=hoisted`, `dedupe-peer-dependents=false`, `enable-pre-post-scripts=true`) so pnpm 9 and 12 install identically; `apps/web/vercel.json` sets `installCommand: pnpm install --frozen-lockfile --filter @kasahouse/web...` and `buildCommand: pnpm --filter @kasahouse/web build`. **Vercel project Root Directory MUST be set to `apps/web`** or vercel.json isn't read and Next isn't detected.

**Why:** the user asked to reconsider hosting; picking the wrong API host would break Phase 2 chat. **How to apply:** when building Phase 2 chat, assume a persistent Node process (Railway/Render), not serverless. See [[kasahouse-overview]] and [[user-prefers-neon]].
