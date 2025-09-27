#!/bin/bash
set -xeuo pipefail
echo "=== Prebuild: npm install ==="

# Hooks already run from /var/app/staging, but be explicit:
cd "${EB_APP_STAGING_DIR:-/var/app/staging}"

# Ensure PATH is set
export PATH="/usr/local/bin:/usr/bin:/bin:/sbin:/usr/sbin:/usr/local/sbin:$PATH"

echo "Working directory: $(pwd)"
echo "NPM version: $(npm --version)"
echo "Node version: $(node --version)"

# Verify .npmrc exists with token
if [ -f ".npmrc" ]; then
  echo "✓ .npmrc file found"
else
  echo "✗ .npmrc file not found, creating from environment..."
  cat > .npmrc << EOF
@captify-io:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
registry=https://registry.npmjs.org/
EOF
fi

# Clear existing caches and dependencies to ensure clean install
echo "Cleaning existing dependencies..."
rm -rf node_modules .npm || true
npm cache clean --force || true

# Install dependencies
echo "Installing dependencies with GitHub token..."
npm ci --legacy-peer-deps

echo "Verifying installation..."
if [ -d "node_modules" ]; then
  echo "✓ node_modules directory created"
  
  # Check if @captify-io packages were installed
  if [ -d "node_modules/@captify-io" ]; then
    echo "✓ @captify-io packages installed successfully"
  else
    echo "⚠ @captify-io packages not found - check GITHUB_TOKEN permissions"
  fi
else
  echo "✗ node_modules directory not found"
  exit 1
fi

echo "=== Prebuild install complete ==="
