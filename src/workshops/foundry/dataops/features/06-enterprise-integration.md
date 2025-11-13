# Feature: Enterprise Integration & AWS Data Services

## Overview

Full integration with AWS data services (Athena, Glue, EMR, QuickSight, Kendra, SageMaker) and enterprise systems (Databricks, Snowflake) to create a comprehensive data mesh. All data flows through the ontology for unified governance and discovery.

**Feature ID**: 06
**Priority**: P0 - Critical (foundational AWS integration)
**Story Points**: 60
**Dependencies**: Phase 1-3 complete
**Implementation Phase**: Phase 5 (Weeks 21-24)

## Requirements

### Functional Requirements

#### FR-1: AWS Glue Integration
- **Glue Data Catalog**: Import/sync Glue databases and tables
- **Glue ETL Jobs**: Execute Glue jobs from pipelines, import existing jobs
- **Glue Crawlers**: Run crawlers to auto-discover schemas
- **Glue Studio**: Export DataOps pipelines to Glue Studio
- **Auto-sync**: Scheduled sync of Glue catalog to DataOps catalog

#### FR-2: AWS Athena Integration
- **SQL Query**: Run SQL queries against S3 data via Athena
- **Query Editor**: Built-in SQL editor with autocomplete
- **Query History**: Track all queries run by users
- **Query Preview**: Show query results in DataOps UI
- **Cost Tracking**: Monitor Athena query costs per user/dataset

#### FR-3: AWS S3 Integration
- **S3 Browser**: Browse buckets and folders in DataOps UI
- **File Upload**: Upload files (CSV, JSON, Parquet) to create datasets
- **File Preview**: Preview file contents without downloading
- **Partitioning**: Automatic S3 partition discovery (year/month/day)
- **Lifecycle**: Set S3 lifecycle policies from DataOps

#### FR-4: AWS QuickSight Integration
- **Dataset Creation**: Auto-create QuickSight datasets from data products
- **Dashboard Embedding**: Embed QuickSight dashboards in DataOps UI
- **SPICE Refresh**: Schedule SPICE refresh from DataOps pipelines
- **Visualizations**: Generate QuickSight analyses from data products

#### FR-5: AWS Kendra Integration
- **Search Indexing**: Index dataset metadata in Kendra
- **Semantic Search**: Natural language search across all data
- **Document Indexing**: Index data dictionaries and documentation
- **Query Suggestions**: AI-powered search suggestions

#### FR-6: AWS SageMaker Integration
- **Data Preparation**: Use SageMaker Data Wrangler for transformations
- **Model Training**: Train ML models on datasets
- **Feature Store**: Store and retrieve features
- **Model Deployment**: Deploy models as pipeline steps

#### FR-7: AWS EMR Integration
- **Spark Jobs**: Execute Spark jobs on EMR clusters
- **Notebook Integration**: Link Jupyter notebooks to data products
- **Cluster Management**: Create/stop EMR clusters from DataOps
- **Cost Optimization**: Auto-terminate idle clusters

#### FR-8: Databricks Connector
- **Workspace Connection**: Connect to Databricks workspaces
- **Table Import**: Import Delta tables to DataOps catalog
- **Notebook Execution**: Run Databricks notebooks from pipelines
- **Unity Catalog Sync**: Sync with Unity Catalog
- **Lineage Bridge**: Track lineage across Databricks → DataOps

#### FR-9: Snowflake Connector
- **Warehouse Connection**: Connect to Snowflake warehouses
- **Table Import**: Import tables to DataOps catalog
- **Query Execution**: Run Snowflake queries from DataOps
- **Data Sharing**: Create Snowflake data shares
- **Lineage Bridge**: Track lineage across Snowflake → DataOps

#### FR-10: Ontology Integration
All external entities registered in ontology:
- **Glue Database** → OntologyNode (type: glue-database)
- **Glue Table** → OntologyNode (type: glue-table)
- **Athena Table** → OntologyNode (type: athena-table)
- **S3 Bucket** → OntologyNode (type: s3-bucket)
- **QuickSight Dataset** → OntologyNode (type: quicksight-dataset)
- **Databricks Table** → OntologyNode (type: databricks-table)
- **Snowflake Table** → OntologyNode (type: snowflake-table)

