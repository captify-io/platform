# Feature 42: Admin Panel

**Persona:** System (Admin Users)
**Priority:** High
**Effort:** Medium
**Status:** Sprint 3

## Overview
System administration panel for managing users, spaces, permissions, integrations, and monitoring system health.

## Requirements
### Functional: User management (create/edit/deactivate), Role and permission management, Space administration, System health monitoring, Audit logs, Integration configuration, License management, Data export/import
### Non-Functional: Admin-only access, Audit trail for all actions, Real-time monitoring, Bulk operations support

## Ontology
### New Ontology Nodes
```typescript
// OntologyNode for AuditLog
{
  id: "core-audit-log",
  name: "AuditLog",
  type: "auditLog",
  category: "entity",
  domain: "System",
  icon: "History",
  color: "#6b7280",
  active: "true",
  properties: {
    dataSource: "core-audit-log",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        userId: { type: "string", required: true },
        action: { type: "string", required: true },
        entityType: { type: "string" },
        entityId: { type: "string" },
        changes: { type: "object", description: "Before/after values" },
        ipAddress: { type: "string" },
        userAgent: { type: "string" },
        timestamp: { type: "string", required: true }
      },
      required: ["userId", "action", "timestamp"]
    },
    indexes: {
      "userId-timestamp-index": { hashKey: "userId", rangeKey: "timestamp", type: "GSI" },
      "entityType-timestamp-index": { hashKey: "entityType", rangeKey: "timestamp", type: "GSI" },
      "action-timestamp-index": { hashKey: "action", rangeKey: "timestamp", type: "GSI" }
    }
  }
}

// OntologyNode for SystemHealth
{
  id: "core-system-health",
  name: "SystemHealth",
  type: "systemHealth",
  category: "entity",
  domain: "System",
  icon: "Activity",
  color: "#10b981",
  active: "true",
  properties: {
    dataSource: "core-system-health",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        timestamp: { type: "string", required: true },
        metrics: {
          type: "object",
          properties: {
            activeUsers: { type: "number" },
            requestsPerMinute: { type: "number" },
            avgResponseTime: { type: "number" },
            errorRate: { type: "number" },
            dbConnections: { type: "number" },
            cacheHitRate: { type: "number" }
          }
        },
        services: {
          type: "object",
          properties: {
            dynamodb: { type: "string", enum: ["healthy", "degraded", "down"] },
            s3: { type: "string", enum: ["healthy", "degraded", "down"] },
            bedrock: { type: "string", enum: ["healthy", "degraded", "down"] },
            kendra: { type: "string", enum: ["healthy", "degraded", "down"] }
          }
        }
      },
      required: ["timestamp"]
    },
    indexes: {
      "timestamp-index": { hashKey: "timestamp", type: "GSI" }
    }
  }
}
```

## Components
```typescript
// /opt/captify-apps/core/src/components/spaces/features/admin/admin-panel.tsx (REUSABLE)
export function AdminPanel()

// /opt/captify-apps/core/src/components/spaces/features/admin/user-management.tsx (REUSABLE)
export function UserManagement()

// /opt/captify-apps/core/src/components/spaces/features/admin/space-admin.tsx (REUSABLE)
export function SpaceAdmin()

// /opt/captify-apps/core/src/components/spaces/features/admin/system-health.tsx (REUSABLE)
export function SystemHealth()

// /opt/captify-apps/core/src/components/spaces/features/admin/audit-logs.tsx (REUSABLE)
export function AuditLogs()

// /opt/captify-apps/core/src/components/spaces/features/admin/integration-config.tsx (REUSABLE)
export function IntegrationConfig()
```

## Actions
### 1. Get System Health
```typescript
interface GetSystemHealthRequest {
  period?: 'hour' | 'day' | 'week';
}

interface SystemHealthResponse {
  current: SystemHealth;
  history: SystemHealth[];
  alerts: Array<{
    severity: 'warning' | 'critical';
    message: string;
    timestamp: string;
  }>;
}
```

