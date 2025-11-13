# Data Products in NextGen DataOps

**Date**: 2025-11-06
**Status**: Design Complete - Ready to Implement

---

## What is a Data Product?

A **Data Product** is a curated, API-accessible, versioned data asset that:
- Serves a specific business purpose
- Has a clear owner (product manager)
- Exposes standardized interfaces (REST API, GraphQL, SQL)
- Maintains SLOs for quality, availability, and latency
- Is documented and discoverable
- Treats consumers as customers

**Data Products are THE bridge between raw data and analytics/AI agents.**

---

## Data Mesh Principles

### 1. Domain-Oriented Ownership
- Each domain owns its data products
- Product managers are accountable for quality
- Cross-functional teams build and maintain

### 2. Data as a Product
- Discoverable (in catalog with rich metadata)
- Addressable (unique URI: `dataops://products/{id}`)
- Trustworthy (quality scores, SLOs, certifications)
- Secure (classification, access control)
- Interoperable (standard formats, APIs)

### 3. Self-Serve Infrastructure
- Platform provides tools to build/deploy products
- No dependency on central data team
- Automated quality checks
- Automated API generation

### 4. Federated Governance
- Global standards for interoperability
- Local autonomy for implementation
- Automated compliance checks

---

## Data Product Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      DATA PRODUCT                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │              SERVING LAYER (APIs)                  │   │
│  ├────────────────────────────────────────────────────┤   │
│  │  REST API    │  GraphQL    │  SQL    │  gRPC      │   │
│  │  /api/v1/... │  /graphql   │  ODBC   │  Port 9000 │   │
│  └────────────────────────────────────────────────────┘   │
│                         ▲                                   │
│                         │                                   │
│  ┌────────────────────────────────────────────────────┐   │
│  │            TRANSFORMATION LAYER                    │   │
│  ├────────────────────────────────────────────────────┤   │
│  │  • Business Logic (aggregations, enrichments)      │   │
│  │  • Quality Checks (validation, profiling)          │   │
│  │  • PII Masking (automatic redaction)               │   │
│  │  • Classification (auto-tagging)                   │   │
│  └────────────────────────────────────────────────────┘   │
│                         ▲                                   │
│                         │                                   │
│  ┌────────────────────────────────────────────────────┐   │
│  │              SOURCE DATASETS                       │   │
│  ├────────────────────────────────────────────────────┤   │
│  │  Dataset 1  │  Dataset 2  │  Dataset 3  │  ...    │   │
│  │  (Glue)     │  (S3)       │  (Databricks)│        │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Product Components

### 1. Core Metadata
```typescript
interface DataProduct {
  // Identity
  id: string;                     // product-{domain}-{name}
  name: string;                   // Human-readable name
  domain: string;                 // Owning domain (e.g., "sales", "logistics")
  version: string;                // Semantic version (e.g., "2.1.0")

  // Ownership
  owner: string;                  // Product manager user ID
  team: string;                   // Owning team
  steward: string;                // Data steward user ID

  // Description
  description: string;            // Business purpose
  businessUseCase: string;        // What problem it solves
  consumers: string[];            // List of consumer teams/apps

  // Classification
  classification: ClassificationLevel; // U/C/S/TS
  tags: string[];                 // Searchable tags
  keywords: string[];             // Discovery keywords

  // Data
  sourceDatasets: string[];       // Dataset IDs that feed this product
  outputSchema: Schema;           // Schema of the product output
  sampleData?: any[];             // Sample records for preview

  // APIs
  endpoints: {
    rest?: {
      url: string;                // https://api.captify.io/dataops/products/{id}
      methods: string[];          // GET, POST, etc.
      authentication: string;     // Bearer token, API key, etc.
    };
    graphql?: {
      url: string;
      schema: string;             // GraphQL schema definition
    };
    sql?: {
      connectionString: string;
      tableName: string;
    };
    grpc?: {
      host: string;
      port: number;
      protoFile: string;
    };
  };

  // Quality & SLOs
  qualityScore: number;           // 0-100
  qualityDimensions: QualityDimensions;
  slos: {
    availability: number;         // 99.9%
    latencyP50: number;           // 50ms
    latencyP95: number;           // 200ms
    latencyP99: number;           // 500ms
    freshnessMinutes: number;     // Data freshness SLO
    completeness: number;         // 99.5%
  };
  slis: {
    currentAvailability: number;
    currentLatencyP50: number;
    currentLatencyP95: number;
    currentLatencyP99: number;
    currentFreshnessMinutes: number;
    lastUpdated: string;
  };

  // Lifecycle
  status: 'draft' | 'dev' | 'staging' | 'production' | 'deprecated';
  maturity: 'experimental' | 'beta' | 'stable' | 'mature';
  deprecationDate?: string;
  replacedBy?: string;            // ID of replacement product

  // Usage
  accessCount: number;            // Total API calls
  uniqueConsumers: number;        // Unique consumer count
  avgDailyRequests: number;       // Average daily API calls
  popularityScore: number;        // 0-100

  // Ratings & Reviews
  rating: number;                 // 0-5 stars
  ratingCount: number;
  reviews: Review[];

  // Compliance
  piiFields: string[];            // Fields containing PII
  sensitiveFields: string[];
  complianceChecks: ComplianceCheck[];
  certifications: string[];       // IL5, FedRAMP, etc.

  // Lineage
  lineageGraph: string;           // Graph ID or embedded graph

  // Documentation
  documentation: string;          // Markdown documentation
  changelog: ChangelogEntry[];    // Version history
  examples: Example[];            // Usage examples

  // Technical
  refreshSchedule?: string;       // Cron expression
  lastRefreshed?: string;         // ISO timestamp
  nextRefresh?: string;           // ISO timestamp
  transformationLogic?: string;   // SQL, Python, etc.
  deploymentConfig?: any;         // K8s manifest, CloudFormation, etc.

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}
```

