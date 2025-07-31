# AWS Service Catalog Search API Implementation

## Overview

The `/api/search` endpoint now implements AWS Service Catalog search using proper AWS SDK authentication through Cognito Identity Pools. This follows AWS best practices for secure API access.

## Authentication Flow

1. **User Authentication**: NextAuth.js authenticates user with Cognito User Pool
2. **ID Token Extraction**: API route extracts the ID token from the session
3. **Identity Pool Authentication**: Uses `fromCognitoIdentityPool` to get temporary AWS credentials
4. **Service Catalog Access**: Makes authenticated calls to AWS Service Catalog API

## Implementation Details

### Environment Variables Required

```bash
# AWS Configuration
AWS_REGION=us-east-1
COGNITO_SERVICE_CATALOG_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX

# Cognito OAuth Provider
COGNITO_CLIENT_ID=your-cognito-app-client-id
COGNITO_CLIENT_SECRET=your-cognito-app-client-secret
COGNITO_DOMAIN=https://your-domain.auth.us-east-1.amazoncognito.com

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

### API Route Structure

```typescript
// /src/app/api/search/route.ts
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import {
  ServiceCatalogClient,
  SearchProductsCommand,
} from "@aws-sdk/client-service-catalog";

async function searchServiceCatalog(
  query: string,
  limit: number,
  idToken: string
) {
  const credentials = fromCognitoIdentityPool({
    identityPoolId: IDENTITY_POOL_ID,
    logins: {
      [`cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}`]: idToken,
    },
  });

  const client = new ServiceCatalogClient({
    region: AWS_REGION,
    credentials,
  });

  const command = new SearchProductsCommand({
    Filters: query ? { FullTextSearch: [query] } : undefined,
    PageSize: limit,
  });

  const response = await client.send(command);
  return response.ProductViewSummaries;
}
```

### Request/Response Format

**Request:**

```json
{
  "query": "database",
  "limit": 20
}
```

**Response:**

```json
{
  "query": "database",
  "totalResults": 5,
  "sections": [
    {
      "sectionTitle": "AWS Service Catalog",
      "provider": "service-catalog",
      "totalCount": 5,
      "results": [
        {
          "title": "Amazon RDS Database",
          "url": "/console/servicecatalog/product/prod-xxxxx",
          "description": "Managed relational database service",
          "serviceId": "prod-xxxxx",
          "topServiceFeatures": ["managed", "scalable"],
          "source": "service-catalog"
        }
      ]
    }
  ],
  "suggestions": [],
  "executionTime": 0.25
}
```

## AWS IAM Configuration

### Identity Pool Role Policy

The Identity Pool authenticated role needs the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "servicecatalog:SearchProducts",
        "servicecatalog:DescribeProduct",
        "servicecatalog:ListPortfolios"
      ],
      "Resource": "*"
    }
  ]
}
```

### Trust Relationship

```json
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
          "cognito-identity.amazonaws.com:aud": "us-east-1:your-identity-pool-id"
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "authenticated"
        }
      }
    }
  ]
}
```

## Future Extensions

This pattern can be extended for other AWS services:

### Bedrock Integration

```typescript
// Add environment variable: AWS_COGNITO_BEDROCK_IDENTITY_POOL_ID
import {
  BedrockClient,
  ListFoundationModelsCommand,
} from "@aws-sdk/client-bedrock";
```

### SageMaker Integration

```typescript
// Add environment variable: AWS_COGNITO_SAGEMAKER_IDENTITY_POOL_ID
import { SageMakerClient, ListModelsCommand } from "@aws-sdk/client-sagemaker";
```

### Lambda Integration

```typescript
// Add environment variable: AWS_COGNITO_LAMBDA_IDENTITY_POOL_ID
import { LambdaClient, ListFunctionsCommand } from "@aws-sdk/client-lambda";
```

## Error Handling

The implementation includes comprehensive error handling:

1. **Authentication Errors**: Returns 401 if session or ID token is missing
2. **AWS Service Errors**: Logs and continues with empty results
3. **Permission Errors**: Specific handling for `UnauthorizedOperation` and `AccessDenied`

## Testing

To test the implementation:

1. Ensure all environment variables are configured
2. Start the development server: `npm run dev`
3. Authenticate through the application
4. Make a POST request to `/api/search` with a query

Example using curl:

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "database", "limit": 10}'
```

## Security Benefits

1. **No Static AWS Keys**: Uses temporary credentials from Identity Pools
2. **User-Scoped Access**: Each user gets their own AWS session
3. **Minimal Permissions**: Each service gets only required permissions
4. **Audit Trail**: All AWS API calls are logged with user context
5. **Token Expiration**: Temporary credentials automatically expire
