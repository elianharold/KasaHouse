# KasaHouse

Direct landlord/seller-to-tenant/buyer property marketplace for Ghana — list a
property directly, get KYC-verified, chat with the owner, sign in-app, and pay
rent with the commission split out automatically. No agent fees.

This repository is a **pnpm monorepo**:

| Package | Path | Stack |
| --- | --- | --- |
| `@kasahouse/mobile` | `apps/mobile` | Expo (SDK 57) · Expo Router · React Native 0.81 · NativeWind · TanStack Query · Zustand · react-hook-form + zod |
| `@kasahouse/backend` | `apps/backend` | NestJS 12 · Prisma 6 · PostgreSQL · Passport JWT · Cloudinary · Africa's Talking |
| `@kasahouse/shared-types` | `packages/shared-types` | Framework-agnostic TypeScript types shared by both apps (API shapes, enums, route constants) |

---

## Build phases

The product is built in deliberate phases (see the original brief). **This
codebase currently implements Phase 1.**

1. **Phase 1 — DONE.** Phone-OTP auth, roles, listings (create / browse / search
   / detail / edit / publish), media upload pipeline (Cloudinary, signed direct
   upload with on-device compression), and the full
   page → hook → service → API / controller → service → repository scaffolding.
2. Phase 2 — Ghana Card KYC (Smile ID) + in-app chat with off-platform-payment flagging.
3. Phase 3 — Flutterwave payments behind a `PaymentProvider` abstraction, split payments, internal reconciliation ledger.
4. Phase 4 — Lease/sale agreement e-signature flow.
5. Phase 5 — Landlord dashboard polish, admin property-verification queue, push notifications.

Phase-2+ concepts already have a home in the schema/types where it was cheap to
reserve them (e.g. `User.kycStatus`), but no Phase-2+ feature code exists yet.

---

## Prerequisites

