# Data Products - Integration Summary

**Date**: 2025-11-06
**Status**: Types Added - Ready for Implementation

---

## Overview

Data Products are now a **first-class entity** in the DataOps platform. They represent the critical layer between raw datasets and consumption by analytics/AI agents.

## The Data Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                    CONSUMPTION LAYER                    │
│  • Analytics Dashboards (QuickSight)                    │
│  • AI Agents (Bedrock)                                  │
│  • Applications (REST APIs)                             │
│  • Data Scientists (SQL/Python)                         │
└────────────────────▲────────────────────────────────────┘
                     │
                     │ API Access (REST, GraphQL, SQL, gRPC)
                     │
┌────────────────────┴────────────────────────────────────┐
│                   DATA PRODUCTS                         │
│  • Curated, versioned, API-accessible                   │
│  • SLOs/SLIs for quality & performance                  │
│  • Business logic & transformations                     │
│  • IL5 compliant with PII masking                       │
└────────────────────▲────────────────────────────────────┘
                     │
                     │ Transformation Pipelines
                     │
┌────────────────────┴────────────────────────────────────┐
│                    DATASETS                             │
│  • Cataloged tables from sources                        │
│  • Quality profiled                                     │
│  • Lineage tracked                                      │
└────────────────────▲────────────────────────────────────┘
                     │
                     │ Sync & Discovery
                     │
┌────────────────────┴────────────────────────────────────┐
│                  DATA SOURCES                           │
│  • External systems (Glue, Databricks, Snowflake)      │
│  • Connection management                                │
│  • Credentials & encryption                             │
└─────────────────────────────────────────────────────────┘
```

---

## What Was Added

### 1. TypeScript Types ✅

**File**: [/opt/captify-apps/core/src/types/dataops.ts](../../core/src/types/dataops.ts) (lines 536-736)

**New Types**:
- `DataProduct` - Main entity with full metadata
- `ServiceLevelObjectives` - SLOs (availability, latency, freshness)
- `ServiceLevelIndicators` - Current SLI measurements
- `TransformationPipeline` - Pipeline configuration
- `TransformationStep` - Individual transformation steps
- `ChangelogEntry` - Version history
- `ProductExample` - Code examples for consumers
- `Schema` & `SchemaProperty` - Output schema definitions
- `ListDataProductsRequest` - Query parameters

**Key Fields**:
- Identity: `id`, `name`, `domain`, `version`
- Ownership: `owner`, `team`, `steward`
- APIs: `rest`, `graphql`, `sql`, `grpc` endpoints
- Quality: `qualityScore`, `qualityDimensions`, `slos`, `slis`
- Lifecycle: `status` (draft → dev → staging → production), `maturity`
- Usage: `accessCount`, `uniqueConsumers`, `avgDailyRequests`
- Compliance: `classification`, `piiFields`, `certifications`

---

## What Needs to Be Built

### Phase 1: Core Infrastructure (Week 1-2)

#### 1. Ontology Node
Create `dataops-data-product` ontology node:

```typescript
{
  id: "dataops-data-product",
  name: "Data Product",
  type: "dataProduct",
  category: "product",
  domain: "DataOps",
  properties: {
    dataSource: "dataops-data-product",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string", required: true },
        domain: { type: "string", required: true },
        version: { type: "string", required: true },
        owner: { type: "string", required: true },
        classification: { type: "string", enum: ["U", "C", "S", "TS"] },
        status: { type: "string", enum: ["draft", "dev", "staging", "production", "deprecated"] },
        // ... full schema
      }
    }
  }
}
```

#### 2. DynamoDB Table
Create `captify-core-dataops-data-product` table:

```typescript
{
  TableName: 'captify-core-dataops-data-product',
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'domain', AttributeType: 'S' },
    { AttributeName: 'status', AttributeType: 'S' },
    { AttributeName: 'owner', AttributeType: 'S' },
    { AttributeName: 'updatedAt', AttributeType: 'S' },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'domain-updatedAt-index',
      KeySchema: [
        { AttributeName: 'domain', KeyType: 'HASH' },
        { AttributeName: 'updatedAt', KeyType: 'RANGE' }
      ]
    },
    {
      IndexName: 'status-updatedAt-index',
      KeySchema: [
        { AttributeName: 'status', KeyType: 'HASH' },
        { AttributeName: 'updatedAt', KeyType: 'RANGE' }
      ]
    },
    {
      IndexName: 'owner-updatedAt-index',
      KeySchema: [
        { AttributeName: 'owner', KeyType: 'HASH' },
        { AttributeName: 'updatedAt', KeyType: 'RANGE' }
      ]
    }
  ]
}
```

#### 3. Data Product Service
Create `/opt/captify-apps/core/src/services/aws/data-product-service.ts`:

**Operations**:
- `list` - Query by domain, status, owner
- `get` - Get single data product
- `create` - Create new product
- `update` - Update product metadata
- `delete` - Delete/deprecate product
- `publish` - Move from draft → dev → production
- `getData` - Get product data via API
- `getSchema` - Get product output schema
- `getSLOs` - Get current SLO status
- `recordAccess` - Track API usage

---

### Phase 2: API Serving Layer (Week 3-4)

#### 1. REST API Generator
Auto-generate REST endpoints for each product:

```
GET    /api/v1/products/{id}/data
POST   /api/v1/products/{id}/data
GET    /api/v1/products/{id}/schema
GET    /api/v1/products/{id}/slos
GET    /api/v1/products/{id}/docs
```

#### 2. GraphQL Endpoint
Generate GraphQL schema from product output schema:

```graphql
type DataProduct {
  id: ID!
  name: String!
  domain: String!
  version: String!
  data(filters: FilterInput, limit: Int, offset: Int): DataConnection!
  schema: JSONSchema!
  slos: ServiceLevelObjectives!
  slis: ServiceLevelIndicators!
}

