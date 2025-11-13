# Feature: AWS Integration UI/UX

## Overview

Create visual interfaces for AWS services (DynamoDB, Glue, Athena, CloudWatch, QuickSight, Kendra) enabling GenAI agents and users to explore data catalogs, build queries visually, analyze time-series data, and search across datasets without writing code.

### Current State

- AWS service integrations exist in `core/src/services/aws/`
- Tools defined in Phase 1 for programmatic access
- No visual query builders
- No data catalog browser
- No time-series visualization
- No embedded QuickSight dashboards
- Kendra search is backend-only

### Target State

- Visual DynamoDB query builder with filter/condition editor
- Interactive Glue data catalog browser with schema viewer
- Athena SQL query interface with syntax highlighting and autocomplete
- CloudWatch time-series visualization with interactive charts
- Embedded QuickSight dashboards for BI
- Kendra semantic search UI with faceted filtering
- S3 file browser with preview capabilities
- Unified AWS resource explorer

## Requirements

### Functional Requirements

**FR1: DynamoDB Query Builder**
- FR1.1: Visual table selector with schema display
- FR1.2: Drag-drop filter builder (conditions, expressions)
- FR1.3: Index selector (primary key, GSI, LSI)
- FR1.4: Query preview before execution
- FR1.5: Result pagination and export
- FR1.6: Query history and saved queries
- FR1.7: Batch operations UI

**FR2: Glue Data Catalog Browser**
- FR2.1: Hierarchical database/table tree view
- FR2.2: Table schema viewer with column types and descriptions
- FR2.3: Partition browser for partitioned tables
- FR2.4: Crawler status and management
- FR2.5: Data lineage visualization
- FR2.6: Table statistics (row count, size, last modified)
- FR2.7: Quick actions (query in Athena, export schema)

**FR3: Athena SQL Interface**
- FR3.1: SQL editor with syntax highlighting
- FR3.2: Autocomplete for tables, columns, functions
- FR3.3: Query validation before execution
- FR3.4: Query history with re-run capability
- FR3.5: Result grid with sorting and filtering
- FR3.6: Visual query builder (drag-drop)
- FR3.7: Export results (CSV, JSON, Parquet)
- FR3.8: Saved queries and query templates

**FR4: CloudWatch Time-Series Visualization**
- FR4.1: Metric selector with namespace/dimension filters
- FR4.2: Time range picker (last 1h, 24h, 7d, custom)
- FR4.3: Interactive line charts with zoom and pan
- FR4.4: Multiple metrics on same chart
- FR4.5: Anomaly detection overlays
- FR4.6: Alert threshold visualization
- FR4.7: Export chart as PNG/CSV

**FR5: QuickSight Dashboard Embedding**
- FR5.1: Dashboard selector with thumbnails
- FR5.2: Embedded iframe with SSO
- FR5.3: Dashboard filter controls
- FR5.4: Full-screen mode
- FR5.5: Dashboard sharing and permissions
- FR5.6: Export dashboard as PDF

**FR6: Kendra Semantic Search**
- FR6.1: Natural language search input
- FR6.2: Faceted filtering (document type, date, source)
- FR6.3: Result snippets with highlights
- FR6.4: Relevance scores and confidence
- FR6.5: Document preview panel
- FR6.6: Search suggestions and autocomplete
- FR6.7: Saved searches and search history

**FR7: S3 File Browser**
- FR7.1: Bucket/folder tree navigation
- FR7.2: File list with metadata (size, modified, type)
- FR7.3: File preview (text, JSON, CSV, images)
- FR7.4: Upload/download files
- FR7.5: Search files by name/metadata
- FR7.6: Bulk operations (delete, move, copy)

### Non-Functional Requirements

**NFR1: Performance**
- Query execution: Display progress indicator
- Result loading: Paginated (100 rows at a time)
- Schema loading: < 1 second
- Search results: < 2 seconds
- Chart rendering: < 500ms

**NFR2: Usability**
- Query builders require no SQL/AWS knowledge
- Error messages are descriptive and actionable
- Keyboard shortcuts for common actions
- Responsive design for tablet

**NFR3: Security**
- IAM permission checks before operations
- Audit log for all queries and operations
- No exposure of AWS credentials
- Rate limiting per user

**NFR4: Reliability**
- Graceful handling of service unavailability
- Auto-retry with exponential backoff
- Clear error messages for AWS errors
- Offline mode shows cached data

## Architecture

### Component Structure

