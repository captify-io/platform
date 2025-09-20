#!/bin/bash

# Setup AWS Verified Permissions for Captify Platform
# This script creates the policy store and uploads Cedar policies

REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
USER_POOL_ID="us-east-1_k3Fp77c09"
CLIENT_ID="4og43nmsksolkkrk3v47tj7gv9"

echo "🚀 Setting up AWS Verified Permissions for Captify Platform"
echo "Account ID: $ACCOUNT_ID"
echo "Region: $REGION"
echo "User Pool: $USER_POOL_ID"

# Step 1: Create Policy Store
echo ""
echo "🏗️  Creating Verified Permissions Policy Store..."

POLICY_STORE_RESPONSE=$(aws verifiedpermissions create-policy-store \
    --validation-settings mode=STRICT \
    --region $REGION \
    --output json)

POLICY_STORE_ID=$(echo $POLICY_STORE_RESPONSE | jq -r '.policyStoreId')

echo "✅ Policy Store Created: $POLICY_STORE_ID"

# Step 2: Add Cognito User Pool as Identity Source
echo ""
echo "👥 Adding Cognito User Pool as Identity Source..."

USER_POOL_ARN="arn:aws:cognito-idp:${REGION}:${ACCOUNT_ID}:userpool/${USER_POOL_ID}"

IDENTITY_SOURCE_RESPONSE=$(aws verifiedpermissions create-identity-source \
    --policy-store-id $POLICY_STORE_ID \
    --configuration "{\"cognitoUserPoolConfiguration\":{\"userPoolArn\":\"$USER_POOL_ARN\",\"clientIds\":[\"$CLIENT_ID\"]}}" \
    --principal-entity-type "CognitoUserPool" \
    --region $REGION \
    --output json)

IDENTITY_SOURCE_ID=$(echo $IDENTITY_SOURCE_RESPONSE | jq -r '.identitySourceId')

echo "✅ Identity Source Created: $IDENTITY_SOURCE_ID"

# Step 3: Create Cedar Policies
echo ""
echo "📜 Creating Cedar Policies..."

# Policy 1: Allow captify group to read all captify-core-* tables
POLICY1_STATEMENT='permit(principal in CognitoUserPool::"captify", action in [Action::"dynamo:scan", Action::"dynamo:query", Action::"dynamo:get"], resource) when { resource.tableName like "captify-core-*" };'

POLICY1_RESPONSE=$(aws verifiedpermissions create-policy \
    --policy-store-id $POLICY_STORE_ID \
    --definition "{\"static\":{\"description\":\"Allow captify users to read core tables\",\"statement\":\"$POLICY1_STATEMENT\"}}" \
    --region $REGION \
    --output json)

POLICY1_ID=$(echo $POLICY1_RESPONSE | jq -r '.policyId')
echo "✅ Policy 1 Created (Read Access): $POLICY1_ID"

# Policy 2: Allow captify users to create their own User record
POLICY2_STATEMENT='permit(principal in CognitoUserPool::"captify", action == Action::"dynamo:put", resource == DynamoTable::"captify-core-User") when { resource.itemKey.id == principal.sub };'

POLICY2_RESPONSE=$(aws verifiedpermissions create-policy \
    --policy-store-id $POLICY_STORE_ID \
    --definition "{\"static\":{\"description\":\"Allow users to create their own User record\",\"statement\":\"$POLICY2_STATEMENT\"}}" \
    --region $REGION \
    --output json)

POLICY2_ID=$(echo $POLICY2_RESPONSE | jq -r '.policyId')
echo "✅ Policy 2 Created (Self Create): $POLICY2_ID"

# Policy 3: Allow captify users to update their own User record
POLICY3_STATEMENT='permit(principal in CognitoUserPool::"captify", action == Action::"dynamo:update", resource == DynamoTable::"captify-core-User") when { resource.itemKey.id == principal.sub };'

