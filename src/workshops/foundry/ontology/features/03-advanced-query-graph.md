# Feature 3: Advanced Query & Graph Features

**Status**: ❌ Not Started
**Priority**: P2 (Medium)
**Story Points**: 13
**Depends On**: Feature 1 (Ontology Viewer), Feature 2 (DataOps)

## Overview

Build advanced querying and graph traversal capabilities that enable users to explore relationships, perform complex queries, and visualize data connections across the ontology. This includes graph traversal, aggregations, path finding, and visual query building.

## Requirements

### Functional Requirements

1. **Graph Traversal**
   - Follow edges between nodes (hasMany, belongsTo, references)
   - Multi-hop traversal (e.g., Contract → CLIN → Funding)
   - Depth-limited queries (1-5 hops)
   - Bidirectional traversal

2. **Visual Query Builder**
   - Drag-and-drop query interface
   - Filter by property values
   - Combine filters with AND/OR logic
   - Save queries as views

3. **Aggregations**
   - Count, sum, avg, min, max by property
   - Group by entity type or property
   - Time-based aggregations (by month, quarter, year)
   - Nested aggregations

4. **Path Finding**
   - Find all paths between two nodes
   - Shortest path between entities
   - Constrained path finding (specific edge types)

5. **Graph Analytics**
   - Degree centrality (most connected nodes)
   - Pagerank for importance
   - Connected components
   - Cycle detection

### Non-Functional Requirements

1. **Performance**: Queries complete in <3s for 100K nodes
2. **Scalability**: Handle graphs up to 1M nodes, 10M edges
3. **Caching**: Query result caching with 5-minute TTL

## Architecture

### Query Data Model

```typescript
interface OntologyQuery {
  id: string;                      // UUID
  name: string;                    // e.g., 'Active Contracts with CLINs'

  source: {
    type: string;                  // Entity type to start from (e.g., 'contract')
    filters?: QueryFilter[];       // Initial filters
  };

  traversal?: {
    edges: string[];               // Edge types to follow (e.g., ['hasMany'])
    depth: number;                 // Max hops (1-5)
    direction: 'forward' | 'backward' | 'both';
  };

  aggregations?: {
    field: string;
    operation: 'count' | 'sum' | 'avg' | 'min' | 'max';
    groupBy?: string;
  }[];

  limit?: number;
  offset?: number;

  app: string;
  createdAt: string;
  updatedAt: string;
}

interface QueryFilter {
  field: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'in' | 'between';
  value: any;
  logic?: 'AND' | 'OR';
}

interface GraphPath {
  nodes: string[];                 // Node IDs in path
  edges: string[];                 // Edge IDs connecting nodes
  length: number;                  // Number of hops
  weight?: number;                 // Optional path weight
}

interface QueryResult {
  nodes: OntologyNode[];
  edges: OntologyEdge[];
  aggregations?: Record<string, any>;
  paths?: GraphPath[];
  total: number;
  executionTime: number;           // Milliseconds
}
```

### Graph Traversal Engine