type DataConnection {
  edges: [DataEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}
```

#### 3. SQL Interface
Create Athena views for each product:

```sql
CREATE OR REPLACE VIEW dataproducts.{product_name} AS
SELECT * FROM {transformation_output_table};
```

#### 4. Authentication & Authorization
- API key management
- Rate limiting (per SLO)
- Access logging for audit

---

### Phase 3: Transformation Pipeline Builder (Week 5-6)

#### 1. Visual Pipeline Builder UI
- Drag-and-drop canvas (@xyflow/react)
- Node types: Source, Filter, Join, Aggregate, Enrich, Output
- Live data preview at each step
- Validation before save

#### 2. Pipeline Execution Engine
- Execute transformations (SQL, Python, Spark)
- Quality checks at each step
- PII masking
- Error handling & retry

#### 3. Scheduling
- Cron-based scheduling
- Event-driven triggers
- Manual refresh

---

### Phase 4: Product Catalog UI (Week 7-8)

#### 1. Products List Page
`/dataops/products`

**Features**:
- Grid/list view toggle
- Search by name, domain, tags
- Filter by status, maturity, classification, domain
- Sort by quality, popularity, rating
- Stats: Total products, by status, by domain

#### 2. Product Detail Page
`/dataops/products/{id}`

**Tabs**:
1. **Overview**
   - Description, use case, consumers
   - Quality score & dimensions
   - SLO/SLI metrics
   - Version history

2. **API Documentation**
   - REST endpoint docs
   - GraphQL schema
   - SQL table name
   - Code examples (curl, Python, JS)
   - Authentication guide

3. **Data**
   - Output schema viewer
   - Sample data preview
   - Data freshness indicator
   - Download sample

4. **Lineage**
   - Source datasets
   - Transformation pipeline visualization
   - Downstream consumers
   - Impact analysis

5. **Quality**
   - Quality score breakdown
   - Quality check results
   - Data profiling stats
   - PII fields

6. **Compliance**
   - Classification level
   - PII masking status
   - Certifications
   - Audit logs

7. **Usage**
   - API request metrics
   - Unique consumers
   - Latency charts (P50, P95, P99)
   - Error rate

8. **Settings**
   - Edit metadata
   - Manage owners/stewards
   - Configure SLOs
   - Deprecation settings

#### 3. Product Builder Page
`/dataops/products/new`

**Sections**:
1. **Metadata**
   - Name, domain, description
   - Owner, team, steward
   - Classification, tags

2. **Source Datasets**
   - Select datasets
   - Configure joins

3. **Transformations**
   - Visual pipeline builder
   - Add transformation steps
   - Quality checks
   - PII masking

4. **Output Schema**
   - Define schema
   - Add field descriptions
   - Mark PII fields

5. **APIs**
   - Choose access methods (REST, GraphQL, SQL)
   - Configure authentication

6. **SLOs**
   - Set availability target
   - Set latency targets
   - Set freshness target

7. **Deploy**
   - Preview & validate
   - Deploy to dev/staging/production

---

### Phase 5: Integration with Agents (Week 9-10)

#### 1. Bedrock Agent Integration
Expose data products as tools for Bedrock agents:

```typescript
// Agent tool definition
{
  name: "get_sales_metrics",
  description: "Get daily sales metrics for analysis",
  inputSchema: {
    type: "object",
    properties: {
      startDate: { type: "string", format: "date" },
      endDate: { type: "string", format: "date" },
      region: { type: "string", enum: ["north", "south", "east", "west"] }
    }
  },
  action: async (input) => {
    return await dataProductService.getData({
      productId: "product-sales-daily-metrics",
      filters: input
    });
  }
}
```

#### 2. QuickSight Integration
Auto-create QuickSight datasets from data products:

```typescript
async function createQuickSightDataset(productId: string) {
  const product = await dataProductService.get({ id: productId });

  // Create dataset pointing to product's SQL table
  const dataset = await quicksight.createDataSet({
    DataSetId: productId,
    Name: product.name,
    PhysicalTableMap: {
      [productId]: {
        RelationalTable: {
          DataSourceArn: athenaDataSourceArn,
          Schema: 'dataproducts',
          Name: product.endpoints.sql.tableName
        }
      }
    }
  });
}
```

---

## Example: Building a Sales Metrics Product

### Step 1: Define Product
```typescript
const product: DataProduct = {
  id: "product-sales-daily-metrics",
  name: "Sales Daily Metrics",
  domain: "sales",
  version: "1.0.0",
  owner: "user-sales-manager",
  team: "sales-analytics",
  description: "Daily aggregated sales metrics for executive reporting",
  businessUseCase: "Track daily sales performance across regions and products",
  classification: "C", // Confidential
  tags: ["sales", "metrics", "daily", "kpis"],

  sourceDatasets: [
    "dataset-glue-sales-transactions",
    "dataset-glue-customer-master",
    "dataset-glue-product-catalog"
  ],

  endpoints: {
    rest: {
      url: "https://api.captify.io/dataops/products/sales-daily-metrics/data",
      methods: ["GET"],
      authentication: "Bearer token"
    },
    sql: {
      tableName: "sales_daily_metrics"
    }
  },

  slos: {
    availability: 99.9,
    latencyP95: 200,
    latencyP99: 500,
    freshnessMinutes: 60,
    completeness: 99.5
  },

  status: "production",
  maturity: "stable"
};
```

### Step 2: Build Transformation Pipeline
```typescript
const pipeline: TransformationPipeline = {
  id: "pipeline-sales-daily-metrics",
  productId: "product-sales-daily-metrics",

  sources: [
    {
      datasetId: "dataset-glue-sales-transactions",
      joinType: "inner"
    },
    {
      datasetId: "dataset-glue-customer-master",
      joinType: "left"
    },
    {
      datasetId: "dataset-glue-product-catalog",
      joinType: "left"
    }
  ],

  steps: [
    {
      order: 1,
      type: "join",
      config: {
        on: [
          { left: "customerId", right: "id" },
          { left: "productId", right: "id" }
        ]
      }
    },
    {
      order: 2,
      type: "filter",
      config: {
        where: "status = 'completed' AND date >= CURRENT_DATE - INTERVAL '90' DAY"
      }
    },
    {
      order: 3,
      type: "aggregate",
      config: {
        groupBy: ["date", "region", "productCategory"],
        aggregates: [
          { field: "amount", func: "SUM", as: "totalRevenue" },
          { field: "quantity", func: "SUM", as: "totalUnits" },
          { field: "customerId", func: "COUNT_DISTINCT", as: "uniqueCustomers" },
          { field: "amount", func: "AVG", as: "avgOrderValue" }
        ]
      }
    }
  ],

  qualityChecks: [
    { ruleId: "rule-completeness-revenue", runAt: "post" },
    { ruleId: "rule-validity-dates", runAt: "post" }
  ],

  piiMasking: {
    enabled: true,
    fields: ["customerEmail", "customerPhone"],
    maskingStrategy: "partial"
  },

  schedule: "0 */1 * * *", // Every hour
  timeout: 300,
  retryPolicy: {
    maxRetries: 3,
    backoffMultiplier: 2
  }
};
```

### Step 3: Consume from Agent
```python
# Bedrock agent tool
async def get_sales_insights(filters: dict) -> dict:
    """Get sales insights from data product"""
    response = await apiClient.run({
        "service": "platform.dataproduct",
        "operation": "getData",
        "productId": "product-sales-daily-metrics",
        "filters": filters
    })

    return response["data"]

# Agent uses the data
insights = await bedrock_agent.analyze_sales(
    data=await get_sales_insights({
        "date_gte": "2025-01-01",
        "region": "west"
    })
)
```

---

## Next Steps

1. **Review** this design with stakeholders
2. **Create** ontology node & DynamoDB table for data products
3. **Build** data-product-service.ts with CRUD operations
4. **Implement** basic REST API serving layer
5. **Build** product catalog UI
6. **Integrate** with existing datasets
7. **Test** with sample data products
8. **Deploy** to production

Data products are the **missing link** that transforms DataOps from a catalog into a **true data mesh platform** where analytics and AI agents can reliably consume governed, high-quality data through standardized APIs.
