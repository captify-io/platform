# Space Service Specification for Developers

## Overview

The Space service manages knowledge spaces for agents with document storage, dataset connections, and Kendra-powered search. **Each space uses a shared Kendra index** with filtering by `spaceId` and `agentId` for isolation.

## Architecture

### Shared Kendra Index
- **Index ID**: `40c21b43-f153-448b-b8b4-0df10a4ad879` (pmbook-genai-index)
- **Edition**: GEN_AI_ENTERPRISE_EDITION
- **Cost**: ~$4.50/hour (shared across all spaces)
- **Isolation**: Documents filtered by S3 URI path and metadata attributes

### Agent ↔ Space ↔ App Linking
All three entities use matching IDs:
```typescript
agent-12345 === space-12345 === app-12345
```

### Storage Structure
```
S3: captify-core-bucket/
└── spaces/
    └── ${spaceId}/
        ├── docs/          # HTML documents from editor
        └── uploads/       # User-uploaded files

DynamoDB Tables:
- core-Space           # Space configuration
- core-Document        # Document metadata (has spaceId field)
- core-Dataset         # Dataset connections
```

---

## Space Service Operations

Access via `apiClient.run({ service: 'space', operation: '...', data: {...} })`

### Space Lifecycle

#### `createSpace`
Creates a new knowledge space linked to an agent.

**Required**: `id`, `name`
**Optional**: `agentId`, `appId`, `description`, `requiredGroups`, `settings`

**Example**:
```typescript
await apiClient.run({
  service: 'space',
  operation: 'createSpace',
  data: {
    id: `space-${timestamp}`,
    agentId: `agent-${timestamp}`,
    appId: `app-${timestamp}`,
    name: 'My Knowledge Base',
    description: 'Knowledge space for my agent',
    requiredGroups: ['captify-users'],
    settings: {
      autoSync: true,
      allowUploads: true,
      allowedFileTypes: ['pdf', 'docx', 'xlsx', 'txt', 'md', 'html'],
    },
  },
});
```

**Returns**:
```typescript
{
  success: true,
  data: {
    id: 'space-12345',
    status: 'active',  // Immediately active (shared index)
    kendraIndexId: '40c21b43-f153-448b-b8b4-0df10a4ad879',
    s3Prefix: 'spaces/space-12345',
    ...
  },
  metadata: {
    message: 'Space created successfully using shared Kendra index.',
    kendraIndexId: '40c21b43-f153-448b-b8b4-0df10a4ad879',
    s3Path: 's3://captify-core-bucket/spaces/space-12345/',
  }
}
```

#### `getSpace`, `listSpaces`, `updateSpace`, `deleteSpace`
Standard CRUD operations. See main documentation.

---

### Document Management

Documents are stored in S3 with **comprehensive metadata** for Kendra filtering.

#### `addDocument`
Uploads a document with rich metadata for advanced filtering.

**Required**: `spaceId`, `document`, `content`

**Document Metadata Fields** (all optional, with defaults):
```typescript
{
  // Basic
  name: string,
  description: string,

  // User & Ownership
  uploadedByName: string,
  uploadedByEmail: string,
  teamId: string,
  ownerId: string,

  // Categorization
  category: 'financial' | 'technical' | 'legal' | 'operational' | 'general',
  domain: 'operations' | 'engineering' | 'hr' | 'supply-chain' | 'general',
  subDomain: string,
  documentType: 'report' | 'manual' | 'specification' | 'email' | 'memo' | 'document',
  contentType: 'pdf' | 'docx' | 'xlsx' | 'txt' | 'html',

  // Classification & Security
  securityLevel: 'public' | 'internal' | 'confidential' | 'secret',
  protection: 'open' | 'internal' | 'restricted',
  allowedGroups: string[],  // Defaults to space.requiredGroups
  requiredClearance: 'none' | 'basic' | 'advanced' | 'top-secret',
  classification: 'unclassified' | 'cui' | 'classified',

  // Versioning
  version: string,          // '1.0', '1.1', etc.
  versionStatus: 'draft' | 'review' | 'approved' | 'archived',
  supersedes: string,       // Document ID this replaces

  // Source & Provenance
  sourceSystem: 'manual-upload' | 'express' | 'blade' | 'sharepoint' | 'email',
  sourceUrl: string,
  importedFrom: string,
  sourceId: string,

  // Business Context (AFSC-specific)
  projectId: string,
  projectName: string,
  weaponSystem: 'F-16' | 'C-130' | 'B-52' | string,
  baseLocation: 'Hill AFB' | 'Tinker AFB' | string,
  dataSource: 'EXPRESS' | 'BLADE' | 'iPID' | 'SOS' | string,
  missionCritical: boolean,
  readinessImpact: 'high' | 'medium' | 'low',
  afscDomain: 'supply' | 'maintenance' | 'engineering',
  squadron: string,
  partNumber: string,
  nsn: string,              // National Stock Number

  // Workflow
  workflowState: 'pending' | 'in-review' | 'approved' | 'rejected',
  approvedBy: string,
  approvedByName: string,
  requiresUpdate: boolean,
  updateFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'none',

  // Tags & Labels
  tags: string[],
  labels: string[],
  keywords: string,
}
```