```typescript
// core/src/services/ontology/traversal.ts
import { ontology } from '@captify-io/core';

export async function traverse(
  startNodeId: string,
  edgeTypes: string[],
  depth: number,
  direction: 'forward' | 'backward' | 'both',
  credentials: AwsCredentials
): Promise<QueryResult> {
  const visited = new Set<string>();
  const nodes: OntologyNode[] = [];
  const edges: OntologyEdge[] = [];

  // BFS traversal
  const queue = [{ nodeId: startNodeId, level: 0 }];

  while (queue.length > 0) {
    const { nodeId, level } = queue.shift()!;

    if (visited.has(nodeId) || level > depth) continue;
    visited.add(nodeId);

    // Load node
    const node = await ontology.node.getById(nodeId, credentials);
    nodes.push(node);

    // Find connected edges
    const connectedEdges = await findEdges(nodeId, edgeTypes, direction, credentials);

    for (const edge of connectedEdges) {
      edges.push(edge);

      // Add target to queue
      const targetId = direction === 'backward' ? edge.source : edge.target;
      if (!visited.has(targetId)) {
        queue.push({ nodeId: targetId, level: level + 1 });
      }
    }
  }

  return {
    nodes,
    edges,
    total: nodes.length,
    executionTime: 0  // Set by caller
  };
}

async function findEdges(
  nodeId: string,
  edgeTypes: string[],
  direction: 'forward' | 'backward' | 'both',
  credentials: AwsCredentials
): Promise<OntologyEdge[]> {
  const edges: OntologyEdge[] = [];

  if (direction === 'forward' || direction === 'both') {
    const outgoing = await ontology.edge.query({
      IndexName: 'source-index',
      KeyConditionExpression: 'source = :nodeId',
      FilterExpression: edgeTypes.length > 0
        ? 'relation IN (:edgeTypes)'
        : undefined,
      ExpressionAttributeValues: {
        ':nodeId': nodeId,
        ...(edgeTypes.length > 0 && { ':edgeTypes': edgeTypes })
      }
    }, credentials);
    edges.push(...outgoing);
  }

  if (direction === 'backward' || direction === 'both') {
    const incoming = await ontology.edge.query({
      IndexName: 'target-index',
      KeyConditionExpression: 'target = :nodeId',
      FilterExpression: edgeTypes.length > 0
        ? 'relation IN (:edgeTypes)'
        : undefined,
      ExpressionAttributeValues: {
        ':nodeId': nodeId,
        ...(edgeTypes.length > 0 && { ':edgeTypes': edgeTypes })
      }
    }, credentials);
    edges.push(...incoming);
  }

  return edges;
}
```

### Path Finding

```typescript
// core/src/services/ontology/pathfinding.ts
export async function findShortestPath(
  startNodeId: string,
  endNodeId: string,
  edgeTypes: string[],
  credentials: AwsCredentials
): Promise<GraphPath | null> {
  const visited = new Set<string>();
  const queue: { nodeId: string; path: string[]; edgePath: string[] }[] = [
    { nodeId: startNodeId, path: [startNodeId], edgePath: [] }
  ];

  while (queue.length > 0) {
    const { nodeId, path, edgePath } = queue.shift()!;

    if (nodeId === endNodeId) {
      return {
        nodes: path,
        edges: edgePath,
        length: path.length - 1
      };
    }

    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const edges = await findEdges(nodeId, edgeTypes, 'forward', credentials);

    for (const edge of edges) {
      if (!visited.has(edge.target)) {
        queue.push({
          nodeId: edge.target,
          path: [...path, edge.target],
          edgePath: [...edgePath, edge.id]
        });
      }
    }
  }

  return null; // No path found
}

export async function findAllPaths(
  startNodeId: string,
  endNodeId: string,
  maxDepth: number,
  credentials: AwsCredentials
): Promise<GraphPath[]> {
  const paths: GraphPath[] = [];

  function dfs(
    currentId: string,
    path: string[],
    edgePath: string[],
    visited: Set<string>
  ) {
    if (path.length > maxDepth + 1) return;

    if (currentId === endNodeId) {
      paths.push({
        nodes: [...path],
        edges: [...edgePath],
        length: path.length - 1
      });
      return;
    }

    visited.add(currentId);

    const edges = await findEdges(currentId, [], 'forward', credentials);

    for (const edge of edges) {
      if (!visited.has(edge.target)) {
        dfs(
          edge.target,
          [...path, edge.target],
          [...edgePath, edge.id],
          new Set(visited)
        );
      }
    }
  }

  await dfs(startNodeId, [startNodeId], [], new Set());

  return paths.sort((a, b) => a.length - b.length);
}
```

### Aggregation Engine

