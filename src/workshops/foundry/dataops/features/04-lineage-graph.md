# Feature: Intelligent Lineage Graph

## Overview

The Lineage Graph provides visual, interactive tracking of data flows from sources through transformations to products. Think of it as a "social graph for data" - see exactly where data comes from, how it's transformed, and who uses it.

**Feature ID**: 04
**Priority**: P0 - Critical (transparency is essential for trust)
**Story Points**: 75 (part of Phase 4)
**Dependencies**: Phase 1 (Foundation), Feature 01 (Data Catalog), Feature 02 (Pipeline Builder)
**Implementation Phase**: Phase 4 (Weeks 18-20)

## Requirements

### Functional Requirements

#### FR-1: Automatic Lineage Capture
- Auto-detect lineage from pipeline executions
- Create lineage records when pipeline runs
- Track source → transformation → destination relationships
- Store column-level lineage (which columns feed which)
- Support manual lineage creation for external processes

#### FR-2: Interactive Lineage Graph
- Visual graph using @xyflow/react
- Nodes: datasets, data products, data sources
- Edges: data flows with transformation labels
- Interactive: zoom, pan, fit-to-screen, search
- Expand/collapse nodes to show/hide details
- Filter by domain, classification, quality score
- Highlight paths (e.g., "source to specific product")

#### FR-3: Upstream/Downstream Analysis
- **Upstream**: Show all sources that feed a dataset/product
- **Downstream**: Show all products that consume a dataset
- Recursive traversal (multi-level lineage)
- Count total upstream sources and downstream products
- Show lineage depth (how many hops)

