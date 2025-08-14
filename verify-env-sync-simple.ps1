# Environment Variables Sync Verification Script
Write-Host "Verifying environment variable synchronization..." -ForegroundColor Green

# Check if required files exist
$requiredFiles = @(".env", "amplify-env-vars.json", "env-vars.json", "amplify.yml")
$missingFiles = @()

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "Missing required files:" -ForegroundColor Red
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
            $value = $parts[1].Trim()
            $envVars[$key] = $value
        }
    }
}

Write-Host "Total variables in .env file: $($envVars.Count)" -ForegroundColor Cyan

# Check amplify-env-vars.json
Write-Host "Checking amplify-env-vars.json..." -ForegroundColor Yellow
$amplifyVars = Get-Content "amplify-env-vars.json" | ConvertFrom-Json
$amplifyMissing = @()

foreach ($key in $envVars.Keys) {
    if (-not $amplifyVars.PSObject.Properties.Name.Contains($key)) {
        $amplifyMissing += $key
    }
}

if ($amplifyMissing.Count -eq 0) {
    Write-Host "amplify-env-vars.json is in sync" -ForegroundColor Green
} else {
    Write-Host "Missing variables in amplify-env-vars.json:" -ForegroundColor Red
    foreach ($var in $amplifyMissing) {
        Write-Host "   - $var" -ForegroundColor Red
    }
}

# Check env-vars.json
Write-Host "Checking env-vars.json..." -ForegroundColor Yellow
$legacyVars = Get-Content "env-vars.json" | ConvertFrom-Json
$legacyMissing = @()

foreach ($key in $envVars.Keys) {
    if (-not $legacyVars.PSObject.Properties.Name.Contains($key)) {
        $legacyMissing += $key
    }
}

if ($legacyMissing.Count -eq 0) {
    Write-Host "env-vars.json is in sync" -ForegroundColor Green
} else {
    Write-Host "Missing variables in env-vars.json:" -ForegroundColor Red
    foreach ($var in $legacyMissing) {
        Write-Host "   - $var" -ForegroundColor Red
    }
}

Write-Host "Verification complete!" -ForegroundColor Green
