# Setup AWS Verified Permissions for Captify Platform
# This script creates the policy store and uploads Cedar policies

$REGION = "us-east-1"
$ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
$USER_POOL_ID = "us-east-1_k3Fp77c09"
$CLIENT_ID = "4og43nmsksolkkrk3v47tj7gv9"

Write-Host "Setting up AWS Verified Permissions for Captify Platform" -ForegroundColor Green
Write-Host "Account ID: $ACCOUNT_ID" -ForegroundColor Yellow
Write-Host "Region: $REGION" -ForegroundColor Yellow
Write-Host "User Pool: $USER_POOL_ID" -ForegroundColor Yellow

# Step 1: Create Policy Store
Write-Host "`n🏗️  Creating Verified Permissions Policy Store..." -ForegroundColor Cyan

$policyStoreResponse = aws verifiedpermissions create-policy-store `
    --validation-settings mode=STRICT `
    --region $REGION `
    --output json | ConvertFrom-Json

$POLICY_STORE_ID = $policyStoreResponse.policyStoreId

Write-Host "✅ Policy Store Created: $POLICY_STORE_ID" -ForegroundColor Green

# Step 2: Add Cognito User Pool as Identity Source
Write-Host "`n👥 Adding Cognito User Pool as Identity Source..." -ForegroundColor Cyan

$USER_POOL_ARN = "arn:aws:cognito-idp:${REGION}:${ACCOUNT_ID}:userpool/${USER_POOL_ID}"

$identitySourceResponse = aws verifiedpermissions create-identity-source `
    --policy-store-id $POLICY_STORE_ID `
    --configuration "cognitoUserPoolConfiguration={userPoolArn=$USER_POOL_ARN,clientIds=[$CLIENT_ID]}" `
    --principal-entity-type "CognitoUserPool" `
    --region $REGION `
    --output json | ConvertFrom-Json

$IDENTITY_SOURCE_ID = $identitySourceResponse.identitySourceId

Write-Host "✅ Identity Source Created: $IDENTITY_SOURCE_ID" -ForegroundColor Green

# Step 3: Create Cedar Policies
Write-Host "`n📜 Creating Cedar Policies..." -ForegroundColor Cyan

# Policy 1: Allow captify group to read all captify-core-* tables
$policy1 = @"
permit(
  principal in CognitoUserPool::"captify",
  action in [Action::"dynamo:scan", Action::"dynamo:query", Action::"dynamo:get"],
  resource
) when {
  resource.tableName like "captify-core-*"
};
"@

$policy1Response = aws verifiedpermissions create-policy `
    --policy-store-id $POLICY_STORE_ID `
    --definition "static={description='Allow captify users to read core tables',statement='$policy1'}" `
    --region $REGION `
    --output json | ConvertFrom-Json

Write-Host "✅ Policy 1 Created (Read Access): $($policy1Response.policyId)" -ForegroundColor Green

# Policy 2: Allow captify users to create their own User record
$policy2 = @"
permit(
  principal in CognitoUserPool::"captify",
  action == Action::"dynamo:put",
  resource == DynamoTable::"captify-core-User"
) when {
  resource.itemKey.id == principal.sub
};
"@

$policy2Response = aws verifiedpermissions create-policy `
    --policy-store-id $POLICY_STORE_ID `
    --definition "static={description='Allow users to create their own User record',statement='$policy2'}" `
    --region $REGION `
    --output json | ConvertFrom-Json

Write-Host "✅ Policy 2 Created (Self Create): $($policy2Response.policyId)" -ForegroundColor Green

# Policy 3: Allow captify users to update their own User record
$policy3 = @"
permit(
  principal in CognitoUserPool::"captify",
  action == Action::"dynamo:update",
  resource == DynamoTable::"captify-core-User"
) when {
  resource.itemKey.id == principal.sub
};
"@

