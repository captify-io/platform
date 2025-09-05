# Rollback DNS from Elastic Beanstalk to Amplify
param(
    [string]$HostedZoneId = "Z09370724S4HS44EEKN", 
    [string]$Domain = "anautics.ai",
    [string]$AmplifyDomain = "d3vl8ax7akbu10.cloudfront.net"
)

Write-Host "🔄 Rolling back DNS to Amplify..." -ForegroundColor Yellow

# CloudFront hosted zone ID (fixed)
$CloudFrontHostedZoneId = "Z2FDTNDATAQYW2"

# Create the rollback change batch
$changeBatch = @"
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "$Domain",
                "Type": "A", 
                "AliasTarget": {
                    "DNSName": "$AmplifyDomain",
                    "HostedZoneId": "$CloudFrontHostedZoneId",
                    "EvaluateTargetHealth": false
                }
            }
        },
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "www.$Domain",
                "Type": "A",
                "AliasTarget": {
                    "DNSName": "$AmplifyDomain", 
                    "HostedZoneId": "$CloudFrontHostedZoneId",
                    "EvaluateTargetHealth": false
                }
            }
        }
    ]
}
"@

# Save change batch to temporary file
$tempFile = [System.IO.Path]::GetTempFileName()
$changeBatch | Out-File -FilePath $tempFile -Encoding utf8

Write-Host "📝 Reverting DNS records..." -ForegroundColor Yellow

# Execute the DNS rollback
$changeInfo = aws route53 change-resource-record-sets --hosted-zone-id $HostedZoneId --change-batch file://$tempFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ DNS rollback failed!" -ForegroundColor Red
    Remove-Item $tempFile -Force
    exit 1
}

# Extract change ID
$changeId = ($changeInfo | ConvertFrom-Json).ChangeInfo.Id

Write-Host "✅ DNS rollback submitted: $changeId" -ForegroundColor Green
Write-Host "⏳ Waiting for DNS propagation..." -ForegroundColor Yellow

# Wait for the change to propagate
aws route53 wait resource-record-sets-changed --id $changeId

# Cleanup
Remove-Item $tempFile -Force

Write-Host "✅ DNS rollback completed!" -ForegroundColor Green
Write-Host "🌐 anautics.ai now points back to Amplify" -ForegroundColor Cyan
Write-Host "⚠️  DNS propagation may take 5-10 minutes worldwide" -ForegroundColor Yellow

Write-Host "🔙 Your site is now running on the original Amplify deployment" -ForegroundColor Green
