# Feature: Data Catalog (The "Facebook for Data")

## Overview

The Data Catalog is the heart of NextGen DataOps - a social, visual, and intelligent platform where every data asset has a rich profile, quality score, and community ratings. Think of it as "Facebook for Data" - users can discover, explore, rate, and discuss datasets just like browsing social media profiles.

**Feature ID**: 01
**Priority**: P0 - Critical (foundation for all other features)
**Story Points**: 75
**Dependencies**: Phase 1 (Foundation) must be complete
**Implementation Phase**: Phase 2 (Weeks 5-9)

## Requirements

### Functional Requirements

#### FR-1: Dataset Discovery
- Users can search for datasets using:
  - Full-text search (name, description, tags, columns)
  - Semantic search (natural language, AI-powered)
  - Filters (domain, classification, quality score, owner, tags)
  - Sort options (name, quality, usage, date)
- Search returns results in <2 seconds for 10,000+ datasets
- Search suggestions appear as user types
- Recent searches are saved per user

#### FR-2: Dataset Profile Pages
Each dataset has a rich profile with 6 sections:
1. **Overview**: Name, description, owner, tags, quality score, ratings, classification
2. **Schema**: Columns, types, constraints, PII flags, data samples
3. **Quality**: Quality metrics, trends, active rules, recent checks
4. **Lineage**: Upstream sources, downstream products, mini graph
5. **Usage**: Views, downloads, queries, top users, access history
6. **Activity**: Recent changes, comments, ratings, reviews

#### FR-3: Ratings & Reviews
- Users can rate datasets (1-5 stars)
- Users can write reviews with comments
- Reviews can be upvoted/downvoted
- Average rating and count displayed prominently
- Dataset owners notified of ratings below 3 stars

#### FR-4: Data Source Management
- Users can register new data sources:
  - Type: S3, Aurora, DynamoDB, Glue, Databricks, Snowflake
  - Connection info (host, credentials, database)
  - Test connection before saving
- Auto-discover tables and schemas from source
- Sync metadata on schedule (daily/weekly)
- Display connection status (active, offline, error)

#### FR-5: Activity Feeds
- Global feed shows all activity across platform
- My activity shows activity on my datasets/products
- Team activity shows activity in my domain
- Activity types: create, update, delete, rate, comment
- Real-time updates (WebSocket or 10-second polling)

#### FR-6: Notifications
- Notify users on:
  - Quality degradation on owned datasets
  - Schema changes on used datasets
  - Access granted to requested datasets
  - Comments on owned datasets
  - Low ratings on owned datasets
- Delivery: email + in-app
- User can configure notification preferences

### Non-Functional Requirements

#### NFR-1: Performance
- Search response time: <2 seconds for 10,000+ datasets
- Profile page load time: <1 second
- Support 1,000 concurrent users
- Handle 100,000+ datasets without degradation

#### NFR-2: Scalability
- Metadata storage: DynamoDB with GSIs for fast queries
- Search index: AWS Kendra for semantic search
- Caching: Redis for frequently accessed data
- Pagination: 50 items per page, infinite scroll

#### NFR-3: Security
- Row-level security: users only see datasets they have access to
- Classification-based filtering: filter by clearance level
- Audit logging: all views, searches, downloads logged
- Encryption: at rest (S3/DynamoDB) and in transit (TLS)

#### NFR-4: Usability
- Mobile-responsive design
- Keyboard shortcuts (/, Ctrl+K for search)
- Accessible (WCAG 2.1 AA compliance)
- Dark mode support

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Data Catalog UI                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Search    │  │   Profile   │  │   Source    │        │
│  │    Page     │  │    Page     │  │   Mgmt      │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │
│         └────────────────┴────────────────┘                │
│                         │                                   │
├─────────────────────────┼───────────────────────────────────┤
│                    API Layer                                │
├─────────────────────────┼───────────────────────────────────┤
│         │                │                │                 │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐        │
│  │   Dataset   │  │  DataSource │  │   Activity  │        │
│  │   Service   │  │   Service   │  │   Service   │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │
├─────────┴────────────────┴────────────────┴─────────────────┤
│                     Storage Layer                           │
├─────────────────────────────────────────────────────────────┤
│         │                │                │                 │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐        │
│  │  DynamoDB   │  │   Kendra    │  │      S3     │        │
│  │  (Metadata) │  │  (Search)   │  │   (Files)   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Model

See [readme.md](../readme.md) for complete entity definitions. Key entities:
- **DataSource**: External system providing data
- **Dataset**: Specific table/file from a source
- **Rating**: User rating and review
- **Activity**: Event log entry
- **Notification**: User notification

## UI/UX

### Search Page Mockup

