# syntax=docker/dockerfile:1
#
# KasaHouse API image. BUILD FROM THE REPO ROOT so the pnpm workspace
# (pnpm-workspace.yaml, lockfile, packages/shared-types) is in context:
#
#   docker build -f apps/backend/Dockerfile -t kasahouse-api .
#
# Railway: set "Dockerfile Path" = apps/backend/Dockerfile, root directory = repo root.
# Render:  handled by render.yaml at the repo root.

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate
# OpenSSL is needed by the Prisma schema engine (`prisma migrate deploy`, run
# from docker-entrypoint.sh). The runtime uses the pure-JS pg driver adapter.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /repo

# ---- deps + build ----
# shared-types (tiny) and the prisma schema are copied before install because
# their `prepare` / `postinstall` scripts run during `pnpm install`.
FROM base AS build
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY apps/mobile/package.json ./apps/mobile/
COPY apps/web/package.json ./apps/web/
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types ./packages/shared-types
COPY apps/backend/prisma ./apps/backend/prisma
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile \
      --filter @kasahouse/backend... \
      --filter @kasahouse/shared-types

COPY apps/backend ./apps/backend
RUN pnpm --filter @kasahouse/shared-types build \
 && pnpm --filter @kasahouse/backend run build

# ---- runner ----
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /repo

COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/package.json ./package.json
COPY --from=build /repo/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /repo/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=build /repo/packages/shared-types/package.json ./packages/shared-types/package.json
COPY --from=build /repo/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=build /repo/apps/backend/dist ./apps/backend/dist
COPY --from=build /repo/apps/backend/package.json ./apps/backend/package.json
COPY --from=build /repo/apps/backend/prisma ./apps/backend/prisma
COPY --from=build /repo/apps/backend/docker-entrypoint.sh ./apps/backend/docker-entrypoint.sh

WORKDIR /repo/apps/backend
RUN chmod +x docker-entrypoint.sh
EXPOSE 4000

# Runs `prisma migrate deploy` (idempotent), then starts the API.
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
