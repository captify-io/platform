# Feature: Visual Pipeline Builder

## Overview

The Visual Pipeline Builder enables users to create complex data products using a drag-and-drop canvas powered by @xyflow/react. Users can visually design ETL pipelines, add transformations, quality checks, and governance controls, then deploy with one click.

**Feature ID**: 02
**Priority**: P0 - Critical (core value proposition)
**Story Points**: 90
**Dependencies**: Phase 1 (Foundation), Feature 01 (Data Catalog)
**Implementation Phase**: Phase 3 (Weeks 10-15)

## Requirements

### Functional Requirements

#### FR-1: Visual Canvas
- Drag-and-drop interface using @xyflow/react
- Three-panel layout: Palette (left), Canvas (center), Config (right)
- Node palette organized by category with color coding
- Canvas supports zoom, pan, fit-to-screen, mini-map
- Keyboard shortcuts (Delete to remove nodes, Ctrl+Z undo)

#### FR-2: Node Types (18+ nodes)
**Source Nodes** (read data):
- S3 Source: bucket, prefix, format, schema
- Aurora Source: connection, SQL query, schema
- DynamoDB Source: table, scan/query, filters
- Glue Source: database, table, partitions
- Databricks Source: workspace, database, table, SQL
- Snowflake Source: warehouse, database, schema, table
- File Upload: CSV, JSON, Parquet, Excel

**Transform Nodes** (manipulate data):
- Filter: SQL WHERE clause or Python expression
- Join: join type, keys, columns to keep
- Aggregate: group by, aggregations (sum, avg, count, min, max)
- Pivot: rows, columns, values, aggregation function
- Sort: columns, direction (asc/desc)
- Deduplicate: columns for uniqueness check
- Rename Columns: old → new mapping
- Cast Types: column type conversions
- Add Column: computed columns (formulas)
- Union: combine multiple datasets

**Quality Nodes** (validate/clean data):
- Validate Schema: check column types match expected
- Check Completeness: ensure no nulls in required columns
- Remove Nulls: drop rows with null values
- Detect Anomalies: statistical outlier detection
- Enforce Uniqueness: ensure unique keys
- Apply Validation Rules: custom SQL/Python rules

**Destination Nodes** (write data):
- S3 Destination: bucket, prefix, format, partitioning
- Aurora Destination: table, write mode (append/overwrite/merge)
- DynamoDB Destination: table, write mode
- Glue Destination: database, table, partitions
- Kendra Destination: index name, document fields
- QuickSight Destination: dataset name, refresh schedule

**Governance Nodes** (security/compliance):
- Classify Data: auto-label classification (U/C/S/TS)
- Mask PII: mask SSN, email, phone, credit card
- Apply Policy: enforce policy rules
- Encrypt Columns: encrypt sensitive columns

#### FR-3: Node Configuration Panel
- Dynamic form based on selected node type
- Field types: text, number, select, multi-select, code editor (SQL/Python), date picker
- Validation: required fields, regex patterns, valid expressions
- Live data preview: show sample data at current node
- Save/Cancel buttons

#### FR-4: Data Preview
- Preview data at any node in pipeline
- Click node → see "Preview" button in config panel
- Shows first 1000 rows in table view
- Column headers with data types
- Pagination (50 rows per page)
- Export preview to CSV
- Highlight transformed columns (green border)

#### FR-5: Pipeline Execution
- **Test Mode**: Run on sample data (1000 rows)
  - Validate all node configurations
  - Check for errors
  - Show execution logs
  - Display results at each node
- **Production Mode**: Run on full dataset
  - Deploy to AWS Glue (Spark) or Lambda
  - Schedule with cron expressions
  - Monitor execution status
  - View CloudWatch logs

#### FR-6: Scheduling
- Visual cron editor (no need to write cron syntax)
- Presets: hourly, daily, weekly, monthly, custom
- Timezone selector
- Enable/disable toggle
- Next run time preview
- Manual trigger option

#### FR-7: Versioning
- Semantic versioning (1.0.0, 1.1.0, 2.0.0)
- Auto-save on every change
- Version history list (last 20 versions)
- Compare versions (diff view)
- Rollback to previous version
- Deploy specific version

#### FR-8: Testing & Validation
- Unit tests for individual transforms
- Integration test for full pipeline
- Test data generator (sample or synthetic)
- Test results with pass/fail status
- Error messages with line numbers
- Suggestions for fixing errors

### Non-Functional Requirements