**Example**:
```typescript
await apiClient.run({
  service: 'space',
  operation: 'addDocument',
  data: {
    spaceId: 'space-12345',
    document: {
      name: 'F-16 Maintenance Report Q1 2025',
      category: 'operational',
      domain: 'maintenance',
      documentType: 'report',
      weaponSystem: 'F-16',
      baseLocation: 'Hill AFB',
      dataSource: 'EXPRESS',
      missionCritical: true,
      readinessImpact: 'high',
      afscDomain: 'maintenance',
      squadron: '448th SCMW',
      tags: ['quarterly', 'maintenance', 'readiness'],
      allowedGroups: ['afsc-ops', 'maintenance-team'],
    },
    content: '<html><body>Report content...</body></html>',
  },
});
```

**Auto-Generated Metadata**:
The service automatically adds:
- `spaceId`, `agentId`, `documentId`, `tenantId`
- `uploadedBy`, `uploadedAt`
- `year`, `quarter`, `month` (from current date)
- `pageCount`, `wordCount`, `sizeBytes` (calculated)
- `isLatest: 'true'`
- `viewCount: '0'`, `downloadCount: '0'`

---

### Dataset Connections

Connect existing DynamoDB or Aurora tables to spaces.

#### `addDataset`
Links a dataset to a space for reference.

**Required**: `spaceId`, `dataset`

**Example**:
```typescript
await apiClient.run({
  service: 'space',
  operation: 'addDataset',
  data: {
    spaceId: 'space-12345',
    dataset: {
      name: 'Job Applicants',
      description: 'PMBook job applicant records',
      type: 'dynamodb',
      schema: 'captify',
      tableName: 'pmbook-JobApplicants',
      queryAccess: true,        // Allow preview queries
      syncToKendra: false,       // Don't index table data
      allowedGroups: ['captify-operations'],
    },
  },
});
```

#### `queryDataset`
Preview dataset contents (max 100 rows).

**Required**: `datasetId`

**Example**:
```typescript
const result = await apiClient.run({
  service: 'space',
  operation: 'queryDataset',
  data: {
    datasetId: 'dataset-12345',
    params: { limit: 50 },
  },
});

// Returns:
{
  success: true,
  data: {
    columns: ['id', 'name', 'email', 'status'],
    rows: [ /* data rows */ ],
    totalCount: 50,
    schema: { id: 'string', name: 'string', email: 'string', ... }
  }
}
```

---

### Search

Search across space documents with advanced filtering using Kendra.

#### `searchSpace`
Query documents with natural language + filters.

**Required**: `spaceId`, `query`
**Optional**: `pageSize`, `pageNumber`, `filterByAgentId`

**Example**:
```typescript
const results = await apiClient.run({
  service: 'space',
  operation: 'searchSpace',
  data: {
    spaceId: 'space-12345',
    query: 'F-16 maintenance procedures',
    pageSize: 20,
    filterByAgentId: true,  // Optional: also filter by agentId
  },
});
```

**How Filtering Works**:
1. **By S3 URI**: Only documents in `s3://captify-core-bucket/spaces/${spaceId}/`
2. **By User Groups**: User must have ≥1 group in document's `allowedGroups`
3. **By Agent ID** (optional): If `filterByAgentId: true`, also filters by `agentId` metadata