All integrated through unified DataOps catalog with quality scores, ratings, and lineage.

### Non-Functional Requirements

#### NFR-1: Performance
- Glue catalog sync completes in <5 minutes for 1000 tables
- Athena queries return results in <10 seconds
- S3 file preview loads in <2 seconds
- QuickSight dashboard embeds load in <3 seconds

#### NFR-2: Cost Management
- Track and display AWS service costs per dataset/user
- Alerts when costs exceed thresholds
- Automatic cleanup of unused resources
- SPICE refresh optimization (incremental updates)

#### NFR-3: Security
- IAM-based access control for all AWS services
- Secrets Manager for credentials
- VPC endpoints for private connectivity
- Encryption at rest and in transit

## Architecture

### AWS Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DataOps Platform                                │
├─────────────────────────────────────────────────────────────────────────┤
│                           Ontology Layer                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Nodes   │  │  Edges   │  │ Schemas  │  │ Lineage  │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │             │             │             │                      │
│       └─────────────┴─────────────┴─────────────┘                      │
│                           │                                             │
├───────────────────────────┼──────────────────────────────────────────────┤
│                    Connector Layer                                      │
├───────────────────────────┼──────────────────────────────────────────────┤
│       │         │         │         │         │         │               │
│  ┌────▼───┐ ┌──▼───┐ ┌───▼───┐ ┌───▼───┐ ┌──▼───┐ ┌──▼────┐          │
│  │ Glue   │ │Athena│ │  S3   │ │QuickSt│ │Kendra│ │SageMkr│          │
│  │Connect.│ │Connect│ │Connect│ │Connect│ │Connect│ │Connect│          │
│  └────┬───┘ └──┬───┘ └───┬───┘ └───┬───┘ └──┬───┘ └──┬────┘          │
│       │        │         │         │        │        │                 │
├───────┴────────┴─────────┴─────────┴────────┴────────┴──────────────────┤
│                        AWS Services Layer                               │
├─────────────────────────────────────────────────────────────────────────┤
│       │         │         │         │         │         │               │
│  ┌────▼───┐ ┌──▼───┐ ┌───▼───┐ ┌───▼───┐ ┌──▼───┐ ┌──▼────┐          │
│  │AWS Glue│ │Athena│ │AWS S3 │ │QuickSt│ │Kendra│ │SageMkr│          │
│  │        │ │      │ │       │ │       │ │      │ │       │          │
│  │Catalog │ │Federated│Buckets│ │Dashbrd│ │Index │ │Models │          │
│  │  ETL   │ │Queries│ │Objects│ │Datasets│ │Search│ │Features│         │
│  └────────┘ └──────┘ └───────┘ └───────┘ └──────┘ └───────┘          │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                  External Systems (Data Mesh)                           │
├─────────────────────────────────────────────────────────────────────────┤
│       │                                  │                              │
│  ┌────▼─────────┐                   ┌───▼──────────┐                   │
│  │  Databricks  │                   │  Snowflake   │                   │
│  │              │                   │              │                   │
│  │ Delta Tables │                   │   Tables     │                   │
│  │  Notebooks   │                   │ Warehouses   │                   │
│  └──────────────┘                   └──────────────┘                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Example: S3 → Athena → Glue → DataOps → QuickSight

```
1. S3 Bucket (Raw Data)
   └─> Glue Crawler discovers schema
       └─> Creates Glue Table in Glue Catalog
           └─> DataOps syncs Glue Catalog
               └─> Dataset created in DataOps (ontology node)
                   └─> User builds pipeline using Athena queries
                       └─> Pipeline creates Data Product
                           └─> Auto-creates QuickSight Dataset
                               └─> Dashboard embeds in DataOps UI

All entities tracked in ontology with lineage.
```

## Data Model

### Ontology Node Types for AWS Services