```typescript
// core/src/services/ontology/aggregation.ts
export async function aggregate(
  nodeType: string,
  aggregations: Array<{
    field: string;
    operation: 'count' | 'sum' | 'avg' | 'min' | 'max';
    groupBy?: string;
  }>,
  filters: QueryFilter[],
  credentials: AwsCredentials
): Promise<Record<string, any>> {
  // 1. Load ontology node to get table
  const node = await ontology.node.getById(nodeType, credentials);
  const table = node.properties.dataSource;

  // 2. Build filter expression
  const filterExpr = buildFilterExpression(filters);

  // 3. Scan table with filters
  const items = await dynamodb.execute({
    operation: 'scan',
    table,
    data: {
      FilterExpression: filterExpr.expression,
      ExpressionAttributeValues: filterExpr.values
    }
  }, credentials);

  // 4. Perform aggregations in-memory
  const results: Record<string, any> = {};

  for (const agg of aggregations) {
    if (agg.groupBy) {
      // Group by aggregation
      const grouped = groupBy(items, agg.groupBy);
      results[`${agg.operation}_${agg.field}_by_${agg.groupBy}`] = Object.entries(grouped).map(
        ([group, groupItems]) => ({
          [agg.groupBy]: group,
          [agg.operation]: performAggregation(groupItems, agg.field, agg.operation)
        })
      );
    } else {
      // Simple aggregation
      results[`${agg.operation}_${agg.field}`] = performAggregation(
        items,
        agg.field,
        agg.operation
      );
    }
  }

  return results;
}

function performAggregation(items: any[], field: string, operation: string): number {
  const values = items.map(item => item[field]).filter(v => v != null);

  switch (operation) {
    case 'count':
      return values.length;
    case 'sum':
      return values.reduce((sum, v) => sum + v, 0);
    case 'avg':
      return values.reduce((sum, v) => sum + v, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    default:
      return 0;
  }
}
```

## Data Model

**Tables**:
- `captify-core-ontology-query` (NEW) - Saved queries
  ```
  id (PK), name, source, traversal, aggregations, app, createdAt, updatedAt
  GSI: app-index (app)
  ```

- `captify-core-query-cache` (NEW) - Query result cache
  ```
  queryHash (PK), result, ttl
  TTL: 300 seconds (5 minutes)
  ```

## API Actions

### Execute Graph Query

```typescript
const result = await ontology.query.execute({
  source: {
    type: 'contract',
    filters: [
      { field: 'status', operator: 'equals', value: 'active' }
    ]
  },
  traversal: {
    edges: ['hasMany'],
    depth: 2,
    direction: 'forward'
  }
}, credentials);

// Returns: { nodes: [...], edges: [...], total: 42, executionTime: 1234 }
```

### Find Path

```typescript
const path = await ontology.query.findPath(
  'contract-123',     // Start node
  'funding-456',      // End node
  ['hasMany', 'references'],  // Edge types to follow
  credentials
);

// Returns: { nodes: ['contract-123', 'clin-789', 'funding-456'], edges: [...], length: 2 }
```

### Aggregate Data

```typescript
const stats = await ontology.query.aggregate(
  'contract',         // Node type
  [
    { field: 'totalValue', operation: 'sum', groupBy: 'status' },
    { field: 'id', operation: 'count', groupBy: 'fiscalYear' }
  ],
  [
    { field: 'status', operator: 'in', value: ['active', 'completed'] }
  ],
  credentials
);

// Returns:
// {
//   sum_totalValue_by_status: [
//     { status: 'active', sum: 12500000 },
//     { status: 'completed', sum: 45000000 }
//   ],
//   count_id_by_fiscalYear: [
//     { fiscalYear: '2024', count: 156 },
//     { fiscalYear: '2025', count: 203 }
//   ]
// }
```

### Save Query

