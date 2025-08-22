# API Services

Service APIs that provide high-level interfaces for different AWS services and platform capabilities.

## Overview

This directory contains service API classes that abstract AWS service operations into easy-to-use interfaces. Each service API handles authentication, error handling, and response formatting automatically.

## Files

### `DynamoDBServiceAPI.ts`

High-level interface for all DynamoDB operations with automatic authentication and error handling.

**Key Features:**

- Unified interface for all DynamoDB operations (get, put, update, delete, query, scan)
- Automatic session management and credential handling
- Service pooling for performance optimization
- Standardized response format across all operations

**Usage:**

```typescript
import { DynamoDBServiceAPI } from "@captify/api/services";

// Execute DynamoDB operations
const result = await DynamoDBServiceAPI.execute(
  {
    operation: "query",
    tableName: "users",
    data: {
      KeyConditionExpression: "orgId = :orgId",
      ExpressionAttributeValues: { ":orgId": "org-123" },
    },
  },
  session
);

// Handle response
if (result.success) {
  console.log("Users:", result.data);
} else {
  console.error("Error:", result.error);
}
```

### `S3ServiceAPI.ts`

High-level interface for S3 file operations with proper credential management.

**Key Features:**

- File upload/download operations
- Presigned URL generation
- Automatic content type detection
- Streaming support for large files

**Usage:**

```typescript
import { S3ServiceAPI } from "@captify/api/services";

// Upload file
const uploadResult = await S3ServiceAPI.execute(
  {
    operation: "put",
    bucket: "my-bucket",
    key: "files/document.pdf",
    data: fileBuffer,
  },
  session
);

// Generate presigned URL
const urlResult = await S3ServiceAPI.execute(
  {
    operation: "presignedUrl",
    bucket: "my-bucket",
    key: "files/document.pdf",
    data: { expiresIn: 3600 }, // 1 hour
  },
  session
);
```

### `ServiceRegistry.ts`

Central registry for managing and discovering service APIs.

**Key Features:**

- Dynamic service registration
- Service discovery and instantiation
- Dependency injection for service APIs
- Plugin architecture for extensibility

**Usage:**

```typescript
import { ServiceRegistry } from "@captify/api/services";

// Register custom service
ServiceRegistry.register("customService", CustomServiceAPI);

// Get service instance
const service = ServiceRegistry.get("dynamodb");

// Execute operation
const result = await service.execute(request, session);
```

### `ResourceHandlerRegistry.ts`

Registry for resource-specific handlers that provide specialized operations.

**Key Features:**

- Resource-specific operation handlers
- Automatic handler discovery
- Type-safe resource operations
- Extensible plugin system

**Usage:**

```typescript
import { ResourceHandlerRegistry } from "@captify/api/services";

// Register resource handler
ResourceHandlerRegistry.register("users", UserResourceHandler);

// Execute resource operation
const result = await ResourceHandlerRegistry.execute(
  "users",
  "create",
  userData,
  session
);
```

## Service API Architecture

### Base Service Interface

All service APIs implement a common interface:

```typescript
interface ServiceAPI {
  execute(request: ServiceRequest, session: UserSession): Promise<ApiResponse>;
}

interface ServiceRequest {
  operation: string;
  data: any;
  [key: string]: any;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: ResponseMetadata;
}
```

### Operation Patterns

#### CRUD Operations

```typescript
// Create operation
await DynamoDBServiceAPI.execute(
  {
    operation: "put",
    tableName: "users",
    data: { id: "123", name: "John Doe" },
  },
  session
);

// Read operation
await DynamoDBServiceAPI.execute(
  {
    operation: "get",
    tableName: "users",
    data: { id: "123" },
  },
  session
);

// Update operation
await DynamoDBServiceAPI.execute(
  {
    operation: "update",
    tableName: "users",
    data: {
      Key: { id: "123" },
      UpdateExpression: "SET #name = :name",
      ExpressionAttributeNames: { "#name": "name" },
      ExpressionAttributeValues: { ":name": "Jane Doe" },
    },
  },
  session
);

// Delete operation
await DynamoDBServiceAPI.execute(
  {
    operation: "delete",
    tableName: "users",
    data: { id: "123" },
  },
  session
);
```

