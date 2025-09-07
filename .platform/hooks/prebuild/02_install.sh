#!/bin/bash
set -xeuo pipefail
echo "=== Prebuild: pnpm install ==="

# Hooks already run from /var/app/staging, but be explicit:
cd "${EB_APP_STAGING_DIR:-/var/app/staging}"

# Ensure pnpm is available and PATH is set
export PNPM_HOME="/root/.local/share/pnpm"
export PATH="$PNPM_HOME:/usr/local/bin:/usr/bin:/bin:/sbin:/usr/sbin:/usr/local/sbin:$PATH"

echo "Working directory: $(pwd)"
echo "pnpm version: $(pnpm --version)"
echo "Node version: $(node --version)"

# Clear existing caches and dependencies to ensure clean install
echo "Cleaning existing dependencies and caches..."
rm -rf node_modules packages/*/node_modules .pnpm-store || true
pnpm store prune || true

# Install dependencies without frozen lockfile to handle version mismatches
echo "Installing dependencies (no-frozen-lockfile)..."
pnpm install --no-frozen-lockfile --prefer-offline=false

echo "Verifying installation..."
if [ -d "node_modules" ]; then
  echo "✓ node_modules directory created"
else
  echo "✗ node_modules directory not found"
  exit 1
fi

echo "=== Prebuild install complete ==="
