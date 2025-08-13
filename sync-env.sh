#!/bin/bash

# Environment Variables Sync Script for Amplify
# This script helps sync environment variables from .env to amplify-env-vars.json

echo "🔄 Syncing environment variables for Amplify deployment..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create one first."
    exit 1
fi

# Create amplify-env-vars.json from .env file
echo "📝 Creating amplify-env-vars.json from .env..."

# Read .env and convert to JSON format
cat > amplify-env-vars.json << 'EOF'
{
EOF

# Process .env file, skipping comments and empty lines
grep -v '^#' .env | grep -v '^$' | while IFS='=' read -r key value; do
    if [ -n "$key" ] && [ -n "$value" ]; then
        # Remove quotes if present
        value=$(echo "$value" | sed 's/^"\(.*\)"$/\1/')
        echo "  \"$key\": \"$value\"," >> amplify-env-vars.json
    fi
done

# Remove trailing comma and close JSON
sed -i '$ s/,$//' amplify-env-vars.json
echo "}" >> amplify-env-vars.json

echo "✅ amplify-env-vars.json created successfully!"

# Display variables that need to be set in Amplify Console
echo ""
echo "🚀 Environment variables for Amplify Console:"
echo "================================================"

# Required variables for Amplify
required_vars=(
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
    "NEXT_PUBLIC_COGNITO_CLIENT_ID"
    "NEXT_PUBLIC_COGNITO_ISSUER"
    "COGNITO_CLIENT_SECRET"
    "COGNITO_USER_POOL_ID"
    "COGNITO_IDENTITY_POOL_ID"
    "COGNITO_SERVICE_CATALOG_POOL_ID"
    "COGNITO_DOMAIN"
    "REGION"
    "ACCESS_KEY_ID"
    "SECRET_ACCESS_KEY"
    "BEDROCK_AGENT_ID"
    "BEDROCK_AGENT_ALIAS_ID"
    "BEDROCK_SESSION_ID"
    "NEXT_PUBLIC_BEDROCK_AGENT_ID"
    "S3_BUCKET"
    "S3_REGION"
    "DYNAMODB_APPLICATIONS_TABLE"
    "DYNAMODB_USER_APPLICATION_STATE_TABLE"
    "DYNAMODB_ORGANIZATION_SETTINGS_TABLE"
    "DYNAMODB_MENU_ITEMS_TABLE"
    "DYNAMODB_WORKSPACE_CONTENT_TABLE"
    "DYNAMODB_CHAT_TABLE"
    "MI_DYNAMODB_TABLE"
    "AGENTS_TABLE_NAME"
    "AGENT_JOBS_TABLE_NAME"
    "API_GATEWAY_URL"
)

# Check which required variables are present
missing_vars=()
while IFS= read -r line; do
    if [[ $line =~ ^[[:space:]]*\"([^\"]+)\":[[:space:]]*\"([^\"]+)\" ]]; then
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        
        # Check if this is a required variable
        for req_var in "${required_vars[@]}"; do
            if [ "$key" = "$req_var" ]; then
                echo "✅ $key"
                break
            fi
        done
    fi
done < amplify-env-vars.json

# Check for missing required variables
for req_var in "${required_vars[@]}"; do
    if ! grep -q "\"$req_var\":" amplify-env-vars.json; then
        missing_vars+=("$req_var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo ""
    echo "⚠️  Missing required variables:"
    printf '❌ %s\n' "${missing_vars[@]}"
    echo ""
    echo "Please add these to your .env file and run this script again."
fi

echo ""
echo "📋 Next steps:"
echo "1. Go to AWS Amplify Console"
echo "2. Select your app"
echo "3. Go to Environment variables"
echo "4. Add the variables listed above"
echo "5. Deploy your app"

echo ""
echo "🎉 Environment sync complete!"
