#!/bin/bash
set -xeuo pipefail

echo "=== Prebuild: ensure pnpm is available ==="

# Make pnpm visible to non-login shells
export PNPM_HOME="/root/.local/share/pnpm"
export PATH="$PNPM_HOME:/usr/local/bin:/usr/bin:/bin:/sbin:/usr/sbin:/usr/local/sbin:$PATH"

# Prefer corepack if present; otherwise install via npm -g
if command -v corepack >/dev/null 2>&1; then
  corepack enable || true
  corepack prepare pnpm@9.0.0 --activate || true
fi
if ! command -v pnpm >/dev/null 2>&1; then
  npm install -g pnpm@9.0.0
fi

hash -r
echo "node: $(node -v || true)"
echo "npm:  $(npm -v || true)"
echo "pnpm: $(pnpm --version)"
echo "=== Prebuild prepare complete ==="