```typescript
const query = await ontology.query.save({
  name: 'Active Contracts with Funding',
  source: {
    type: 'contract',
    filters: [
      { field: 'status', operator: 'equals', value: 'active' }
    ]
  },
  traversal: {
    edges: ['hasMany'],
    depth: 2,
    direction: 'forward'
  }
}, credentials);

// Execute saved query
const result = await ontology.query.executeSaved(query.id, credentials);
```

## UI/UX

### Query Builder Tab

```
┌────────────────────────────────────────────────────────────────┐
│ Ontology > Queries                                  [+ New]    │
├────────────────┬───────────────────────────────────────────────┤
│ Objects        │ Query Builder                                 │
│ Links          │                                               │
│ Actions        │ ┌─ Source ────────────────────────────────┐  │
│ DataOps        │ │ Start from: [Contract ▼]                │  │
│ > Queries      │ │                                          │  │
│   Saved        │ │ Filters:                   [+ Add]      │  │
│   History      │ │ • status = active                    [✕] │  │
│                │ │ • totalValue > 1000000               [✕] │  │
│                │ └──────────────────────────────────────────┘  │
│                │                                               │
│                │ ┌─ Traversal ─────────────────────────────┐  │
│                │ │ [✓] Follow relationships                 │  │
│                │ │                                          │  │
│                │ │ Edge Types: [hasMany ▼] [+ Add]        │  │
│                │ │ Depth:      [2 hops ▼]                  │  │
│                │ │ Direction:  [Forward ▼]                 │  │
│                │ └──────────────────────────────────────────┘  │
│                │                                               │
│                │ ┌─ Aggregations ──────────────────────────┐  │
│                │ │ [✓] Calculate aggregations               │  │
│                │ │                                          │  │
│                │ │ • SUM(totalValue) GROUP BY status        │  │
│                │ │ • COUNT(*) GROUP BY fiscalYear           │  │
│                │ └──────────────────────────────────────────┘  │
│                │                                               │
│                │                   [Save Query] [Execute ▶]   │
└────────────────┴───────────────────────────────────────────────┘
```

### Query Results

```
┌──────────────────────────────────────────────────────────────┐
│ Query: Active Contracts with Funding              [✏️] [✕]  │
├──────────────────────────────────────────────────────────────┤
│ Results: 42 nodes, 156 edges | Execution: 1.2s              │
│                                                               │
│ [Graph View] [Table View] [Aggregations]                    │
│                                                               │
│ ┌─ Graph Visualization ──────────────────────────────────┐  │
│ │                                                          │  │
│ │     ┌─────────┐                                         │  │
│ │     │Contract │                                         │  │
│ │     │  #123   │─┬─→ ┌──────┐                          │  │
│ │     └─────────┘ │   │ CLIN │                          │  │
│ │                 └─→ └──────┘─→ ┌────────┐            │  │
│ │                                 │ Funding│            │  │
│ │                                 └────────┘            │  │
│ │                                                          │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                               │
│ Aggregations:                                                │
│ ┌────────────┬───────────────┐                              │
│ │ Status     │ Total Value   │                              │
│ ├────────────┼───────────────┤                              │
│ │ Active     │ $12,500,000   │                              │
│ │ Completed  │ $45,000,000   │                              │
│ └────────────┴───────────────┘                              │
│                                                               │
│                              [Export CSV] [Export JSON]      │
└──────────────────────────────────────────────────────────────┘
```

## User Stories

### US-1: Graph Traversal

**As a** data analyst
**I want to** traverse relationships between entities
**So that** I can explore connected data

**Acceptance Criteria**:
- ✅ Select starting entity type
- ✅ Specify edge types to follow
- ✅ Set max depth (1-5 hops)
- ✅ Choose direction (forward/backward/both)
- ✅ View results in graph visualization

### US-2: Build Visual Query

**As a** business user
**I want to** build queries without writing code
**So that** I can explore data easily

**Acceptance Criteria**:
- ✅ Select entity type from dropdown
- ✅ Add filters with operators
- ✅ Combine filters with AND/OR
- ✅ Preview results
- ✅ Save query for reuse

