# Feature 2: DataOps & Integration

**Status**: ❌ Not Started
**Priority**: P1 (High)
**Story Points**: 21
**Depends On**: Feature 1 (Ontology Viewer)

## Overview

Build a visual data integration system that allows users to connect data sources (Postgres, Excel, S3, APIs), extract data into datasets, and map them to ontology objects. This enables users to populate ontology objects with real data for searching, viewing, and analytics without writing code.

## Requirements

### Functional Requirements

1. **Data Source Management**
   - Add/edit/delete data sources (Postgres, MySQL, Excel, CSV, S3, REST APIs)
   - Test connection before saving
   - Store credentials securely (encrypted in DynamoDB)
   - Visual source configuration UI

2. **Dataset Extraction**
   - Define extraction queries (SQL, S3 path, API endpoint)
   - Preview data before extraction
   - Schedule recurring extractions (cron expressions)
   - Store raw data in S3 buckets
   - Track extraction history and status

3. **Object Mapping**
   - Visual mapper: dataset columns → ontology properties
   - Auto-suggest mappings based on column names
   - Transform data (trim, format dates, parse JSON)
   - Handle nested objects and arrays
   - Validation against ontology schema

4. **Pipeline Visualization**
   - Visual pipeline builder using ReactFlow
   - Drag-and-drop: Source → Dataset → Object
   - Real-time pipeline status (running, paused, error)
   - Pipeline templates for common patterns

5. **Data Sync**
   - One-time or recurring sync
   - Incremental updates (detect changes)
   - Conflict resolution (upsert vs replace)
   - Error handling and retry logic

### Non-Functional Requirements

1. **Security**: Encrypted credentials, access control per source
2. **Performance**: Handle datasets up to 10M rows, streaming for large files
3. **Reliability**: Transactional writes, automatic retries, error logging

## Architecture

### Data Model

```typescript
interface DataSource {
  id: string;                      // UUID
  name: string;                    // e.g., 'Aircraft Master DB'
  type: 'postgres' | 'mysql' | 'excel' | 'csv' | 's3' | 'api';

  connection: {
    // Postgres/MySQL
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;               // Encrypted

    // S3
    bucket?: string;
    region?: string;
    prefix?: string;

    // API
    endpoint?: string;
    headers?: Record<string, string>;
    authType?: 'none' | 'bearer' | 'apikey';
    token?: string;                  // Encrypted
  };

  status: 'active' | 'inactive' | 'error';
  lastTested?: string;               // ISO timestamp
  app: string;
  createdAt: string;
  updatedAt: string;
}

interface Dataset {
  id: string;                        // UUID
  name: string;                      // e.g., 'Aircraft Inventory'
  sourceId: string;                  // References DataSource

  extraction: {
    type: 'sql' | 's3' | 'api';

    // SQL
    query?: string;

    // S3
    path?: string;                   // S3 key pattern
    format?: 'csv' | 'json' | 'parquet' | 'excel';

    // API
    endpoint?: string;
    method?: 'GET' | 'POST';
    body?: any;
  };

  schedule?: {
    enabled: boolean;
    cron: string;                    // e.g., '0 0 * * *' (daily at midnight)
    timezone: string;
  };

  storage: {
    bucket: string;                  // S3 bucket for raw data
    prefix: string;                  // S3 prefix (folder)
  };

  status: 'draft' | 'active' | 'paused' | 'error';
  lastExtractedAt?: string;
  app: string;
  createdAt: string;
  updatedAt: string;
}

interface ObjectMapping {
  id: string;                        // UUID
  name: string;                      // e.g., 'Aircraft Inventory → Aircraft'
  datasetId: string;                 // References Dataset
  objectType: string;                // Ontology node type (e.g., 'aircraft')

  mappings: {
    [ontologyProperty: string]: {
      sourceColumn: string;          // Column from dataset
      transform?: string;            // JS expression or function name
      defaultValue?: any;
    }
  };

  sync: {
    mode: 'upsert' | 'replace' | 'append';
    keyField: string;                // Property to match on (e.g., 'tailNumber')
    onConflict: 'skip' | 'overwrite' | 'merge';
  };

  schedule?: {
    enabled: boolean;
    cron: string;
    timezone: string;
  };

  status: 'draft' | 'active' | 'paused' | 'error';
  lastSyncedAt?: string;
  recordsProcessed?: number;
  recordsSucceeded?: number;
  recordsFailed?: number;

  app: string;
  createdAt: string;
  updatedAt: string;
}

interface Pipeline {
  id: string;                        // UUID
  name: string;                      // e.g., 'Aircraft Data Pipeline'

  nodes: {
    id: string;
    type: 'source' | 'dataset' | 'mapping';
    data: {
      sourceId?: string;
      datasetId?: string;
      mappingId?: string;
    };
    position: { x: number; y: number };
  }[];

  edges: {
    id: string;
    source: string;                  // Node ID
    target: string;                  // Node ID
  }[];

  status: 'draft' | 'active' | 'paused' | 'error';
  app: string;
  createdAt: string;
  updatedAt: string;
}
```

