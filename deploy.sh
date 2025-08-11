#!/bin/bash

# Captify Amplify Deployment Script
# Usage: ./deploy.sh [dev|staging|prod]

set -e

# Default environment
ENV=${1:-dev}

echo "🚀 Starting deployment to $ENV environment..."

# Validate environment
case $ENV in
  dev|staging|prod)
    echo "✅ Deploying to $ENV environment"
    ;;
  *)
    echo "❌ Invalid environment: $ENV"
    echo "Usage: ./deploy.sh [dev|staging|prod]"
    exit 1
    ;;
esac

# Check if Amplify CLI is installed
if ! command -v amplify &> /dev/null; then
    echo "❌ Amplify CLI not found. Installing..."
    npm install -g @aws-amplify/cli
fi

# Check if authenticated with Amplify
if ! amplify status &> /dev/null; then
    echo "❌ Not authenticated with Amplify. Please run: amplify configure"
    exit 1
fi

# Validate environment variables based on environment
echo "🔍 Validating environment variables..."
required_vars=(
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
    "NEXT_PUBLIC_COGNITO_CLIENT_ID"
    "NEXT_PUBLIC_COGNITO_ISSUER"
    "COGNITO_CLIENT_SECRET"
    "REGION"
    "ACCESS_KEY_ID"
    "SECRET_ACCESS_KEY"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '%s\n' "${missing_vars[@]}"
    echo "Please set these variables before deploying."
    exit 1
fi

echo "✅ All required environment variables are set"

# Run pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found. Installing..."
    npm install -g pnpm
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Run tests and validation
echo "🧪 Running validation..."
pnpm run lint
pnpm run type-check

# Build application
echo "🔨 Building application..."
pnpm run build

echo "✅ Pre-deployment checks passed"

# Deploy based on environment
case $ENV in
  dev)
    echo "🚀 Deploying to development..."
    amplify publish --environment dev
    ;;
  staging)
    echo "🚀 Deploying to staging..."
    amplify publish --environment staging
    ;;
  prod)
    echo "🚀 Deploying to production..."
    echo "⚠️  Production deployment requires confirmation"
    read -p "Are you sure you want to deploy to production? (y/N): " confirm
    if [[ $confirm =~ ^[Yy]$ ]]; then
        amplify publish --environment prod
    else
        echo "❌ Production deployment cancelled"
        exit 1
    fi
    ;;
esac

echo "✅ Deployment completed successfully!"

# Display deployment URL
amplify status | grep -E "Hosting|URL" || true

echo "🎉 Deployment to $ENV environment complete!"
