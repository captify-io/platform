#!/bin/bash
set -xeuo pipefail
echo "=== Prebuild: pnpm install ==="

# Hooks already run from /var/app/staging, but be explicit:
cd "${EB_APP_STAGING_DIR:-/var/app/staging}"

# Try reproducible install first; fall back if lockfile is stale
if pnpm install --frozen-lockfile; then
  echo "pnpm install (frozen) succeeded"
else
  echo "Lockfile out of date; retrying without frozen..."
  pnpm install --no-frozen-lockfile
fi

echo "=== Prebuild install complete ==="
