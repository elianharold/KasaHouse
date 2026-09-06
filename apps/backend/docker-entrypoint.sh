#!/bin/sh
set -e

# Apply any pending migrations before the API accepts traffic.
# `migrate deploy` is idempotent and safe to run on every boot/instance.
# node_modules is hoisted to the repo root in this image.
echo "Running database migrations…"
node /repo/node_modules/prisma/build/index.js migrate deploy

echo "Starting KasaHouse API…"
exec "$@"