**Access Control**:
- User must have at least one group in space's `requiredGroups`
- Only returns documents where user's groups match document's `allowedGroups`

---

## Kendra Metadata Schema

Documents in Kendra have the following searchable metadata (all stored as S3 object metadata with `x-amz-meta-` prefix):

### Core Identifiers
- `spaceId` - Space ID (for isolation)
- `agentId` - Agent ID (for agent-specific filtering)
- `documentId` - Unique document ID
- `tenantId` - Tenant ID

### Temporal
- `uploadedAt` - ISO 8601 timestamp
- `lastModifiedAt` - Last edit timestamp
- `year` - "2025"
- `quarter` - "Q1", "Q2", "Q3", "Q4"
- `month` - "2025-10"

### Categorization
- `category` - "financial", "technical", "legal", "operational"
- `domain` - "operations", "engineering", "hr", "supply-chain"
- `subDomain` - More specific categorization
- `documentType` - "report", "manual", "specification", "email", "memo"
- `contentType` - "pdf", "docx", "xlsx", "txt", "html"

### Security & Classification
- `securityLevel` - "public", "internal", "confidential", "secret"
- `protection` - "open", "internal", "restricted"
- `allowedGroups` - CSV of group names
- `requiredClearance` - "none", "basic", "advanced", "top-secret"
- `classification` - "unclassified", "cui", "classified"

### Versioning
- `version` - "1.0", "1.1", "2.0"
- `versionStatus` - "draft", "review", "approved", "archived"
- `isLatest` - "true" | "false"
- `supersedes` - Document ID this version replaces

### Source & Provenance
- `sourceSystem` - "manual-upload", "express", "blade", "sharepoint", "email"
- `sourceUrl` - Original URL if imported
- `importedFrom` - Source system name
- `sourceId` - Original ID in source system

### Content Characteristics
- `language` - "en", "es", "fr"
- `pageCount` - Number of pages (as string)
- `wordCount` - Number of words (as string)
- `sizeBytes` - File size in bytes (as string)
- `hasImages`, `hasTables`, `hasCharts` - "true" | "false"

### Business Context (AFSC-Specific)
- `projectId`, `projectName` - Project identifiers
- `weaponSystem` - "F-16", "C-130", "B-52", etc.
- `baseLocation` - "Hill AFB", "Tinker AFB", etc.
- `dataSource` - "EXPRESS", "BLADE", "iPID", "SOS"
- `missionCritical` - "true" | "false"
- `readinessImpact` - "high", "medium", "low"
- `afscDomain` - "supply", "maintenance", "engineering"
- `squadron` - Unit name
- `partNumber`, `nsn`, `aircraftTailNumber` - Part/aircraft identifiers

### Workflow & Status
- `workflowState` - "pending", "in-review", "approved", "rejected"
- `approvedBy`, `approvedByName`, `approvedAt` - Approval info
- `requiresUpdate` - "true" | "false"
- `updateFrequency` - "daily", "weekly", "monthly", "quarterly", "none"
- `nextUpdateDue` - ISO date

### Usage Tracking
- `viewCount` - Number of views (as string)
- `downloadCount` - Number of downloads (as string)
- `lastAccessedAt` - Last access timestamp
- `popularityScore` - "0.0" to "1.0"

### Tags & Labels
- `tags` - CSV: "urgent,quarterly-report,financial"
- `labels` - CSV: "approved,final,reviewed"
- `keywords` - CSV: "inventory,forecast,readiness"

### AI/ML Metadata
- `indexedForRAG` - "true" | "false"
- `summaryGenerated` - "true" | "false"
- `summaryText` - First 500 chars of AI summary
- `sentiment` - "positive", "neutral", "negative"
- `extractedEntities` - CSV of detected entities
- `topicsDetected` - CSV of detected topics

---

## Advanced Kendra Filtering Examples

### Filter by Weapon System
```typescript
const results = await apiClient.run({
  service: 'space',
  operation: 'searchSpace',
  data: {
    spaceId: 'space-12345',
    query: 'maintenance procedures',
    // Note: Advanced filters need to be added to searchSpace operation
    // This is the structure agents should use:
    attributeFilter: {
      EqualsTo: {
        Key: '_metadata_weaponSystem',
        Value: { StringValue: 'F-16' }
      }
    }
  },
});
```

