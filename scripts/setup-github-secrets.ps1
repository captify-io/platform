# GitHub Secrets Setup Helper

# Get your AWS Account ID
$accountId = aws sts get-caller-identity --query Account --output text
Write-Host "Your AWS Account ID: $accountId" -ForegroundColor Green

# Get current AWS credentials (if available)
$accessKeyId = $env:AWS_ACCESS_KEY_ID
if ($accessKeyId) {
    Write-Host "Current AWS Access Key ID: $accessKeyId" -ForegroundColor Green
} else {
    Write-Host "AWS Access Key ID not found in environment variables" -ForegroundColor Yellow
    Write-Host "You may need to create new access keys in the AWS IAM console" -ForegroundColor Yellow
}

Write-Host "`n=== GitHub Secrets Configuration ===" -ForegroundColor Cyan
Write-Host "Add these secrets to your GitHub repository:" -ForegroundColor White
Write-Host "Repository → Settings → Secrets and variables → Actions → New repository secret" -ForegroundColor Gray

Write-Host "`n1. AWS_ACCESS_KEY_ID" -ForegroundColor Yellow
if ($accessKeyId) {
    Write-Host "   Value: $accessKeyId" -ForegroundColor Green
} else {
    Write-Host "   Value: [Your AWS Access Key ID]" -ForegroundColor Red
}

Write-Host "`n2. AWS_SECRET_ACCESS_KEY" -ForegroundColor Yellow
Write-Host "   Value: [Your AWS Secret Access Key]" -ForegroundColor Red

Write-Host "`n3. AWS_ACCOUNT_ID" -ForegroundColor Yellow
Write-Host "   Value: $accountId" -ForegroundColor Green

Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Add the above secrets to your GitHub repository" -ForegroundColor White
Write-Host "2. Commit and push your changes to trigger the deployment" -ForegroundColor White
Write-Host "3. Monitor the deployment in the GitHub Actions tab" -ForegroundColor White
Write-Host "4. Once deployed, run: pnpm run aws:switch-dns" -ForegroundColor White

Write-Host "`n=== Quick Test ===" -ForegroundColor Cyan
Write-Host "To test the workflow locally:" -ForegroundColor White
Write-Host "pnpm run deploy:ci" -ForegroundColor Green

Write-Host "`n=== Environment Status ===" -ForegroundColor Cyan
$envStatus = aws elasticbeanstalk describe-environments --environment-names Anautics-ai-env --query "Environments[0].{Status:Status,Health:Health,URL:CNAME}" 2>$null
if ($envStatus) {
    Write-Host "Current Environment:" -ForegroundColor White
    Write-Host $envStatus -ForegroundColor Green
} else {
    Write-Host "Environment status check failed - make sure AWS CLI is configured" -ForegroundColor Red
}
