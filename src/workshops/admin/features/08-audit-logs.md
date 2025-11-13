# Feature: Audit Logs

## Overview

Comprehensive audit trail of all admin actions, system events, and user activities. Provides searchable, filterable logs for compliance, security monitoring, and troubleshooting.

## Requirements

### Functional Requirements

1. **View Audit Logs**
   - Display all logged events in chronological order
   - Show: timestamp, actor, action, resource, result, IP address
   - Real-time updates (new logs appear automatically)
   - Pagination with infinite scroll

2. **Search & Filter**
   - Search by: actor (user), action type, resource ID
   - Filter by: date range, event category, success/failure
   - Filter by severity: info, warning, error, critical
   - Quick filters: "My actions", "Failed actions", "Today"

3. **Event Categories**
   - **User Management**: Create, update, delete users
   - **Group Management**: Add/remove users from groups
   - **Application Management**: App config changes, Identity Pool assignments
   - **Access Control**: Permission changes, access grants/denials
   - **Database Operations**: Query, update, delete items
   - **System Events**: Authentication, authorization failures, errors

4. **Event Details**
   - Full event payload (before/after values)
   - Request/response data
   - Stack trace (for errors)
   - Related events (e.g., all events in a session)

5. **Export & Reporting**
   - Export logs to CSV/JSON
   - Generate compliance reports
   - Schedule automated reports (daily/weekly/monthly)
   - Email reports to admins

6. **Retention & Archival**
   - Hot storage: 90 days in DynamoDB
   - Cold storage: 1 year in S3 (Glacier)
   - Archive to S3 after 90 days
   - Restore from archive on demand

### Non-Functional Requirements

1. **Performance**: Log view loads in <1s for 1000 items
2. **Real-time**: New logs appear within 5 seconds
3. **Reliability**: 99.9% log delivery (no lost events)
4. **Compliance**: Immutable logs (cannot be edited/deleted)
5. **Retention**: 90 days hot, 1 year cold, 7 years archive

## Architecture

```
Application Events → Event Bus (EventBridge)
                           ↓
                    Lambda (Log Processor)
                           ↓
                    DynamoDB (core-audit-log)
                           ↓
                    S3 (Archive after 90d)
                           ↓
                    Glacier (Long-term archive)

Admin UI → API → DynamoDB (query logs)
                → S3 (restore from archive)
```

## Data Model

### DynamoDB Table: `core-audit-log`

```typescript
interface AuditLog {
  // Primary Key
  id: string;                    // PK: log-{timestamp}-{random}
  timestamp: string;             // SK: ISO 8601 timestamp

  // Event Info
  eventType: string;             // "user.create", "group.addMember", "app.update"
  category: string;              // "user_mgmt" | "group_mgmt" | "app_mgmt" | "access_control" | "database" | "system"
  severity: 'info' | 'warning' | 'error' | 'critical';

  // Actor
  actorId: string;               // User ID who performed action
  actorEmail: string;            // User email
  actorIP?: string;              // IP address
  actorUserAgent?: string;       // Browser/client info

  // Action
  action: string;                // "create" | "update" | "delete" | "query" | "grant" | "deny"
  resource: string;              // Resource type: "User", "Group", "App", "Table"
  resourceId?: string;           // Specific resource ID

  // Result
  success: boolean;
  errorMessage?: string;
  errorStack?: string;

  // Change Details
  before?: any;                  // State before action
  after?: any;                   // State after action
  changes?: {                    // Specific changed fields
    field: string;
    oldValue: any;
    newValue: any;
  }[];

  // Metadata
  sessionId?: string;            // Session identifier
  requestId?: string;            // Request tracking ID
  metadata?: {                   // Event-specific data
    [key: string]: any;
  };

  // TTL for auto-archival
  ttl: number;                   // Unix timestamp (now + 90 days)
}
```

**Indexes:**
- Primary: `id` (PK), `timestamp` (SK)
- GSI: `actorId-timestamp-index` - Query logs by actor
- GSI: `eventType-timestamp-index` - Query logs by event type
- GSI: `category-timestamp-index` - Query logs by category
- GSI: `resourceId-timestamp-index` - Query logs for specific resource

### S3 Archive Structure

```
s3://captify-audit-logs/
  year=2025/
    month=01/
      day=15/
        audit-logs-2025-01-15.json.gz
```

## API Actions

### getLogs(request: LogRequest)
- **Purpose**: Get audit logs with filtering
- **Input**:
```typescript
{
  startTime?: string,
  endTime?: string,
  actorId?: string,
  eventType?: string,
  category?: string,
  resourceId?: string,
  severity?: 'info' | 'warning' | 'error' | 'critical',
  successOnly?: boolean,
  limit?: number,
  nextToken?: string
}
```
- **Output**:
```typescript
{
  logs: AuditLog[],
  count: number,
  nextToken?: string
}
```

