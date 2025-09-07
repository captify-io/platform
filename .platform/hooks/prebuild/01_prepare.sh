#!/bin/bash
set -xeuo pipefail

echo "=== Prebuild: ensure pnpm is available ==="

# Make pnpm visible to non-login shells
export PNPM_HOME="/root/.local/share/pnpm"
export PATH="$PNPM_HOME:/usr/local/bin:/usr/bin:/bin:/sbin:/usr/sbin:/usr/local/sbin:$PATH"

# Install specific pnpm version to match lockfile
echo "Installing pnpm@10.15.1 to match lockfile..."
npm install -g pnpm@10.15.1

# Verify installation
hash -r
CURRENT_PNPM_VERSION=$(pnpm --version)
echo "Installed pnpm version: $CURRENT_PNPM_VERSION"

if [ "$CURRENT_PNPM_VERSION" != "10.15.1" ]; then
  echo "ERROR: Failed to install correct pnpm version. Expected 10.15.1, got $CURRENT_PNPM_VERSION"
  exit 1
fi

echo "node: $(node -v || true)"
echo "npm:  $(npm -v || true)"
echo "pnpm: $(pnpm --version)"
echo "=== Prebuild prepare complete ==="
