# API Framework Architecture

## Client-Side API Usage Patterns

### Using API Client on Frontend

**CRITICAL**: Always use the centralized API client for frontend API calls to ensure proper authentication headers are included.

#### ✅ Correct Pattern - Using API Client

```typescript
// Import the appropriate API client
import { MIApiClient } from "@/app/mi/services/api-client";

// Example: Workbench page implementation
const fetchWorkbenchData = async () => {
  try {
    setLoading(true);
    setError(null);

    const params = {
      status: statusFilter !== "all" ? statusFilter : undefined,
      priority: priorityFilter !== "all" ? priorityFilter : undefined,
    };

    // ✅ Use API client - automatically includes authentication headers
    const response = await MIApiClient.getWorkbench(params);

    if (!response.ok) {
      throw new Error(
        response.error || `HTTP error! status: ${response.status}`
      );
    }

    setWorkbenchData(response.data || null);
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to fetch workbench data"
    );
  } finally {
    setLoading(false);
  }
};
```

#### ❌ Incorrect Pattern - Direct Fetch

```typescript
// ❌ NEVER do this - bypasses authentication headers
const response = await fetch("/api/mi/workbench", {
  method: "GET",
  headers: { "Content-Type": "application/json" },
});
```

### API Client Authentication Headers

The API client automatically includes these authentication headers for all requests:

```typescript
// Headers automatically included by API client
headers: {
  "Content-Type": "application/json",
  "X-ID-Token": session.idToken,              // Cognito JWT token
  "X-AWS-Session-Token": session.awsSessionToken,  // AWS temporary credentials
  "X-User-Email": session.email,              // User identifier
}
```

### Available API Clients

```typescript
// Material Insights API Client
import { MIApiClient } from "@/app/mi/services/api-client";

// Methods available:
await MIApiClient.getBOM(nodeId, params); // BOM data
await MIApiClient.getWorkbench(params); // Workbench issues
```

### Best Practices Summary

#### Frontend Development

1. **Always use API clients** - Never use direct `fetch()` calls to internal APIs
2. **Centralized types** - Import types from `@/app/mi/types` instead of defining local interfaces
3. **Error handling** - Check `response.ok` before accessing `response.data`
4. **State management** - Use `useEffect` with proper dependencies instead of manual refresh handlers

#### API Development

1. **Authentication first** - Implement `requireUserSession` and three-tier AWS credentials
2. **IAM compliance** - Use `QueryCommand` instead of `ScanCommand` for database operations
3. **Consistent responses** - Follow established response patterns with metadata, charts, etc.
4. **Header validation** - Extract and validate all required authentication headers

````

## Server-Side API Implementation Patterns

### Building APIs with AWS Authentication

**CRITICAL**: All API routes must implement the three-tier authentication pattern for AWS credentials.

#### Required Authentication Headers

APIs must extract and validate these headers from client requests:

```typescript
// Extract authentication headers in API route
const idToken = request.headers.get("X-ID-Token");
const awsSessionToken = request.headers.get("X-AWS-Session-Token");
const userEmail = request.headers.get("X-User-Email");

// Construct session object for authentication
const session = {
  email: userEmail,
  idToken: idToken,
  awsSessionToken: awsSessionToken,
  awsExpiresAt: // Extract from token if needed
};
````

#### Three-Tier Authentication Pattern

All APIs must follow this authentication hierarchy:

```typescript
// 1. Primary: requireUserSession for NextAuth validation
const session = await requireUserSession(request);

