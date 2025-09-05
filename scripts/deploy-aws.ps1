# AWS Elastic Beanstalk Deployment Script
# Run this script from the project root directory

param(
    [string]$Environment = "Anautics-ai-env",
    [string]$Region = "us-east-1"
)

Write-Host "🚀 Starting Elastic Beanstalk deployment..." -ForegroundColor Green

# Step 1: Build packages
Write-Host "📦 Building packages..." -ForegroundColor Yellow
pnpm run build:packages
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Package build failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Build Next.js app
Write-Host "🏗️ Building Next.js application..." -ForegroundColor Yellow
pnpm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Application build failed!" -ForegroundColor Red
    exit 1
}

# Step 3: Create deployment package
Write-Host "📁 Creating deployment package..." -ForegroundColor Yellow
$deployFile = "deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
$excludePatterns = @(
    "node_modules\*",
    ".next\*", 
    "packages\*\node_modules\*",
    "packages\*\dist\*",
    ".git\*",
    "*.log"
)

# Use 7-Zip or PowerShell compression
if (Get-Command "7z" -ErrorAction SilentlyContinue) {
    7z a $deployFile . -x!"node_modules\*" -x!".next\*" -x!"packages\*\node_modules\*" -x!"packages\*\dist\*" -x!".git\*"
} else {
    Compress-Archive -Path "." -DestinationPath $deployFile -Force
}

Write-Host "✅ Created deployment package: $deployFile" -ForegroundColor Green

# Step 4: Get AWS Account ID for S3 bucket
Write-Host "🔍 Getting AWS account information..." -ForegroundColor Yellow
$accountId = aws sts get-caller-identity --query Account --output text
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to get AWS account ID. Make sure AWS CLI is configured." -ForegroundColor Red
    exit 1
}

$bucketName = "elasticbeanstalk-$Region-$accountId"
$s3Key = "anautics-ai/$deployFile"

# Step 5: Upload to S3
Write-Host "☁️ Uploading to S3..." -ForegroundColor Yellow
aws s3 cp $deployFile "s3://$bucketName/$s3Key"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ S3 upload failed!" -ForegroundColor Red
    exit 1
}

# Step 6: Create application version
$versionLabel = "v$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "🏷️ Creating application version: $versionLabel" -ForegroundColor Yellow

aws elasticbeanstalk create-application-version `
    --application-name anautics-ai `
    --version-label $versionLabel `
    --source-bundle "S3Bucket=$bucketName,S3Key=$s3Key"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create application version!" -ForegroundColor Red
    exit 1
}

# Step 7: Deploy to environment
Write-Host "🚀 Deploying to environment: $Environment" -ForegroundColor Yellow
aws elasticbeanstalk update-environment `
    --environment-name $Environment `
    --version-label $versionLabel

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Environment update failed!" -ForegroundColor Red
    exit 1
}

# Step 8: Wait for deployment
Write-Host "⏳ Waiting for deployment to complete..." -ForegroundColor Yellow
aws elasticbeanstalk wait environment-updated --environment-name $Environment

# Step 9: Get environment URL
$envUrl = aws elasticbeanstalk describe-environments `
    --environment-names $Environment `
    --query "Environments[0].CNAME" `
    --output text

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Application URL: http://$envUrl" -ForegroundColor Cyan
Write-Host "📊 Monitor at: https://console.aws.amazon.com/elasticbeanstalk/" -ForegroundColor Cyan

# Cleanup
Remove-Item $deployFile -Force
Write-Host "🧹 Cleaned up temporary files" -ForegroundColor Gray