### getLogDetails(logId: string)
- **Purpose**: Get full log entry details
- **Input**: `{ logId: string }`
- **Output**: `{ log: AuditLog, relatedLogs?: AuditLog[] }`

### searchLogs(query: string)
- **Purpose**: Full-text search in logs
- **Input**: `{ query: string, limit?: number }`
- **Output**: `{ logs: AuditLog[], count: number }`

### exportLogs(request: ExportRequest)
- **Purpose**: Export logs to file
- **Input**:
```typescript
{
  startTime: string,
  endTime: string,
  format: 'csv' | 'json',
  filters?: LogRequest
}
```
- **Output**: `{ downloadUrl: string, itemCount: number, expiresAt: string }`

### createAuditLog(event: AuditEvent)
- **Purpose**: Create new audit log entry (called by services)
- **Input**:
```typescript
{
  eventType: string,
  category: string,
  severity: string,
  actorId: string,
  action: string,
  resource: string,
  resourceId?: string,
  before?: any,
  after?: any,
  metadata?: any
}
```
- **Output**: `{ log: AuditLog }`

### getLogStats(timeRange: string)
- **Purpose**: Get log statistics
- **Input**: `{ timeRange: '24h' | '7d' | '30d' }`
- **Output**:
```typescript
{
  totalLogs: number,
  byCategory: { [category: string]: number },
  bySeverity: { [severity: string]: number },
  topActors: { actorId: string, count: number }[],
  failureRate: number
}
```

## UI/UX

### Audit Log View
```
┌─────────────────────────────────────────────────────────────────┐
│ Audit Logs                           [Search: _________] [📊]   │
├─────────────────────────────────────────────────────────────────┤
│ Filters: [Last 24h ▼] [All Categories ▼] [All Users ▼]         │
│ Quick: [My Actions] [Failed Only] [Critical Only] [Clear]       │
├──────────┬────────┬────────┬──────────┬──────────┬────────┬─────┤
│ Time     │ Actor  │ Action │ Resource │ Result   │ Severity│ ... │
├──────────┼────────┼────────┼──────────┼──────────┼────────┼─────┤
│ 14:23:45 │ admin1 │ UPDATE │ User-123 │ ✅ Success│ info   │ 👁  │
│ 14:22:10 │ admin2 │ DELETE │ Group-5  │ ✅ Success│ warning│ 👁  │
│ 14:20:33 │ admin1 │ QUERY  │ Table-X  │ ❌ Failed │ error  │ 👁  │
│ 14:18:22 │ admin3 │ CREATE │ App-New  │ ✅ Success│ info   │ 👁  │
└──────────┴────────┴────────┴──────────┴──────────┴────────┴─────┘
│                                              [Load More ▼]       │
└─────────────────────────────────────────────────────────────────┘
```

### Log Details Modal
```
┌─────────────────────────────────────────────────────────────────┐
│ Audit Log Details                                    [✕]        │
├─────────────────────────────────────────────────────────────────┤
│ Event: user.update                                              │
│ Time: 2025-01-15 14:23:45 UTC                                   │
│ Actor: admin1@example.com (192.168.1.100)                       │
│ Result: ✅ Success                                               │
├─────────────────────────────────────────────────────────────────┤
│ Changes:                                                        │
│   ┌─────────────┬──────────────────┬──────────────────┐        │
│   │ Field       │ Old Value        │ New Value        │        │
│   ├─────────────┼──────────────────┼──────────────────┤        │
│   │ name        │ "John Doe"       │ "John Smith"     │        │
│   │ email       │ "john@old.com"   │ "john@new.com"   │        │
│   │ groups      │ ["user"]         │ ["user","admin"] │        │
│   └─────────────┴──────────────────┴──────────────────┘        │
├─────────────────────────────────────────────────────────────────┤
│ Request ID: req-abc123-def456                                   │
│ Session ID: sess-xyz789                                         │
│                                                                 │
│ [View Related Logs] [Export] [Close]                            │
└─────────────────────────────────────────────────────────────────┘
```

### Statistics Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│ Audit Log Statistics                        [Last 7 days ▼]    │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│ │ Total Logs   │ │ Success Rate │ │ Top Actor    │            │
│ │ 1,247        │ │ 98.2%        │ │ admin1 (452) │            │
│ └──────────────┘ └──────────────┘ └──────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│ By Category:                                                    │
│ User Management:     342 ████████████████░░░░                  │
│ Group Management:    178 ████████░░░░░░░░░░░░                  │
│ App Management:       89 ████░░░░░░░░░░░░░░░░                  │
│ Database Ops:        512 ████████████████████░░                  │
│ Access Control:      126 ██████░░░░░░░░░░░░░░                  │
├─────────────────────────────────────────────────────────────────┤
│ By Severity:                                                    │
│ 🔵 Info: 1,023  🟡 Warning: 198  🔴 Error: 26  ⚫ Critical: 0   │
└─────────────────────────────────────────────────────────────────┘
```

### Export Dialog
```
┌─────────────────────────────────────────────────────────────────┐
│ Export Audit Logs                                    [✕]        │
├─────────────────────────────────────────────────────────────────┤
│ Date Range:                                                     │
│   From: [2025-01-01] To: [2025-01-31]                           │
│                                                                 │
│ Format: ○ CSV  ● JSON  ○ PDF Report                             │
│                                                                 │
│ Include:                                                        │
│   ☑ Event details                                               │
│   ☑ Actor information                                           │
│   ☑ Change history (before/after)                               │
│   ☑ Error messages                                              │
│   ☐ Stack traces                                                │
│                                                                 │
│ Filters: (current filters applied)                              │
│                                                                 │
│ Estimated size: ~2.4MB (1,247 logs)                             │
│                                                                 │
│ [Generate Export] [Cancel]                                      │
└─────────────────────────────────────────────────────────────────┘
```

## AWS Integration

### EventBridge for Event Collection
```typescript
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const eventBridge = new EventBridgeClient({ region: 'us-east-1' });

