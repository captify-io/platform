# Feature: Database Management

## Overview

Admin tools for managing DynamoDB tables, viewing data, running queries, and performing maintenance tasks. Provides a safe interface for database operations with built-in safeguards.

## Requirements

### Functional Requirements

1. **Table Browser**
   - List all DynamoDB tables (filter by prefix)
   - View table metadata: item count, size, status
   - Show GSI/LSI definitions
   - Display provisioned/on-demand capacity

2. **Table Inspector**
   - View table schema (inferred from ontology)
   - Browse items with pagination
   - Filter items by attributes
   - Sort by partition/sort key

3. **Query Builder**
   - Visual query builder (no code required)
   - Select table from dropdown
   - Choose operation: Scan, Query, GetItem
   - Build key conditions (partition key, sort key)
   - Add filter expressions
   - Preview and execute query
   - Export results to CSV/JSON

4. **Item Editor**
   - View item details (formatted JSON)
   - Edit item attributes (with validation)
   - Delete item (with confirmation)
   - Clone item (copy with new key)

5. **Maintenance Operations**
   - Backup table to S3
   - Restore table from backup
   - Export table data (CSV/JSON)
   - Import data from file
   - Delete old items (with date filter)

6. **Table Metrics**
   - Read/write capacity consumed
   - Throttled requests
   - Item count trends
   - Storage size over time

### Non-Functional Requirements

1. **Safety**: All destructive operations require confirmation
2. **Performance**: Query results limited to 1000 items max
3. **Validation**: Schema validation before item updates
4. **Audit**: All operations logged with admin ID
5. **Access Control**: Only captify-admin can access

## Architecture

```
Admin UI → API → DynamoDB (AWS SDK)
                → Ontology Service (schema validation)
                → S3 (backups, exports)
                → CloudWatch (metrics)
                → Audit Service (operation logs)
```

## Data Model

No new tables required. This feature operates on existing tables.

### Query History (stored in core-audit-log)

```typescript
interface DatabaseOperation {
  id: string;                    // PK
  operation: string;             // "scan" | "query" | "put" | "delete" | "update"
  tableName: string;

  // Operation details
  params?: {
    keyCondition?: string;
    filterExpression?: string;
    limit?: number;
  };

  // Results
  itemsAffected?: number;
  executionTime?: number;        // milliseconds

  // Audit
  executedBy: string;            // Admin user ID
  executedAt: string;
  success: boolean;
  error?: string;
}
```

## API Actions

### listTables()
- **Purpose**: Get all DynamoDB tables
- **Input**: `{ prefix?: string }`
- **Output**:
```typescript
{
  tables: [
    {
      name: string,
      itemCount: number,
      sizeBytes: number,
      status: 'ACTIVE' | 'CREATING' | 'UPDATING' | 'DELETING',
      billingMode: 'PROVISIONED' | 'PAY_PER_REQUEST',
      gsis: string[],
      lsis: string[]
    }
  ]
}
```

### describeTable(tableName: string)
- **Purpose**: Get table details
- **Input**: `{ tableName: "captify-core-user" }`
- **Output**:
```typescript
{
  table: {
    name: string,
    schema: {
      partitionKey: { name: string, type: 'S' | 'N' | 'B' },
      sortKey?: { name: string, type: 'S' | 'N' | 'B' }
    },
    gsis: [
      {
        name: string,
        partitionKey: string,
        sortKey?: string,
        projectionType: 'ALL' | 'KEYS_ONLY' | 'INCLUDE'
      }
    ],
    ontologySchema?: OntologySchema  // From ontology service
  }
}
```

### queryTable(request: QueryRequest)
- **Purpose**: Execute DynamoDB query
- **Input**:
```typescript
{
  tableName: string,
  operation: 'scan' | 'query' | 'getItem',
  indexName?: string,
  keyCondition?: {
    partitionKey: { name: string, value: any },
    sortKey?: { name: string, operator: '=' | '<' | '>' | 'between' | 'begins_with', value: any }
  },
  filterExpression?: {
    attribute: string,
    operator: '=' | '!=' | '<' | '>' | 'contains' | 'exists',
    value?: any
  }[],
  limit?: number,
  nextToken?: string
}
```
- **Output**:
```typescript
{
  items: any[],
  count: number,
  scannedCount: number,
  nextToken?: string,
  executionTime: number
}
```

