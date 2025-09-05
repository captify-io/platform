#!/bin/bash
#
# .platform/hooks/predeploy/01_build_app.sh
#
# Build the application after dependencies are installed
#

set -e

echo "=== Building application ==="

cd /var/app/staging

# Build the packages first
pnpm run build:packages || echo "build:packages failed or not found"

# Build the main application
pnpm run build

echo "=== Build complete ==="