#### Glue Database Node
```typescript
{
  id: "glue-db-{name}",
  type: "glue-database",
  category: "datasource",
  domain: "AWS Glue",
  name: string,
  properties: {
    dataSource: "glue-database",
    arn: string,
    region: string,
    catalogId: string,
    description: string,
    tableCount: number
  }
}
```

#### Glue Table Node
```typescript
{
  id: "glue-table-{database}-{name}",
  type: "glue-table",
  category: "dataset",
  domain: "AWS Glue",
  name: string,
  properties: {
    dataSource: "glue-table",
    database: string,
    tableName: string,
    location: string,              // S3 path
    storageFormat: string,          // Parquet, CSV, JSON
    schema: {
      columns: Array<{
        name: string,
        type: string,
        comment: string
      }>
    },
    partitionKeys: string[],
    rowCount: number,
    sizeBytes: number
  }
}
```

#### S3 Bucket Node
```typescript
{
  id: "s3-bucket-{name}",
  type: "s3-bucket",
  category: "datasource",
  domain: "AWS S3",
  name: string,
  properties: {
    dataSource: "s3-bucket",
    arn: string,
    region: string,
    sizeBytes: number,
    objectCount: number,
    encryption: boolean,
    versioning: boolean,
    publicAccess: boolean
  }
}
```

#### QuickSight Dataset Node
```typescript
{
  id: "quicksight-dataset-{id}",
  type: "quicksight-dataset",
  category: "dataproduct",
  domain: "AWS QuickSight",
  name: string,
  properties: {
    dataSource: "quicksight-dataset",
    datasetId: string,
    arn: string,
    importMode: "SPICE" | "DIRECT",
    spiceCapacity: number,
    lastRefresh: string,
    dashboards: string[]          // Dashboard IDs using this dataset
  }
}
```

## UI/UX