### US-3: Find Path Between Entities

**As a** auditor
**I want to** find paths between two entities
**So that** I can trace connections

**Acceptance Criteria**:
- ✅ Select start and end entities
- ✅ Specify allowed edge types
- ✅ View shortest path
- ✅ View all paths up to depth limit
- ✅ Export path details

### US-4: Calculate Aggregations

**As a** analyst
**I want to** calculate statistics across entities
**So that** I can generate reports

**Acceptance Criteria**:
- ✅ Select aggregation (count, sum, avg, min, max)
- ✅ Group by property
- ✅ Apply filters
- ✅ View results in table
- ✅ Export to CSV/Excel

## Implementation Notes

### Week 1-2: Graph Traversal

```typescript
// core/src/services/ontology/query.ts
export async function execute(
  query: OntologyQuery,
  credentials: AwsCredentials
): Promise<QueryResult> {
  const startTime = Date.now();

  // Check cache
  const cacheKey = hashQuery(query);
  const cached = await getFromCache(cacheKey);
  if (cached) return cached;

  // Execute query
  let result: QueryResult;

  if (query.traversal) {
    result = await traverse(
      query.source.type,
      query.traversal.edges,
      query.traversal.depth,
      query.traversal.direction,
      credentials
    );
  } else {
    // Simple query without traversal
    result = await queryNodes(query.source.type, query.source.filters, credentials);
  }

  // Apply aggregations
  if (query.aggregations) {
    result.aggregations = await aggregate(
      query.source.type,
      query.aggregations,
      query.source.filters || [],
      credentials
    );
  }

  result.executionTime = Date.now() - startTime;

  // Cache result
  await saveToCache(cacheKey, result, 300); // 5 min TTL

  return result;
}
```

### Week 3: Path Finding & Analytics

```typescript
// Graph analytics
export async function calculateCentrality(
  nodeType: string,
  credentials: AwsCredentials
): Promise<Record<string, number>> {
  const edges = await ontology.edge.getAllEdges(credentials);

  // Calculate degree centrality
  const degrees: Record<string, number> = {};

  for (const edge of edges) {
    degrees[edge.source] = (degrees[edge.source] || 0) + 1;
    degrees[edge.target] = (degrees[edge.target] || 0) + 1;
  }

  return degrees;
}
```

## Testing

```typescript
describe('Graph Traversal', () => {
  it('traverses 2 hops from contract', async () => {
    const result = await ontology.query.execute({
      source: { type: 'contract' },
      traversal: { edges: ['hasMany'], depth: 2, direction: 'forward' }
    }, credentials);

    expect(result.nodes.length).toBeGreaterThan(0);
    expect(result.edges.length).toBeGreaterThan(0);
  });

  it('finds shortest path between nodes', async () => {
    const path = await ontology.query.findPath('contract-123', 'funding-456', [], credentials);

    expect(path).toBeDefined();
    expect(path.nodes[0]).toBe('contract-123');
    expect(path.nodes[path.nodes.length - 1]).toBe('funding-456');
  });

  it('calculates aggregations', async () => {
    const stats = await ontology.query.aggregate(
      'contract',
      [{ field: 'totalValue', operation: 'sum', groupBy: 'status' }],
      [],
      credentials
    );

    expect(stats.sum_totalValue_by_status).toBeDefined();
  });
});
```

## Dependencies

- Feature 1: Ontology Viewer (for UI)
- Feature 2: DataOps (for populated data)
- `core/src/services/ontology/node.ts`
- `core/src/services/ontology/edge.ts`
- Graph algorithms library (optional: `graphology`)

## Success Metrics

- ✅ 100+ queries saved by users
- ✅ 90%+ queries complete in <3s
- ✅ 50%+ queries use graph traversal
- ✅ Cache hit rate >70%

## Related Features

- Feature 1: Ontology Viewer (provides graph visualization)
- Feature 2: DataOps (provides data to query)