### Integration with Ontology

```typescript
// core/src/services/dataops/mapper.ts
import { ontology } from '@captify-io/core';

export async function mapDatasetToObject(
  mapping: ObjectMapping,
  datasetRows: any[],
  credentials: AwsCredentials
) {
  // 1. Load ontology node to get schema
  const node = await ontology.node.getById(mapping.objectType, credentials);
  const schema = node.properties.schema;

  // 2. Validate mappings against schema
  validateMappings(mapping.mappings, schema);

  // 3. Transform and map each row
  const mappedObjects = datasetRows.map(row => {
    const obj: Record<string, any> = {};

    for (const [ontologyProp, mapping] of Object.entries(mapping.mappings)) {
      const sourceValue = row[mapping.sourceColumn];

      // Apply transform if defined
      obj[ontologyProp] = mapping.transform
        ? applyTransform(sourceValue, mapping.transform)
        : sourceValue ?? mapping.defaultValue;
    }

    return obj;
  });

  // 4. Validate against schema
  const validated = mappedObjects.map(obj =>
    validateAgainstSchema(obj, schema)
  );

  // 5. Write to DynamoDB
  const table = node.properties.dataSource;
  const results = await batchWrite(table, validated, credentials);

  return results;
}
```

### Pipeline Execution Flow

```
1. Trigger (manual or schedule)
   ↓
2. Load pipeline definition
   ↓
3. For each source node:
   - Connect to data source
   - Test connection
   ↓
4. For each dataset node:
   - Execute extraction query/API call
   - Store raw data in S3
   - Parse and validate data
   ↓
5. For each mapping node:
   - Load ontology schema
   - Map columns to properties
   - Apply transforms
   - Validate against schema
   ↓
6. Write to target tables
   ↓
7. Update pipeline status and metrics
```

## Data Model

**Tables**:
- `captify-core-data-source` - Data source connections
  ```
  id (PK), name, type, connection (encrypted), status, app, createdAt, updatedAt
  GSI: app-index (app), type-index (type)
  ```

- `captify-core-dataset` - Dataset definitions
  ```
  id (PK), name, sourceId, extraction, schedule, storage, status, app, createdAt, updatedAt
  GSI: sourceId-index (sourceId), app-index (app)
  ```

- `captify-core-object-mapping` - Object mappings
  ```
  id (PK), name, datasetId, objectType, mappings, sync, schedule, status, app, createdAt, updatedAt
  GSI: datasetId-index (datasetId), objectType-index (objectType)
  ```

- `captify-core-pipeline` - Pipeline definitions
  ```
  id (PK), name, nodes, edges, status, app, createdAt, updatedAt
  GSI: app-index (app), status-index (status)
  ```

- `captify-core-pipeline-execution` (NEW) - Execution history
  ```
  id (PK), pipelineId, status, startedAt, completedAt, recordsProcessed, recordsSucceeded, recordsFailed, error
  GSI: pipelineId-createdAt-index (pipelineId, startedAt)
  ```

**S3 Buckets**:
- `captify-datasets` - Raw extracted data
  ```
  Structure: {app}/{datasetId}/{timestamp}.{format}
  Example: pmbook/dataset-123/2025-11-02T10:00:00Z.csv
  ```

## API Actions