### 2. Manage User
```typescript
interface ManageUserRequest {
  action: 'create' | 'update' | 'deactivate' | 'reactivate';
  userId?: string;
  userData?: Partial<User>;
  role?: string;
  permissions?: string[];
}
```

### 3. Get Audit Logs
```typescript
interface GetAuditLogsRequest {
  service: 'platform.dynamodb';
  operation: 'query';
  table: 'core-audit-log';
  data: {
    IndexName: 'userId-timestamp-index' | 'action-timestamp-index';
    KeyConditionExpression: string;
    FilterExpression?: string;
    Limit?: number;
  };
}
```

### 4. Log Admin Action
```typescript
async function logAdminAction(
  action: string,
  entityType: string,
  entityId: string,
  changes: any,
  userId: string
): Promise<void> {
  await dynamodb.put({
    table: 'core-audit-log',
    item: {
      id: uuidv4(),
      userId,
      action,
      entityType,
      entityId,
      changes,
      timestamp: new Date().toISOString(),
      ipAddress: request.ip,
      userAgent: request.headers['user-agent']
    }
  });
}
```

## User Stories
### Story 1: Admin Views System Health
**Tasks:** Open admin panel, view health dashboard, check service status, review metrics
**Acceptance:** All services show current status, metrics update in real-time

### Story 2: Admin Manages Users
**Tasks:** View user list, search users, edit roles, deactivate user, audit log updated
**Acceptance:** User changes applied immediately, audit log records action

### Story 3: Admin Reviews Audit Logs
**Tasks:** Filter by action/user/date, view log details, export logs
**Acceptance:** Logs display all admin actions with full details

### Story 4: Admin Configures Integration
**Tasks:** Open integration settings, enter API keys, test connection, save
**Acceptance:** Integration connects successfully, settings persist

## Implementation
```typescript
// System health monitoring
async function collectSystemHealth(): Promise<SystemHealth> {
  const [dynamoStatus, s3Status, bedrockStatus] = await Promise.all([
    checkServiceHealth('dynamodb'),
    checkServiceHealth('s3'),
    checkServiceHealth('bedrock')
  ]);

  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    metrics: {
      activeUsers: await getActiveUserCount(),
      requestsPerMinute: await getRequestRate(),
      avgResponseTime: await getAvgResponseTime(),
      errorRate: await getErrorRate(),
      dbConnections: await getDBConnectionCount(),
      cacheHitRate: await getCacheHitRate()
    },
    services: {
      dynamodb: dynamoStatus,
      s3: s3Status,
      bedrock: bedrockStatus,
      kendra: await checkServiceHealth('kendra')
    }
  };
}

async function checkServiceHealth(service: string): Promise<'healthy' | 'degraded' | 'down'> {
  try {
    const response = await testServiceConnection(service);
    if (response.latency < 100) return 'healthy';
    if (response.latency < 1000) return 'degraded';
    return 'down';
  } catch (error) {
    return 'down';
  }
}
```

## Testing
```typescript
describe('AdminPanel', () => {
  it('displays system health', async () => {
    const { getByText } = render(<AdminPanel />);
    await waitFor(() => {
      expect(getByText('System Health')).toBeInTheDocument();
      expect(getByText('healthy')).toBeInTheDocument();
    });
  });

  it('logs admin actions', async () => {
    await logAdminAction('user.deactivate', 'user', 'user-123', {}, 'admin-1');

    const logs = await dynamodb.query({
      table: 'core-audit-log',
      indexName: 'action-timestamp-index',
      keyCondition: 'action = :action',
      values: { ':action': 'user.deactivate' }
    });

    expect(logs.length).toBeGreaterThan(0);
  });
});
```

## Dependencies
- User authentication and authorization
- All system services (DynamoDB, S3, Bedrock, etc.)

## Status: Sprint 3, Not Started
