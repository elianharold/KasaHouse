---
name: kasahouse-overview
description: What KasaHouse is, its stack, and which build phase the code is at
metadata:
  type: project
---

KasaHouse — direct landlord/seller-to-tenant/buyer property marketplace for Ghana (eliminates agent fees). pnpm monorepo: `apps/backend` (NestJS 12 + Prisma 6 + Postgres), `apps/mobile` (Expo SDK 57 + Expo Router + NativeWind + TanStack Query + Zustand), `packages/shared-types`.

As of 2026-09-06 the repo implements **Phase 1 only**: phone-OTP auth, roles, listings CRUD/browse/search, Cloudinary signed-upload media pipeline, and the page→hook→service→API / controller→service→repository scaffolding. Verified: all packages typecheck, backend boots + maps routes, mobile bundles for iOS/Android, expo-doctor 21/21. Not yet done: live DB run (needs the user's Neon string).

Remaining phases: 2 = Smile ID KYC + Socket.io chat with off-platform-payment flagging; 3 = Flutterwave payments behind a `PaymentProvider` abstraction + split payments + internal reconciliation ledger; 4 = lease e-signature; 5 = dashboard polish + admin property-verification queue + push. See [[kasahouse-deployment]].

Money is stored as integer pesewas, currency always GHS. SMS provider is an abstraction (`SMS_PROVIDER` token): `console` for dev (OTP echoed in API response + logs), `africastalking` for real. Prisma pinned to 6.19.3 because Prisma 7's `latest` npm tag is a breaking RC.