### 2. API Serving Layer
Each data product exposes multiple access patterns:

**REST API** (for applications):
```
GET /api/v1/products/{id}/data
  ?filters[]=status:active
  &sort=createdAt:desc
  &limit=100
  &offset=0

Response:
{
  "data": [...],
  "metadata": {
    "total": 1523,
    "page": 1,
    "pageSize": 100,
    "freshnessMinutes": 5
  },
  "slos": {
    "availability": 99.95,
    "latencyP95": 180
  }
}
```

**GraphQL** (for flexible queries):
```graphql
query GetProductData($productId: ID!, $filters: FilterInput) {
  dataProduct(id: $productId) {
    name
    version
    data(filters: $filters) {
      edges {
        node {
          id
          ...fields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
    qualityScore
    slos {
      availability
      latencyP95
    }
  }
}
```

**SQL Interface** (for analysts):
```sql
-- Virtual table access
SELECT * FROM dataproducts.sales_transactions
WHERE date >= '2025-01-01'
  AND classification = 'U'
LIMIT 1000;
```

### 3. Transformation Pipeline
Each data product has a transformation pipeline:

```typescript
interface TransformationPipeline {
  id: string;
  productId: string;

  // Source
  sources: {
    datasetId: string;
    query?: string;              // Optional filtering
    joinType?: string;           // For multi-source
  }[];

  // Transformations
  steps: {
    order: number;
    type: 'filter' | 'aggregate' | 'join' | 'enrich' | 'pivot' | 'custom';
    config: any;                 // Type-specific config
    validation?: {
      rules: string[];
      onFailure: 'skip' | 'fail' | 'warn';
    };
  }[];

  // Quality
  qualityChecks: {
    ruleId: string;
    runAt: 'pre' | 'post' | 'both';
  }[];

  // Compliance
  piiMasking: {
    enabled: boolean;
    fields: string[];
    maskingStrategy: 'redact' | 'hash' | 'tokenize' | 'partial';
  };

  // Execution
  schedule: string;              // Cron expression
  timeout: number;               // Max execution time (seconds)
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
  };
}
```

---

## Implementation Plan

### Phase 1: Core Data Product Entity (Week 1-2)

**Tasks**:
1. Create `dataops-data-product` ontology node
2. Create `captify-core-dataops-data-product` DynamoDB table
3. Build `data-product-service.ts` in core
4. Add data product types to `dataops.ts`

**Deliverables**:
- CRUD operations for data products
- Version management
- Owner assignment
- Status lifecycle

### Phase 2: API Serving Layer (Week 3-4)

**Tasks**:
1. Build REST API generator
2. Build GraphQL schema generator
3. Build SQL interface (Athena/Glue)
4. Implement authentication/authorization
5. Add rate limiting and caching

**Deliverables**:
- Auto-generated REST APIs for each product
- GraphQL endpoint for flexible queries
- SQL access via Athena
- API documentation (OpenAPI/Swagger)

### Phase 3: Transformation Pipeline (Week 5-6)

**Tasks**:
1. Build visual pipeline builder UI
2. Implement transformation engine
3. Add quality check integration
4. Add PII masking
5. Add scheduling

**Deliverables**:
- Drag-and-drop pipeline builder
- Execution engine
- Monitoring and alerting
- Pipeline versioning

