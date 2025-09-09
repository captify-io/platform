# PowerShell script to update IAM user permissions for Elastic Beanstalk S3 bucket

$userName = "mi-app-user"
$accountId = "211125459951"
$region = "us-east-1"
$bucketName = "elasticbeanstalk-$region-$accountId"

# Create IAM policy document for S3 bucket access
$policyDocument = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ElasticBeanstalkS3Access",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:GetBucketLocation",
        "s3:GetBucketPolicy",
        "s3:ListBucket",
        "s3:PutBucketPolicy",
        "s3:PutBucketVersioning",
        "s3:GetBucketVersioning"
      ],
      "Resource": "arn:aws:s3:::$bucketName"
    },
    {
      "Sid": "ElasticBeanstalkS3ObjectAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:DeleteObjectVersion"
      ],
      "Resource": "arn:aws:s3:::$bucketName/*"
    },
    {
      "Sid": "ElasticBeanstalkOperations",
      "Effect": "Allow",
      "Action": [
        "elasticbeanstalk:CreateApplication",
        "elasticbeanstalk:CreateApplicationVersion",
        "elasticbeanstalk:CreateEnvironment",
        "elasticbeanstalk:UpdateApplication",
        "elasticbeanstalk:UpdateApplicationVersion",
        "elasticbeanstalk:UpdateEnvironment",
        "elasticbeanstalk:DeleteApplication",
        "elasticbeanstalk:DeleteApplicationVersion",
        "elasticbeanstalk:DeleteEnvironment",
        "elasticbeanstalk:DescribeApplications",
        "elasticbeanstalk:DescribeApplicationVersions",
        "elasticbeanstalk:DescribeEnvironments",
        "elasticbeanstalk:DescribeEnvironmentResources",
        "elasticbeanstalk:ListPlatformVersions",
        "elasticbeanstalk:DescribeEvents",
        "elasticbeanstalk:RetrieveEnvironmentInfo",
        "elasticbeanstalk:RequestEnvironmentInfo",
        "elasticbeanstalk:ValidateConfigurationSettings",
        "elasticbeanstalk:CheckDNSAvailability",
        "elasticbeanstalk:DescribeConfigurationOptions",
        "elasticbeanstalk:DescribeConfigurationSettings"
      ],
      "Resource": "*"
    },
    {
      "Sid": "RequiredEC2Permissions",
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "autoscaling:Describe*",
        "elasticloadbalancing:Describe*",
        "cloudwatch:Describe*",
        "cloudwatch:List*",
        "cloudwatch:GetMetricStatistics",
        "sns:List*",
        "cloudformation:Describe*",
        "cloudformation:List*"
      ],
      "Resource": "*"
    }
  ]
}
"@

$policyName = "ElasticBeanstalkDeploymentPolicy"

Write-Host "Updating IAM permissions for user: $userName" -ForegroundColor Cyan
Write-Host "Account ID: $accountId" -ForegroundColor Cyan
Write-Host "S3 Bucket: $bucketName" -ForegroundColor Cyan
Write-Host ""

# Save policy document to file
$policyDocument | Out-File -FilePath "eb-policy.json" -Encoding UTF8

try {
    # Check if policy already exists
    Write-Host "Checking if policy exists..." -ForegroundColor Yellow
    $existingPolicy = aws iam get-user-policy --user-name $userName --policy-name $policyName 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Policy already exists. Updating..." -ForegroundColor Yellow
        # Delete existing policy
        aws iam delete-user-policy --user-name $userName --policy-name $policyName
    }
    
    # Attach the inline policy to the user
    Write-Host "Attaching policy to user..." -ForegroundColor Yellow
    aws iam put-user-policy `
        --user-name $userName `
        --policy-name $policyName `
        --policy-document file://eb-policy.json
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully updated IAM permissions for $userName" -ForegroundColor Green
        Write-Host ""
        Write-Host "The user now has permissions to:" -ForegroundColor Green
        Write-Host "  - Create and manage the S3 bucket: $bucketName" -ForegroundColor White
        Write-Host "  - Upload objects to the bucket" -ForegroundColor White
        Write-Host "  - Manage Elastic Beanstalk applications and environments" -ForegroundColor White
        Write-Host ""
        
        # Now create the S3 bucket
        Write-Host "Creating S3 bucket if it doesn't exist..." -ForegroundColor Yellow
        $bucketExists = aws s3 ls "s3://$bucketName" 2>$null
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Creating S3 bucket: $bucketName" -ForegroundColor Yellow
            aws s3 mb "s3://$bucketName" --region $region
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ S3 bucket created successfully" -ForegroundColor Green
                
                # Enable versioning
                Write-Host "Enabling versioning on bucket..." -ForegroundColor Yellow
                aws s3api put-bucket-versioning `
                    --bucket $bucketName `
                    --versioning-configuration Status=Enabled
                    
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ Versioning enabled" -ForegroundColor Green
                }
            }
        } else {
            Write-Host "✅ S3 bucket already exists" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "🎉 Setup complete! You can now re-run the GitHub Actions workflow." -ForegroundColor Cyan
    } else {
        Write-Host "❌ Failed to attach policy to user" -ForegroundColor Red
        Write-Host "Please check that you have the necessary IAM permissions" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ An error occurred: $_" -ForegroundColor Red
} finally {
    # Clean up temporary file
    if (Test-Path "eb-policy.json") {
        Remove-Item "eb-policy.json"
    }
}