```
┌─────────────────────────────────────────────────────────────┐
│  DataOps                                    🔍 Search...     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🔍  Search datasets, data products, sources...      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Filters:                                                   │
│  ☐ Contracts  ☐ Personnel  ☐ Logistics                     │
│  ☐ Unclassified  ☐ Secret  ☐ Top Secret                    │
│  Quality: [━━━━━━━━━━] 70-100                               │
│                                                             │
│  ───────────────────────────────────────────────────────   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📊 Contract Spend 2024                  ⭐⭐⭐⭐⭐ 4.8│
│  │  Quality: ████████░░ 85/100              🏷️ Contracts │
│  │  Owner: John Doe                        🔓 Unclassified│
│  │  1.2K views · 450 downloads · Updated 2 days ago       │
│  │  "Monthly contract spend aggregated by vendor..."       │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📈 Performance Metrics Q4                ⭐⭐⭐⭐☆ 4.2│
│  │  Quality: ██████░░░░ 62/100              🏷️ Operations│
│  │  Owner: Jane Smith                       🔒 Secret     │
│  │  850 views · 120 downloads · Updated 5 hours ago       │
│  │  "Quarterly performance metrics for all contracts..."   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Load more...                                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Dataset Profile Mockup

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Catalog                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Contract Spend 2024                    ⭐⭐⭐⭐⭐ 4.8  │
│  (342 ratings)                                              │
│                                                             │
│  Quality Score: ████████░░ 85/100          🏷️ Contracts   │
│  Owner: John Doe                           🔓 Unclassified  │
│  Created: 2024-01-15 · Updated: 2 days ago                  │
│                                                             │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────┐│
│  │Overview │ Schema  │ Quality │ Lineage │  Usage  │Activity│
│  └─────────┴─────────┴─────────┴─────────┴─────────┴─────┘│
│                                                             │
│  ──────────────── Overview ────────────────                │
│                                                             │
│  Description:                                               │
│  Monthly contract spend aggregated by vendor, including     │
│  obligated, expended, and remaining funds. Updated daily    │
│  from WAWF and ERP systems.                                 │
│                                                             │
│  Tags: #contracts #spend #financial #monthly #vendor        │
│                                                             │
│  Source: Production DynamoDB (contracts-prod)               │
│  Format: Parquet                                            │
│  Location: s3://dataops-prod/datasets/contract-spend-2024/  │
│  Size: 15.2 GB · Records: 2.4M                              │
│                                                             │
│  ──────────────── Recent Activity ──────────────           │
│                                                             │
│  🟢 Quality check passed (2 hours ago)                      │
│  💬 Sarah commented: "Great dataset, very clean!" (3h ago)  │
│  ⭐ Mike rated 5 stars (1 day ago)                          │
│  📝 Schema updated: added 'contract_type' column (2d ago)   │
│                                                             │
│  ──────────────── Reviews ──────────────                   │
│                                                             │
│  ⭐⭐⭐⭐⭐ Sarah Johnson · 3 hours ago                        │
│  "Excellent data quality and very well documented. Used     │
│  this for Q4 spend analysis and it was perfect."            │
│  👍 12  💬 Reply                                            │
│                                                             │
│  ⭐⭐⭐⭐☆ Mike Chen · 1 day ago                              │
│  "Good dataset but missing some CLINs from older contracts."│
│  👍 5  💬 Reply                                             │
│                                                             │
│  [Write a review...]                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## API Actions

### searchDatasets(query, filters, sort, page)

**Purpose**: Search for datasets across the catalog

**Input**:
```typescript
{
  query: string                     // Search text
  filters?: {
    domain?: string[]               // Filter by domain
    classification?: string[]       // U, C, S, TS
    qualityScore?: { min: number, max: number }
    owner?: string[]
    tags?: string[]
  }
  sort?: "relevance" | "quality" | "usage" | "date"
  page?: number
  limit?: number
}
```

**Output**:
```typescript
{
  datasets: Dataset[]
  total: number
  page: number
  hasMore: boolean
}
```

**Example**:
```typescript
const results = await searchDatasets({
  query: "contract spend",
  filters: {
    domain: ["contracts"],
    qualityScore: { min: 70, max: 100 }
  },
  sort: "quality",
  page: 1,
  limit: 50
});
```

### getDataset(id)

**Purpose**: Fetch complete dataset profile

**Input**:
```typescript
{
  id: string                        // Dataset ID
}
```

**Output**:
```typescript
{
  dataset: Dataset
  lineage: {
    upstream: Dataset[]
    downstream: DataProduct[]
  }
  usage: {
    views: number
    downloads: number
    topUsers: User[]
    accessHistory: Access[]
  }
  activity: Activity[]
  reviews: Review[]
}
```

### rateDataset(datasetId, rating, comment?)

**Purpose**: Submit a rating and optional review

**Input**:
```typescript
{
  datasetId: string
  rating: 1 | 2 | 3 | 4 | 5
  comment?: string
}
```

**Output**:
```typescript
{
  success: boolean
  newAverageRating: number
  reviewId: string
}
```

### createDataSource(config)

**Purpose**: Register a new data source

**Input**:
```typescript
{
  type: "s3" | "aurora" | "dynamodb" | "glue" | "databricks" | "snowflake"
  name: string
  description: string
  connectionInfo: {
    host?: string
    port?: number
    database?: string
    credentials: string             // Secrets Manager ARN
  }
  domain: string
  owner: string
  tags: string[]
}
```

**Output**:
```typescript
{
  success: boolean
  dataSourceId: string
  connectionStatus: "active" | "error"
}
```

### syncDataSource(dataSourceId)

**Purpose**: Sync metadata from data source (discover tables/schemas)

**Input**:
```typescript
{
  dataSourceId: string
  fullSync?: boolean                // Default: incremental
}
```

**Output**:
```typescript
{
  success: boolean
  datasetsCreated: number
  datasetsUpdated: number
  errors: string[]
}
```

## Implementation Notes

### Search Implementation

**Option 1: Kendra + DynamoDB (Recommended)**
- Use AWS Kendra for semantic search (natural language understanding)
- Index dataset metadata (name, description, tags, columns)
- Use DynamoDB GSIs for filtering (domain, classification, quality)
- Merge results from both sources, sort by relevance + quality

**Option 2: OpenSearch**
- Use OpenSearch for full-text and semantic search
- Build custom relevance scoring
- More control but higher maintenance

**Recommendation**: Start with Kendra (easier), migrate to OpenSearch if needed

### Ratings Aggregation

Store ratings in separate table for fast queries:
```typescript
Table: dataops-rating
PK: datasetId
SK: userId
Attributes: rating, comment, createdAt

