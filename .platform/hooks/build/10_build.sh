#!/bin/bash
set -xeuo pipefail
echo "=== Build: pnpm run build ==="

cd "${EB_APP_STAGING_DIR:-/var/app/staging}"
export NODE_ENV=production
pnpm run build

echo "=== Build complete ==="
