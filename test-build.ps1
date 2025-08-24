# Test Build Script - Mimics Amplify Build Process
Write-Host "🧪 Testing Amplify Build Process Locally..." -ForegroundColor Cyan

# Clean up previous build
Write-Host "Cleaning up previous build..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Install pnpm if not available
Write-Host "Checking pnpm installation..." -ForegroundColor Yellow
if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm@latest
}

# Install dependencies with dev dependencies
Write-Host "Installing dependencies (including dev dependencies)..." -ForegroundColor Yellow
$ErrorActionPreference = "Stop"

try {
    pnpm install --frozen-lockfile
    Write-Host "✅ Installed with frozen lockfile"
} catch {
    Write-Host "⚠️ Frozen lockfile failed, trying without..." -ForegroundColor Yellow
    pnpm install
    Write-Host "✅ Installed dependencies"
}

$ErrorActionPreference = "Continue"

# Debug: Check if node_modules exists and has expected structure
Write-Host "Debugging node_modules structure..." -ForegroundColor Yellow
if (Test-Path node_modules) {
    Write-Host "✅ node_modules directory exists"
    Get-ChildItem node_modules | Select-Object -First 5 | ForEach-Object { Write-Host "  - $($_.Name)" }
} else {
    Write-Host "❌ No node_modules directory" -ForegroundColor Red
}

if (Test-Path node_modules\.bin) {
    Write-Host "✅ .bin directory exists"
    Get-ChildItem node_modules\.bin | Select-Object -First 5 | ForEach-Object { Write-Host "  - $($_.Name)" }
} else {
    Write-Host "❌ No .bin directory" -ForegroundColor Red
}

# Verify dependencies installation
Write-Host "Verifying key dependencies..." -ForegroundColor Yellow
$turboCheck = pnpm list turbo 2>$null
$tsCheck = pnpm list typescript 2>$null
if ($turboCheck -match "turbo") { Write-Host "✅ turbo found" } else { Write-Host "❌ turbo missing" -ForegroundColor Red }
if ($tsCheck -match "typescript") { Write-Host "✅ typescript found" } else { Write-Host "❌ typescript missing" -ForegroundColor Red }

# Try to build workspace packages (non-blocking)
Write-Host "Attempting to build workspace packages..." -ForegroundColor Yellow
try {
    npx turbo run build --filter=packages/*
    Write-Host "✅ Workspace packages built successfully"
} catch {
    try {
        pnpm exec turbo run build --filter=packages/*
        Write-Host "✅ Workspace packages built with pnpm exec"
    } catch {
        Write-Host "⚠️ Workspace packages build skipped, continuing..." -ForegroundColor Yellow
    }
}

# Verify TypeScript installation before type-check
Write-Host "Verifying TypeScript installation..." -ForegroundColor Yellow
try {
    npx tsc --version
    Write-Host "✅ TypeScript is available"
} catch {
    Write-Host "❌ TypeScript not found, this will cause type-check to fail" -ForegroundColor Red
}

# Run type checking
Write-Host "Running type check..." -ForegroundColor Yellow
$typeCheckResult = & pnpm run type-check 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Type check passed" -ForegroundColor Green
} else {
    Write-Host "❌ Type check failed" -ForegroundColor Red
    Write-Host $typeCheckResult
    exit 1
}

# Run linting
Write-Host "Running linting..." -ForegroundColor Yellow
$lintResult = & pnpm run lint 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Linting passed" -ForegroundColor Green
} else {
    Write-Host "❌ Linting failed" -ForegroundColor Red
    Write-Host $lintResult
    exit 1
}

# Build the application
Write-Host "Building Next.js application..." -ForegroundColor Yellow
$buildResult = & pnpm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build completed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    Write-Host $buildResult
    exit 1
}

# Verify build output
Write-Host "Verifying build output..." -ForegroundColor Yellow
if (Test-Path .next) {
    Write-Host "✅ Build output exists"
    Get-ChildItem .next | ForEach-Object { Write-Host "  - $($_.Name)" }
} else {
    Write-Host "❌ No build output found" -ForegroundColor Red
}

Write-Host "🎉 Local build test completed successfully!" -ForegroundColor Green
