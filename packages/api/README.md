# @captify/api

Server-side API client package for Captify SDK with built-in security, AWS integration, and session management. This package is exclusively for server-side usage in API routes and server components.

## Package Overview

This package provides:

- **Server-side API orchestration** with centralized credential management
- **AWS service integration** (DynamoDB, S3, Cognito, STS)
- **Session management** with three-tier authentication
- **Organization-based access control** and permissions
- **Service registry** for extensible API architecture

## Installation

```bash
npm install @captify/api
```

## Usage

### Basic API Usage (Server-side only)

**Ground Rule #1**: All applications MUST use `@captify/core/api/client` for client-side access. This package is for server-side only.

```typescript
// In API routes only
import { CaptifyApi, requireUserSession } from "@captify/api";

export async function GET(request: Request) {
  // Validate and get user session
  const session = await requireUserSession(request);

  // Initialize API with authenticated session
  const api = new CaptifyApi({ session });

  // Use service APIs
  const users = await api.dynamodb.query({
    TableName: "users",
    KeyConditionExpression: "orgId = :orgId",
    ExpressionAttributeValues: {
      ":orgId": session.organizationId,
    },
  });

  return Response.json(users);
}
```

### Session Management

```typescript
import {
  getUserSession,
  requireUserSession,
  hasPermission,
  validateOrgAccess,
} from "@captify/api";

// Get session without requiring authentication
const session = await getUserSession(request);

// Require authenticated session (throws if not authenticated)
const session = await requireUserSession(request);

// Check permissions
const canEdit = await hasPermission(session, "edit", "users");

// Validate organization access
const hasAccess = await validateOrgAccess(session, organizationId);
```

### DynamoDB Operations

```typescript
import { CaptifyApi } from "@captify/api";

const api = new CaptifyApi({ session });

// Query operations
const items = await api.dynamodb.query({
  TableName: "applications",
  KeyConditionExpression: "userId = :userId",
  ExpressionAttributeValues: { ":userId": session.userId },
});

// Put operations
await api.dynamodb.put({
  TableName: "users",
  Item: {
    id: generateUUID(),
    email: session.email,
    createdAt: new Date().toISOString(),
  },
});

// Update operations
await api.dynamodb.update({
  TableName: "users",
  Key: { id: userId },
  UpdateExpression: "SET #name = :name",
  ExpressionAttributeNames: { "#name": "name" },
  ExpressionAttributeValues: { ":name": newName },
});
```

### Organization Management

```typescript
import { organizationService } from "@captify/api";

// Get user's organizations
const orgs = await organizationService.getUserOrganizations(session.userId);

// Create new organization
const newOrg = await organizationService.createOrganization({
  name: "My Organization",
  ownerId: session.userId,
});

// Update organization settings
await organizationService.updateSettings(orgId, {
  allowedDomains: ["example.com"],
  maxUsers: 100,
});
```

## Directory Structure

- `/aws` - AWS service clients and factories
- `/lib` - Authentication, session, and organization utilities
- `/services` - Service APIs for different resources
- `CaptifyApi.ts` - Main API orchestrator class
- `SessionService.ts` - Session management service
- `types.ts` - TypeScript definitions for server-side APIs

## Architecture

### Three-Tier Authentication System

1. **Tier 1: AWS Session Token (Preferred)**

   - Direct AWS credentials from NextAuth JWT callback
   - Highest privilege level for all AWS services
   - Used when available for optimal performance

2. **Tier 2: User Credentials**

   - Cognito Identity Pool credentials
   - User-scoped access with organization boundaries
   - Automatic fallback when session tokens unavailable

3. **Tier 3: Static Fallback**
   - Service account credentials from environment
   - Least privileged access for emergency scenarios
   - Should only be used as last resort

### Service Registry Pattern

The API uses a service registry for extensible architecture:

```typescript
// Register new services
api.registerService("customService", new CustomServiceAPI());

// Use registered services
const result = await api.customService.performOperation(params);
```

### Organization-Based Security

All operations respect organization boundaries:

- Users can only access data within their organizations
- Cross-organization access requires explicit permissions
- Organization settings control feature availability

## Server-Side Integration

### NextAuth.js Integration

```typescript
// pages/api/auth/[...nextauth].ts
import { authOptions } from "@captify/api";

export default NextAuth(authOptions);
```

### API Route Example

```typescript
// app/api/users/route.ts
import { CaptifyApi, requireUserSession } from "@captify/api";

export async function GET(request: Request) {
  try {
    const session = await requireUserSession(request);
    const api = new CaptifyApi({ session });

    const users = await api.dynamodb.scan({
      TableName: "users",
      FilterExpression: "orgId = :orgId",
      ExpressionAttributeValues: {
        ":orgId": session.organizationId,
      },
    });

    return Response.json({
      success: true,
      data: users.Items,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 401 }
    );
  }
}
```

### Middleware Integration

```typescript
// middleware.ts
import { getUserSession } from "@captify/api";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/protected/")) {
    const session = await getUserSession(request);

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
}
```

## TypeScript Configuration

**Ground Rule #2**: All code must use TypeScript strict mode. The package provides comprehensive server-side types:

```typescript
import type {
  ApiConfig,
  ExtendedUserSession,
  AwsCredentials,
  ApiRequest,
  ApiResponse,
  DynamoDbOptions,
  ServicePermission,
} from "@captify/api";
```

## Security Features

1. **Automatic credential rotation** via AWS STS
2. **Organization isolation** for multi-tenant security
3. **Permission-based access control** with role validation
4. **Session validation** with JWT verification
5. **Request logging** for audit trails

## Performance Optimization

1. **Connection pooling** for AWS services
2. **Credential caching** with automatic refresh
3. **Service registry** for efficient resource management
4. **Lazy loading** of AWS clients
5. **Request batching** for DynamoDB operations

## TODO List

**Ground Rule #3**: All TODOs are tracked here in the README:

- [ ] Implement comprehensive audit logging for all API operations
- [ ] Add request rate limiting per organization
- [ ] Create automated testing suite for all service APIs
- [ ] Implement caching layer for frequently accessed data
- [ ] Add performance monitoring and metrics collection
- [ ] Create database migration utilities
- [ ] Implement backup and restore functionality
- [ ] Add support for batch operations across all services
- [ ] Create API versioning system for backward compatibility
- [ ] Implement real-time event streaming for data changes
- [ ] Add support for custom service plugins
- [ ] Create comprehensive API documentation generator
- [ ] Implement query optimization recommendations
- [ ] Add support for cross-region data replication

## Related Packages

- `@captify/core` - Client-side utilities and components (use for browser code)
- `@captify/core` - Application management functionality
- `@captify/chat` - Chat and messaging services
