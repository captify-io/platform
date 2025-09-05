#!/bin/bash
set -xeuo pipefail
echo "=== Predeploy: verify build & prep runtime ==="

cd "${EB_APP_STAGING_DIR:-/var/app/staging}"

# Keep pnpm on PATH in this phase too
export PNPM_HOME="/root/.local/share/pnpm"
export PATH="$PNPM_HOME:/usr/local/bin:/usr/bin:/bin:/sbin:/usr/sbin:/usr/local/sbin:$PATH"

# Validate build output (adjust if your project outputs to another dir)
if [ ! -d ".next" ] && [ ! -d "build" ]; then
  echo "ERROR: Build output not found (.next or build). Did the build step run?"
  exit 1
fi

# Ensure the app will bind to EB-provided PORT (Next.js start uses this)
: "${PORT:=8081}"
echo "PORT will be ${PORT}"

# Optional: run migrations only if a migrate script exists
if grep -q '"migrate' package.json 2>/dev/null; then
  echo "Running migrations..."
  pnpm run migrate || true
fi

echo "=== Predeploy complete ==="