#### NFR-1: Performance
- Canvas handles 100+ nodes without lag
- Preview data in <3 seconds
- Test execution completes in <1 minute
- Production deployment completes in <2 minutes

#### NFR-2: Reliability
- Auto-save every 30 seconds
- Recover from crashes (restore last saved state)
- Handle Glue job failures gracefully
- Retry failed steps up to 3 times

#### NFR-3: Scalability
- Support pipelines processing 100GB+ datasets
- Parallel execution of independent steps
- Incremental processing (only new data)
- Partition large datasets automatically

#### NFR-4: Usability
- Intuitive drag-and-drop (no training required)
- Helpful error messages
- Undo/redo support
- Copy/paste nodes
- Snap to grid option

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                Pipeline Builder UI                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌─────────────────────┐  ┌──────────────┐  │
│  │ Palette  │  │      Canvas         │  │    Config    │  │
│  │ (Nodes)  │  │   (@xyflow/react)   │  │    Panel     │  │
│  │          │  │                     │  │              │  │
│  │  Sources │  │  [Node] → [Node]    │  │  Properties  │  │
│  │Transform │  │     ↓        ↓      │  │  Validation  │  │
│  │  Quality │  │  [Node] → [Node]    │  │  Preview     │  │
│  │   Dest   │  │                     │  │              │  │
│  └──────────┘  └─────────────────────┘  └──────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                     API Layer                               │
├─────────────────────────────────────────────────────────────┤
│         │                    │                │             │
│  ┌──────▼──────┐  ┌──────────▼────────┐  ┌───▼──────┐     │
│  │ DataProduct │  │    Execution      │  │ Preview  │     │
│  │   Service   │  │     Service       │  │ Service  │     │
│  └──────┬──────┘  └──────────┬────────┘  └───┬──────┘     │
│         │                    │                │             │
├─────────┴────────────────────┴────────────────┴─────────────┤
│                 Execution Layer                             │
├─────────────────────────────────────────────────────────────┤
│         │                    │                │             │
│  ┌──────▼──────┐  ┌──────────▼────────┐  ┌───▼──────┐     │
│  │ AWS Glue    │  │   AWS Lambda      │  │   Step   │     │
│  │  (Spark)    │  │  (Simple ETL)     │  │Functions │     │
│  └─────────────┘  └───────────────────┘  └──────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Pipeline Execution Flow

```
1. User saves pipeline
   ↓
2. Validate configuration (all required fields filled)
   ↓
3. Test mode: Run on sample data
   ↓
4. Production mode: Translate to Glue/Lambda
   ↓
5. Deploy to AWS (create Glue job, Lambda function)
   ↓
6. Create EventBridge rule for scheduling
   ↓
7. Execute pipeline
   ↓
8. Monitor status, log results
   ↓
9. Create lineage records
   ↓
10. Update dataset metadata
```

## Data Model

### DataProduct Entity (Extended)

```typescript
{
  id: string
  name: string
  description: string
  version: string                    // "1.2.0"
  domain: string
  owner: string
  tags: string[]
  classification: string

  // Pipeline definition
  pipeline: {
    pipelineId: string
    version: string
    nodes: Array<{
      id: string                     // "node-xyz123"
      type: string                   // "s3-source", "filter", etc.
      position: { x: number, y: number }
      data: {
        label: string                // Display name
        icon: string                 // Lucide icon name
        color: string                // Node color
        config: {                    // Node-specific config
          [key: string]: any
        }
      }
    }>
    edges: Array<{
      id: string
      source: string                 // Node ID
      target: string                 // Node ID
      type: string                   // "default", "smoothstep"
    }>
  }

  // Execution
  schedule: {
    cron: string                     // "0 0 * * *"
    enabled: boolean
    timezone: string
    nextRunAt: string
  }

  execution: {
    type: "glue" | "lambda" | "step-function"
    resourceArn: string              // Glue job ARN or Lambda ARN
    eventBridgeRuleArn: string
    lastRunAt: string
    lastRunStatus: "success" | "failed" | "running"
    metrics: {
      successRate: number
      avgRunTime: number             // milliseconds
      recordsProcessed: number
      lastError: string
    }
  }

  // Outputs
  outputs: Array<{
    type: "table" | "file" | "api" | "dashboard"
    location: string                 // S3 path, table name, etc.
    format: string                   // "parquet", "csv", "json"
    schema: any
    sizeBytes: number
    recordCount: number
  }>

  // Quality
  qualityScore: number
  qualityChecks: Array<{
    id: string
    type: string
    rule: string
    threshold: number
    enabled: boolean
    lastResult: {
      passed: boolean
      score: number
      message: string
    }
  }>

  // Status
  status: "draft" | "testing" | "production" | "deprecated"
  createdAt: string
  updatedAt: string
  deployedAt: string
}
```

