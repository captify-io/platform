# SSL Setup Script for Elastic Beanstalk
param(
    [string]$Environment = "captify-prod",
    [string]$CertificateArn = "arn:aws:acm:us-east-1:211125459951:certificate/5540afb4-ec20-4b17-94dd-e8c39949f508"
)

Write-Host "🔒 Setting up SSL for Elastic Beanstalk..." -ForegroundColor Green

# Get the load balancer ARN
Write-Host "🔍 Getting load balancer information..." -ForegroundColor Yellow
$lbArn = aws elbv2 describe-load-balancers --query "LoadBalancers[?contains(LoadBalancerName, 'awseb')].LoadBalancerArn" --output text

if (-not $lbArn) {
    Write-Host "❌ Could not find load balancer!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found load balancer: $lbArn" -ForegroundColor Green

# Check if HTTPS listener already exists
Write-Host "🔍 Checking for existing HTTPS listener..." -ForegroundColor Yellow
$httpsListener = aws elbv2 describe-listeners --load-balancer-arn $lbArn --query "Listeners[?Port==`443`].ListenerArn" --output text

if ($httpsListener) {
    Write-Host "✅ HTTPS listener already exists: $httpsListener" -ForegroundColor Green
    
    # Update the certificate
    Write-Host "🔄 Updating certificate..." -ForegroundColor Yellow
    aws elbv2 modify-listener --listener-arn $httpsListener --certificates CertificateArn=$CertificateArn
} else {
    # Get the target group ARN
    Write-Host "🎯 Getting target group..." -ForegroundColor Yellow
    $targetGroupArn = aws elbv2 describe-target-groups --query "TargetGroups[0].TargetGroupArn" --output text
    
    # Create HTTPS listener
    Write-Host "🚀 Creating HTTPS listener..." -ForegroundColor Yellow
    aws elbv2 create-listener `
        --load-balancer-arn $lbArn `
        --protocol HTTPS `
        --port 443 `
        --certificates CertificateArn=$CertificateArn `
        --default-actions Type=forward,TargetGroupArn=$targetGroupArn `
        --ssl-policy ELBSecurityPolicy-TLS-1-2-2017-01
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ SSL setup failed!" -ForegroundColor Red
    exit 1
}

# Update security group to allow HTTPS traffic
Write-Host "🔐 Updating security group for HTTPS..." -ForegroundColor Yellow
$securityGroupId = aws ec2 describe-security-groups --filters "Name=group-name,Values=awseb-*" --query "SecurityGroups[0].GroupId" --output text

if ($securityGroupId) {
    aws ec2 authorize-security-group-ingress `
        --group-id $securityGroupId `
        --protocol tcp `
        --port 443 `
        --cidr 0.0.0.0/0 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Security group updated for HTTPS" -ForegroundColor Green
    } else {
        Write-Host "ℹ️ HTTPS rule may already exist in security group" -ForegroundColor Cyan
    }
}

Write-Host "✅ SSL setup completed successfully!" -ForegroundColor Green
Write-Host "🌐 HTTPS will be available at: https://anautics.ai" -ForegroundColor Cyan