### getItem(tableName: string, key: any)
- **Purpose**: Get single item by key
- **Input**: `{ tableName: "captify-core-user", key: { id: "user-123" } }`
- **Output**: `{ item: any }`

### putItem(tableName: string, item: any)
- **Purpose**: Create or update item
- **Input**: `{ tableName: string, item: any }`
- **Validation**: Validate against ontology schema
- **Output**: `{ item: any }`
- **Side Effects**: Audit log

### deleteItem(tableName: string, key: any)
- **Purpose**: Delete single item
- **Input**: `{ tableName: string, key: any }`
- **Output**: `{ success: boolean }`
- **Side Effects**: Audit log

### exportTable(tableName: string, format: 'csv' | 'json')
- **Purpose**: Export table data
- **Input**: `{ tableName: string, format: 'csv' | 'json', filterExpression?: string }`
- **Output**: `{ downloadUrl: string, itemCount: number, expiresAt: string }`
- **Side Effects**: Upload to S3, generate signed URL

### backupTable(tableName: string)
- **Purpose**: Create table backup
- **Input**: `{ tableName: string }`
- **Output**: `{ backupArn: string, backupName: string, createdAt: string }`

### getTableMetrics(tableName: string, timeRange: string)
- **Purpose**: Get CloudWatch metrics for table
- **Input**: `{ tableName: string, timeRange: '1h' | '24h' | '7d' }`
- **Output**:
```typescript
{
  metrics: {
    readCapacity: TimeSeries[],
    writeCapacity: TimeSeries[],
    throttledReads: number,
    throttledWrites: number
  }
}
```

## UI/UX

### Table Browser
```
┌─────────────────────────────────────────────────────┐
│ Database Tables                    [Filter: captify]│
├──────────┬────────┬──────────┬─────────┬────────────┤
│ Table    │ Items  │ Size     │ Status  │ Actions    │
├──────────┼────────┼──────────┼─────────┼────────────┤
│core-user │ 247    │ 1.2MB    │ ACTIVE  │ View Query │
│core-app  │ 8      │ 45KB     │ ACTIVE  │ View Query │
│pmbook-.. │ 1,523  │ 8.4MB    │ ACTIVE  │ View Query │
└──────────┴────────┴──────────┴─────────┴────────────┘
```

### Table Inspector
```
┌─────────────────────────────────────────────────────┐
│ Table: captify-core-user              [Export ▼]    │
├─────────────────────────────────────────────────────┤
│ Schema                                              │
│ Partition Key: id (String)                          │
│ GSI: email-index (email)                            │
│ GSI: createdAt-index (createdAt)                    │
├─────────────────────────────────────────────────────┤
│ Items (247)                          [Query Builder]│
│ ┌────┬───────────┬───────────────┬──────────┬─────┐ │
│ │ ✓  │ ID        │ Email         │ Name     │ ... │ │
│ ├────┼───────────┼───────────────┼──────────┼─────┤ │
│ │    │ user-001  │ john@ex.com   │ John Doe │ ... │ │
│ │    │ user-002  │ jane@ex.com   │ Jane Sm. │ ... │ │
│ └────┴───────────┴───────────────┴──────────┴─────┘ │
│                                   [1-20 of 247] > > │
└─────────────────────────────────────────────────────┘
```

### Query Builder
```
┌─────────────────────────────────────────────────────┐
│ Query Builder                                       │
├─────────────────────────────────────────────────────┤
│ Table:  [captify-core-user ▼]                       │
│ Operation: ○ Scan  ● Query  ○ Get Item             │
│                                                     │
│ Index: [email-index ▼] (optional)                   │
│                                                     │
│ Key Condition:                                      │
│   email [=] [john@example.com]                      │
│                                                     │
│ Filter Expression: (optional)                       │
│   [+] Add filter                                    │
│                                                     │
│ Limit: [100]  ☑ Consistent Read                     │
│                                                     │
│ [Preview Query] [Execute]                           │
└─────────────────────────────────────────────────────┘
```

