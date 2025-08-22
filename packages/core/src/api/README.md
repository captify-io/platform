# Core API Client

The API client provides a unified interface for accessing all Captify services and AWS resources from client-side code.

## Overview

This directory contains the core API client that all Captify applications must use to access AWS services and internal APIs. It handles authentication, request routing, and response formatting.

## Files

### `client.ts`

The main `CaptifyClient` class that provides a unified interface for all API operations.

**Key Features:**

- Automatic authentication header injection
- Unified request/response format
- Support for all HTTP methods (GET, POST, PUT, DELETE)
- Error handling and response standardization
- Session-aware requests

### `utils.ts`

Helper functions and utilities for easier API client integration:

- `createApiClient()` - Creates a configured client instance
- `handleApiResponse()` - Simplified error handling for API responses
- `ApiHelpers` class - Common DynamoDB operations

### `types.ts`

TypeScript definitions for all API client interfaces and types.

## Usage Examples

### Basic Client Usage

```typescript
import { createApiClient } from "@captify/core/api";

// Create a client (automatically configured)
const client = createApiClient();

// DynamoDB operations
const response = await client.get({
  table: "my-table",
  key: { id: "123" },
});

// Generic resource operations
const response = await client.post({
  resource: "users",
  operation: "create",
  data: { name: "John Doe" },
});
```

### Using API Helpers

```typescript
import { ApiHelpers } from "@captify/core/api";

const api = new ApiHelpers();

// Simplified DynamoDB operations
const user = await api.getItem("users", { id: "123" });
const newUser = await api.putItem("users", { id: "456", name: "Jane" });
const users = await api.scanTable("users");
```

### Using React Hooks

```typescript
import { useGetItem, usePutItem, useAuth } from "@captify/core/hooks";

function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading, error, execute: loadUser } = useGetItem("users");
  const { execute: saveUser } = usePutItem("users");
  const { validateSession } = useAuth();

  // Load user on mount
  useEffect(() => {
    loadUser({ id: userId });
  }, [userId]);

  const handleSave = async (userData: any) => {
    await saveUser(userData);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{/* User profile UI */}</div>;
}
```

**Key Types:**

- `CaptifyRequest`: Request structure for all operations
- `CaptifyResponse<T>`: Standardized response format
- `CaptifyClientOptions`: Client configuration options

### `index.ts`

Export definitions for the API client module.

## Authentication Integration

The client automatically handles:

1. **Session Token Authentication**: Uses NextAuth session for AWS credentials
2. **Header Injection**: Adds required headers (X-ID-Token, X-AWS-Session-Token, X-User-Email)
3. **Fallback Mechanisms**: Three-tier authentication system as per platform architecture

## Request Flow

1. Client constructs request using `CaptifyRequest` interface
2. Authentication headers are retrieved from session
3. Request is sent to unified API endpoint (`/api/captify`)
4. Response is standardized into `CaptifyResponse<T>` format
5. Errors are caught and returned in consistent format

## Supported Operations

### DynamoDB Operations

```typescript
// Query items
await client.get({
  table: "users",
  key: { userId: "123" },
});

// Create items
await client.post({
  table: "users",
  item: { userId: "123", name: "John" },
});

// Update items
await client.put({
  table: "users",
  key: { userId: "123" },
  item: { name: "John Updated" },
});

// Delete items
await client.delete({
  table: "users",
  key: { userId: "123" },
});
```

### Generic Resource Operations

```typescript
// Any service operation
await client.post({
  resource: "service-name",
  operation: "operation-name",
  params: { key: "value" },
  data: { payload: "data" },
});
```

## Error Handling

All responses follow the same format:

```typescript
interface CaptifyResponse<T> {
  success: boolean;
  data?: T; // Only present on success
  error?: string; // Only present on failure
  metadata?: {
    requestId: string;
    timestamp: string;
    source: string;
  };
}
```

## Best Practices

1. **Always use the client**: Never make direct fetch() calls to internal APIs
2. **Type your responses**: Use generics to type expected response data
3. **Handle errors**: Always check the `success` flag before using `data`
4. **Session management**: Ensure the session is passed to the client constructor

## TODO List

- [ ] Add request retry logic with exponential backoff
- [ ] Implement request caching for GET operations
- [ ] Add request/response logging in development mode
- [ ] Create specialized methods for common DynamoDB patterns
- [ ] Add pagination support for large result sets
- [ ] Implement request deduplication
- [ ] Add performance metrics collection
- [ ] Create mock client for testing environments
- [ ] Add request validation before sending
- [ ] Implement client-side rate limiting
