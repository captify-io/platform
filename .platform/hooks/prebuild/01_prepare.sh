#!/bin/bash
set -xeuo pipefail

echo "=== Prebuild: environment setup ==="

# Ensure PATH is set correctly
export PATH="/usr/local/bin:/usr/bin:/bin:/sbin:/usr/sbin:/usr/local/sbin:$PATH"

# Verify Node.js and npm are available
echo "node: $(node -v || true)"
echo "npm:  $(npm -v || true)"

# Check if we have the required versions
NODE_VERSION=$(node -v | cut -d'v' -f2)
NPM_VERSION=$(npm -v)

echo "Node version: $NODE_VERSION"
echo "NPM version: $NPM_VERSION"

# Configure npm for GitHub Packages using environment token
echo "Configuring npm for GitHub Packages..."

# Create .npmrc file for GitHub Packages authentication
# The GITHUB_TOKEN is already set in the EB environment
cat > ~/.npmrc << EOF
@captify-io:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
registry=https://registry.npmjs.org/
EOF

# Also set it in the staging directory for the build process
cat > /var/app/staging/.npmrc << EOF
@captify-io:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
registry=https://registry.npmjs.org/
EOF

echo "✓ npm configured for GitHub Packages with token from environment"

echo "=== Prebuild prepare complete ==="