// 2. AWS Credentials: Three-tier fallback for database access
async function getDynamoDBClient(
  session: UserSession
): Promise<DynamoDBDocumentClient> {
  // Tier 1: Session Token (Preferred)
  if (session.awsSessionToken && session.idToken) {
    try {
      console.log("🔐 Using session token for database access");
      return await createSessionTokenDynamoDBClient(session);
    } catch (error) {
      console.log("⚠️ Session token failed, falling back to user credentials");
    }
  }

  // Tier 2: User Credentials (Federated Identity)
  if (session.idToken) {
    try {
      console.log("🔐 Using user-scoped credentials for database access");
      return await createUserDynamoDBClient(session);
    } catch (error) {
      console.log(
        "⚠️ User credentials failed, falling back to static credentials"
      );
    }
  }

  // Tier 3: Static Fallback (Service Account)
  console.log("⚠️ Using static credentials fallback");
  return createStaticDynamoDBClient();
}
```

### Common Authentication Issues & Solutions

#### Missing Authentication Headers

**Symptom**: API calls fail with authentication errors despite valid user session.

**Cause**: Frontend code using direct `fetch()` instead of API client.

**Solution**:

```typescript
// ❌ Problem: Direct fetch bypasses authentication
const response = await fetch("/api/mi/workbench");

// ✅ Solution: Use API client
const response = await MIApiClient.getWorkbench(params);
```

#### API Client Not Including Headers

**Symptom**: API client calls fail with missing header errors.

**Cause**: API client not properly configured or session not available.

**Solution**: Ensure API client is properly initialized with session context:

```typescript
// Check that API client has access to session
// Headers should automatically include:
// - X-ID-Token
// - X-AWS-Session-Token
// - X-User-Email
```

#### Type Mismatches Between API and Frontend

**Symptom**: TypeScript errors when consuming API responses.

**Cause**: API response structure doesn't match frontend type expectations.

**Solution**: Update centralized types to match actual API response:

```typescript
// ❌ Problem: Local interface that doesn't match API
interface LocalWorkbenchData { ... }

// ✅ Solution: Use centralized types that match API
import type { WorkbenchData } from "@/app/mi/types";
```

## Overview

Schema-first API framework that ensures client/server sync while maintaining the existing `requireUserSession` pattern. All APIs follow consistent patterns for authentication, validation, and response formatting.

## Important IAM Constraints

**Critical**: The current IAM policy only grants these DynamoDB permissions:

- `dynamodb:Query`
- `dynamodb:GetItem`

**Prohibited Operations**:

- `dynamodb:Scan` - Will result in "not authorized" errors
- `dynamodb:BatchGetItem`
- `dynamodb:PutItem`, `dynamodb:UpdateItem`, `dynamodb:DeleteItem`

**Design Implications**:

- All database operations MUST use `QueryCommand` or `GetCommand`
- Use GSI (Global Secondary Index) for access patterns that would typically require Scan
- Apply filters in memory after Query operations when necessary
- Avoid `ScanCommand` entirely - it will fail with authorization errors

## Authentication Patterns

### Session Token Pattern

All APIs must implement the layered authentication approach established in the MI (Material Insights) BOM API:

```typescript
// 1. Use requireUserSession as the primary authentication gate
const session = await requireUserSession(request);

// 2. Session includes AWS credentials from NextAuth JWT callback
interface UserSession {
  email: string;
  idToken: string;
  awsSessionToken?: string; // AWS temporary session token
  awsExpiresAt?: string; // Token expiration timestamp
}
```

### Database Client Priority Order

Database services must implement the three-tier fallback pattern:

```typescript
async function getDynamoDBClient(
  session: UserSession
): Promise<DynamoDBDocumentClient> {
  // Priority order: session token > user credentials > static fallback

  // 1. Session Token (Preferred) - From NextAuth JWT callback
  if (session.awsSessionToken && session.idToken) {
    try {
      console.log("🔐 Using session token from headers for database access");
      return await createSessionTokenDynamoDBClient(session);
    } catch (error) {
      console.log("⚠️ Session token failed, falling back to user credentials");
    }
  }

  // 2. User Credentials - Cognito Identity Pool federated identity
  if (session.idToken) {
    try {
      console.log("🔐 Using user-scoped credentials for database access");
      return await createUserDynamoDBClient(session);
    } catch (error) {
      console.log(
        "⚠️ User-scoped credentials failed, falling back to static credentials"
      );
      return createStaticDynamoDBClient();
    }
  }

  // 3. Static Fallback - Service credentials (least preferred)
  console.log("⚠️ Falling back to static credentials - ID token not available");
  return createStaticDynamoDBClient();
}
```

### NodeId Normalization Pattern

For APIs that work with node identifiers, implement automatic prefix handling:

```typescript
// Ensure consistent NODE# prefix for database queries
const pk = nodeId.startsWith("NODE#") ? nodeId : `NODE#${nodeId}`;

