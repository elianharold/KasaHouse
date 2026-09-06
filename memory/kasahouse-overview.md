---
name: kasahouse-overview
description: What KasaHouse is, its stack, and which build phase the code is at
metadata:
  type: project
---

KasaHouse — direct landlord/seller-to-tenant/buyer property marketplace for Ghana (eliminates agent fees). pnpm monorepo: `apps/backend` (NestJS 12 + Prisma 6 + Postgres), `apps/mobile` (Expo SDK 57 + Expo Router + NativeWind + TanStack Query + Zustand), `apps/web` (Next.js 15, planned — decided 2026-09-06, full feature parity with mobile, deploys to Vercel), `packages/shared-types`.

Web app talks to the same NestJS API as mobile — it never touches Postgres directly. "Full feature parity" = parity with whatever backend phase is live (so the web app grows feature-by-feature alongside mobile, not all at once).

As of 2026-09-07 the repo implements **Phase 1** across backend + mobile + web: phone-OTP auth, roles, listings CRUD/browse/search/detail/edit/publish, Cloudinary signed-upload media pipeline (client-side compression), page→hook→service→API / controller→service→repository scaffolding. Web app (`apps/web`, Next.js 16 App Router + Tailwind v4) mirrors mobile feature-for-feature and adds SSR + SEO metadata on public browse/listing pages; auth tokens in cookies (js-cookie, not httpOnly — hardening TODO), `proxy.ts` (renamed from middleware.ts per Next 16) gates /dashboard + /profile. Verified: all 4 packages typecheck, backend boots + maps routes, mobile bundles iOS/Android + expo-doctor 21/21, `next build` clean. Not yet done: live DB run (needs the user's Neon connection strings).

Remaining phases: 2 = Smile ID KYC + Socket.io chat with off-platform-payment flagging; 3 = Flutterwave payments behind a `PaymentProvider` abstraction + split payments + internal reconciliation ledger; 4 = lease e-signature; 5 = dashboard polish + admin property-verification queue + push. See [[kasahouse-deployment]].

Money is stored as integer pesewas, currency always GHS. SMS provider is an abstraction (`SMS_PROVIDER` token): `console` for dev (OTP echoed in API response + logs), `africastalking` for real. Prisma pinned to 6.19.3 because Prisma 7's `latest` npm tag is a breaking RC.
