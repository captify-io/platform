# Captify Amplify Deployment Script (Windows PowerShell)
# Usage: .\deploy.ps1 [dev|staging|prod]

param(
    [string]$Environment = "dev"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting deployment to $Environment environment..." -ForegroundColor Green

# Validate environment
switch ($Environment) {
    { $_ -in @("dev", "staging", "prod") } {
        Write-Host "✅ Deploying to $Environment environment" -ForegroundColor Green
    }
    default {
        Write-Host "❌ Invalid environment: $Environment" -ForegroundColor Red
        Write-Host "Usage: .\deploy.ps1 [dev|staging|prod]" -ForegroundColor Yellow
        exit 1
    }
}

# Check if Amplify CLI is installed
try {
    amplify --version | Out-Null
    Write-Host "✅ Amplify CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Amplify CLI not found. Installing..." -ForegroundColor Red
    npm install -g @aws-amplify/cli
}

# Check if authenticated with Amplify
try {
    amplify status | Out-Null
    Write-Host "✅ Authenticated with Amplify" -ForegroundColor Green
} catch {
    Write-Host "❌ Not authenticated with Amplify. Please run: amplify configure" -ForegroundColor Red
    exit 1
}

# Validate environment variables
Write-Host "🔍 Validating environment variables..." -ForegroundColor Yellow

$requiredVars = @(
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET", 
    "NEXT_PUBLIC_COGNITO_CLIENT_ID",
    "NEXT_PUBLIC_COGNITO_ISSUER",
    "COGNITO_CLIENT_SECRET",
    "REGION",
    "ACCESS_KEY_ID",
    "SECRET_ACCESS_KEY"
)

$missingVars = @()
foreach ($var in $requiredVars) {
    if (-not (Get-ChildItem Env: | Where-Object Name -eq $var)) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "❌ Missing required environment variables:" -ForegroundColor Red
    $missingVars | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host "Please set these variables before deploying." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ All required environment variables are set" -ForegroundColor Green

# Run pre-deployment checks
Write-Host "🔍 Running pre-deployment checks..." -ForegroundColor Yellow

# Check if pnpm is installed
try {
    pnpm --version | Out-Null
    Write-Host "✅ pnpm found" -ForegroundColor Green
} catch {
    Write-Host "❌ pnpm not found. Installing..." -ForegroundColor Red
    npm install -g pnpm
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
pnpm install --frozen-lockfile

# Run tests and validation
Write-Host "🧪 Running validation..." -ForegroundColor Yellow
pnpm run lint
pnpm run type-check

# Build application
Write-Host "🔨 Building application..." -ForegroundColor Yellow
pnpm run build

Write-Host "✅ Pre-deployment checks passed" -ForegroundColor Green

# Deploy based on environment
switch ($Environment) {
    "dev" {
        Write-Host "🚀 Deploying to development..." -ForegroundColor Green
        amplify publish --environment dev
    }
    "staging" {
        Write-Host "🚀 Deploying to staging..." -ForegroundColor Green
        amplify publish --environment staging
    }
    "prod" {
        Write-Host "🚀 Deploying to production..." -ForegroundColor Green
        Write-Host "⚠️  Production deployment requires confirmation" -ForegroundColor Yellow
        $confirm = Read-Host "Are you sure you want to deploy to production? (y/N)"
        if ($confirm -match "^[Yy]$") {
            amplify publish --environment prod
        } else {
            Write-Host "❌ Production deployment cancelled" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green

# Display deployment status
try {
    amplify status
} catch {
    Write-Host "Could not retrieve status" -ForegroundColor Yellow
}

Write-Host "🎉 Deployment to $Environment environment complete!" -ForegroundColor Green
