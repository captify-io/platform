# Setup Standardized Identity Pools and IAM Roles for Captify
# 
# Naming Convention:
# - Captify_<Environment>_<Purpose>_Role
# Examples:
# - Captify_Default_Auth_Role (for regular authenticated users)
# - Captify_Default_Unauth_Role (for unauthenticated users)  
# - Captify_Admin_Auth_Role (for admin users)

$REGION = "us-east-1"
$ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
$USER_POOL_ID = "us-east-1_k3Fp77c09"
$CLIENT_ID = "4og43nmsksolkkrk3v47tj7gv9"

Write-Host "Setting up Standardized Identity Pools and Roles" -ForegroundColor Green
Write-Host "Account ID: $ACCOUNT_ID"
Write-Host "Region: $REGION"

# ====================
# DEFAULT IDENTITY POOL (Regular Users)
# ====================
$DEFAULT_POOL_ID = "us-east-1:565334e6-f014-45ba-9b85-399f2888f1dc"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Setting up DEFAULT Identity Pool Roles" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# Create trust policy for default authenticated role
$defaultAuthTrust = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "cognito-identity.amazonaws.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "cognito-identity.amazonaws.com:aud": "$DEFAULT_POOL_ID"
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "authenticated"
        }
      }
    }
  ]
}
"@

# Create trust policy for default unauthenticated role
$defaultUnauthTrust = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "cognito-identity.amazonaws.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "cognito-identity.amazonaws.com:aud": "$DEFAULT_POOL_ID"
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "unauthenticated"
        }
      }
    }
  ]
}
"@

# Create policy for default authenticated users (basic access)
$defaultAuthPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:BatchGetItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:BatchWriteItem",
        "dynamodb:DescribeTable"
      ],
      "Resource": [
        "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/captify-*",
        "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/captify-*/index/*"
      ]
    },
    {
      "Sid": "CognitoIdentityAccess",
      "Effect": "Allow",
      "Action": [
        "cognito-identity:GetCredentialsForIdentity",
        "cognito-identity:GetId",
        "cognito-identity:GetOpenIdToken"
      ],
      "Resource": "*"
    }
  ]
}
"@

# Save trust policies to files
$defaultAuthTrust | Out-File -FilePath "default-auth-trust.json" -Encoding UTF8
$defaultUnauthTrust | Out-File -FilePath "default-unauth-trust.json" -Encoding UTF8
$defaultAuthPolicy | Out-File -FilePath "default-auth-policy.json" -Encoding UTF8

# Create or update DEFAULT authenticated role
$defaultAuthRoleName = "Captify_Default_Auth_Role"
Write-Host "`nCreating/Updating role: $defaultAuthRoleName" -ForegroundColor Yellow

try {
    aws iam create-role `
        --role-name $defaultAuthRoleName `
        --assume-role-policy-document file://default-auth-trust.json `
        --description "Default role for authenticated Captify users" `
        --output json | Out-Null
    Write-Host "Created role: $defaultAuthRoleName" -ForegroundColor Green
} catch {
    Write-Host "Role exists, updating trust policy..." -ForegroundColor Yellow
    aws iam update-assume-role-policy `
        --role-name $defaultAuthRoleName `
        --policy-document file://default-auth-trust.json
}

# Attach policy to default auth role
aws iam put-role-policy `
    --role-name $defaultAuthRoleName `
    --policy-name "CaptifyDefaultAccess" `
    --policy-document file://default-auth-policy.json

Write-Host "Attached policy to $defaultAuthRoleName" -ForegroundColor Green

# Create or update DEFAULT unauthenticated role
$defaultUnauthRoleName = "Captify_Default_Unauth_Role"
Write-Host "`nCreating/Updating role: $defaultUnauthRoleName" -ForegroundColor Yellow

try {
    aws iam create-role `
        --role-name $defaultUnauthRoleName `
        --assume-role-policy-document file://default-unauth-trust.json `
        --description "Default role for unauthenticated Captify users" `
        --output json | Out-Null
    Write-Host "Created role: $defaultUnauthRoleName" -ForegroundColor Green
} catch {
    Write-Host "Role exists, updating trust policy..." -ForegroundColor Yellow
    aws iam update-assume-role-policy `
        --role-name $defaultUnauthRoleName `
        --policy-document file://default-unauth-trust.json
}

# Minimal policy for unauth users
$unauthPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "MinimalAccess",
      "Effect": "Allow",
      "Action": [
        "cognito-identity:GetCredentialsForIdentity",
        "cognito-identity:GetId"
      ],
      "Resource": "*"
    }
  ]
}
"@

$unauthPolicy | Out-File -FilePath "unauth-policy.json" -Encoding UTF8

aws iam put-role-policy `
    --role-name $defaultUnauthRoleName `
    --policy-name "CaptifyMinimalAccess" `
    --policy-document file://unauth-policy.json

Write-Host "Attached policy to $defaultUnauthRoleName" -ForegroundColor Green

# Update DEFAULT Identity Pool with new roles
Write-Host "`nUpdating DEFAULT Identity Pool with standardized roles..." -ForegroundColor Yellow

$defaultAuthRoleArn = "arn:aws:iam::${ACCOUNT_ID}:role/${defaultAuthRoleName}"
$defaultUnauthRoleArn = "arn:aws:iam::${ACCOUNT_ID}:role/${defaultUnauthRoleName}"

aws cognito-identity set-identity-pool-roles `
    --identity-pool-id $DEFAULT_POOL_ID `
    --roles authenticated=$defaultAuthRoleArn,unauthenticated=$defaultUnauthRoleArn `
    --role-mappings "{\"cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}:${CLIENT_ID}\":{\"Type\":\"Token\",\"AmbiguousRoleResolution\":\"AuthenticatedRole\"}}" `
    --region $REGION

Write-Host "Updated DEFAULT Identity Pool roles" -ForegroundColor Green

# ====================
# ADMIN IDENTITY POOL
# ====================
$ADMIN_POOL_ID = "us-east-1:52e865f2-4871-4a74-8976-edc945af0c0f"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Setting up ADMIN Identity Pool Roles" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# Update admin role to follow naming convention
$adminAuthRoleName = "Captify_Admin_Auth_Role"
Write-Host "Admin role: $adminAuthRoleName (keeping existing)" -ForegroundColor Green

# The admin role already exists as Cognito_CaptifyAdmin_Auth_Role
# We'll keep using it but could rename it in the future

# Clean up temporary files
Remove-Item -Path "default-auth-trust.json", "default-unauth-trust.json", "default-auth-policy.json", "unauth-policy.json" -ErrorAction SilentlyContinue

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nIdentity Pool Configuration:" -ForegroundColor Yellow
Write-Host @"

DEFAULT Pool (Regular Users):
- Pool ID: $DEFAULT_POOL_ID
- Auth Role: $defaultAuthRoleName
- Unauth Role: $defaultUnauthRoleName
- Permissions: DynamoDB access to captify-* tables

ADMIN Pool (Admin/App Users):
- Pool ID: $ADMIN_POOL_ID  
- Auth Role: Cognito_CaptifyAdmin_Auth_Role
- Permissions: Full Cognito admin + DynamoDB access

"@ -ForegroundColor Cyan

Write-Host "Environment Variables to Use:" -ForegroundColor Yellow
Write-Host @"
COGNITO_IDENTITY_POOL_ID=$DEFAULT_POOL_ID
COGNITO_ADMIN_IDENTITY_POOL_ID=$ADMIN_POOL_ID
"@ -ForegroundColor Green