```
platform/src/app/ontology/aws/
├── dynamodb/
│   ├── page.tsx                     # DynamoDB dashboard
│   ├── components/
│   │   ├── TableSelector.tsx        # Select table with schema
│   │   ├── QueryBuilder.tsx         # Visual query builder
│   │   ├── FilterBuilder.tsx        # Drag-drop filters
│   │   ├── IndexSelector.tsx        # Choose index
│   │   ├── QueryPreview.tsx         # Preview query before run
│   │   ├── ResultGrid.tsx           # Paginated results
│   │   ├── QueryHistory.tsx         # Past queries
│   │   └── BatchOperations.tsx      # Bulk actions
│   └── [table]/
│       └── page.tsx                 # Table detail view
│
├── glue/
│   ├── page.tsx                     # Glue catalog dashboard
│   ├── components/
│   │   ├── DatabaseTree.tsx         # Database/table tree
│   │   ├── SchemaViewer.tsx         # Table schema display
│   │   ├── PartitionBrowser.tsx     # Browse partitions
│   │   ├── CrawlerStatus.tsx        # Crawler management
│   │   ├── LineageGraph.tsx         # Data lineage viz
│   │   └── TableStats.tsx           # Statistics display
│   └── [database]/[table]/
│       └── page.tsx                 # Table detail view
│
├── athena/
│   ├── page.tsx                     # Athena query interface
│   ├── components/
│   │   ├── SQLEditor.tsx            # Code editor with highlighting
│   │   ├── QueryValidation.tsx      # Validate SQL
│   │   ├── Autocomplete.tsx         # SQL autocomplete
│   │   ├── VisualQueryBuilder.tsx   # Drag-drop query builder
│   │   ├── QueryHistory.tsx         # Past queries
│   │   ├── ResultGrid.tsx           # Query results
│   │   ├── ExportDialog.tsx         # Export options
│   │   └── SavedQueries.tsx         # Saved query library
│   └── query/[id]/
│       └── page.tsx                 # Query detail/edit
│
├── cloudwatch/
│   ├── page.tsx                     # CloudWatch dashboard
│   ├── components/
│   │   ├── MetricSelector.tsx       # Choose metrics
│   │   ├── TimeRangePicker.tsx      # Select time range
│   │   ├── TimeSeriesChart.tsx      # Interactive chart
│   │   ├── AnomalyOverlay.tsx       # Anomaly detection
│   │   ├── AlertThresholds.tsx      # Alert visualization
│   │   └── ChartExport.tsx          # Export chart
│   └── metric/[namespace]/[name]/
│       └── page.tsx                 # Metric detail
│
├── quicksight/
│   ├── page.tsx                     # QuickSight dashboard gallery
│   ├── components/
│   │   ├── DashboardGallery.tsx     # Dashboard thumbnails
│   │   ├── EmbeddedDashboard.tsx    # Embedded iframe
│   │   ├── FilterControls.tsx       # Dashboard filters
│   │   └── ShareDialog.tsx          # Sharing options
│   └── dashboard/[id]/
│       └── page.tsx                 # Dashboard view
│
├── kendra/
│   ├── page.tsx                     # Kendra search interface
│   └── components/
│       ├── SearchBar.tsx            # Search input
│       ├── SearchFacets.tsx         # Faceted filters
│       ├── SearchResults.tsx        # Results list
│       ├── ResultCard.tsx           # Individual result
│       ├── DocumentPreview.tsx      # Document preview panel
│       ├── SearchSuggestions.tsx    # Autocomplete
│       └── SearchHistory.tsx        # Past searches
│
├── s3/
│   ├── page.tsx                     # S3 browser
│   └── components/
│       ├── BucketTree.tsx           # Bucket/folder tree
│       ├── FileList.tsx             # File list view
│       ├── FilePreview.tsx          # Preview panel
│       ├── UploadDialog.tsx         # Upload files
│       ├── FileSearch.tsx           # Search files
│       └── BulkOperations.tsx       # Bulk actions
│
└── components/
    ├── AWSResourceExplorer.tsx      # Unified resource browser
    ├── QueryExecutionStatus.tsx     # Progress indicator
    └── AWSErrorDisplay.tsx          # AWS error formatter
```

### Query Builder Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface                            │
│  - Drag-drop components                                      │
│  - Visual editors                                            │
│  - Preview panels                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                Query Builder Engine                          │
│  - Parse visual query to API params                          │
│  - Validate query against schema                             │
│  - Generate preview                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ↓               ↓               ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ DynamoDB     │  │ Athena       │  │ Glue         │
│ Query        │  │ SQL          │  │ Metadata     │
│              │  │              │  │              │
│ - Filters    │  │ - SELECT     │  │ - Schema     │
│ - Conditions │  │ - FROM       │  │ - Partitions │
│ - Index      │  │ - WHERE      │  │ - Stats      │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┴─────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    Tool Execution                            │
│  - Use Phase 1 AI SDK tools                                  │
│  - Handle pagination                                         │
│  - Stream results                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   Result Display                             │
│  - Paginated grid                                            │
│  - Export options                                            │
│  - Visualization                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Model

