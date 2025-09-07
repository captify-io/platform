build: |
  #!/bin/bash
  set -euo pipefail
  
  echo "=== Starting build process ==="
  
  # Set environment variables
  export NODE_ENV=production
  export NEXT_TELEMETRY_DISABLED=1
  
  # Ensure pnpm is available
  export PNPM_HOME="/root/.local/share/pnpm"
  export PATH="$PNPM_HOME:/usr/local/bin:/usr/bin:/bin:/sbin:/usr/sbin:/usr/local/sbin:$PATH"
  
  # Navigate to staging directory
  cd /var/app/staging
  
  echo "Working directory: $(pwd)"
  echo "Node version: $(node --version)"
  echo "pnpm version: $(pnpm --version)"
  
  # Build packages first
  echo "Building packages..."
  pnpm run build:packages
  
  # Build the main application
  echo "Building main application..."
  pnpm run build
  
  # Verify the build
  if [ ! -d ".next" ]; then
    echo "ERROR: .next directory not found after build"
    exit 1
  fi
  
  if [ ! -f ".next/BUILD_ID" ]; then
    echo "ERROR: BUILD_ID not found after build"
    exit 1
  fi
  
  echo "✓ Build completed successfully"
  echo "BUILD_ID: $(cat .next/BUILD_ID)"
  echo "=== Build process complete ==="