### Phase 4: Product Catalog & Discovery (Week 7-8)

**Tasks**:
1. Build data product catalog UI
2. Add search and filters
3. Add product detail pages
4. Add API documentation viewer
5. Add usage analytics

**Deliverables**:
- Product catalog with rich metadata
- Search by name, domain, tags
- Product detail page with docs
- Usage dashboard

### Phase 5: SLOs & Monitoring (Week 9-10)

**Tasks**:
1. Implement SLO tracking
2. Build SLI collection
3. Add alerting for SLO violations
4. Build product health dashboard

**Deliverables**:
- SLO/SLI monitoring
- Automated alerts
- Health dashboard
- Performance metrics

---

## Use Cases

### Use Case 1: Sales Analytics Product
**Domain**: Sales
**Owner**: Sales Analytics Team
**Purpose**: Provide daily sales metrics for dashboards

**Source Datasets**:
- `dataset-glue-sales-transactions`
- `dataset-glue-customer-master`
- `dataset-glue-product-catalog`

**Transformation**:
1. Join transactions with customers and products
2. Aggregate by date, region, product
3. Calculate KPIs (revenue, units, avg order value)
4. Apply classification rules
5. Mask customer PII

**Outputs**:
- REST API: `GET /api/v1/products/sales-daily-metrics/data`
- GraphQL: Query with flexible filters
- SQL: `dataproducts.sales_daily_metrics`

**SLOs**:
- Availability: 99.9%
- Latency P95: < 200ms
- Freshness: < 60 minutes
- Completeness: > 99%

**Consumers**:
- Executive Dashboard (QuickSight)
- Sales AI Agent (Bedrock)
- Mobile App API

### Use Case 2: Mission Logistics Product
**Domain**: Logistics
**Owner**: Mission Planning Team
**Purpose**: Real-time equipment location and status

**Source Datasets**:
- `dataset-glue-equipment-tracking` (real-time stream)
- `dataset-glue-mission-assignments`
- `dataset-glue-maintenance-logs`

**Transformation**:
1. Join tracking data with assignments
2. Calculate status (available, in-use, maintenance)
3. Apply classification (S - Secret)
4. Enrich with weather data
5. Calculate risk scores

**Outputs**:
- REST API: `GET /api/v1/products/mission-logistics/data`
- gRPC: Real-time streaming
- SQL: `dataproducts.mission_logistics`

**SLOs**:
- Availability: 99.99%
- Latency P95: < 50ms (real-time)
- Freshness: < 5 minutes
- Completeness: > 99.9%

**Consumers**:
- Mission Planning Dashboard
- C2 System Integration
- Logistics AI Agent

---

## Integration with Agents & Analytics

### For AI Agents (Bedrock)
```python
# Agent uses data product via API
response = requests.get(
    "https://api.captify.io/dataops/products/sales-daily-metrics/data",
    headers={"Authorization": f"Bearer {token}"},
    params={"filters": "region:west", "limit": 100}
)

sales_data = response.json()["data"]

# Agent processes data for insights
insights = bedrock_agent.analyze(sales_data)
```

### For Analytics (QuickSight)
```sql
-- QuickSight connects directly to data product
SELECT
    date,
    region,
    SUM(revenue) as total_revenue,
    COUNT(DISTINCT customer_id) as unique_customers
FROM dataproducts.sales_daily_metrics
WHERE date >= CURRENT_DATE - INTERVAL '30' DAY
GROUP BY date, region
ORDER BY date DESC;
```

### For Applications (REST API)
```typescript
// Application consumes data product
const dataProduct = await apiClient.run({
  service: 'platform.dataproduct',
  operation: 'getData',
  productId: 'sales-daily-metrics',
  filters: {
    region: 'west',
    date_gte: '2025-01-01'
  },
  limit: 100
});
```

---

## Success Metrics

**Adoption**:
- Number of data products created
- Number of consumers per product
- API request volume

**Quality**:
- Average quality score across products
- SLO compliance rate
- Customer satisfaction (ratings)

**Governance**:
- Classification coverage (% products classified)
- PII masking rate
- Compliance check pass rate

**Performance**:
- Average API latency
- Average data freshness
- Availability uptime

---

## Next Steps

1. **Review & Approve** this design
2. **Create ontology node** for data products
3. **Build core service** with CRUD operations
4. **Implement API layer** with REST/GraphQL
5. **Build UI** for product catalog and builder
6. **Integrate with agents** and analytics tools

This architecture transforms DataOps from a catalog into a **product platform** where analytics and AI agents consume high-quality, governed, API-accessible data products.
