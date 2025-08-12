# Environment Variables Sync Script for Amplify (PowerShell)
# This script helps sync environment variables from .env to amplify-env-vars.json

Write-Host "🔄 Syncing environment variables for Amplify deployment..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found. Please create one first." -ForegroundColor Red
    exit 1
}

Write-Host "📝 Creating amplify-env-vars.json from .env..." -ForegroundColor Yellow

# Read .env file and create JSON
$envVars = @{}
Get-Content ".env" | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#")) {
        $parts = $line.Split("=", 2)
        if ($parts.Length -eq 2) {
            $key = $parts[0].Trim()
            $value = $parts[1].Trim().Trim('"').Trim("'")
            $envVars[$key] = $value
        }
    }
}

# Convert to JSON and write to file
$envVars | ConvertTo-Json -Depth 1 | Set-Content "amplify-env-vars.json" -Encoding UTF8

Write-Host "✅ amplify-env-vars.json created successfully!" -ForegroundColor Green

# Display variables that need to be set in Amplify Console
Write-Host ""
Write-Host "🚀 Environment variables for Amplify Console:" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Required variables for Amplify
$requiredVars = @(
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "NEXT_PUBLIC_COGNITO_CLIENT_ID",
    "NEXT_PUBLIC_COGNITO_ISSUER",
    "COGNITO_CLIENT_SECRET",
    "COGNITO_USER_POOL_ID",
    "COGNITO_IDENTITY_POOL_ID",
    "COGNITO_SERVICE_CATALOG_POOL_ID",
    "COGNITO_DOMAIN",
    "REGION",
    "AWS_REGION",
    "ACCESS_KEY_ID",
    "SECRET_ACCESS_KEY",
    "BEDROCK_AGENT_ID",
    "BEDROCK_AGENT_ALIAS_ID",
    "BEDROCK_SESSION_ID",
    "NEXT_PUBLIC_BEDROCK_AGENT_ID",
    "S3_BUCKET",
    "S3_REGION",
    "DYNAMODB_APPLICATIONS_TABLE",
    "DYNAMODB_USER_APPLICATION_STATE_TABLE",
    "DYNAMODB_ORGANIZATION_SETTINGS_TABLE",
    "DYNAMODB_MENU_ITEMS_TABLE",
    "DYNAMODB_WORKSPACE_CONTENT_TABLE",
    "DYNAMODB_CHAT_TABLE",
    "MI_DYNAMODB_TABLE",
    "AGENTS_TABLE_NAME",
    "AGENT_JOBS_TABLE_NAME",
    "API_GATEWAY_URL"
)

# Check which required variables are present
$missingVars = @()
foreach ($reqVar in $requiredVars) {
    if ($envVars.ContainsKey($reqVar)) {
        Write-Host "✅ $reqVar" -ForegroundColor Green
    } else {
        $missingVars += $reqVar
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Missing required variables:" -ForegroundColor Yellow
    foreach ($missingVar in $missingVars) {
        Write-Host "❌ $missingVar" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please add these to your .env file and run this script again." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to AWS Amplify Console" -ForegroundColor White
Write-Host "2. Select your app" -ForegroundColor White
Write-Host "3. Go to Environment variables" -ForegroundColor White
Write-Host "4. Add the variables listed above" -ForegroundColor White
Write-Host "5. Deploy your app" -ForegroundColor White

Write-Host ""
Write-Host "🎉 Environment sync complete!" -ForegroundColor Green