## UI/UX

### Pipeline Builder Mockup

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Contract Spend Analysis v1.2.0                    💾 Save  ▶️ Run  🚀 Deploy│
├──────────┬────────────────────────────────────────────────┬──────────────┤
│          │                                                │              │
│ Sources  │                  Canvas                        │  Config      │
│ ────────│                                                │  ────────   │
│  📊 S3   │   ┌─────────┐                                  │              │
│  🗄️ Aurora│   │S3 Source│                                │  S3 Source   │
│  📋 DDB   │   │contracts│                                │              │
│  🔗 Glue  │   └────┬────┘                                │  Bucket:     │
│          │        │                                     │  my-bucket   │
│Transform │        ↓                                     │              │
│ ────────│   ┌────────┐                                 │  Prefix:     │
│  🔍 Filter│   │ Filter │                                 │  contracts/  │
│  🔗 Join  │   │amount>0│                                │              │
│  📊 Agg   │   └───┬────┘                                │  Format:     │
│  🔄 Pivot │       │                                     │  Parquet ▼   │
│          │       ↓                                     │              │
│ Quality  │   ┌──────────┐                              │  [Preview]   │
│ ────────│   │Aggregate │                              │              │
│  ✅ Valid │   │by vendor │                              │  [Test]      │
│  🧹 Clean │   └────┬─────┘                              │              │
│  🔎 Detect│        │                                     │              │
│          │        ↓                                     │              │
│  Dest    │   ┌─────────┐                                │              │
│ ────────│   │S3 Dest  │                                │              │
│  📊 S3    │   │ output/ │                                │              │
│  🗄️ Aurora│   └─────────┘                                │              │
│  📋 DDB   │                                                │              │
│  📈 QS    │                                                │              │
│          │                                                │              │
└──────────┴────────────────────────────────────────────────┴──────────────┘
```

### Node Configuration Panel Mockup

```
┌──────────────────────────────────────┐
│ Filter Node Configuration            │
├──────────────────────────────────────┤
│                                      │
│ Label: *                             │
│ ┌──────────────────────────────────┐ │
│ │ Filter High Value Contracts      │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Description:                         │
│ ┌──────────────────────────────────┐ │
│ │ Remove contracts with amount < 0 │ │
│ │ or null values                   │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Filter Type:                         │
│ ┌──────────────────────────────────┐ │
│ │ SQL Expression         ▼         │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Expression: *                        │
│ ┌──────────────────────────────────┐ │
│ │ amount > 0                       │ │
│ │ AND amount IS NOT NULL           │ │
│ │ AND contract_status = 'active'   │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ────────────── Preview ────────────  │
│                                      │
│ Records Before: 10,450               │
│ Records After:  9,823 (94%)          │
│                                      │
│ [Preview Data] [Validate]            │
│                                      │
│ [Cancel]              [Save Changes] │
│                                      │
└──────────────────────────────────────┘
```

## API Actions

### savePipeline(dataProductId, pipeline)

**Purpose**: Save pipeline definition

**Input**:
```typescript
{
  dataProductId: string
  pipeline: {
    nodes: Node[]
    edges: Edge[]
  }
  incrementVersion?: boolean     // Default: false (patch update)
}
```

**Output**:
```typescript
{
  success: boolean
  dataProductId: string
  version: string
  validationErrors: string[]
}
```

### executePipeline(dataProductId, mode)

**Purpose**: Run pipeline

**Input**:
```typescript
{
  dataProductId: string
  mode: "test" | "production"
  sampleSize?: number            // For test mode (default: 1000)
}
```

**Output**:
```typescript
{
  success: boolean
  executionId: string
  status: "running" | "completed" | "failed"
  logs: string[]
  results: {
    recordsProcessed: number
    executionTime: number
    outputLocation: string
  }
}
```

### previewNode(dataProductId, nodeId)

**Purpose**: Preview data at specific node

**Input**:
```typescript
{
  dataProductId: string
  nodeId: string
  limit?: number                 // Default: 1000
}
```

**Output**:
```typescript
{
  success: boolean
  data: Array<Record<string, any>>
  schema: {
    columns: Array<{
      name: string
      type: string
    }>
  }
  recordCount: number
}
```

### deployPipeline(dataProductId)

**Purpose**: Deploy pipeline to production

**Input**:
```typescript
{
  dataProductId: string
  schedule?: {
    cron: string
    enabled: boolean
    timezone: string
  }
}
```

**Output**:
```typescript
{
  success: boolean
  deploymentId: string
  resourceArn: string            // Glue job or Lambda ARN
  eventBridgeRuleArn: string
  status: "deployed" | "failed"
  errors: string[]
}
```

## Implementation Notes

### Node Registration (Ontology-Driven)

Store node types in ontology:
```typescript
{
  id: "node-s3-source",
  type: "pipelineNode",
  category: "source",
  domain: "Pipeline",
  name: "S3 Source",
  label: "S3 Source",
  icon: "database",
  color: "#3b82f6",
  properties: {
    schema: {
      type: "object",
      properties: {
        bucket: {
          type: "string",
          description: "S3 bucket name",
          required: true
        },
        prefix: {
          type: "string",
          description: "Prefix/path within bucket"
        },
        format: {
          type: "string",
          enum: ["parquet", "csv", "json", "avro"],
          description: "File format"
        }
      }
    }
  }
}
```

Load nodes dynamically in palette:
```typescript
const nodes = await loadOntologyNodes({
  nodeDomain: "Pipeline",
  nodeCategory: "source"
});
```

### Pipeline Translation to Glue

Convert visual pipeline to PySpark code:
```python
# Auto-generated from DataOps Pipeline
from pyspark.sql import SparkSession
from pyspark.sql.functions import *

