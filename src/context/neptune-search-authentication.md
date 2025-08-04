# Neptune Search API Authentication Guide

## Overview

The `/api/search` endpoint now supports proper authentication using Cognito Identity Pool credentials and AWS SigV4 signing for Neptune access.

## Authentication Flow

1. **Client Request**: Include authentication tokens in headers

   - `X-ID-Token`: Cognito ID token from user session
   - `Authorization`: Bearer access token (optional)

2. **Credential Resolution**: API exchanges ID token for AWS credentials via Cognito Identity Pool

   - Uses `fromCognitoIdentityPool()` from AWS SDK
   - Gets temporary AWS credentials (accessKeyId, secretAccessKey, sessionToken)

3. **Neptune Connection**: Creates authenticated Gremlin connection

   - Uses `gremlin-aws-sigv4` package for SigV4 signing
   - Establishes WebSocket connection with proper AWS authentication

4. **Fallback**: If authentication fails, falls back to simple VPC connection

## Required Environment Variables

```bash
NEPTUNE_ENDPOINT=your-neptune-cluster-endpoint
COGNITO_SERVICE_CATALOG_POOL_ID=your-identity-pool-id
COGNITO_USER_POOL_ID=your-user-pool-id
REGION=us-east-1
```

## API Usage

### GET Request

```bash
curl "http://localhost:3000/api/search?query=test" \
  -H "X-ID-Token: your-cognito-id-token" \
  -H "Authorization: Bearer your-access-token"
```

### POST Request

```bash
curl -X POST "http://localhost:3000/api/search" \
  -H "Content-Type: application/json" \
  -H "X-ID-Token: your-cognito-id-token" \
  -H "Authorization: Bearer your-access-token" \
  -d '{"query": "test"}'
```

## Response Format

```json
{
  "query": "test",
  "totalResults": 3,
  "results": [
    {
      "title": "Test Application",
      "url": "/apps/test-app",
      "description": "Found: Test Application",
      "serviceId": "test-app",
      "source": "neptune"
    }
  ],
  "executionTime": 0.245
}
```

## Error Handling

- **400**: Missing query parameter
- **500**: Neptune connection or authentication errors
- Graceful fallback to empty results on connection failures

## Security Features

- AWS SigV4 request signing
- Temporary credentials via Cognito Identity Pool
- Automatic credential refresh
- Connection cleanup after each request
