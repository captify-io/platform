# PowerShell script to set AWS Amplify environment variables
# Replace 'your-app-id' with your actual Amplify App ID

$APP_ID = "your-app-id"  # Replace with your actual Amplify App ID
$BRANCH_NAME = "master"   # or your production branch name

# Environment variables to set (secrets are managed separately in Amplify console)
$envVars = @{
    "NEXTAUTH_URL" = "https://www.anautics.ai"
    "NEXT_PUBLIC_COGNITO_CLIENT_ID" = "4og43nmsksolkkrk3v47tj7gv9"
    "NEXT_PUBLIC_COGNITO_ISSUER" = "https://auth.anautics.ai"
    "COGNITO_USER_POOL_ID" = "us-east-1_k3Fp77c09"
    "COGNITO_SERVICE_CATALOG_POOL_ID" = "us-east-1:d70589a1-b2ff-4a47-9528-e8dc6b98ff95"
    "AWS_REGION" = "us-east-1"
    "AWS_BEDROCK_AGENT_ID" = "H7MXL2MY4U"
    "AWS_BEDROCK_AGENT_ALIAS_ID" = "RFQULMWMAO"
    "BEDROCK_SESSION_ID" = "test-session-001"
    "S3_BUCKET" = "titan-dev-documents-211125459951"
    "S3_REGION" = "us-east-1"
    "API_GATEWAY_URL" = "https://nip321gg81.execute-api.us-east-1.amazonaws.com/dev"
    "NODE_ENV" = "production"
}

Write-Host "Setting environment variables for Amplify app: $APP_ID"

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-Host "Setting $key..."
    
    aws amplify update-app --app-id $APP_ID --environment-variables $key=$value
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Successfully set $key" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to set $key" -ForegroundColor Red
    }
}

Write-Host "Environment variables setup complete!"
Write-Host "Don't forget to trigger a new deployment for changes to take effect."