spark = SparkSession.builder.appName("contract-spend").getOrCreate()

# S3 Source: contracts
df1 = spark.read.parquet("s3://my-bucket/contracts/")

# Filter: amount > 0
df2 = df1.filter((col("amount") > 0) & (col("amount").isNotNull()))

# Aggregate: by vendor
df3 = df2.groupBy("vendor").agg(
    sum("amount").alias("total_spend"),
    count("*").alias("contract_count")
)

# S3 Destination: output
df3.write.mode("overwrite").parquet("s3://output-bucket/contract-spend/")
```

### Data Preview Service

For fast previews, use sampling:
```typescript
async function previewNode(dataProductId, nodeId) {
  // 1. Get all nodes upstream of nodeId
  const upstreamNodes = getUpstreamNodes(nodeId);

  // 2. Execute pipeline up to nodeId with sample data
  const result = await executePartialPipeline(upstreamNodes, {
    sampleSize: 1000,
    mode: "preview"
  });

  // 3. Return sample data
  return {
    data: result.data,
    schema: result.schema,
    recordCount: result.recordCount
  };
}
```

### Scheduling with EventBridge

Create EventBridge rule for scheduled execution:
```typescript
async function schedulePipeline(dataProductId, schedule) {
  // Create EventBridge rule
  const ruleName = `dataops-${dataProductId}-schedule`;

  await eventBridge.putRule({
    Name: ruleName,
    ScheduleExpression: `cron(${schedule.cron})`,
    State: schedule.enabled ? "ENABLED" : "DISABLED",
    Description: `Schedule for DataOps pipeline ${dataProductId}`
  });

  // Add target (Step Function or Lambda)
  await eventBridge.putTargets({
    Rule: ruleName,
    Targets: [{
      Id: "1",
      Arn: executionArn,
      Input: JSON.stringify({ dataProductId })
    }]
  });
}
```

## Testing

### Unit Tests
- Node configuration validation
- Pipeline validation (detect circular dependencies)
- Translation to Glue code
- Preview data generation

### Integration Tests
- End-to-end pipeline execution
- Scheduled execution
- Deployment to AWS
- Rollback to previous version

### Performance Tests
- Canvas with 100+ nodes
- Preview on 1GB dataset (<3s)
- Full execution on 100GB dataset (<10min)

## Success Metrics

- **Build Time**: Reduce from 2 weeks (code) to <2 hours (visual) - 98% reduction
- **Pipeline Success Rate**: >90% of pipelines execute successfully
- **User Adoption**: 80% of data products built visually (not code)
- **Time to Deploy**: <2 minutes from save to production

## Related Features

- [01-data-catalog.md](./01-data-catalog.md) - Discover datasets to use in pipelines
- [03-quality-engine.md](./03-quality-engine.md) - Quality checks in pipelines
- [04-lineage-graph.md](./04-lineage-graph.md) - Auto-generate lineage from pipelines
