#!/bin/bash
set -xeuo pipefail
echo "=== Predeploy: verify build & prep runtime ==="

cd "${EB_APP_STAGING_DIR:-/var/app/staging}"

# Validate build output
if [ ! -d ".next" ]; then
  echo "ERROR: Build output not found (.next). Did the build step run?"
  exit 1
fi

# Verify the application can start
echo "Verifying Next.js build..."
if [ ! -f ".next/BUILD_ID" ]; then
  echo "WARNING: No BUILD_ID found. Build may be incomplete."
fi

# Ensure the app will bind to EB-provided PORT
: "${PORT:=8081}"
echo "PORT will be ${PORT}"

echo "=== Predeploy complete ==="