### Create Data Source

```typescript
const source = await dataops.source.create({
  name: 'Aircraft Master DB',
  type: 'postgres',
  connection: {
    host: 'db.example.com',
    port: 5432,
    database: 'aircraft',
    username: 'reader',
    password: 'secret'  // Will be encrypted
  }
}, credentials);

// Test connection
const isValid = await dataops.source.test(source.id, credentials);
```

### Create Dataset

```typescript
const dataset = await dataops.dataset.create({
  name: 'Aircraft Inventory',
  sourceId: source.id,
  extraction: {
    type: 'sql',
    query: 'SELECT * FROM aircraft WHERE active = true'
  },
  schedule: {
    enabled: true,
    cron: '0 2 * * *',  // 2 AM daily
    timezone: 'America/New_York'
  },
  storage: {
    bucket: 'captify-datasets',
    prefix: 'pmbook/aircraft'
  }
}, credentials);

// Extract data
const result = await dataops.dataset.extract(dataset.id, credentials);
// Returns: { success: true, records: 1234, s3Path: '...' }
```

### Create Object Mapping

```typescript
const mapping = await dataops.mapping.create({
  name: 'Aircraft Inventory → Aircraft',
  datasetId: dataset.id,
  objectType: 'aircraft',
  mappings: {
    tailNumber: { sourceColumn: 'tail_number' },
    manufacturer: { sourceColumn: 'mfr' },
    model: { sourceColumn: 'model_name' },
    yearBuilt: {
      sourceColumn: 'build_year',
      transform: 'parseInt'
    },
    status: {
      sourceColumn: 'active',
      transform: 'value ? "active" : "inactive"'
    },
    lastInspection: {
      sourceColumn: 'last_inspection_date',
      transform: 'new Date(value).toISOString()'
    }
  },
  sync: {
    mode: 'upsert',
    keyField: 'tailNumber',
    onConflict: 'overwrite'
  }
}, credentials);

// Sync data to objects
const syncResult = await dataops.mapping.sync(mapping.id, credentials);
// Returns: { success: true, processed: 1234, succeeded: 1230, failed: 4 }
```

### Create Pipeline

```typescript
const pipeline = await dataops.pipeline.create({
  name: 'Aircraft Data Pipeline',
  nodes: [
    { id: 'src-1', type: 'source', data: { sourceId: source.id }, position: { x: 0, y: 100 } },
    { id: 'ds-1', type: 'dataset', data: { datasetId: dataset.id }, position: { x: 300, y: 100 } },
    { id: 'map-1', type: 'mapping', data: { mappingId: mapping.id }, position: { x: 600, y: 100 } }
  ],
  edges: [
    { id: 'e1', source: 'src-1', target: 'ds-1' },
    { id: 'e2', source: 'ds-1', target: 'map-1' }
  ]
}, credentials);

// Execute pipeline
const execution = await dataops.pipeline.execute(pipeline.id, credentials);
```

## UI/UX

### DataOps Tab in Ontology Viewer

```
┌────────────────────────────────────────────────────────────────┐
│ Ontology                                              [+ New]  │
├────────────────┬───────────────────────────────────────────────┤
│ Objects        │ DataOps                                       │
│ Links          │                                               │
│ Actions        │ Pipelines (3)                    [+ Create]  │
│ > DataOps      │                                               │
│   Pipelines    │ ┌─────────────────────────────────────────┐ │
│   Sources      │ │ Aircraft Data Pipeline          [▶] [✏️] │ │
│   Datasets     │ │ Status: Active  Last run: 2h ago        │ │
│   Mappings     │ │                                          │ │
│ Datasets       │ │ [Source] → [Dataset] → [Aircraft]       │ │
│ Views          │ │ Records: 1,234 | Succeeded: 1,230       │ │
│                │ └─────────────────────────────────────────┘ │
│                │                                               │
│                │ ┌─────────────────────────────────────────┐ │
│                │ │ Contract Data Pipeline      [⏸] [✏️]    │ │
│                │ │ Status: Paused                           │ │
│                │ └─────────────────────────────────────────┘ │
└────────────────┴───────────────────────────────────────────────┘
```

### Pipeline Builder