### AWS Services Integration Page Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ AWS Services Integration                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ──────── Connected Services (6/9) ────────                 │
│                                                             │
│  ✅ AWS Glue                                                 │
│     Status: Connected · 1,234 tables synced                 │
│     Last sync: 10 minutes ago                               │
│     [Configure] [Sync Now] [View Catalog]                   │
│                                                             │
│  ✅ AWS Athena                                               │
│     Status: Connected · Query editor enabled                │
│     Queries today: 47 · Cost: $2.35                         │
│     [Open Query Editor] [View History]                      │
│                                                             │
│  ✅ AWS S3                                                   │
│     Status: Connected · 15 buckets accessible               │
│     Total size: 2.3 TB · Objects: 450K                      │
│     [Browse Buckets] [Upload Files]                         │
│                                                             │
│  ✅ AWS QuickSight                                           │
│     Status: Connected · 8 datasets published                │
│     Active dashboards: 12                                   │
│     [Create Dataset] [View Dashboards]                      │
│                                                             │
│  ✅ AWS Kendra                                               │
│     Status: Connected · Index: dataops-catalog              │
│     Documents indexed: 1,234                                │
│     [Reindex] [Test Search]                                 │
│                                                             │
│  ✅ AWS SageMaker                                            │
│     Status: Connected · Feature Store enabled               │
│     Models deployed: 3                                      │
│     [Open Studio] [View Models]                             │
│                                                             │
│  ❌ AWS EMR (Not configured)                                 │
│     [Connect EMR]                                           │
│                                                             │
│  ──────── External Systems ────────                         │
│                                                             │
│  ⚠️ Databricks                                               │
│     Status: Connected (1 workspace)                         │
│     Tables synced: 450                                      │
│     [Add Workspace] [Configure]                             │
│                                                             │
│  ❌ Snowflake (Not configured)                               │
│     [Connect Snowflake]                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Athena Query Editor Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ Athena Query Editor                                    [✕]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Database: [contracts_db ▼]                                 │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ SELECT                                                │ │
│  │   vendor_id,                                          │ │
│  │   SUM(amount) as total_spend,                         │ │
│  │   COUNT(*) as contract_count                          │ │
│  │ FROM contract_spend_2024                              │ │
│  │ WHERE amount > 0                                      │ │
│  │ GROUP BY vendor_id                                    │ │
│  │ ORDER BY total_spend DESC                             │ │
│  │ LIMIT 10;                                             │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [▶️ Run Query]  [💾 Save]  [📊 Visualize]  [🔄 History]   │
│                                                             │
│  ────────── Results (10 rows) ──────────                    │
│                                                             │
│  vendor_id  │ total_spend  │ contract_count               │
│  ──────────┼──────────────┼───────────────               │
│  VEN-001    │  $15,234,567 │      145                     │
│  VEN-042    │  $12,456,789 │       98                     │
│  VEN-123    │   $9,876,543 │      234                     │
│  ...                                                        │
│                                                             │
│  Query execution time: 1.2s                                 │
│  Data scanned: 245 MB                                       │
│  Estimated cost: $0.001                                     │
│                                                             │
│  [Export CSV] [Export JSON] [Create Dataset]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Glue Catalog Sync Status Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ AWS Glue Catalog Sync                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Last Sync: 10 minutes ago                                  │
│  Status: ✅ Complete                                         │
│  Duration: 3m 24s                                           │
│                                                             │
│  ────────── Sync Summary ──────────                         │
│                                                             │
│  📊 Tables Discovered: 1,234                                │
│  ✅ Successfully imported: 1,230                             │
│  ⚠️ Warnings: 3                                              │
│  ❌ Errors: 1                                                │
│                                                             │
│  ────────── Changes ──────────                              │
│                                                             │
│  ➕ New Tables (15):                                         │
│     • contracts_db.new_contracts_q4                         │
│     • personnel_db.employee_updates                         │
│     • logistics_db.shipment_tracking                        │
│     ... and 12 more                                         │
│                                                             │
│  📝 Updated Tables (42):                                     │
│     • contracts_db.contract_spend (schema changed)          │
│     • contracts_db.vendor_info (row count: 10K→12K)         │
│     ... and 40 more                                         │
│                                                             │
│  ❌ Deleted Tables (2):                                      │
│     • temp_db.staging_data                                  │
│     • test_db.sample_data                                   │
│                                                             │
│  ⚠️ Warnings:                                                │
│     • contracts_db.legacy_data: Column types mismatch       │
│     • personnel_db.temp_table: No description               │
│     • logistics_db.old_shipments: Low quality (45/100)      │
│                                                             │
│  ❌ Errors:                                                  │
│     • finance_db.budget_2024: Access denied (IAM)           │
│                                                             │
│  [View Full Report] [Sync Now] [Schedule Sync]              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## API Actions

### syncGlueCatalog(options)

**Purpose**: Sync Glue catalog to DataOps

**Input**:
```typescript
{
  databases?: string[]            // Specific databases (empty = all)
  fullSync?: boolean              // Default: incremental
  createNodes?: boolean           // Create ontology nodes (default: true)
}
```

**Output**:
```typescript
{
  success: boolean
  stats: {
    tablesDiscovered: number
    tablesImported: number
    tablesUpdated: number
    tablesDeleted: number
    warnings: number
    errors: number
  }
  changes: {
    newTables: string[]
    updatedTables: string[]
    deletedTables: string[]
  }
  warnings: Array<{ table: string, message: string }>
  errors: Array<{ table: string, error: string }>
}
```

### executeAthenaQuery(query, options)

**Purpose**: Run SQL query via Athena

**Input**:
```typescript
{
  query: string
  database?: string
  outputLocation?: string         // S3 location for results
  workgroup?: string
}
```

**Output**:
```typescript
{
  success: boolean
  queryExecutionId: string
  results: Array<Record<string, any>>
  stats: {
    executionTime: number         // milliseconds
    dataScanned: number           // bytes
    estimatedCost: number         // USD
  }
}
```

### browseS3Bucket(bucket, prefix)

**Purpose**: Browse S3 bucket contents

**Input**:
```typescript
{
  bucket: string
  prefix?: string                 // Folder path
  maxKeys?: number                // Default: 1000
}
```

