# Setup GitHub Token for Package Installation
# DO NOT share your token or commit it to git!

Write-Host "Setting up GitHub Package Authentication..." -ForegroundColor Cyan

# Set the token as an environment variable for this session
$env:GITHUB_TOKEN = Read-Host "Enter your GitHub token (ghp_...)" -AsSecureString

# Convert secure string to plain text for npm
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($env:GITHUB_TOKEN)
$PlainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Configure npm
npm config set "//npm.pkg.github.com/:_authToken" $PlainToken

Write-Host "Authentication configured!" -ForegroundColor Green
Write-Host "Installing packages..." -ForegroundColor Yellow

# Install packages
npm install

Write-Host "Done! Packages installed." -ForegroundColor Green