// This allows APIs to accept both formats:
// - Frontend calls: "nsn:2840-00-123-4567"
// - Database storage: "NODE#nsn:2840-00-123-4567"
```

### API Response Structure

All APIs should return data structures that match frontend expectations:

```typescript
// BOM API Response Pattern
interface BOMResponse {
  metadata: {
    nodeId: string;
    depth: number;
    view: string;
    asof: string;
    generated: string;
  };
  rootNode: {
    id: string;
    name: string;
    entity: string;
    level: number;
    riskScore: number;
    costImpact: number;
    attrs: Record<string, any>;
    riskColor: string; // Theme-aware CSS variable
  };
  children: Array<{
    id: string;
    name: string;
    entity: string;
    level: number;
    riskScore: number;
    costImpact: number;
    hasChildren: boolean;
    chartColor: string; // CSS variable for consistency
    riskColor: string; // CSS variable for consistency
  }>;
  suppliers: Array<{
    id: string;
    name: string;
    leadDays: number;
    otifPct: number;
    unitCost: number;
    status: string;
    chartColor: string;
  }>;
  chartData: {
    riskDistribution: Array<{
      name: string;
      risk: number;
      cost: number;
      fill: string; // CSS variable
    }>;
    supplierMetrics: Array<{
      name: string;
      leadTime: number;
      otd: number;
      cost: number;
      fill: string; // CSS variable
    }>;
  };
  priorityActions: Array<{
    id: string;
    title: string;
    description: string;
    priority: "Low" | "Medium" | "High" | "Critical";
    action: "navigate" | "alert";
    target?: string;
  }>;
}
```

### Workbench API Response Pattern

The workbench API follows the same three-tier authentication pattern and uses Query operations (IAM-compliant):

```typescript
// Workbench API Database Service Usage (IAM-Compliant)
const issues = await WorkbenchDatabase.getIssues(session, params);
// Note: Uses QueryCommand with GSI1, applies filters in memory
// Returns Array<any> directly, not wrapped object like BOM API

// IAM-Compliant Query Pattern
const command = new QueryCommand({
  TableName: tableName,
  IndexName: "GSI1", // Use GSI for efficient access
  KeyConditionExpression: "gsi1pk = :issueType",
  ExpressionAttributeValues: {
    ":issueType": "ISSUE",
  },
});
// Apply additional filters in memory after query
```

```typescript
// Workbench API Response Pattern
interface WorkbenchResponse {
  metadata: {
    filters: WorkbenchParams;
    totalIssues: number;
    filteredIssues: number;
    generated: string;
  };
  summary: {
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  };
  issues: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    riskScore: number;
    missionImpact: number;
    taskCount: number;
    completedTasks: number;
    priorityColor: string; // CSS variable for consistency
    chartColor: string; // CSS variable for consistency
  }>;
  chartData: {
    statusDistribution: Array<{
      name: string;
      value: number;
      fill: string;
    }>;
    priorityTrend: Array<{
      name: string;
      count: number;
      fill: string;
    }>;
  };
  priorityActions: Array<{
    id: string;
    title: string;
    description: string;
    priority: string;
    dueDate: string;
    assignee: string;
  }>;
}

