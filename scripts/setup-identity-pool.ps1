# Setup Cognito Identity Pool for Admin Functions
# This script creates an identity pool and associated IAM roles for admin access

$REGION = "us-east-1"
$USER_POOL_ID = "us-east-1_k3Fp77c09"
$IDENTITY_POOL_NAME = "Captify Admin Identity Pool"
$ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)

Write-Host "Setting up Cognito Identity Pool for Admin Functions" -ForegroundColor Green
Write-Host "Account ID: $ACCOUNT_ID"
Write-Host "User Pool ID: $USER_POOL_ID"

# Step 1: Get User Pool Client ID (assuming you have one, or we'll create one)
Write-Host "`nStep 1: Getting User Pool Client..." -ForegroundColor Yellow
$clients = aws cognito-idp list-user-pool-clients --user-pool-id $USER_POOL_ID --output json | ConvertFrom-Json
if ($clients.UserPoolClients.Count -eq 0) {
    Write-Host "No client found. Creating new client..." -ForegroundColor Yellow
    $newClient = aws cognito-idp create-user-pool-client `
        --user-pool-id $USER_POOL_ID `
        --client-name "CaptifyAdminClient" `
        --generate-secret `
        --explicit-auth-flows ALLOW_ADMIN_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH `
        --output json | ConvertFrom-Json
    $CLIENT_ID = $newClient.UserPoolClient.ClientId
} else {
    $CLIENT_ID = $clients.UserPoolClients[0].ClientId
}
Write-Host "Client ID: $CLIENT_ID" -ForegroundColor Green

# Step 2: Create IAM role trust policy for authenticated users
Write-Host "`nStep 2: Creating IAM trust policies..." -ForegroundColor Yellow
$authTrustPolicy = @"
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
          "cognito-identity.amazonaws.com:aud": "IDENTITY_POOL_ID"
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "authenticated"
        }
      }
    }
  ]
}
"@

$authTrustPolicy | Out-File -FilePath "auth-trust-policy.json" -Encoding UTF8

# Step 3: Create IAM role policy for admin permissions
Write-Host "`nStep 3: Creating IAM role policies..." -ForegroundColor Yellow
$adminRolePolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:AdminGetUser",
        "cognito-idp:AdminUpdateUserAttributes",
        "cognito-idp:AdminEnableUser",
        "cognito-idp:AdminDisableUser",
        "cognito-idp:AdminResetUserPassword",
        "cognito-idp:AdminSetUserPassword",
        "cognito-idp:AdminAddUserToGroup",
        "cognito-idp:AdminRemoveUserFromGroup",
        "cognito-idp:AdminListGroupsForUser",
        "cognito-idp:AdminConfirmSignUp",
        "cognito-idp:AdminDeleteUser",
        "cognito-idp:ListUsers",
        "cognito-idp:ListGroups",
        "cognito-idp:DescribeUserPool"
      ],
      "Resource": "arn:aws:cognito-idp:${REGION}:${ACCOUNT_ID}:userpool/${USER_POOL_ID}"
    },
    {
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

$adminRolePolicy = $adminRolePolicy -replace '\${REGION}', $REGION
$adminRolePolicy = $adminRolePolicy -replace '\${ACCOUNT_ID}', $ACCOUNT_ID
$adminRolePolicy = $adminRolePolicy -replace '\${USER_POOL_ID}', $USER_POOL_ID

$adminRolePolicy | Out-File -FilePath "admin-role-policy.json" -Encoding UTF8

# Step 4: Create IAM role for authenticated admin users
Write-Host "`nStep 4: Creating IAM role for authenticated admin users..." -ForegroundColor Yellow
$authRoleName = "Cognito_CaptifyAdmin_Auth_Role"
try {
    aws iam create-role `
        --role-name $authRoleName `
        --assume-role-policy-document file://auth-trust-policy.json `
        --description "IAM role for authenticated Captify admin users" `
        --output json | Out-Null
    Write-Host "Created role: $authRoleName" -ForegroundColor Green
} catch {
    Write-Host "Role $authRoleName already exists, updating..." -ForegroundColor Yellow
    aws iam update-assume-role-policy `
        --role-name $authRoleName `
        --policy-document file://auth-trust-policy.json
}

# Attach the admin policy to the role
aws iam put-role-policy `
    --role-name $authRoleName `
    --policy-name "CaptifyAdminPolicy" `
    --policy-document file://admin-role-policy.json

$authRoleArn = "arn:aws:iam::${ACCOUNT_ID}:role/${authRoleName}"
Write-Host "Auth Role ARN: $authRoleArn" -ForegroundColor Green

# Step 5: Create IAM role for unauthenticated users (limited permissions)
Write-Host "`nStep 5: Creating IAM role for unauthenticated users..." -ForegroundColor Yellow
$unauthTrustPolicy = @"
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
          "cognito-identity.amazonaws.com:aud": "IDENTITY_POOL_ID"
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "unauthenticated"
        }
      }
    }
  ]
}
"@

