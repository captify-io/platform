# API AWS Services

AWS service clients and factory for centralized credential management and client creation.

## Overview

This directory contains AWS service integrations that handle authentication, client creation, and service-specific operations. All AWS operations must go through these clients for proper credential management and security.

## Files

### `client-factory.ts`

Centralized factory for creating AWS service clients with proper credential management.

**Key Features:**

- Three-tier credential management (Session Token → User Credentials → Service Account)
- Connection pooling for optimal performance
- Automatic credential refresh
- Type-safe client configuration

**Usage:**

```typescript
import { AwsClientFactory } from "@captify/api/aws/client-factory";

// Create factory instance
const factory = new AwsClientFactory({
  region: "us-east-1",
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  identityPoolId: process.env.COGNITO_IDENTITY_POOL_ID,
});

// Get DynamoDB client with user session
const dynamoClient = await factory.getDynamoDBClient(session);

// Get S3 client with automatic credentials
const s3Client = await factory.getS3Client(session);
```

### `dynamodb.ts`

DynamoDB service implementation with convenience methods and type safety.

**Key Features:**

- Full CRUD operations with proper error handling
- Automatic marshalling/unmarshalling of JavaScript objects
- Connection pooling and performance optimization
- Query and scan operations with pagination support

**Usage:**

```typescript
import { DynamoDBService } from "@captify/api/aws/dynamodb";

const dynamodb = new DynamoDBService(session);

// Query operations
const users = await dynamodb.query({
  TableName: "users",
  KeyConditionExpression: "orgId = :orgId",
  ExpressionAttributeValues: { ":orgId": "org-123" },
});

// Put operations
await dynamodb.put({
  TableName: "users",
  Item: {
    id: "user-123",
    email: "user@example.com",
    orgId: "org-123",
  },
});

// Batch operations
await dynamodb.batchWrite({
  RequestItems: {
    users: [{ PutRequest: { Item: user1 } }, { PutRequest: { Item: user2 } }],
  },
});
```

## Authentication Integration

### Three-Tier Credential System

1. **Tier 1: Session Token (Preferred)**

   ```typescript
   // Automatic when session contains AWS credentials
   const client = await factory.getDynamoDBClient(sessionWithCredentials);
   ```

2. **Tier 2: Cognito Identity Pool**

   ```typescript
   // Automatic fallback using Identity Pool
   const client = await factory.getDynamoDBClient(sessionWithIdToken);
   ```

3. **Tier 3: Service Account**
   ```typescript
   // Environment variable fallback
   const client = await factory.getDynamoDBClient(null);
   ```

### Credential Validation

```typescript
// Validate credentials before use
const isValid = await factory.validateCredentials(session);
if (!isValid) {
  throw new Error("Invalid or expired credentials");
}
```

## Service-Specific Operations

### DynamoDB Operations

```typescript
// Table operations
const items = await dynamodb.scan({ TableName: "applications" });
const item = await dynamodb.get({ TableName: "users", Key: { id: "123" } });

// Complex queries
const results = await dynamodb.query({
  TableName: "user-data",
  IndexName: "email-index",
  KeyConditionExpression: "email = :email",
  ExpressionAttributeValues: { ":email": "user@example.com" },
});

// Conditional updates
await dynamodb.update({
  TableName: "users",
  Key: { id: "123" },
  UpdateExpression: "SET #status = :status",
  ConditionExpression: "attribute_exists(id)",
  ExpressionAttributeNames: { "#status": "status" },
  ExpressionAttributeValues: { ":status": "active" },
});
```

### Performance Optimization

```typescript
// Use batch operations for multiple items
await dynamodb.batchGet({
  RequestItems: {
    users: {
      Keys: [{ id: "user1" }, { id: "user2" }, { id: "user3" }],
    },
  },
});

// Parallel operations
const [users, applications] = await Promise.all([
  dynamodb.scan({ TableName: "users" }),
  dynamodb.scan({ TableName: "applications" }),
]);
```

## Error Handling

All AWS operations include comprehensive error handling:

```typescript
try {
  const result = await dynamodb.get({
    TableName: "users",
    Key: { id: "non-existent" },
  });

  if (!result.Item) {
    // Handle missing item
    throw new Error("User not found");
  }
} catch (error) {
  if (error.name === "ResourceNotFoundException") {
    // Handle table not found
  } else if (error.name === "AccessDeniedException") {
    // Handle permission issues
  } else {
    // Handle other errors
  }
}
```

## Connection Management

### Connection Pooling

```typescript
// Clients are automatically pooled and reused
const factory = new AwsClientFactory(config);

// Multiple calls reuse the same connection
const client1 = await factory.getDynamoDBClient(session);
const client2 = await factory.getDynamoDBClient(session); // Same instance
```

### Credential Caching

```typescript
// Credentials are cached and auto-refreshed
const credentials = await factory.getCredentials(session);
// Subsequent calls use cached credentials until expiration
```

## Security Features

1. **Automatic credential rotation** via AWS STS
2. **Least privilege access** based on user session
3. **Organization isolation** for multi-tenant security
4. **Request logging** for audit trails
5. **Error sanitization** to prevent credential leaks

## Best Practices

1. **Always use factory methods** instead of creating clients directly
2. **Pass user session** for proper authentication scoping
3. **Handle errors gracefully** with appropriate fallbacks
4. **Use batch operations** for better performance
5. **Monitor credential usage** and refresh patterns

## Configuration

### Environment Variables

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=fallback_access_key
AWS_SECRET_ACCESS_KEY=fallback_secret_key

# Cognito Configuration
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Client Configuration

```typescript
const factory = new AwsClientFactory({
  region: process.env.AWS_REGION,
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  identityPoolId: process.env.COGNITO_IDENTITY_POOL_ID,
  // Optional service account fallback
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
```

## TODO List

- [ ] Add S3 service implementation with presigned URLs
- [ ] Implement Bedrock runtime client for AI operations
- [ ] Add SNS/SQS service clients for messaging
- [ ] Create CloudWatch logging integration
- [ ] Implement Lambda invocation client
- [ ] Add Secrets Manager integration for secure config
- [ ] Create RDS/Aurora client for relational data
- [ ] Implement ElastiCache client for caching
- [ ] Add Kinesis client for real-time data streams
- [ ] Create Step Functions client for workflows
- [ ] Implement API Gateway management client
- [ ] Add CloudFormation client for infrastructure
- [ ] Create backup and restore utilities
- [ ] Implement cross-region data replication