// Database Service Usage
const issues = await WorkbenchDatabase.getIssues(session, params);
// Note: Returns Array<any> directly, not wrapped object like BOM API
```

### Error Handling Pattern

Implement consistent error handling with proper HTTP status codes:

```typescript
try {
  // API logic here
  return NextResponse.json(responseData);
} catch (error) {
  console.error("API error:", error);

  // Handle authentication errors specifically
  if (error instanceof Error) {
    if (error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (
      error.message.includes("Session expired") ||
      error.message.includes("Token expired")
    ) {
      return NextResponse.json(
        {
          error: "Session expired",
          message: "Your session has expired. Please log in again.",
          requiresReauth: true,
        },
        { status: 401 }
      );
    }
  }

  return NextResponse.json(
    {
      error: "Failed to fetch data",
      details: error instanceof Error ? error.message : "Unknown error",
    },
    { status: 500 }
  );
}
```

### Logging Pattern

Use consistent logging for debugging and monitoring:

```typescript
console.log("🔍 API Name - Starting request");
console.log("✅ User authenticated:", session.email);
console.log("🔍 Session idToken present:", !!session.idToken);
console.log("🔍 Session awsSessionToken present:", !!session.awsSessionToken);
console.log("🔍 Request params:", params);
```

## Architecture Principles

### 1. **Universal Session Management**

- All APIs use `requireUserSession()` as first step
- Maintains existing security patterns
- No API is accessible without valid session

### 2. **Schema-First Design**

- TypeScript schemas define API contracts
- Runtime validation on both client and server
- Compile-time type safety prevents mismatches

### 3. **Configuration-Driven**

- App configs in `src/app/{appId}/config.json`
- Database table mappings per app
- Shared services use global configuration

### 4. **Layered Services**

- **Shared Services**: Cross-app functionality (notifications, audit, permissions)
- **App Services**: App-specific business logic
- **Database Layer**: Consistent AWS SDK patterns

## Implementation Roadmap

### Phase 1: Foundation (Steps 1-3)

**Goal**: Establish core framework without breaking existing APIs

#### Step 1: Shared Table Configuration ⏳

- **File**: `src/lib/config/database.ts`
- **Purpose**: Define shared table names as typed constants
- **Impact**: Zero - pure addition
- **Validation**: Import in existing API, verify table names resolve

```typescript
export const SHARED_TABLES = {
  users: "captify-users",
  sessions: "captify-sessions",
  notifications: "captify-notifications",
  applications: "captify-applications",
} as const;
```

#### Step 2: Standard API Response Types ⏳

- **File**: `src/lib/types/api.ts`
- **Purpose**: Consistent response structure across all APIs
- **Impact**: Zero - pure addition
- **Validation**: Use in one existing API, verify response format

```typescript
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}
```

#### Step 3: Enhanced App Config Schema ⏳

- **Files**: Update existing `src/app/console/config.json`
- **Purpose**: Add database table mappings to app configs
- **Impact**: Minimal - extends existing config
- **Validation**: Load config in AppMenu, verify no breaking changes

```json
{
  "id": "console-app-001",
  "name": "Console",
  "database": {
    "tables": {
      "settings": "console-user-settings",
      "cache": "console-cache-data"
    }
  },
  "menu": [...]
}
```

### Phase 2: API Framework (Steps 4-6)

**Goal**: Create reusable API patterns while maintaining backward compatibility

#### Step 4: App Config Loader Service ⏳

- **File**: `src/lib/services/config.ts`
- **Purpose**: Load and validate app configurations
- **Impact**: Zero - new utility function
- **Validation**: Load console config, verify table names accessible

#### Step 5: Base API Handler ⏳

- **File**: `src/lib/api/handler.ts`
- **Purpose**: Wrap `requireUserSession` with app config loading
- **Impact**: Zero - optional helper function
- **Validation**: Use in one existing API route as drop-in replacement

```typescript
export async function createApiHandler(appId: string) {
  const session = await requireUserSession();
  const appConfig = await loadAppConfig(appId);

  return {
    session,
    appConfig,
    sharedTables: SHARED_TABLES,
  };
}
```

#### Step 6: Migrate One Existing API ⏳

- **Target**: `/api/apps/[appId]/agent-config/route.ts`
- **Purpose**: Prove pattern works with real API
- **Impact**: Low - internal refactor only
- **Validation**: Same response format, verify no regression

### Phase 3: Shared Services (Steps 7-9)

**Goal**: Extract common functionality into reusable services

#### Step 7: Database Service Base ⏳

- **File**: `src/lib/services/database.ts`
- **Purpose**: Common DynamoDB operations and client setup
- **Impact**: Zero - extraction of existing patterns
- **Validation**: Use in agent-config API, verify same behavior

#### Step 8: Notification Service ⏳

- **File**: `src/lib/services/notifications.ts`
- **Purpose**: Cross-app notification system
- **Impact**: Zero - new feature, opt-in usage
- **Validation**: Create test notification, verify storage

#### Step 9: Audit Service ⏳

- **File**: `src/lib/services/audit.ts`
- **Purpose**: Activity logging across all apps
- **Impact**: Zero - new feature, opt-in usage
- **Validation**: Log API access, verify audit trail

### Phase 4: Client Integration (Steps 10-12)

**Goal**: Type-safe client API calls

#### Step 10: Typed API Client Base ⏳

- **File**: `src/lib/api/client.ts`
- **Purpose**: Type-safe API calls with error handling
- **Impact**: Zero - new utility, existing calls unchanged
- **Validation**: Replace one fetch() call, verify same behavior

#### Step 11: App-Specific API Clients ⏳

- **Files**: `src/lib/api/apps/console.ts`, `src/lib/api/apps/agents.ts`
- **Purpose**: Typed methods for each app's APIs
- **Impact**: Zero - additive only
- **Validation**: Use typed client in one component

#### Step 12: Migrate AppMenu to Typed Client ⏳

- **Target**: `src/components/apps/AppMenu.tsx`
- **Purpose**: Replace fetch() with typed API client
- **Impact**: Low - internal change only
- **Validation**: Menu loads same data, verify type safety

### Phase 5: Validation & Documentation (Steps 13-15)

**Goal**: Runtime validation and comprehensive documentation

#### Step 13: Schema Validation Framework ⏳

- **File**: `src/lib/validation/schemas.ts`
- **Purpose**: Runtime request/response validation
- **Impact**: Low - optional validation layer
- **Validation**: Add to one API, verify invalid requests rejected

#### Step 14: API Documentation Generator ⏳

- **File**: `src/lib/docs/generator.ts`
- **Purpose**: Auto-generate API docs from schemas
- **Impact**: Zero - development tool only
- **Validation**: Generate docs for existing APIs

#### Step 15: Migration Guide & Examples ⏳

- **File**: `src/app/api/MIGRATION.md`
- **Purpose**: Document how to migrate existing APIs
- **Impact**: Zero - documentation only
- **Validation**: Follow guide to migrate one API

## Current Status

### ✅ Completed

**Phase 1: Foundation (Steps 1-3)**

- ✅ Step 1: Shared Table Configuration (`src/lib/config/database.ts`)
  - Created typed constants for shared table names
  - Added environment-aware table naming
  - Validation: Table names properly exported and typed
- ✅ Step 2: Standard API Response Types (`src/lib/types/api.ts`)
  - Consistent response structure with ApiResponse<T>
  - Error handling types and HTTP status constants
  - Validation: Helper functions for creating responses
- ✅ Step 3: Enhanced App Config Schema (`src/lib/types/config.ts` + app configs)
  - Added database table mappings to console config
  - TypeScript interfaces for type safety
  - Validation: AppMenu loads enhanced configs without breaking

**Phase 2: API Framework (Steps 4-6)**

- ✅ Step 4: App Config Loader Service (`src/lib/services/config.ts`)
  - Loads and validates app configurations from config.json files
  - Type-safe access to app configs and database table mappings
  - Validation: Console config loads successfully with table mappings
- ✅ Step 5: Base API Handler (`src/lib/api/handler.ts`)
  - Wraps `requireUserSession` with app config loading
  - Provides consistent foundation for all API routes
  - Validation: Handler creates proper context with session and config
- ✅ Step 6: Migrated Agent Config API (`/api/apps/[appId]/agent-config/route.ts`)
  - Refactored existing API to use new handler pattern
  - Maintains same response format with enhanced logging
  - Validation: API compiles and maintains backward compatibility

**MI BOM API Authentication Implementation**

- ✅ Implemented session token authentication pattern in MI APIs
  - Enhanced NextAuth JWT callback to fetch AWS session tokens automatically
  - Added session token priority system (session token > user credentials > static fallback)
  - Updated DynamoDB client factory with three-tier authentication approach
  - Resolved performance issues with excessive cognito-identity API calls
- ✅ Database service patterns for user-scoped access
  - `createSessionTokenDynamoDBClient()` for federated identity with session tokens
  - `createUserDynamoDBClient()` for Cognito Identity Pool user credentials
  - `createStaticDynamoDBClient()` as fallback for service accounts
  - Automatic NODE# prefix handling for consistent database queries
- ✅ Frontend-backend data structure alignment
  - Updated BOM API response to match frontend expectations
  - Consistent use of CSS variables for theme-aware styling
  - Priority actions structure with proper action types
  - Chart data formatting for direct consumption by UI components

## Implementation Lessons Learned

### Authentication Performance

- **Problem**: Multiple cognito-identity API calls on page refresh causing performance issues
- **Solution**: Fetch AWS session tokens once during NextAuth JWT callback, pass via session
- **Pattern**: Store `awsSessionToken` and `awsExpiresAt` in NextAuth session for reuse

### Database Access Patterns

- **Problem**: Need for user-scoped database access while maintaining fallback options
- **Solution**: Three-tier authentication priority with graceful degradation
- **Pattern**: Always try most secure option first, fall back with logging for debugging

### Data Structure Consistency

- **Problem**: Frontend expecting different data structure than API was returning
- **Solution**: Update frontend to work with actual API response instead of forcing API changes
- **Pattern**: APIs should provide data in format optimized for UI consumption (CSS variables, chart-ready data)

### Error Handling

- **Problem**: Need to distinguish between authentication errors and data errors
- **Solution**: Specific error handling for different failure modes with proper HTTP status codes
- **Pattern**: Include `requiresReauth: true` flag for client-side re-authentication triggers

### NodeId Normalization

- **Problem**: Frontend passes node IDs without database prefix, causing "not found" errors
- **Solution**: Automatic prefix addition in database service layer
- **Pattern**: Accept user-friendly IDs in API, normalize to database format internally

### 🔄 In Progress

- Ready to begin Phase 3

### ⏳ Pending

- Phase 3: Shared Services (Steps 7-9)
- Phase 4: Client Integration (Steps 10-12)
- Phase 5: Validation & Documentation (Steps 13-15)

### ❌ Blocked

- None

## Key Benefits Achieved

### Type Safety

- [ ] Compile-time API contract validation
- [ ] Client/server type mismatches caught early
- [ ] Auto-completion for API methods

### Consistency

- [ ] All APIs follow same authentication pattern
- [ ] Standard error handling and responses
- [ ] Shared database access patterns

### Maintainability

- [ ] Single source of truth for schemas
- [ ] App configs co-located with implementations
- [ ] Reusable services across apps

### Scalability

- [ ] Easy to add new apps following patterns
- [ ] Shared infrastructure components
- [ ] Clear separation of concerns

## Testing Strategy

### Per-Step Validation

Each step includes specific validation criteria to ensure no regressions and proper functionality.

### Integration Testing

- All APIs maintain existing response formats
- Session management unchanged
- App configs load correctly
- Database connections work as before

### Type Testing

- TypeScript compilation without errors
- Client/server type compatibility
- Schema validation catches invalid data

## Risk Mitigation

### Backward Compatibility

- All changes are additive until Phase 4
- Existing APIs continue working unchanged
- New patterns are opt-in initially

### Incremental Adoption

- Each step is independently deployable
- Can pause/rollback at any phase
- No big-bang migration required

### Validation at Each Step

- Specific test criteria per step
- Real API testing, not just unit tests
- Verify existing functionality unchanged

---

**Next Action**: Review this plan and approve before beginning Step 1.