#### Query Operations

```typescript
// Simple query
await DynamoDBServiceAPI.execute(
  {
    operation: "query",
    tableName: "user-data",
    data: {
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": "user-123" },
    },
  },
  session
);

// Complex query with filters
await DynamoDBServiceAPI.execute(
  {
    operation: "query",
    tableName: "applications",
    data: {
      IndexName: "status-index",
      KeyConditionExpression: "status = :status",
      FilterExpression: "createdAt > :date",
      ExpressionAttributeValues: {
        ":status": "active",
        ":date": "2023-01-01",
      },
    },
  },
  session
);
```

### Service Pooling

Services automatically pool connections for performance:

```typescript
// First call creates service instance
const result1 = await DynamoDBServiceAPI.execute(request1, session);

// Subsequent calls reuse the same service instance
const result2 = await DynamoDBServiceAPI.execute(request2, session);
```

### Error Handling

All service APIs provide consistent error handling:

```typescript
const result = await DynamoDBServiceAPI.execute(request, session);

if (!result.success) {
  switch (result.error) {
    case "ResourceNotFoundException":
      // Handle table not found
      break;
    case "AccessDeniedException":
      // Handle permission denied
      break;
    case "ValidationException":
      // Handle invalid input
      break;
    default:
      // Handle generic error
      break;
  }
}
```

## Custom Service APIs

### Creating Custom Services

```typescript
import { ServiceAPI, ServiceRequest, ApiResponse } from "@captify/api/types";

export class CustomServiceAPI implements ServiceAPI {
  async execute(
    request: ServiceRequest,
    session: UserSession
  ): Promise<ApiResponse> {
    try {
      switch (request.operation) {
        case "customOperation":
          return await this.handleCustomOperation(request.data, session);
        default:
          return {
            success: false,
            error: `Unknown operation: ${request.operation}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async handleCustomOperation(
    data: any,
    session: UserSession
  ): Promise<ApiResponse> {
    // Implementation here
    return {
      success: true,
      data: result,
    };
  }
}
```

### Registering Custom Services

```typescript
// Register in service registry
ServiceRegistry.register("customService", CustomServiceAPI);

// Use in CaptifyApi
const api = new CaptifyApi({ session });
const result = await api.customService.execute(request);
```

## Performance Optimization

1. **Service Pooling**: Instances are reused across requests
2. **Connection Pooling**: AWS clients are pooled automatically
3. **Batch Operations**: Support for batch requests where possible
4. **Lazy Loading**: Services are created only when needed
5. **Caching**: Frequently accessed data is cached appropriately

## Security Features

1. **Session Validation**: All operations require valid user session
2. **Organization Isolation**: Operations are scoped to user's organization
3. **Permission Checking**: Operations respect user permissions
4. **Audit Logging**: All operations are logged for security audit
5. **Error Sanitization**: Sensitive information is not exposed in errors

## TODO List

- [ ] Add comprehensive audit logging for all service operations
- [ ] Implement request rate limiting per user/organization
- [ ] Create batch operation support for all service APIs
- [ ] Add caching layer for frequently accessed data
- [ ] Implement service health monitoring and metrics
- [ ] Create service API versioning system
- [ ] Add support for async/background operations
- [ ] Implement service discovery with load balancing
- [ ] Create automated testing framework for service APIs
- [ ] Add performance monitoring and optimization recommendations
- [ ] Implement service mesh integration for microservices
- [ ] Create service API documentation generator
- [ ] Add support for service API plugins and extensions
- [ ] Implement cross-service transaction support
