#!/bin/bash
# Add security-related custom attributes to Cognito User Pool
# Run this once to set up the user pool schema

set -e

# Load environment variables
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

USER_POOL_ID="${COGNITO_USER_POOL_ID}"
REGION="${AWS_REGION:-us-east-1}"

if [ -z "$USER_POOL_ID" ]; then
  echo "Error: COGNITO_USER_POOL_ID not set"
  echo "Please set COGNITO_USER_POOL_ID environment variable or add to .env.local"
  exit 1
fi

echo "Adding security custom attributes to User Pool: $USER_POOL_ID"
echo "Region: $REGION"
echo ""

# Add custom attributes
# Note: Custom attributes CANNOT be deleted once added, only marked as not required
# They are prefixed with "custom:" in Cognito

echo "Adding custom attributes..."

aws cognito-idp add-custom-attributes \
  --region "$REGION" \
  --user-pool-id "$USER_POOL_ID" \
  --custom-attributes \
    Name=organizationId,AttributeDataType=String,Mutable=true \
    Name=clearanceLevel,AttributeDataType=String,Mutable=true \
    Name=markings,AttributeDataType=String,Mutable=true \
    Name=sciCompartments,AttributeDataType=String,Mutable=true \
    Name=needToKnow,AttributeDataType=String,Mutable=true \
    Name=employeeId,AttributeDataType=String,Mutable=true

echo ""
echo "✅ Custom attributes added successfully!"
echo ""
echo "Attributes added:"
echo "  - custom:organizationId (String) - Which organization the user belongs to"
echo "  - custom:clearanceLevel (String) - UNCLASSIFIED, CUI, SECRET, TOP_SECRET"
echo "  - custom:markings (String) - Comma-separated markings (PII,PHI,FIN)"
echo "  - custom:sciCompartments (String) - Comma-separated SCI compartments"
echo "  - custom:needToKnow (String) - true/false for need-to-know access"
echo "  - custom:employeeId (String) - Employee/contractor ID"
echo ""
echo "To assign attributes to users, use:"
echo "  aws cognito-idp admin-update-user-attributes \\"
echo "    --region $REGION \\"
echo "    --user-pool-id $USER_POOL_ID \\"
echo "    --username user@example.com \\"
echo "    --user-attributes \\"
echo "      Name=custom:organizationId,Value=org-acme \\"
echo "      Name=custom:clearanceLevel,Value=SECRET \\"
echo "      Name=custom:markings,Value=PII,FIN"