- **Node 20+** (tested on Node 24)
- **pnpm 10+** (`npm i -g pnpm`) — tested on pnpm 12.3
- **A PostgreSQL 14+ database** — a free [Neon](https://neon.tech) project is the
  easiest (no local install); a local Postgres works too. Set `DATABASE_URL`
  (pooled) and `DIRECT_URL` (direct) in `apps/backend/.env` — for a local
  Postgres both are the same value.
- For the mobile app: the **Expo Go** app on a phone, or an Android/iOS emulator

> The workspace uses `nodeLinker: hoisted` (set in `pnpm-workspace.yaml`) because
> React Native's Metro bundler needs a flat `node_modules`. Keep that setting.

---

## First-time setup

```bash
# 1. Install everything (also builds shared-types and generates the Prisma client)
pnpm install

# 2. Backend env
cd apps/backend
cp .env.example .env
#   - set DATABASE_URL to your local Postgres
#   - generate JWT secrets:
#       node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
#   - leave SMS_PROVIDER=console for development (OTP codes are logged AND
#     returned by the API so you can sign in without a real SMS gateway)

# 3. Create the database schema and seed demo listings
pnpm prisma:migrate      # applies prisma/migrations
pnpm db:seed             # a few landlords + published listings

cd ../..
```

### Mobile env (optional)

`apps/mobile` auto-detects the API URL from the Expo dev-server host, falling
back to `http://localhost:4000/api/v1` (iOS/web) or `http://10.0.2.2:4000/api/v1`
(Android emulator). To point at a specific machine, copy `apps/mobile/.env.example`
to `apps/mobile/.env` and set `EXPO_PUBLIC_API_BASE_URL`.

---

## Running

```bash
# Terminal 1 — API (http://localhost:4000/api/v1, health at /health)
pnpm dev:backend

# Terminal 2 — Expo dev server
pnpm dev:mobile      # then press "a" (Android), "i" (iOS), or scan the QR in Expo Go
```

Sign-in flow in development: enter any valid Ghana number (e.g. `0201110001`),
then the 6-digit code — in `console` SMS mode the code is printed in the API logs
**and** pre-filled on the verify screen.

---

## Useful scripts (run from the repo root)

| Command | What it does |
| --- | --- |
| `pnpm typecheck` | Type-checks every package |
| `pnpm build:types` | Rebuilds `@kasahouse/shared-types` |
| `pnpm dev:backend` | NestJS in watch mode |
| `pnpm dev:mobile` | Expo dev server |
| `pnpm prisma:migrate` | `prisma migrate dev` (backend) |
| `pnpm prisma:generate` | Regenerate the Prisma client |
| `pnpm db:seed` | Seed demo data |
| `pnpm --filter @kasahouse/backend build` | Compile the API to `apps/backend/dist` |
| `pnpm --filter @kasahouse/mobile exec expo export -p android` | Produce a JS bundle (CI smoke test) |

---

## Deployment

**The mobile app does not deploy to a server** — it's built with EAS
(`eas build`) and submitted to the App Store / Play Store. Only the API is
hosted.

### Database — Neon

Create a free project at [neon.tech](https://neon.tech). From the project's
**Connection Details**, copy both:

- **Pooled** connection string (host contains `-pooler`) → `DATABASE_URL`
- **Direct** connection string (no `-pooler`) → `DIRECT_URL`

Both end with `?sslmode=require`. The running API uses the pooled URL;
`prisma migrate` uses the direct one (`directUrl` in `schema.prisma`).

### API — Railway or Render (Docker)

The API ships as a Docker image built from the **repo root** context:
`apps/backend/Dockerfile`. On boot the container runs `prisma migrate deploy`
(idempotent) then starts the server. Health check: `GET /api/v1/health`.

**Railway:** New Project → Deploy from repo. Railway picks up `railway.json`
(Dockerfile build, health check). Add env vars: `DATABASE_URL`, `DIRECT_URL`,
`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGINS`, and (later)
`AT_*` / `CLOUDINARY_*`. Railway supports the WebSockets needed for Phase 2 chat.

**Render:** New → Blueprint, point at this repo. `render.yaml` defines the
service and generates the JWT secrets; paste `DATABASE_URL` / `DIRECT_URL` /
`CORS_ORIGINS` when prompted (they're marked `sync: false`).

Local Docker smoke test (needs Docker):

```bash
docker build -f apps/backend/Dockerfile -t kasahouse-api .
docker run --rm -p 4000:4000 \
  -e DATABASE_URL=... -e DIRECT_URL=... \
  -e JWT_ACCESS_SECRET=... -e JWT_REFRESH_SECRET=... \
  kasahouse-api
```

---

## Architecture notes

### page → hook → service → API  /  controller → service → repository

Both apps use the same shape so a feature reads top-to-bottom the same way on
each side:

```
mobile:   app/(tabs)/index.tsx        (screen — layout & state only)
            └─ src/hooks/use-listings.ts   (TanStack Query wiring)
                 └─ src/services/listings-service.ts   (Axios calls, typed)
                      └─ src/api/client.ts   (base URL, auth header, refresh)

backend:  listings.controller.ts      (HTTP, DTO validation, auth guards)
            └─ listings.service.ts         (business rules)
                 └─ listings.repository.ts     (Prisma only)
```

### Provider abstractions

`apps/backend/src/modules/sms` defines an `SmsProvider` interface with a
`console` implementation (dev) and an `africastalking` implementation (real,
following the official SDK). Feature code depends only on the `SMS_PROVIDER`
token. **The same pattern is mandated for Flutterwave in Phase 3** — see the
brief's `services/payments/PaymentProvider.ts` requirement.

### Money

All amounts are stored and transported as **pesewas** (integer), currency is
always **GHS**. `toPesewas` / `fromPesewas` / `formatGhs` live in
`@kasahouse/shared-types` and `apps/mobile/src/lib/format.ts`.

### Media

The device compresses images on-device (`expo-image-manipulator`), asks the API
for a **signed** Cloudinary upload signature (computed with the official
`cloudinary.utils.api_sign_request` helper), uploads the bytes **directly** to
Cloudinary, then registers the resulting asset with the API. The API never
proxies file bytes. Cloudinary is optional in Phase 1 — media endpoints return
`503` with a clear message until `CLOUDINARY_*` is configured.

---

## What "confirm it runs" means for Phase 1

- `pnpm install` → clean, builds shared-types, generates Prisma client.
- `pnpm typecheck` → all four packages pass (strict mode).
- `pnpm --filter @kasahouse/backend build` → compiles; `node dist/main.js` boots,
  maps every route, and connects to Postgres when `DATABASE_URL` is reachable.
- `apps/mobile` → `expo export` bundles for iOS and Android; `expo-doctor` passes
  21/21; `expo start` serves the app to Expo Go / emulators.

The one thing that needs your environment: a running PostgreSQL. Everything else
is wired.