POLICY3_RESPONSE=$(aws verifiedpermissions create-policy \
    --policy-store-id $POLICY_STORE_ID \
    --definition "{\"static\":{\"description\":\"Allow users to update their own User record\",\"statement\":\"$POLICY3_STATEMENT\"}}" \
    --region $REGION \
    --output json)

POLICY3_ID=$(echo $POLICY3_RESPONSE | jq -r '.policyId')
echo "✅ Policy 3 Created (Self Update): $POLICY3_ID"

# Policy 4: Allow captify users to get their own User record
POLICY4_STATEMENT='permit(principal in CognitoUserPool::"captify", action == Action::"dynamo:get", resource == DynamoTable::"captify-core-User") when { resource.itemKey.id == principal.sub };'

POLICY4_RESPONSE=$(aws verifiedpermissions create-policy \
    --policy-store-id $POLICY_STORE_ID \
    --definition "{\"static\":{\"description\":\"Allow users to get their own User record\",\"statement\":\"$POLICY4_STATEMENT\"}}" \
    --region $REGION \
    --output json)

POLICY4_ID=$(echo $POLICY4_RESPONSE | jq -r '.policyId')
echo "✅ Policy 4 Created (Self Read): $POLICY4_ID"

# Policy 5: Forbid non-admin users from deleting User records
POLICY5_STATEMENT='forbid(principal in CognitoUserPool::"captify", action == Action::"dynamo:delete", resource == DynamoTable::"captify-core-User") unless { principal in CognitoUserPool::"Admins" };'

POLICY5_RESPONSE=$(aws verifiedpermissions create-policy \
    --policy-store-id $POLICY_STORE_ID \
    --definition "{\"static\":{\"description\":\"Forbid non-admin users from deleting User records\",\"statement\":\"$POLICY5_STATEMENT\"}}" \
    --region $REGION \
    --output json)

POLICY5_ID=$(echo $POLICY5_RESPONSE | jq -r '.policyId')
echo "✅ Policy 5 Created (Delete Restriction): $POLICY5_ID"

# Policy 6: Admin override - allow all operations for admins
POLICY6_STATEMENT='permit(principal in CognitoUserPool::"Admins", action, resource) when { resource.tableName like "captify-core-*" };'

POLICY6_RESPONSE=$(aws verifiedpermissions create-policy \
    --policy-store-id $POLICY_STORE_ID \
    --definition "{\"static\":{\"description\":\"Allow admins full access to core tables\",\"statement\":\"$POLICY6_STATEMENT\"}}" \
    --region $REGION \
    --output json)

POLICY6_ID=$(echo $POLICY6_RESPONSE | jq -r '.policyId')
echo "✅ Policy 6 Created (Admin Override): $POLICY6_ID"

# Output summary
echo ""
echo "🎉 Setup Complete!"
echo "========================================"

echo ""
echo "Configuration Summary:"
echo "Policy Store ID: $POLICY_STORE_ID"
echo "Identity Source ID: $IDENTITY_SOURCE_ID"
echo "User Pool ARN: $USER_POOL_ARN"

echo ""
echo "Add this to your .env.local:"
echo "VERIFIED_PERMISSIONS_POLICY_STORE_ID=$POLICY_STORE_ID"

echo ""
echo "Policies Created:"
echo "1. Read Access for captify users: $POLICY1_ID"
echo "2. Self Create for User table: $POLICY2_ID"
echo "3. Self Update for User table: $POLICY3_ID"
echo "4. Self Read for User table: $POLICY4_ID"
echo "5. Delete Restriction: $POLICY5_ID"
echo "6. Admin Override: $POLICY6_ID"

echo ""
echo "Next Steps:"
echo "1. Add the Policy Store ID to your environment variables"
echo "2. Install @aws-sdk/client-verifiedpermissions dependency"
echo "3. Deploy your updated application"
echo "4. Test with captify group users"