### Query Definition

```typescript
interface QueryDefinition {
  id: string;
  name: string;
  description?: string;
  service: 'dynamodb' | 'athena' | 'cloudwatch' | 'kendra' | 's3';

  // DynamoDB query
  dynamodb?: {
    tableName: string;
    indexName?: string;
    keyConditions: KeyCondition[];
    filterExpression?: FilterExpression;
    projectionExpression?: string[];
    limit?: number;
    scanIndexForward?: boolean;
  };

  // Athena query
  athena?: {
    database: string;
    query: string;                   // SQL query
    outputLocation: string;          // S3 location for results
  };

  // CloudWatch query
  cloudwatch?: {
    metrics: MetricQuery[];
    startTime: Date;
    endTime: Date;
    period: number;
  };

  // Kendra search
  kendra?: {
    query: string;
    indexId: string;
    facets?: SearchFacet[];
  };

  // S3 query
  s3?: {
    bucket: string;
    prefix?: string;
    filters?: S3Filter[];
  };

  // Metadata
  createdBy: string;
  createdAt: Date;
  lastExecuted?: Date;
  executionCount: number;
}

interface KeyCondition {
  attributeName: string;
  operator: '=' | '<' | '<=' | '>' | '>=' | 'BETWEEN' | 'BEGINS_WITH';
  value: any;
  value2?: any;                      // For BETWEEN
}

interface FilterExpression {
  operator: 'AND' | 'OR';
  conditions: Condition[];
}

interface Condition {
  attributeName: string;
  operator: '=' | '<>' | '<' | '<=' | '>' | '>=' | 'CONTAINS' | 'IN' | 'BETWEEN' | 'attribute_exists';
  value: any;
}

interface MetricQuery {
  namespace: string;
  metricName: string;
  dimensions?: Array<{ name: string; value: string }>;
  stat: 'Average' | 'Sum' | 'Minimum' | 'Maximum' | 'SampleCount';
}

interface SearchFacet {
  field: string;
  values: string[];
}
```

### Data Catalog

```typescript
interface GlueDatabase {
  name: string;
  description?: string;
  locationUri?: string;
  createTime: Date;
  updateTime?: Date;
  tables?: GlueTable[];
}

interface GlueTable {
  name: string;
  databaseName: string;
  description?: string;
  owner?: string;
  createTime: Date;
  updateTime?: Date;

  // Schema
  columns: GlueColumn[];
  partitionKeys?: GlueColumn[];

  // Storage
  storageDescriptor?: {
    location: string;
    inputFormat: string;
    outputFormat: string;
    compressed: boolean;
    numberOfBuckets: number;
  };

  // Statistics
  parameters?: {
    rowCount?: string;
    sizeInBytes?: string;
    lastModified?: string;
  };
}

interface GlueColumn {
  name: string;
  type: string;                      // 'string', 'int', 'double', etc.
  comment?: string;
}
```

### Time-Series Data

```typescript
interface TimeSeriesData {
  metric: {
    namespace: string;
    metricName: string;
    dimensions: Record<string, string>;
  };
  datapoints: Datapoint[];
  statistics: {
    min: number;
    max: number;
    avg: number;
    sum: number;
  };
}

interface Datapoint {
  timestamp: Date;
  value: number;
  unit?: string;
}
```

## API Actions

### DynamoDB Query API

```typescript
// Build and execute DynamoDB query
export async function executeDynamoDBQuery(
  query: QueryDefinition['dynamodb'],
  credentials?: AwsCredentials
): Promise<{
  items: any[];
  count: number;
  scannedCount: number;
  lastEvaluatedKey?: any;
}>;

// Get table schema
export async function getDynamoDBTableSchema(
  tableName: string,
  credentials?: AwsCredentials
): Promise<{
  attributeDefinitions: Array<{ name: string; type: string }>;
  keySchema: Array<{ name: string; keyType: 'HASH' | 'RANGE' }>;
  globalSecondaryIndexes?: Array<{
    indexName: string;
    keySchema: Array<{ name: string; keyType: 'HASH' | 'RANGE' }>;
  }>;
}>;
```

### Athena Query API