$policy3Response = aws verifiedpermissions create-policy `
    --policy-store-id $POLICY_STORE_ID `
    --definition "static={description='Allow users to update their own User record',statement='$policy3'}" `
    --region $REGION `
    --output json | ConvertFrom-Json

Write-Host "✅ Policy 3 Created (Self Update): $($policy3Response.policyId)" -ForegroundColor Green

# Policy 4: Allow captify users to get their own User record
$policy4 = @"
permit(
  principal in CognitoUserPool::"captify",
  action == Action::"dynamo:get",
  resource == DynamoTable::"captify-core-User"
) when {
  resource.itemKey.id == principal.sub
};
"@

$policy4Response = aws verifiedpermissions create-policy `
    --policy-store-id $POLICY_STORE_ID `
    --definition "static={description='Allow users to get their own User record',statement='$policy4'}" `
    --region $REGION `
    --output json | ConvertFrom-Json

Write-Host "✅ Policy 4 Created (Self Read): $($policy4Response.policyId)" -ForegroundColor Green

# Policy 5: Forbid non-admin users from deleting User records
$policy5 = @"
forbid(
  principal in CognitoUserPool::"captify",
  action == Action::"dynamo:delete",
  resource == DynamoTable::"captify-core-User"
) unless {
  principal in CognitoUserPool::"Admins"
};
"@

$policy5Response = aws verifiedpermissions create-policy `
    --policy-store-id $POLICY_STORE_ID `
    --definition "static={description='Forbid non-admin users from deleting User records',statement='$policy5'}" `
    --region $REGION `
    --output json | ConvertFrom-Json

Write-Host "✅ Policy 5 Created (Delete Restriction): $($policy5Response.policyId)" -ForegroundColor Green

# Policy 6: Admin override - allow all operations for admins
$policy6 = @"
permit(
  principal in CognitoUserPool::"Admins",
  action,
  resource
) when {
  resource.tableName like "captify-core-*"
};
"@

$policy6Response = aws verifiedpermissions create-policy `
    --policy-store-id $POLICY_STORE_ID `
    --definition "static={description='Allow admins full access to core tables',statement='$policy6'}" `
    --region $REGION `
    --output json | ConvertFrom-Json

Write-Host "✅ Policy 6 Created (Admin Override): $($policy6Response.policyId)" -ForegroundColor Green

# Output summary
Write-Host "`n🎉 Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nConfiguration Summary:" -ForegroundColor Yellow
Write-Host "Policy Store ID: $POLICY_STORE_ID" -ForegroundColor White
Write-Host "Identity Source ID: $IDENTITY_SOURCE_ID" -ForegroundColor White
Write-Host "User Pool ARN: $USER_POOL_ARN" -ForegroundColor White

Write-Host "`nAdd this to your .env.local:" -ForegroundColor Yellow
Write-Host "VERIFIED_PERMISSIONS_POLICY_STORE_ID=$POLICY_STORE_ID" -ForegroundColor Green

Write-Host "`nPolicies Created:" -ForegroundColor Yellow
Write-Host "1. Read Access for captify users: $($policy1Response.policyId)" -ForegroundColor White
Write-Host "2. Self Create for User table: $($policy2Response.policyId)" -ForegroundColor White
Write-Host "3. Self Update for User table: $($policy3Response.policyId)" -ForegroundColor White
Write-Host "4. Self Read for User table: $($policy4Response.policyId)" -ForegroundColor White
Write-Host "5. Delete Restriction: $($policy5Response.policyId)" -ForegroundColor White
Write-Host "6. Admin Override: $($policy6Response.policyId)" -ForegroundColor White

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Add the Policy Store ID to your environment variables" -ForegroundColor White
Write-Host "2. Install @aws-sdk/client-verifiedpermissions dependency" -ForegroundColor White
Write-Host "3. Deploy your updated application" -ForegroundColor White
Write-Host "4. Test with captify group users" -ForegroundColor White