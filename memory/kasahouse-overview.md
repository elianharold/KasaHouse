---
name: kasahouse-overview
description: What KasaHouse is, its stack, and which build phase the code is at
metadata:
  type: project
---

KasaHouse — direct landlord/seller-to-tenant/buyer property marketplace for Ghana (eliminates agent fees). pnpm monorepo: `apps/backend` (NestJS **11** CJS + Prisma 6 with `@prisma/adapter-pg` driver adapter + Postgres), `apps/mobile` (Expo SDK 57 + Expo Router + NativeWind + TanStack Query + Zustand), `apps/web` (Next.js 16 App Router + Tailwind v4, full feature parity with mobile, deploys to Vercel), `packages/shared-types`.

Web app talks to the same NestJS API as mobile — it never touches Postgres directly. "Full feature parity" = parity with whatever backend phase is live (so the web app grows feature-by-feature alongside mobile, not all at once).

As of 2026-09-07 the repo implements **Phase 1** across backend + mobile + web: phone-OTP auth, roles, listings CRUD/browse/search/detail/edit/publish, Cloudinary signed-upload media pipeline (client-side compression), page→hook→service→API / controller→service→repository scaffolding. Web app (`apps/web`, Next.js 16 App Router + Tailwind v4) mirrors mobile feature-for-feature and adds SSR + SEO metadata on public browse/listing pages; auth tokens in cookies (js-cookie, not httpOnly — hardening TODO), `proxy.ts` (renamed from middleware.ts per Next 16) gates /dashboard + /profile. Verified: all 4 packages typecheck, `next build` clean, mobile bundles iOS/Android + expo-doctor 21/21. **Backend is LIVE on Vercel at `kasahouse.vercel.app`** (project name "kasahouse") — `/api/v1/health` returns `db: "up"` against the Neon DB. As of 2026-09-07 migrations were being wired to run in the Vercel build (`vercel-build` = `prisma migrate deploy && ...`); after that redeploy, `/api/v1/listings` works. Web app (`apps/web`) still needs its own Vercel project with `NEXT_PUBLIC_API_BASE_URL=https://kasahouse.vercel.app/api/v1`.

Remaining phases: 2 = Smile ID KYC + Socket.io chat with off-platform-payment flagging; 3 = Flutterwave payments behind a `PaymentProvider` abstraction + split payments + internal reconciliation ledger; 4 = lease e-signature; 5 = dashboard polish + admin property-verification queue + push. See [[kasahouse-deployment]].

Money is stored as integer pesewas, currency always GHS. SMS provider is an abstraction (`SMS_PROVIDER` token): `console` for dev (OTP echoed in API response + logs), `africastalking` for real. Prisma pinned to 6.19.3 because Prisma 7's `latest` npm tag is a breaking RC.