```typescript
// Execute Athena query
export async function executeAthenaQuery(
  query: QueryDefinition['athena'],
  credentials?: AwsCredentials
): Promise<{
  queryExecutionId: string;
  state: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
}>;

// Get query results
export async function getAthenaQueryResults(
  queryExecutionId: string,
  credentials?: AwsCredentials
): Promise<{
  columns: Array<{ name: string; type: string }>;
  rows: any[][];
  nextToken?: string;
}>;

// Validate SQL query
export async function validateAthenaQuery(
  query: string,
  database: string,
  credentials?: AwsCredentials
): Promise<{
  valid: boolean;
  errors?: string[];
}>;
```

### CloudWatch Metrics API

```typescript
// Get metric data
export async function getMetricData(
  query: QueryDefinition['cloudwatch'],
  credentials?: AwsCredentials
): Promise<TimeSeriesData[]>;

// List available metrics
export async function listMetrics(
  namespace?: string,
  credentials?: AwsCredentials
): Promise<Array<{
  namespace: string;
  metricName: string;
  dimensions: Record<string, string>;
}>>;
```

### Kendra Search API

```typescript
// Search Kendra index
export async function searchKendra(
  query: QueryDefinition['kendra'],
  credentials?: AwsCredentials
): Promise<{
  results: Array<{
    id: string;
    title: string;
    excerpt: string;
    uri: string;
    score: number;
    highlights: Array<{ field: string; text: string }>;
  }>;
  facets?: Array<{
    field: string;
    values: Array<{ value: string; count: number }>;
  }>;
  totalResults: number;
}>;

// Get search suggestions
export async function getSearchSuggestions(
  query: string,
  indexId: string,
  credentials?: AwsCredentials
): Promise<string[]>;
```

## Implementation Notes

### Phase 4A: DynamoDB and Glue (Week 7)

1. Create DynamoDB query builder with drag-drop filters
2. Implement table schema viewer
3. Build Glue data catalog browser
4. Add partition browser
5. Create lineage visualization

### Phase 4B: Athena and CloudWatch (Week 7)

1. Implement SQL editor with Monaco (VS Code editor)
2. Add SQL syntax highlighting and autocomplete
3. Create query validation
4. Build CloudWatch metric selector
5. Implement time-series chart with recharts

### Phase 4C: QuickSight and Kendra (Week 8)

1. Implement QuickSight dashboard embedding
2. Add dashboard gallery
3. Create Kendra search interface
4. Implement faceted filtering
5. Add document preview panel

### Phase 4D: S3 Browser (Week 8)

1. Build bucket/folder tree navigation
2. Implement file list with metadata
3. Add file preview for common formats
4. Create upload/download functionality

### Testing Strategy

```typescript
// Query builder test
describe('DynamoDB Query Builder', () => {
  it('generates correct query from visual input', () => {
    const builder = new QueryBuilder();

    builder.setTable('core-user');
    builder.addKeyCondition('userId', '=', 'user-123');
    builder.addFilter('status', '=', 'active');
    builder.setLimit(10);

    const query = builder.build();

    expect(query.tableName).toBe('core-user');
    expect(query.keyConditions[0]).toEqual({
      attributeName: 'userId',
      operator: '=',
      value: 'user-123'
    });
  });
});

// Athena SQL validation
describe('Athena SQL Validation', () => {
  it('detects invalid table names', async () => {
    const result = await validateAthenaQuery(
      'SELECT * FROM nonexistent_table',
      'pmbook'
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Table not found');
  });
});
```

### Performance Optimization

1. **Query Results**: Paginate with 100 rows per page, virtual scrolling
2. **Schema Loading**: Cache table schemas for 10 minutes
3. **Chart Rendering**: Downsample time-series data for faster rendering
4. **Search Results**: Progressive loading, show first 20 results immediately

## Success Metrics

### Adoption
- 50+ queries saved in query library
- 100+ daily Athena query executions
- 80% of users use visual query builder vs SQL
- 20+ QuickSight dashboards embedded

### Performance
- Query execution: < 5s for 90% of queries
- Schema loading: < 1s
- Chart rendering: < 500ms
- Search results: < 2s

### Quality
- 95% query success rate
- < 5% users report AWS service errors
- 0 credential exposure incidents
- 100% compliance with IAM policies

## Related Documentation

- [AWS SDK Services](../../../core/src/services/aws/)
- [DynamoDB Service](../../../core/src/services/aws/dynamodb.ts)
- [Glue Service](../../../core/src/services/aws/glue.ts)
- [Athena Service](../../../core/src/services/aws/athena.ts)

---

**Feature Owner**: Platform Team
**Priority**: P0 (Critical)
**Estimated Effort**: 2 weeks
**Dependencies**: AI SDK Tool Standardization (Phase 1)