$unauthTrustPolicy | Out-File -FilePath "unauth-trust-policy.json" -Encoding UTF8

$unauthRoleName = "Cognito_CaptifyAdmin_Unauth_Role"
try {
    aws iam create-role `
        --role-name $unauthRoleName `
        --assume-role-policy-document file://unauth-trust-policy.json `
        --description "IAM role for unauthenticated Captify users" `
        --output json | Out-Null
    Write-Host "Created role: $unauthRoleName" -ForegroundColor Green
} catch {
    Write-Host "Role $unauthRoleName already exists, updating..." -ForegroundColor Yellow
    aws iam update-assume-role-policy `
        --role-name $unauthRoleName `
        --policy-document file://unauth-trust-policy.json
}

# Minimal policy for unauth users
$unauthPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*"
    }
  ]
}
"@

aws iam put-role-policy `
    --role-name $unauthRoleName `
    --policy-name "CaptifyUnauthPolicy" `
    --policy-document $unauthPolicy

$unauthRoleArn = "arn:aws:iam::${ACCOUNT_ID}:role/${unauthRoleName}"
Write-Host "Unauth Role ARN: $unauthRoleArn" -ForegroundColor Green

# Step 6: Create the Identity Pool
Write-Host "`nStep 6: Creating Cognito Identity Pool..." -ForegroundColor Yellow
$identityPool = aws cognito-identity create-identity-pool `
    --identity-pool-name $IDENTITY_POOL_NAME `
    --allow-unauthenticated-identities `
    --cognito-identity-providers "ProviderName=cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID},ClientId=${CLIENT_ID}" `
    --region $REGION `
    --output json | ConvertFrom-Json

$IDENTITY_POOL_ID = $identityPool.IdentityPoolId
Write-Host "Identity Pool ID: $IDENTITY_POOL_ID" -ForegroundColor Green

# Step 7: Update trust policies with actual Identity Pool ID
Write-Host "`nStep 7: Updating trust policies with Identity Pool ID..." -ForegroundColor Yellow
(Get-Content "auth-trust-policy.json") -replace 'IDENTITY_POOL_ID', $IDENTITY_POOL_ID | Set-Content "auth-trust-policy.json"
(Get-Content "unauth-trust-policy.json") -replace 'IDENTITY_POOL_ID', $IDENTITY_POOL_ID | Set-Content "unauth-trust-policy.json"

aws iam update-assume-role-policy `
    --role-name $authRoleName `
    --policy-document file://auth-trust-policy.json

aws iam update-assume-role-policy `
    --role-name $unauthRoleName `
    --policy-document file://unauth-trust-policy.json

# Step 8: Set Identity Pool roles
Write-Host "`nStep 8: Setting Identity Pool roles..." -ForegroundColor Yellow
$rolesMapping = @"
{
  "authenticated": "$authRoleArn",
  "unauthenticated": "$unauthRoleArn"
}
"@

aws cognito-identity set-identity-pool-roles `
    --identity-pool-id $IDENTITY_POOL_ID `
    --roles authenticated=$authRoleArn,unauthenticated=$unauthRoleArn `
    --region $REGION

# Step 9: Configure role mapping for admin group
Write-Host "`nStep 9: Configuring role mapping for admin group..." -ForegroundColor Yellow
$roleMappingJson = @"
{
  "cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}:${CLIENT_ID}": {
    "Type": "Token",
    "AmbiguousRoleResolution": "AuthenticatedRole"
  }
}
"@

$roleMappingJson | Out-File -FilePath "role-mapping.json" -Encoding UTF8

aws cognito-identity set-identity-pool-roles `
    --identity-pool-id $IDENTITY_POOL_ID `
    --roles authenticated=$authRoleArn,unauthenticated=$unauthRoleArn `
    --role-mappings file://role-mapping.json `
    --region $REGION

# Step 10: Output configuration for application
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Identity Pool Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nAdd these to your application configuration:" -ForegroundColor Yellow
Write-Host @"

{
  "aws": {
    "region": "$REGION",
    "cognito": {
      "userPoolId": "$USER_POOL_ID",
      "userPoolClientId": "$CLIENT_ID",
      "identityPoolId": "$IDENTITY_POOL_ID",
      "adminIdentityPoolId": "$IDENTITY_POOL_ID"
    }
  }
}

Environment Variables:
AWS_REGION=$REGION
COGNITO_USER_POOL_ID=$USER_POOL_ID
COGNITO_USER_POOL_CLIENT_ID=$CLIENT_ID
COGNITO_IDENTITY_POOL_ID=$IDENTITY_POOL_ID
COGNITO_ADMIN_IDENTITY_POOL_ID=$IDENTITY_POOL_ID

"@ -ForegroundColor Cyan

# Cleanup temporary files
Remove-Item -Path "auth-trust-policy.json", "unauth-trust-policy.json", "admin-role-policy.json", "role-mapping.json" -ErrorAction SilentlyContinue

Write-Host "Temporary files cleaned up." -ForegroundColor Green