### Item Editor Modal
```
┌─────────────────────────────────────────────────────┐
│ Edit Item - user-001                    [✕]         │
├─────────────────────────────────────────────────────┤
│ {                                                   │
│   "id": "user-001",                                 │
│   "email": "john@example.com",                      │
│   "name": "John Doe",                               │
│   "groups": ["captify-user", "pmbook-user"],        │
│   "createdAt": "2024-01-15T10:30:00Z",              │
│   "updatedAt": "2024-01-20T14:22:00Z"               │
│ }                                                   │
│                                                     │
│ [Validate] [Save] [Clone] [Delete] [Cancel]         │
└─────────────────────────────────────────────────────┘
```

### Export Dialog
```
┌─────────────────────────────────────────────────────┐
│ Export Table Data                       [✕]         │
├─────────────────────────────────────────────────────┤
│ Table: captify-core-user                            │
│ Items: 247                                          │
│                                                     │
│ Format: ○ CSV  ● JSON                               │
│                                                     │
│ Filter: (optional)                                  │
│ [createdAt > 2024-01-01]                            │
│                                                     │
│ ☑ Include metadata (createdAt, updatedAt)           │
│                                                     │
│ [Export to S3] [Download]                           │
└─────────────────────────────────────────────────────┘
```

## AWS Integration

### DynamoDB Table Operations
```typescript
import { DynamoDBClient, ScanCommand, QueryCommand, PutItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

// Scan table
const scanParams = {
  TableName: 'captify-core-user',
  Limit: 100,
  ExclusiveStartKey: lastEvaluatedKey
};
const scanResult = await docClient.send(new ScanCommand(scanParams));

// Query with key condition
const queryParams = {
  TableName: 'captify-core-user',
  IndexName: 'email-index',
  KeyConditionExpression: 'email = :email',
  ExpressionAttributeValues: {
    ':email': 'john@example.com'
  }
};
const queryResult = await docClient.send(new QueryCommand(queryParams));
```

### Schema Validation
```typescript
import { getNode } from '@captify-io/core/services/ontology/node';
import { generateZodSchema } from '@captify-io/core/lib/tool-generator';

// Get ontology schema
const node = await getNode('core-user', credentials);
const zodSchema = generateZodSchema(node.properties.schema);

// Validate item before put
const validation = zodSchema.safeParse(item);
if (!validation.success) {
  throw new Error(`Validation failed: ${validation.error.message}`);
}
```

### Export to S3
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: 'us-east-1' });

// Export data
const exportKey = `exports/${tableName}-${Date.now()}.json`;
await s3.send(new PutObjectCommand({
  Bucket: 'captify-admin-exports',
  Key: exportKey,
  Body: JSON.stringify(items, null, 2),
  ContentType: 'application/json'
}));

// Generate signed URL (expires in 1 hour)
const downloadUrl = await getSignedUrl(s3, new GetObjectCommand({
  Bucket: 'captify-admin-exports',
  Key: exportKey
}), { expiresIn: 3600 });
```

## Security Considerations

- All operations require captify-admin group membership
- Destructive operations (delete, update) require double confirmation
- Sensitive fields (passwords, tokens) redacted in UI
- Query results limited to prevent excessive data exposure
- Export files stored with encryption in S3
- Audit log for all operations
- Rate limiting on queries to prevent abuse

## Testing

### Test Scenarios
1. List tables → Verify all tables shown
2. Describe table → Verify schema correct
3. Scan table → Verify items returned
4. Query with key condition → Verify filtered results
5. Update item → Verify validation, audit log
6. Delete item → Verify confirmation, audit log
7. Export table → Verify S3 upload, signed URL
8. Invalid schema → Verify validation error

## Dependencies

- DynamoDB (AWS SDK)
- Ontology Service (schema validation)
- S3 (exports, backups)
- CloudWatch (metrics)
- Audit Service (operation logs)

## Safety Features

1. **Confirmation Dialogs**: All destructive operations require typing table/item name
2. **Dry Run Mode**: Preview query results before execution
3. **Undo Support**: Keep last 10 operations in history for undo
4. **Rate Limiting**: Max 100 queries per minute per admin
5. **Read-Only Mode**: Toggle to prevent all writes

## Performance Considerations

- **Pagination**: Scan/query limited to 100 items per page
- **Parallel Scans**: For large tables, use parallel scan segments
- **Caching**: Cache table metadata for 5 minutes
- **Lazy Loading**: Only load item details when clicked

---

**Feature ID**: #7
**Priority**: P1
**Story Points**: 5
**Status**: Not Started
