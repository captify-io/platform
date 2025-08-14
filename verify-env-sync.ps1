# Environment Variables Sync Verification Script
# This script verifies that all Amplify configuration files are synced with .env

Write-Host "🔍 Verifying environment variable synchronization..." -ForegroundColor Green

# Check if required files exist
$requiredFiles = @(".env", "amplify-env-vars.json", "env-vars.json", "amplify.yml")
$missingFiles = @()

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "❌ Missing required files:" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "   - $file" -ForegroundColor Red
    }
    exit 1
}

# Parse .env file
$envVars = @{}
Get-Content ".env" | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $parts = $line.Split("=", 2)
        if ($parts.Length -eq 2) {
            $key = $parts[0].Trim()
            $value = $parts[1].Trim().Trim('"').Trim("'")
            $envVars[$key] = $value
        }
    }
}

# Check amplify-env-vars.json
Write-Host "📋 Checking amplify-env-vars.json..." -ForegroundColor Yellow
$amplifyVars = Get-Content "amplify-env-vars.json" | ConvertFrom-Json
$amplifyMissing = @()
$amplifyMismatch = @()

foreach ($key in $envVars.Keys) {
    if (-not $amplifyVars.PSObject.Properties.Name.Contains($key)) {
        $amplifyMissing += $key
    } elseif ($amplifyVars.$key -ne $envVars[$key]) {
        $amplifyMismatch += $key
    }
}

if ($amplifyMissing.Count -eq 0 -and $amplifyMismatch.Count -eq 0) {
    Write-Host "✅ amplify-env-vars.json is in sync" -ForegroundColor Green
} else {
    if ($amplifyMissing.Count -gt 0) {
        Write-Host "❌ Missing variables in amplify-env-vars.json:" -ForegroundColor Red
        foreach ($var in $amplifyMissing) {
            Write-Host "   - $var" -ForegroundColor Red
        }
    }
    if ($amplifyMismatch.Count -gt 0) {
        Write-Host "⚠️  Mismatched variables in amplify-env-vars.json:" -ForegroundColor Yellow
        foreach ($var in $amplifyMismatch) {
            Write-Host "   - $var" -ForegroundColor Yellow
        }
    }
}

# Check env-vars.json
Write-Host "📋 Checking env-vars.json..." -ForegroundColor Yellow
$legacyVars = Get-Content "env-vars.json" | ConvertFrom-Json
$legacyMissing = @()
$legacyMismatch = @()

foreach ($key in $envVars.Keys) {
    if (-not $legacyVars.PSObject.Properties.Name.Contains($key)) {
        $legacyMissing += $key
    } elseif ($legacyVars.$key -ne $envVars[$key]) {
        $legacyMismatch += $key
    }
}

if ($legacyMissing.Count -eq 0 -and $legacyMismatch.Count -eq 0) {
    Write-Host "✅ env-vars.json is in sync" -ForegroundColor Green
} else {
    if ($legacyMissing.Count -gt 0) {
        Write-Host "❌ Missing variables in env-vars.json:" -ForegroundColor Red
        foreach ($var in $legacyMissing) {
            Write-Host "   - $var" -ForegroundColor Red
        }
    }
    if ($legacyMismatch.Count -gt 0) {
        Write-Host "⚠️  Mismatched variables in env-vars.json:" -ForegroundColor Yellow
        foreach ($var in $legacyMismatch) {
            Write-Host "   - $var" -ForegroundColor Yellow
        }
    }
}

# Check amplify.yml for environment variables
Write-Host "📋 Checking amplify.yml..." -ForegroundColor Yellow
$amplifyYml = Get-Content "amplify.yml" -Raw

# Critical variables that should be in amplify.yml
$criticalVars = @(
    "NEXTAUTH_URL", "NEXTAUTH_SECRET", "NEXT_PUBLIC_COGNITO_CLIENT_ID",
    "COGNITO_CLIENT_SECRET", "ACCESS_KEY_ID", "SECRET_ACCESS_KEY",
    "MI_DYNAMODB_TABLE", "REGION", "BEDROCK_AGENT_ID"
)

$amplifyYmlMissing = @()
foreach ($var in $criticalVars) {
    if (-not $amplifyYml.Contains("`${$var}")) {
        $amplifyYmlMissing += $var
    }
}

if ($amplifyYmlMissing.Count -eq 0) {
    Write-Host "✅ amplify.yml contains all critical variables" -ForegroundColor Green
} else {
    Write-Host "❌ Missing variables in amplify.yml:" -ForegroundColor Red
    foreach ($var in $amplifyYmlMissing) {
        Write-Host "   - $var" -ForegroundColor Red
    }
}

# Summary
Write-Host ""
Write-Host "📊 Synchronization Summary:" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host "Total variables in .env: $($envVars.Count)" -ForegroundColor White

if ($amplifyMissing.Count -eq 0 -and $amplifyMismatch.Count -eq 0 -and 
    $legacyMissing.Count -eq 0 -and $legacyMismatch.Count -eq 0 -and 
    $amplifyYmlMissing.Count -eq 0) {
    Write-Host "🎉 All configuration files are properly synced!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some configuration files need attention." -ForegroundColor Yellow
    Write-Host "Run 'sync-env.ps1' to update JSON files." -ForegroundColor White
}

Write-Host ""