**Output**:
```typescript
{
  success: boolean
  objects: Array<{
    key: string
    size: number
    lastModified: string
    storageClass: string
    isFolder: boolean
  }>
  folders: string[]
  continuationToken?: string      // For pagination
}
```

### createQuickSightDataset(dataProductId, options)

**Purpose**: Create QuickSight dataset from data product

**Input**:
```typescript
{
  dataProductId: string
  datasetName: string
  importMode: "SPICE" | "DIRECT"
  refreshSchedule?: {
    cron: string
    timezone: string
  }
}
```

**Output**:
```typescript
{
  success: boolean
  datasetId: string
  arn: string
  status: "creating" | "ready"
}
```

### importDatabricksTable(workspaceUrl, catalogName, schemaName, tableName)

**Purpose**: Import Databricks table to DataOps

**Input**:
```typescript
{
  workspaceUrl: string
  catalogName: string
  schemaName: string
  tableName: string
  createNode?: boolean            // Create ontology node (default: true)
}
```

**Output**:
```typescript
{
  success: boolean
  datasetId: string
  ontologyNodeId: string
  schema: {
    columns: Array<{
      name: string
      type: string
      comment: string
    }>
  }
  stats: {
    rowCount: number
    sizeBytes: number
  }
}
```

## Implementation Notes

### Glue Catalog Sync Implementation

```typescript
async function syncGlueCatalog(databases: string[] = []) {
  const glueClient = new GlueClient({ region: "us-east-1" });

  // 1. Get all databases
  const dbs = databases.length > 0
    ? databases
    : await getAllGlueDatabases(glueClient);

  const stats = {
    tablesDiscovered: 0,
    tablesImported: 0,
    tablesUpdated: 0,
    warnings: [],
    errors: []
  };

  // 2. For each database, get all tables
  for (const db of dbs) {
    try {
      const tables = await glueClient.send(new GetTablesCommand({
        DatabaseName: db
      }));

      for (const table of tables.TableList) {
        stats.tablesDiscovered++;

        try {
          // 3. Create/update ontology node
          const nodeId = `glue-table-${db}-${table.Name}`;

          await createOrUpdateOntologyNode({
            id: nodeId,
            type: "glue-table",
            category: "dataset",
            domain: "AWS Glue",
            name: `${db}.${table.Name}`,
            properties: {
              dataSource: "glue-table",
              database: db,
              tableName: table.Name,
              location: table.StorageDescriptor.Location,
              storageFormat: table.StorageDescriptor.InputFormat,
              schema: {
                columns: table.StorageDescriptor.Columns.map(col => ({
                  name: col.Name,
                  type: col.Type,
                  comment: col.Comment
                }))
              },
              partitionKeys: table.PartitionKeys?.map(pk => pk.Name) || []
            }
          });

          // 4. Create dataset record
          await createDataset({
            id: nodeId,
            sourceId: `glue-db-${db}`,
            name: `${db}.${table.Name}`,
            schema: table.StorageDescriptor.Columns,
            domain: db,
            classification: detectClassification(table),
            tags: table.Parameters?.tags?.split(",") || []
          });

          // 5. Calculate quality score
          await calculateQualityScore(nodeId);

          stats.tablesImported++;
        } catch (error) {
          stats.errors.push({
            table: `${db}.${table.Name}`,
            error: error.message
          });
        }
      }
    } catch (error) {
      stats.errors.push({
        table: db,
        error: error.message
      });
    }
  }

  return stats;
}
```

### Athena Query Execution