#### FR-4: Impact Analysis
- "What breaks if I change/delete this dataset?"
- Find all downstream dependencies
- Estimate impact radius (# affected datasets/products)
- Identify breaking changes (schema changes that affect consumers)
- Generate impact report with affected users
- Confirmation dialog before making changes

#### FR-5: Column-Level Lineage
- Track how individual columns transform through pipeline
- Show which source columns feed destination columns
- Display transformation logic for each column
- Support joins (multiple source columns → one destination column)
- Support splits (one source column → multiple destination columns)

#### FR-6: Cross-System Lineage
- Track lineage across multiple systems:
  - Databricks → DataOps → S3
  - Snowflake → DataOps → Aurora
  - Glue → DataOps → Kendra
- Color-code by system (blue=Databricks, purple=Snowflake, orange=AWS)
- Show system boundaries in graph

#### FR-7: Time-Travel Lineage
- View lineage at specific point in time
- See historical lineage before changes
- Compare lineage between versions
- Track lineage changes over time

### Non-Functional Requirements

#### NFR-1: Performance
- Render graph with 1,000+ nodes in <3 seconds
- Calculate upstream lineage in <2 seconds
- Calculate downstream lineage in <2 seconds
- Impact analysis completes in <5 seconds

#### NFR-2: Scalability
- Support 10,000+ datasets with lineage
- Handle 100,000+ lineage relationships
- Recursive traversal up to 20 levels deep
- Graph rendering remains responsive with large datasets

#### NFR-3: Accuracy
- 100% accurate lineage for pipelines created in DataOps
- >95% accurate lineage for external processes (via metadata scanning)
- No missing links in lineage chain
- Clear indicators when lineage is incomplete

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  Lineage Engine                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │  Lineage   │  │   Graph    │  │     Impact         │   │
│  │  Tracker   │  │  Builder   │  │     Analyzer       │   │
│  └─────┬──────┘  └─────┬──────┘  └─────────┬──────────┘   │
│        │               │                    │              │
│        └───────────────┴────────────────────┘              │
│                        │                                    │
│                ┌───────▼────────┐                           │
│                │  Lineage Graph │                           │
│                │    Renderer    │                           │
│                │ (@xyflow/react)│                           │
│                └────────────────┘                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                   Storage Layer                             │
├─────────────────────────────────────────────────────────────┤
│         │                                                   │
│  ┌──────▼───────────────────────────┐                      │
│  │       DynamoDB                   │                      │
│  │  dataops-lineage table           │                      │
│  │  - source-index                  │                      │
│  │  - target-index                  │                      │
│  └──────────────────────────────────┘                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Model

### Lineage Entity

```typescript
{
  id: string                        // "lineage-{source}-{target}"
  sourceId: string                  // Dataset or DataProduct ID
  sourceType: "dataset" | "dataproduct" | "datasource"
  targetId: string                  // Dataset or DataProduct ID
  targetType: "dataset" | "dataproduct"
  relationType: "derives_from" | "feeds_into" | "references"

  // Transformation details
  transformations: Array<{
    type: "filter" | "join" | "aggregate" | "pivot" | "custom"
    description: string
    code: string                    // SQL or Python code
    nodeId?: string                 // Pipeline node ID
  }>

  // Column-level lineage
  columnMapping: Array<{
    sourceColumns: string[]         // Source column names
    targetColumn: string            // Target column name
    transformation: string          // How columns are combined
  }>

  // Metadata
  pipelineId?: string               // If from pipeline
  createdBy: string                 // "system" or user ID
  createdAt: string
  updatedAt: string
  version: string                   // For time-travel
}
```

### Lineage Graph (in-memory structure)

```typescript
interface LineageGraph {
  nodes: Map<string, LineageNode>
  edges: Map<string, LineageEdge>
}

interface LineageNode {
  id: string
  type: "dataset" | "dataproduct" | "datasource"
  data: Dataset | DataProduct | DataSource
  position: { x: number, y: number }
  metadata: {
    qualityScore: number
    classification: string
    owner: string
    lastUpdated: string
  }
}

interface LineageEdge {
  id: string
  source: string
  target: string
  label: string                     // Transformation summary
  type: "derives_from" | "feeds_into" | "references"
  transformations: Array<any>
}
```

## UI/UX

### Lineage Graph View Mockup

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Lineage: Contract Spend Analysis                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [🔍 Search]  [🎯 Focus On...]  [⚡ Show Impact]  [🕐 Time: Latest ▼]  │
│                                                                         │
│  Filters: ☑️ Datasets  ☑️ Products  ☐ Sources                           │
│           ☐ Domain: Contracts  ☐ Quality: >70  ☐ Classification: U     │
│                                                                         │
│  ────────────────────────────────────────────────────────────────────  │
│                                                                         │
│                        Lineage Graph                                    │
│                                                                         │
│                   [Databricks]                                          │
│                       │                                                 │
│                       │ ETL Job                                         │
│                       ↓                                                 │
│               ┌───────────────┐                                         │
│               │   Contracts   │ Quality: 92/100                         │
│               │   Raw Data    │ 🔓 Unclassified                         │
│               └───────┬───────┘                                         │
│                       │                                                 │
│                       │ Filter (amount > 0)                             │
│                       ↓                                                 │
│               ┌───────────────┐                                         │
│               │Contract Spend │ Quality: 85/100                         │
│               │     2024      │ 🔓 Unclassified                         │
│               └───────┬───────┘                                         │
│                       │                                                 │
│          ┌────────────┼────────────┐                                    │
│          │            │            │                                    │
│    Aggregate     Join with    Export to                                │
│          │       Vendors        │                                       │
│          ↓            ↓         ↓                                       │
│    ┌─────────┐  ┌─────────┐ ┌─────────┐                               │
│    │Quarterly│  │ Vendor  │ │   S3    │                               │
│    │ Report  │  │Analysis │ │Dashboard│                               │
│    └─────────┘  └─────────┘ └─────────┘                               │
│                                                                         │
│  ────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Selected: Contract Spend 2024                                          │
│                                                                         │
│  Upstream Sources: 2 datasets                                           │
│  - Contracts Raw Data (Databricks)                                     │
│  - Historical Spend Archive (S3)                                        │
│                                                                         │
│  Downstream Products: 3 data products                                   │
│  - Quarterly Spend Report                                              │
│  - Vendor Performance Analysis                                          │
│  - Executive Dashboard (QuickSight)                                     │
│                                                                         │
│  Impact Radius: 5 datasets, 12 users affected                          │
│  [View Impact Analysis]                                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Impact Analysis Modal Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ Impact Analysis: Contract Spend 2024                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠️ Warning: Changing or deleting this dataset will affect  │
│  downstream data products and users.                        │
│                                                             │
│  ────────── Downstream Impact ──────────                    │
│                                                             │
│  📊 Affected Data Products: 3                               │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ • Quarterly Spend Report                              │ │
│  │   Owner: John Doe · Last used: 2 hours ago            │ │
│  │   Impact: High - breaking change (schema modified)    │ │
│  │                                                        │ │
│  │ • Vendor Performance Analysis                         │ │
│  │   Owner: Jane Smith · Last used: 5 hours ago          │ │
│  │   Impact: Medium - may need adjustment                │ │
│  │                                                        │ │
│  │ • Executive Dashboard (QuickSight)                    │ │
│  │   Owner: Mike Chen · Last used: 1 day ago             │ │
│  │   Impact: High - will break visualizations            │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  👥 Affected Users: 12                                      │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ • John Doe (Owner of 1 product)                       │ │
│  │ • Jane Smith (Owner of 1 product)                     │ │
│  │ • Mike Chen (Owner of 1 product)                      │ │
│  │ • Sarah Johnson (Uses 2 products)                     │ │
│  │ • ... and 8 more users                                │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  📧 Notification Preview                                    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Subject: [DataOps Alert] Dataset Change Impact        │ │
│  │                                                        │ │
│  │ The dataset "Contract Spend 2024" that you use in     │ │
│  │ your data product will be modified on 2024-01-20.     │ │
│  │                                                        │ │
│  │ Impact: High - Schema changed (column removed)        │ │
│  │ Action required: Update your data product pipeline    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ☑️ Notify all affected users                               │
│  ☑️ Require acknowledgment before proceeding                │
│                                                             │
│  [Cancel]                              [Proceed with Change]│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Column-Level Lineage Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ Column Lineage: contract_id                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Showing lineage for column: contract_id                    │
│  in dataset: Contract Spend 2024                            │
│                                                             │
│  ────────── Source Columns ──────────                       │
│                                                             │
│  📄 Contracts Raw Data.contract_number                      │
│     └─> UPPER(contract_number) → contract_id               │
│     Transformation: Convert to uppercase, trim whitespace   │
│     Node: Transform (Pipeline Step 2)                       │
│                                                             │
│  ────────── Downstream Usage ──────────                     │
│                                                             │
│  Used in 3 data products:                                   │
│                                                             │
│  1. Quarterly Spend Report                                  │
│     └─> contract_id (no transformation)                     │
│                                                             │
│  2. Vendor Performance Analysis                             │
│     └─> JOIN ON contracts.contract_id                       │
│                                                             │
│  3. Executive Dashboard                                     │
│     └─> GROUP BY contract_id                                │
│                                                             │
│  [View Full Lineage Graph]                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## API Actions

### createLineage(lineage)

**Purpose**: Create lineage record (usually automatic)

**Input**:
```typescript
{
  sourceId: string
  sourceType: "dataset" | "dataproduct" | "datasource"
  targetId: string
  targetType: "dataset" | "dataproduct"
  transformations: Array<{
    type: string
    description: string
    code: string
  }>
  columnMapping: Array<{
    sourceColumns: string[]
    targetColumn: string
    transformation: string
  }>
  pipelineId?: string
}
```

**Output**:
```typescript
{
  success: boolean
  lineageId: string
}
```

### getLineageGraph(entityId, options)

**Purpose**: Build lineage graph for entity

**Input**:
```typescript
{
  entityId: string                  // Dataset or DataProduct ID
  direction: "upstream" | "downstream" | "both"
  maxDepth: number                  // Default: 10
  filters?: {
    domain?: string[]
    classification?: string[]
    qualityMin?: number
  }
}
```

**Output**:
```typescript
{
  success: boolean
  graph: {
    nodes: Array<{
      id: string
      type: string
      data: any
      position: { x: number, y: number }
    }>
    edges: Array<{
      id: string
      source: string
      target: string
      label: string
    }>
  }
  stats: {
    totalNodes: number
    totalEdges: number
    maxDepth: number
  }
}
```

### analyzeImpact(entityId, changeType)

**Purpose**: Analyze impact of changes

**Input**:
```typescript
{
  entityId: string
  changeType: "delete" | "schema_change" | "deprecate"
  changes?: {
    columnsAdded?: string[]
    columnsRemoved?: string[]
    columnsModified?: string[]
  }
}
```

**Output**:
```typescript
{
  success: boolean
  impact: {
    affectedDataProducts: Array<{
      id: string
      name: string
      owner: string
      lastUsed: string
      impactLevel: "low" | "medium" | "high" | "critical"
      breakingChange: boolean
      reason: string
    }>
    affectedUsers: Array<{
      id: string
      name: string
      email: string
      productsOwned: number
      productsUsed: number
    }>
    impactRadius: {
      datasets: number
      dataProducts: number
      users: number
    }
  }
}
```

### getColumnLineage(datasetId, columnName)

**Purpose**: Get column-level lineage

**Input**:
```typescript
{
  datasetId: string
  columnName: string
  direction: "upstream" | "downstream" | "both"
}
```

**Output**:
```typescript
{
  success: boolean
  lineage: {
    upstream: Array<{
      datasetId: string
      columnName: string
      transformation: string
    }>
    downstream: Array<{
      dataProductId: string
      columnName: string
      usage: string
    }>
  }
}
```

## Implementation Notes

### Automatic Lineage Capture

When pipeline executes, automatically create lineage:
```typescript
async function executePipeline(dataProductId: string) {
  const dataProduct = await getDataProduct(dataProductId);
  const pipeline = dataProduct.pipeline;

  // 1. Execute pipeline
  const result = await glue.runJob({
    JobName: `dataops-${dataProductId}`,
    Arguments: { ... }
  });

  // 2. Extract lineage from pipeline
  const lineages = extractLineageFromPipeline(pipeline);

  // 3. Create lineage records
  for (const lineage of lineages) {
    await createLineage({
      sourceId: lineage.source,
      targetId: lineage.target,
      transformations: lineage.transformations,
      columnMapping: lineage.columnMapping,
      pipelineId: dataProductId
    });
  }
}

function extractLineageFromPipeline(pipeline: Pipeline) {
  const lineages = [];

  // Walk through nodes to build lineage
  for (const edge of pipeline.edges) {
    const sourceNode = pipeline.nodes.find(n => n.id === edge.source);
    const targetNode = pipeline.nodes.find(n => n.id === edge.target);

    if (sourceNode && targetNode) {
      lineages.push({
        source: sourceNode.data.datasetId,
        target: targetNode.data.datasetId,
        transformations: extractTransformations(sourceNode, targetNode),
        columnMapping: extractColumnMapping(sourceNode, targetNode)
      });
    }
  }

  return lineages;
}
```

### Building Lineage Graph (Recursive Traversal)

```typescript
async function buildLineageGraph(
  entityId: string,
  direction: "upstream" | "downstream" | "both",
  maxDepth: number = 10
) {
  const visited = new Set<string>();
  const nodes = new Map<string, LineageNode>();
  const edges: LineageEdge[] = [];

  // Recursive traversal
  async function traverse(id: string, depth: number) {
    if (depth > maxDepth || visited.has(id)) return;
    visited.add(id);

    // Get entity
    const entity = await getEntity(id);
    nodes.set(id, {
      id,
      type: entity.type,
      data: entity,
      position: calculatePosition(id, depth)
    });

    // Get connected lineages
    const lineages = direction === "upstream"
      ? await getUpstreamLineages(id)
      : direction === "downstream"
      ? await getDownstreamLineages(id)
      : await getAllLineages(id);

    for (const lineage of lineages) {
      edges.push({
        id: lineage.id,
        source: lineage.sourceId,
        target: lineage.targetId,
        label: summarizeTransformations(lineage.transformations)
      });

      // Recurse
      const nextId = direction === "upstream" ? lineage.sourceId : lineage.targetId;
      await traverse(nextId, depth + 1);
    }
  }

  await traverse(entityId, 0);

  return {
    nodes: Array.from(nodes.values()),
    edges
  };
}
```

### Impact Analysis

```typescript
async function analyzeImpact(entityId: string, changeType: string) {
  // 1. Build downstream lineage graph
  const graph = await buildLineageGraph(entityId, "downstream", 20);

  // 2. Find all affected data products
  const affectedProducts = graph.nodes
    .filter(n => n.type === "dataproduct")
    .map(n => n.data as DataProduct);

  // 3. Determine impact level for each product
  const impacts = affectedProducts.map(product => {
    const impactLevel = determineImpactLevel(product, changeType);
    const breakingChange = isBreakingChange(product, changeType);

    return {
      id: product.id,
      name: product.name,
      owner: product.owner,
      lastUsed: product.execution.lastRunAt,
      impactLevel,
      breakingChange,
      reason: explainImpact(product, changeType)
    };
  });

  // 4. Find all affected users
  const affectedUsers = [...new Set(impacts.map(i => i.owner))];

  return {
    affectedDataProducts: impacts,
    affectedUsers: affectedUsers.map(userId => getUser(userId)),
    impactRadius: {
      datasets: graph.nodes.filter(n => n.type === "dataset").length,
      dataProducts: impacts.length,
      users: affectedUsers.length
    }
  };
}
```

### Graph Layout Algorithm

Use hierarchical layout for lineage:
```typescript
function calculatePosition(nodeId: string, depth: number): { x: number, y: number } {
  // Hierarchical layout: left-to-right
  const x = depth * 250;  // Horizontal spacing
  const y = getNodeIndexAtDepth(nodeId, depth) * 150;  // Vertical spacing

  return { x, y };
}
```

## Testing

### Unit Tests
- Lineage creation and retrieval
- Graph traversal (upstream/downstream)
- Impact analysis calculation
- Column lineage tracking

### Integration Tests
- End-to-end lineage capture from pipeline execution
- Graph rendering with 1000+ nodes
- Impact analysis with deep lineage (20+ levels)

### Performance Tests
- Build graph with 10,000 nodes (<5s)
- Traverse 20 levels deep (<3s)
- Calculate impact with 100+ downstream products (<5s)

## Success Metrics

- **Lineage Coverage**: 95%+ of datasets have complete lineage within 1 week
- **Accuracy**: 100% accurate lineage for DataOps pipelines
- **Performance**: Graph rendering with 1000+ nodes in <3 seconds
- **User Adoption**: 80% of users view lineage before making changes
- **Prevented Errors**: 50% reduction in "data broke downstream" incidents

## Related Features

- [01-data-catalog.md](./01-data-catalog.md) - Display lineage mini-graph in profiles
- [02-pipeline-builder.md](./02-pipeline-builder.md) - Auto-generate lineage from pipelines
- [03-quality-engine.md](./03-quality-engine.md) - Propagate quality through lineage