### Filter by Date Range
```typescript
// Documents from Q1 2025
attributeFilter: {
  AndAllFilters: [
    { EqualsTo: { Key: '_metadata_year', Value: { StringValue: '2025' } } },
    { EqualsTo: { Key: '_metadata_quarter', Value: { StringValue: 'Q1' } } }
  ]
}
```

### Filter by Mission Critical + Data Source
```typescript
attributeFilter: {
  AndAllFilters: [
    { EqualsTo: { Key: '_metadata_missionCritical', Value: { StringValue: 'true' } } },
    { EqualsTo: { Key: '_metadata_dataSource', Value: { StringValue: 'EXPRESS' } } },
    { EqualsTo: { Key: '_metadata_readinessImpact', Value: { StringValue: 'high' } } }
  ]
}
```

### Filter by Tags
```typescript
attributeFilter: {
  ContainsAny: {
    Key: '_metadata_tags',
    Value: { StringListValue: ['urgent', 'quarterly-report'] }
  }
}
```

---

## Integration with Agent Builder

When creating an agent in the builder, automatically create its space:

```typescript
// In agent creation flow
const timestamp = Date.now();
const agentId = `agent-${timestamp}`;
const appId = `app-${timestamp}`;
const spaceId = `space-${timestamp}`;

// 1. Create Agent
const agent = await createAgent({ id: agentId, ... });

// 2. Create App
const app = await createApp({ id: appId, agentId, ... });

// 3. Create Space (using apiClient)
const space = await apiClient.run({
  service: 'space',
  operation: 'createSpace',
  data: {
    id: spaceId,
    agentId,
    appId,
    name: `${agentName} Knowledge Space`,
    description: `Knowledge base for ${agentName}`,
    requiredGroups: agentConfig.requiredGroups || ['captify-users'],
  },
});

// Space is immediately active and ready to use!
```

---

## Cost & Performance

### Shared Kendra Index Benefits
- ✅ **Cost**: One Enterprise index ($4.50/hr) vs many Developer indices ($1.25/hr each)
- ✅ **Instant**: Spaces are immediately active (no 30-60 min wait)
- ✅ **Performance**: Enterprise edition handles higher query volume
- ✅ **Isolation**: Perfect document isolation via S3 URI + metadata filtering

### Search Performance
- Average query latency: < 500ms
- Concurrent queries supported: Hundreds (Enterprise edition)
- Document indexing: Automatic via S3 sync (every 6 hours)
- Manual sync available via `syncSpace` operation

---

## Best Practices

1. **Rich Metadata**: Always provide as much metadata as possible for better filtering
2. **Allowed Groups**: Use specific groups rather than broad ones for better security
3. **Tags**: Use consistent tagging conventions across documents
4. **Version Control**: Use `version`, `versionStatus`, `isLatest` for proper versioning
5. **Business Context**: Include weapon system, base location, data source for AFSC documents
6. **Access Control**: Set `allowedGroups` at document level to override space defaults
7. **Search Scope**: Use attribute filters to narrow search for better relevance

---

## Troubleshooting

### Search returns no results
- Check user has required groups for space access
- Verify document `allowedGroups` includes user's groups
- Confirm documents are in correct S3 path: `spaces/${spaceId}/docs/`
- Check Kendra sync status with AWS console

### Documents not appearing in search
- Wait for Kendra sync (automatic every 6 hours)
- Trigger manual sync: `apiClient.run({ service: 'space', operation: 'syncSpace', data: { spaceId } })`
- Verify S3 metadata is correct: Check S3 console for object metadata

### Access denied errors
- User must have ≥1 group in space's `requiredGroups`
- User must have ≥1 group in document's `allowedGroups`
- Check session has groups: `session.user.roles`

---

## Related Documentation

- [KENDRA_METADATA_SCHEMA.md](/opt/captify-apps/KENDRA_METADATA_SCHEMA.md) - Full metadata schema with UI examples
- [ABOUT_SPACES_FOR_AGENTS.md](/opt/captify-apps/ABOUT_SPACES_FOR_AGENTS.md) - Agent-facing documentation
- Core library README: `/opt/captify-apps/core/README.md`
