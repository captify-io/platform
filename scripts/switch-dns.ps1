# Switch DNS from Amplify to Elastic Beanstalk
param(
    [string]$HostedZoneId = "Z09370724S4HS44EEKN",
    [string]$Domain = "anautics.ai",
    [string]$ElbDomain = "captify-prod.eba-g3yvugdp.us-east-1.elasticbeanstalk.com"
)

Write-Host "🔄 Switching DNS from Amplify to Elastic Beanstalk..." -ForegroundColor Green

# Get the ELB hosted zone ID (this is fixed for us-east-1)
$ElbHostedZoneId = "Z35SXDOTRQ7X7K"

# Create the change batch for main domain
$changeBatch = @"
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "$Domain",
                "Type": "A",
                "AliasTarget": {
                    "DNSName": "$ElbDomain",
                    "HostedZoneId": "$ElbHostedZoneId",
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
                    "DNSName": "$ElbDomain",
                    "HostedZoneId": "$ElbHostedZoneId",
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

Write-Host "📝 Updating DNS records..." -ForegroundColor Yellow

# Execute the DNS change
$changeInfo = aws route53 change-resource-record-sets --hosted-zone-id $HostedZoneId --change-batch file://$tempFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ DNS update failed!" -ForegroundColor Red
    Remove-Item $tempFile -Force
    exit 1
}

# Extract change ID
$changeId = ($changeInfo | ConvertFrom-Json).ChangeInfo.Id

Write-Host "✅ DNS change submitted: $changeId" -ForegroundColor Green
Write-Host "⏳ Waiting for DNS propagation..." -ForegroundColor Yellow

# Wait for the change to propagate
aws route53 wait resource-record-sets-changed --id $changeId

# Cleanup
Remove-Item $tempFile -Force

Write-Host "✅ DNS migration completed!" -ForegroundColor Green
Write-Host "🌐 anautics.ai now points to Elastic Beanstalk" -ForegroundColor Cyan
Write-Host "⚠️  DNS propagation may take 5-10 minutes worldwide" -ForegroundColor Yellow

# Test the new setup
Write-Host "🧪 Testing new DNS..." -ForegroundColor Yellow
Start-Sleep 5
$dnsResult = nslookup anautics.ai 2>$null
if ($dnsResult -match $ElbDomain) {
    Write-Host "✅ DNS test passed!" -ForegroundColor Green
} else {
    Write-Host "⏳ DNS not yet propagated, this is normal" -ForegroundColor Yellow
}
