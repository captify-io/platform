#!/bin/bash
set -xeuo pipefail
echo "=== Build: pnpm run build ==="

cd "${EB_APP_STAGING_DIR:-/var/app/staging}"
export NODE_ENV=production

# Build packages first
echo "Building packages..."
pnpm run build:packages

# Build the main application
echo "Building main application..."
pnpm run build

echo "=== Build complete ==="
