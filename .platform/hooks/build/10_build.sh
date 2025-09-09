#!/bin/bash
set -xeuo pipefail
echo "=== Build: npm run build ==="

cd "${EB_APP_STAGING_DIR:-/var/app/staging}"
export NODE_ENV=production

# Ensure .npmrc exists for any package operations during build
if [ ! -f ".npmrc" ]; then
  echo "Creating .npmrc for build process..."
  cat > .npmrc << EOF
@captify-io:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
registry=https://registry.npmjs.org/
EOF
fi

# Build the main application  
echo "Building application..."
npm run build

echo "=== Build complete ==="