```
┌──────────────────────────────────────────────────────────────┐
│ Create Pipeline: Aircraft Data                    [✕ Close] │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│ ┌─ Pipeline Canvas ─────────────────────────────────────┐   │
│ │                                                         │   │
│ │  ┌──────────┐      ┌──────────┐      ┌──────────┐    │   │
│ │  │ Aircraft │      │ Aircraft │      │ Aircraft │    │   │
│ │  │ Master   │─────→│ Inventory│─────→│ Object   │    │   │
│ │  │ DB (PG)  │      │ Dataset  │      │ Mapping  │    │   │
│ │  └──────────┘      └──────────┘      └──────────┘    │   │
│ │                                                         │   │
│ │  [Data Sources]  [Datasets]  [Mappings]  [Objects]   │   │
│ │                                                         │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                │
│ ┌─ Selected: Aircraft Inventory Dataset ──────────────┐      │
│ │                                                       │      │
│ │ Source: Aircraft Master DB                           │      │
│ │ Query:  SELECT * FROM aircraft WHERE active = true   │      │
│ │                                             [Test ▶] │      │
│ │ Schedule: Daily at 2:00 AM EST                       │      │
│ │ Storage: s3://captify-datasets/pmbook/aircraft       │      │
│ │                                                       │      │
│ │                                 [Cancel] [Save Node] │      │
│ └──────────────────────────────────────────────────────┘      │
│                                                                │
│                                   [Cancel] [Create Pipeline]  │
└──────────────────────────────────────────────────────────────┘
```

### Mapping Editor

```
┌──────────────────────────────────────────────────────────────┐
│ Edit Mapping: Aircraft Inventory → Aircraft       [✕ Close] │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│ Dataset Preview (5 rows):                        [Refresh ↻] │
│ ┌─────────────┬──────┬────────────┬──────────┬────────────┐ │
│ │ tail_number │ mfr  │ model_name │ build_yr │ active     │ │
│ ├─────────────┼──────┼────────────┼──────────┼────────────┤ │
│ │ N12345      │ Boeing│ 737-800   │ 2015     │ true       │ │
│ │ N67890      │ Airbus│ A320-200  │ 2018     │ true       │ │
│ └─────────────┴──────┴────────────┴──────────┴────────────┘ │
│                                                                │
│ ┌─ Property Mappings ───────────────────────────────────┐    │
│ │                                          [+ Add Row]   │    │
│ │                                                         │    │
│ │ Ontology Property │ Source Column │ Transform │ [✕]   │    │
│ │ ─────────────────┼───────────────┼──────────┼──────   │    │
│ │ tailNumber       │ tail_number ▼ │          │        │    │
│ │ manufacturer     │ mfr ▼         │          │        │    │
│ │ model            │ model_name ▼  │          │        │    │
│ │ yearBuilt        │ build_yr ▼    │ parseInt │        │    │
│ │ status           │ active ▼      │ Custom ▼ │        │    │
│ │   → Custom: value ? "active" : "inactive"           │    │
│ │                                                         │    │
│ └──────────────────────────────────────────────────────────┘    │
│                                                                │
│ ┌─ Sync Settings ──────────────────────────────────────┐      │
│ │ Mode:        [Upsert ▼]                              │      │
│ │ Key Field:   [tailNumber ▼]                          │      │
│ │ On Conflict: [Overwrite ▼]                           │      │
│ │ Schedule:    [✓] Daily at 3:00 AM EST                │      │
│ └──────────────────────────────────────────────────────┘      │
│                                                                │
│                                     [Cancel] [Save Mapping]   │
└──────────────────────────────────────────────────────────────┘
```

## User Stories

### US-1: Connect Data Source

**As a** data engineer
**I want to** connect to external data sources
**So that** I can extract data into ontology objects

**Acceptance Criteria**:
- ✅ Can add Postgres, MySQL, S3, Excel, CSV, API sources
- ✅ Test connection before saving
- ✅ Credentials encrypted at rest
- ✅ Connection status indicator
- ✅ Edit/delete sources

### US-2: Create Dataset

**As a** data engineer
**I want to** define datasets extracted from sources
**So that** I can transform and load data into objects