async function logEvent(event: AuditEvent) {
  await eventBridge.send(new PutEventsCommand({
    Entries: [{
      Source: 'captify.admin',
      DetailType: event.eventType,
      Detail: JSON.stringify(event),
      EventBusName: 'captify-audit-bus'
    }]
  }));
}
```

### Lambda Log Processor
```typescript
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

export async function handler(event: EventBridgeEvent) {
  const auditLog: AuditLog = {
    id: `log-${Date.now()}-${randomUUID()}`,
    timestamp: new Date().toISOString(),
    ...event.detail,
    ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days
  };

  const dynamodb = new DynamoDBClient({ region: 'us-east-1' });
  await dynamodb.send(new PutItemCommand({
    TableName: 'captify-core-audit-log',
    Item: marshall(auditLog)
  }));
}
```

### DynamoDB Streams for S3 Archival
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { gzipSync } from 'zlib';

export async function archiveHandler(event: DynamoDBStreamEvent) {
  const expiredLogs = event.Records
    .filter(r => r.eventName === 'REMOVE') // TTL deletion
    .map(r => unmarshall(r.dynamodb.OldImage));

  if (expiredLogs.length === 0) return;

  const date = new Date();
  const key = `year=${date.getFullYear()}/month=${date.getMonth()+1}/day=${date.getDate()}/audit-logs-${date.toISOString().split('T')[0]}.json.gz`;

  const s3 = new S3Client({ region: 'us-east-1' });
  await s3.send(new PutObjectCommand({
    Bucket: 'captify-audit-logs',
    Key: key,
    Body: gzipSync(JSON.stringify(expiredLogs)),
    ContentType: 'application/json',
    ContentEncoding: 'gzip',
    StorageClass: 'GLACIER'
  }));
}
```

## Integration with Admin Services

### Auto-Logging in Services
```typescript
// Example: core/src/services/admin/user.ts

import { createAuditLog } from '@captify-io/core/services/audit';

export async function updateUser(userId: string, updates: any, session: any) {
  // Get current user state
  const before = await getUser(userId);

  // Perform update
  const after = await dynamodb.update(/* ... */);

  // Log the change
  await createAuditLog({
    eventType: 'user.update',
    category: 'user_mgmt',
    severity: 'info',
    actorId: session.userId,
    action: 'update',
    resource: 'User',
    resourceId: userId,
    before,
    after,
    metadata: { ipAddress: session.ipAddress }
  });

  return after;
}
```

## Security Considerations

- Logs are immutable (no edit/delete operations)
- Only captify-admin can view audit logs
- Sensitive data (passwords, tokens) redacted from logs
- Log access is itself logged (meta-auditing)
- Archive encryption with KMS
- Signed URLs for exports expire in 1 hour

## Compliance

- **SOC 2**: Comprehensive audit trail for all admin actions
- **HIPAA**: Logs include all PHI access events
- **PCI DSS**: Card data access logged with retention
- **GDPR**: User data changes tracked with retention policy

## Testing

### Test Scenarios
1. Create user → Verify audit log created
2. Update user → Verify before/after captured
3. Failed action → Verify error logged
4. Search logs → Verify filtering works
5. Export logs → Verify S3 upload
6. Archive → Verify TTL deletion triggers S3 archive
7. Restore from archive → Verify S3 retrieval

## Dependencies

- EventBridge (event collection)
- Lambda (log processing, archival)
- DynamoDB (hot storage)
- DynamoDB Streams (TTL trigger)
- S3 + Glacier (cold storage, archival)

## Performance Optimizations

1. **Batch Writes**: Buffer logs and write in batches (EventBridge)
2. **Async Logging**: Don't block request for log write
3. **Pagination**: Limit query results to 100 items
4. **Compression**: gzip logs before S3 upload
5. **Partitioning**: Partition S3 by date for faster queries

---

**Feature ID**: #8
**Priority**: P0 (Compliance requirement)
**Story Points**: 5
**Status**: Not Started