GSI: userId-index (query all ratings by user)
```

Aggregate on write:
- When rating submitted, update dataset.ratings.averageRating
- Use DynamoDB atomic counters for totalRatings
- Update quality score based on ratings (20% weight)

### Activity Feed Performance

**Challenge**: Activity feed can grow large quickly

**Solution**:
- Store in DynamoDB with TTL (30 days)
- Use GSI for sorting by createdAt (desc)
- Implement pagination (50 items per page)
- Cache recent activity in Redis (last 100 items)
- Use WebSocket for real-time updates (or 10-second polling)

### Data Source Connection Testing

Implement test functions for each source type:
```typescript
async function testS3Connection(config) {
  // Try to list buckets
  const s3 = new S3Client({ credentials: ... });
  await s3.send(new ListBucketsCommand({}));
  return { status: "success" };
}

async function testAuroraConnection(config) {
  // Try to connect and run simple query
  const client = new Client({ ...config });
  await client.connect();
  await client.query("SELECT 1");
  return { status: "success" };
}
```

## Testing

### Unit Tests
- `searchDatasets()` with various filters
- `getDataset()` returns complete profile
- `rateDataset()` updates average correctly
- `syncDataSource()` discovers all tables

### Integration Tests
- End-to-end search flow
- Profile page loads all sections
- Rating submission and aggregation
- Data source sync creates datasets

### Performance Tests
- Search with 10,000+ datasets (<2s)
- Profile page load (<1s)
- 1,000 concurrent searches
- Activity feed pagination (100k items)

### User Acceptance Tests
- User can find relevant dataset in <10 seconds
- User can rate and review dataset
- User can connect new data source
- Activity feed shows recent changes

## Dependencies

- **Phase 1**: Ontology, tables, services must be complete
- **Core Services**: apiClient, ontology resolution
- **AWS Services**: DynamoDB, Kendra, S3, Secrets Manager
- **UI Components**: DataTable, SearchInput, Card, Badge, Avatar

## Success Metrics

- **Discovery Time**: <10 seconds to find relevant dataset (target: 93% reduction from 30+ minutes)
- **Search Performance**: <2 seconds for any search query
- **Catalog Coverage**: 100+ datasets cataloged within 2 weeks
- **User Engagement**: 70% of datasets rated within 30 days
- **Quality Visibility**: 100% of datasets have quality scores
- **User Satisfaction**: 90% positive ratings for catalog experience

## Related Features

- [02-pipeline-builder.md](./02-pipeline-builder.md) - Build data products from datasets
- [03-quality-engine.md](./03-quality-engine.md) - Quality scoring and validation
- [04-lineage-graph.md](./04-lineage-graph.md) - Visual lineage tracking