**Acceptance Criteria**:
- ✅ Define SQL query or S3 path
- ✅ Preview data before saving
- ✅ Schedule recurring extractions
- ✅ Store raw data in S3
- ✅ Track extraction history

### US-3: Map Dataset to Object

**As a** data architect
**I want to** map dataset columns to ontology properties
**So that** data populates the correct fields

**Acceptance Criteria**:
- ✅ Visual column → property mapper
- ✅ Auto-suggest mappings
- ✅ Apply transforms (date parsing, type conversion)
- ✅ Validate against ontology schema
- ✅ Handle nested objects

### US-4: Build Visual Pipeline

**As a** business analyst
**I want to** build data pipelines visually
**So that** I don't need to write code

**Acceptance Criteria**:
- ✅ Drag-and-drop pipeline builder
- ✅ Connect source → dataset → mapping → object
- ✅ Real-time pipeline status
- ✅ Execute pipeline manually
- ✅ Schedule pipeline execution

## Implementation Notes

### Week 1-2: Core Services

```typescript
// core/src/services/dataops/source.ts
export async function create(source: Partial<DataSource>, credentials: AwsCredentials) {
  // Encrypt credentials
  const encrypted = await encryptCredentials(source.connection);

  return await dynamodb.execute({
    operation: 'put',
    table: 'core-data-source',
    data: {
      id: crypto.randomUUID(),
      ...source,
      connection: encrypted,
      status: 'active',
      createdAt: new Date().toISOString()
    }
  }, credentials);
}

export async function test(sourceId: string, credentials: AwsCredentials) {
  const source = await getById(sourceId, credentials);
  const decrypted = await decryptCredentials(source.connection);

  switch (source.type) {
    case 'postgres':
      return await testPostgresConnection(decrypted);
    case 's3':
      return await testS3Connection(decrypted);
    // ...
  }
}
```

### Week 3-4: Pipeline Execution

```typescript
// core/src/services/dataops/pipeline.ts
export async function execute(pipelineId: string, credentials: AwsCredentials) {
  const pipeline = await getById(pipelineId, credentials);
  const execution = await createExecution(pipelineId);

  try {
    // Execute in topological order
    const sorted = topologicalSort(pipeline.nodes, pipeline.edges);

    for (const node of sorted) {
      if (node.type === 'dataset') {
        await dataset.extract(node.data.datasetId, credentials);
      } else if (node.type === 'mapping') {
        await mapping.sync(node.data.mappingId, credentials);
      }
    }

    await updateExecution(execution.id, { status: 'completed' });
  } catch (error) {
    await updateExecution(execution.id, { status: 'failed', error });
  }
}
```

## Testing

```typescript
describe('DataOps Integration', () => {
  it('creates source and tests connection', async () => {
    const source = await dataops.source.create({
      name: 'Test DB',
      type: 'postgres',
      connection: { host: 'localhost', port: 5432, database: 'test' }
    }, credentials);

    expect(source.id).toBeDefined();

    const isValid = await dataops.source.test(source.id, credentials);
    expect(isValid).toBe(true);
  });

  it('maps dataset to object', async () => {
    const mapping = await dataops.mapping.create({
      datasetId: 'dataset-123',
      objectType: 'aircraft',
      mappings: {
        tailNumber: { sourceColumn: 'tail_number' }
      }
    }, credentials);

    const result = await dataops.mapping.sync(mapping.id, credentials);
    expect(result.succeeded).toBeGreaterThan(0);
  });
});
```

## Dependencies

- Feature 1: Ontology Viewer (for UI integration)
- `core/src/services/ontology/node.ts` - Schema validation
- `core/src/services/aws/s3.ts` - Raw data storage
- AWS KMS - Credential encryption
- ReactFlow - Pipeline visualization
- PostgreSQL driver (`pg`)
- Excel parser (`xlsx`)

## Success Metrics

- ✅ 5+ data sources connected
- ✅ 10+ datasets defined
- ✅ 100K+ records synced to objects
- ✅ 90%+ sync success rate
- ✅ <5min average pipeline execution time

## Related Features

- Feature 1: Ontology Viewer (provides UI foundation)
- Feature 3: Advanced Query (uses populated data)