```typescript
async function executeAthenaQuery(query: string, database: string) {
  const athenaClient = new AthenaClient({ region: "us-east-1" });

  // 1. Start query execution
  const startResponse = await athenaClient.send(new StartQueryExecutionCommand({
    QueryString: query,
    QueryExecutionContext: { Database: database },
    ResultConfiguration: {
      OutputLocation: "s3://dataops-query-results/"
    }
  }));

  const queryExecutionId = startResponse.QueryExecutionId;

  // 2. Wait for completion
  let status = "RUNNING";
  while (status === "RUNNING" || status === "QUEUED") {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const getResponse = await athenaClient.send(new GetQueryExecutionCommand({
      QueryExecutionId: queryExecutionId
    }));

    status = getResponse.QueryExecution.Status.State;
  }

  if (status !== "SUCCEEDED") {
    throw new Error(`Query failed: ${status}`);
  }

  // 3. Get results
  const resultsResponse = await athenaClient.send(new GetQueryResultsCommand({
    QueryExecutionId: queryExecutionId
  }));

  // 4. Parse results
  const rows = resultsResponse.ResultSet.Rows;
  const headers = rows[0].Data.map(d => d.VarCharValue);
  const data = rows.slice(1).map(row =>
    row.Data.reduce((obj, cell, i) => {
      obj[headers[i]] = cell.VarCharValue;
      return obj;
    }, {})
  );

  return {
    queryExecutionId,
    results: data,
    stats: {
      executionTime: getResponse.QueryExecution.Statistics.EngineExecutionTimeInMillis,
      dataScanned: getResponse.QueryExecution.Statistics.DataScannedInBytes,
      estimatedCost: (getResponse.QueryExecution.Statistics.DataScannedInBytes / 1e12) * 5
    }
  };
}
```

### QuickSight Dataset Creation

```typescript
async function createQuickSightDataset(
  dataProductId: string,
  options: { datasetName: string, importMode: string }
) {
  const quicksightClient = new QuickSightClient({ region: "us-east-1" });

  // 1. Get data product output location
  const dataProduct = await getDataProduct(dataProductId);
  const s3Location = dataProduct.outputs[0].location;

  // 2. Create Athena data source
  const dataSourceId = `dataops-${dataProductId}-source`;
  await quicksightClient.send(new CreateDataSourceCommand({
    AwsAccountId: AWS_ACCOUNT_ID,
    DataSourceId: dataSourceId,
    Name: `DataOps ${dataProduct.name}`,
    Type: "ATHENA",
    DataSourceParameters: {
      AthenaParameters: {
        WorkGroup: "primary"
      }
    }
  }));

  // 3. Create dataset
  const datasetId = `dataops-${dataProductId}-dataset`;
  await quicksightClient.send(new CreateDataSetCommand({
    AwsAccountId: AWS_ACCOUNT_ID,
    DataSetId: datasetId,
    Name: options.datasetName,
    ImportMode: options.importMode,
    PhysicalTableMap: {
      "table1": {
        CustomSql: {
          DataSourceArn: `arn:aws:quicksight:${AWS_REGION}:${AWS_ACCOUNT_ID}:datasource/${dataSourceId}`,
          Name: options.datasetName,
          SqlQuery: `SELECT * FROM "${s3Location}"`
        }
      }
    }
  }));

  // 4. Create ontology node
  await createOntologyNode({
    id: `quicksight-dataset-${datasetId}`,
    type: "quicksight-dataset",
    category: "dataproduct",
    domain: "AWS QuickSight",
    name: options.datasetName,
    properties: {
      dataSource: "quicksight-dataset",
      datasetId,
      importMode: options.importMode
    }
  });

  return { datasetId };
}
```

## Testing

### Integration Tests
- Glue catalog sync (end-to-end)
- Athena query execution
- S3 file upload and discovery
- QuickSight dataset creation
- Databricks table import

### Performance Tests
- Sync 1000+ Glue tables (<5 min)
- Athena query on 1GB dataset (<10s)
- S3 file preview (<2s)

## Success Metrics

- **Catalog Coverage**: 100% of Glue tables synced within 24 hours
- **Query Performance**: 90% of Athena queries complete in <10 seconds
- **Integration Usage**: 80% of pipelines use AWS service nodes
- **Cost Efficiency**: 30% reduction in AWS service costs via optimization
- **Lineage Accuracy**: 100% lineage tracking for AWS → DataOps → QuickSight flows

## Related Features

- [01-data-catalog.md](./01-data-catalog.md) - Unified catalog across all systems
- [02-pipeline-builder.md](./02-pipeline-builder.md) - AWS service nodes in pipelines
- [04-lineage-graph.md](./04-lineage-graph.md) - Cross-system lineage tracking
