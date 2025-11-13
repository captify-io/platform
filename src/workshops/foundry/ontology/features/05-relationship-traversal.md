# Feature 5: Interactive Relationship Traversal

**Status**: ❌ Not Started
**Priority**: P0 (Critical)
**Story Points**: 13
**Estimated Hours**: 40

## Overview

Add "search around" functionality to dynamically expand connections from any node, enabling users to discover indirect relationships and explore data paths interactively. Users can right-click nodes to expand connections 1, 2, or N hops away with type filtering and path pattern matching.

**Problem**: Current implementation shows all edges statically. Users cannot interactively explore connections, discover indirect relationships (A → B → C), or filter what gets expanded.

**Solution**: Implement multi-hop traversal with an interactive expansion dialog, path finding algorithms, and traversal templates for reusable exploration patterns.

## Requirements

### Functional Requirements

1. **Search Around Feature**
   - Right-click node → "Expand Connections" context menu
   - Dialog shows all possible relationship types with counts
   - Select relationship types to expand onto canvas
   - Multi-select with checkboxes

2. **Multi-Hop Traversal**
   - "Expand 1 hop" (direct connections)
   - "Expand 2 hops" (connections of connections)
   - "Expand N hops" (configurable depth)
   - Filter by path patterns (A → B → C)
   - Highlight shortest paths between two nodes

3. **Relationship Type Filtering**
   - Checkbox filters for each relationship type
   - Show/hide relationship categories
   - Filter by direction (outgoing, incoming, both)
   - Persistent filter state

4. **Traversal Templates**
   - Save current traversal pattern as template
   - Quick apply saved templates
   - Share templates with team
   - Examples: "Contract Dependencies", "User Access Paths"

5. **Path Visualization**
   - Highlight active path on canvas
   - Show path distance/hop count
   - Multiple path options if available
   - Critical path identification

### Non-Functional Requirements

1. **Performance**: Expand 1-hop in <500ms, 2-hop in <2s
2. **Scalability**: Handle nodes with 50+ direct connections
3. **Caching**: Cache graph structure for 5 minutes
4. **Responsiveness**: Update UI in <100ms during expansion

## Architecture

### Component Structure

```
platform/src/app/ontology/components/
├── search-around-dialog.tsx       - Expansion options dialog
├── path-finder-dialog.tsx         - Find paths between nodes
├── traversal-template-dialog.tsx  - Save/load templates
├── relationship-filter-panel.tsx  - Filter relationships
├── path-highlighter.tsx           - Highlight paths on canvas
└── expansion-controls.tsx         - Hop count controls
```

### Service Functions

```
core/src/services/ontology/
└── traversal.ts                   - Graph traversal algorithms
    ├── expandNode()               - Expand N hops from node
    ├── findPaths()                - Find paths between nodes
    ├── findShortestPath()         - BFS shortest path
    ├── findAllPaths()             - DFS all paths
    └── getConnectedComponent()    - Get all reachable nodes
```

### Data Flow

```
User Right-Clicks Node
  ↓
Get Available Relationships (ontology.edge.getForNode)
  ↓
Show Search Around Dialog with Counts
  ↓
User Selects Relationship Types
  ↓
Traverse Graph (traversal.expandNode)
  ↓
Add New Nodes/Edges to Canvas
  ↓
Apply Auto-Layout
```

### State Management

```typescript
interface TraversalState {
  expandedNodes: Set<string>;
  activeFilters: {
    relationshipTypes: string[];
    direction: 'outgoing' | 'incoming' | 'both';
    maxDepth: number;
  };
  activePath: {
    nodes: string[];
    edges: string[];
    distance: number;
  } | null;
  savedTemplates: TraversalTemplate[];
}

interface TraversalTemplate {
  id: string;
  name: string;
  description: string;
  filters: {
    relationshipTypes: string[];
    direction: string;
    maxDepth: number;
  };
  createdBy: string;
  createdAt: string;
}
```

## Data Model

**Existing Tables** (reuse):
- `{schema}-core-ontology-node` - Nodes
- `{schema}-core-ontology-edge` - Edges

**New Tables**:
- `{schema}-core-ontology-traversal-template` - Saved traversal patterns

```typescript
interface OntologyTraversalTemplate {
  id: string;                      // UUID
  name: string;                    // "Contract Dependencies"
  description: string;             // Human-readable description
  filters: {
    relationshipTypes: string[];   // ['hasMany', 'funds']
    direction: 'outgoing' | 'incoming' | 'both';
    maxDepth: number;              // 1, 2, 3, etc.
  };
  startNodeTypes: string[];        // Types this template works with
  shared: boolean;                 // Public template?
  createdBy: string;               // User ID
  createdAt: string;               // ISO 8601
  updatedAt: string;
}
```

## API Actions

### Expand Node Connections

```typescript
/**
 * Expands connections from a node to specified depth
 * @param nodeId - Starting node ID
 * @param relationshipTypes - Filter by these relationship types (empty = all)
 * @param depth - How many hops (1, 2, 3, etc.)
 * @param direction - Which direction to traverse
 * @param credentials - AWS credentials
 * @returns Discovered nodes and edges
 */
export async function expandNode(
  nodeId: string,
  relationshipTypes: string[],
  depth: number,
  direction: 'outgoing' | 'incoming' | 'both',
  credentials: AwsCredentials
): Promise<{ nodes: OntologyNode[]; edges: OntologyEdge[] }> {
  const discoveredNodes = new Map<string, OntologyNode>();
  const discoveredEdges = new Map<string, OntologyEdge>();
  const visited = new Set<string>();
  const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId, depth: 0 }];

  while (queue.length > 0) {
    const { nodeId: currentId, depth: currentDepth } = queue.shift()!;

    if (visited.has(currentId) || currentDepth >= depth) {
      continue;
    }

    visited.add(currentId);

    // Get node
    const node = await getNode(currentId, credentials);
    if (node) {
      discoveredNodes.set(currentId, node);
    }

    // Get edges
    const edges = await getEdgesForNode(currentId, credentials);

    for (const edge of edges) {
      // Apply filters
      if (relationshipTypes.length > 0 && !relationshipTypes.includes(edge.relation)) {
        continue;
      }

      // Check direction
      if (direction === 'outgoing' && edge.source !== currentId) continue;
      if (direction === 'incoming' && edge.target !== currentId) continue;

      discoveredEdges.set(edge.id, edge);

      // Add next node to queue
      const nextNodeId = edge.source === currentId ? edge.target : edge.source;
      if (!visited.has(nextNodeId)) {
        queue.push({ nodeId: nextNodeId, depth: currentDepth + 1 });
      }
    }
  }

  return {
    nodes: Array.from(discoveredNodes.values()),
    edges: Array.from(discoveredEdges.values())
  };
}
```

### Find Paths Between Nodes

```typescript
/**
 * Finds all paths between two nodes
 * @param sourceId - Start node
 * @param targetId - End node
 * @param maxDepth - Maximum path length
 * @param credentials - AWS credentials
 * @returns Array of paths
 */
export async function findPaths(
  sourceId: string,
  targetId: string,
  maxDepth: number,
  credentials: AwsCredentials
): Promise<Path[]> {
  const paths: Path[] = [];
  const visited = new Set<string>();

  async function dfs(
    currentId: string,
    target: string,
    depth: number,
    path: { nodes: string[]; edges: string[] }
  ) {
    if (depth > maxDepth) return;
    if (currentId === target) {
      paths.push({ ...path, distance: depth });
      return;
    }
    if (visited.has(currentId)) return;

    visited.add(currentId);

    const edges = await getEdgesForNode(currentId, credentials);
    for (const edge of edges) {
      const nextNode = edge.source === currentId ? edge.target : edge.source;
      await dfs(
        nextNode,
        target,
        depth + 1,
        {
          nodes: [...path.nodes, nextNode],
          edges: [...path.edges, edge.id]
        }
      );
    }

    visited.delete(currentId);
  }

  await dfs(sourceId, targetId, 0, { nodes: [sourceId], edges: [] });

  // Sort by distance (shortest first)
  return paths.sort((a, b) => a.distance - b.distance);
}

interface Path {
  nodes: string[];    // Ordered list of node IDs
  edges: string[];    // Ordered list of edge IDs
  distance: number;   // Hop count
}
```

### Get Relationship Counts

```typescript
/**
 * Gets count of connections per relationship type
 * @param nodeId - Node to count connections for
 * @param credentials - AWS credentials
 * @returns Counts by relationship type
 */
export async function getRelationshipCounts(
  nodeId: string,
  credentials: AwsCredentials
): Promise<RelationshipCount[]> {
  const edges = await getEdgesForNode(nodeId, credentials);

  const counts = new Map<string, { outgoing: number; incoming: number }>();

  for (const edge of edges) {
    const type = edge.relation;
    if (!counts.has(type)) {
      counts.set(type, { outgoing: 0, incoming: 0 });
    }

    const count = counts.get(type)!;
    if (edge.source === nodeId) {
      count.outgoing++;
    } else {
      count.incoming++;
    }
  }

  return Array.from(counts.entries()).map(([type, count]) => ({
    relationshipType: type,
    outgoingCount: count.outgoing,
    incomingCount: count.incoming,
    totalCount: count.outgoing + count.incoming
  }));
}

interface RelationshipCount {
  relationshipType: string;
  outgoingCount: number;
  incomingCount: number;
  totalCount: number;
}
```

## UI/UX

### Search Around Dialog

```
┌─────────────────────────────────────────────────────────┐
│ Expand Connections for "Contract"                   [×] │
├─────────────────────────────────────────────────────────┤
│ Select relationship types to expand:                    │
│                                                          │
│ Direction: ⚪ Outgoing  ⚪ Incoming  ● Both             │
│ Max Depth: [2 ▼]                                        │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Outgoing Relationships                               │ │
│ │ ☑ hasMany → CLIN (12)                               │ │
│ │ ☑ funds → Budget (3)                                │ │
│ │ ☐ references → Document (45)                        │ │
│ │                                                      │ │
│ │ Incoming Relationships                               │ │
│ │ ☑ belongsTo ← Agency (1)                            │ │
│ │ ☐ mentions ← Email (234)                            │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ 💡 This will add ~16 nodes to the graph                │
│                                                          │
│ [Cancel]                   [Expand Connections] ───────→│
└─────────────────────────────────────────────────────────┘
```

### Path Finder Dialog

```
┌─────────────────────────────────────────────────────────┐
│ Find Paths Between Nodes                             [×] │
├─────────────────────────────────────────────────────────┤
│ From: [Contract #ABC-123    ▼]                          │
│ To:   [User john.doe        ▼]                          │
│                                                          │
│ Max Path Length: [5 ▼]                                  │
│                                                          │
│ [Find Paths] ─────────────→                             │
│                                                          │
│ Found 3 paths:                                           │
│                                                          │
│ Path 1: (3 hops) - Shortest  ✓                          │
│ Contract → CLIN → Budget → User                          │
│ [Highlight] [Details]                                    │
│                                                          │
│ Path 2: (4 hops)                                         │
│ Contract → Agency → Team → User                          │
│ [Highlight] [Details]                                    │
│                                                          │
│ Path 3: (5 hops)                                         │
│ Contract → Document → Email → Thread → User              │
│ [Highlight] [Details]                                    │
│                                                          │
│ [Close]                                                  │
└─────────────────────────────────────────────────────────┘
```

### Context Menu on Node

```
Right-click node:
┌────────────────────────────┐
│ 🔍 Expand Connections...   │
│ 🎯 Find Path To...         │
│ ✏️  Edit Node              │
│ 📋 Copy Node ID            │
│ ─────────────────────────  │
│ 💾 Save as Template...     │
│ 🔗 View Relationships      │
│ ─────────────────────────  │
│ 🗑️  Delete Node            │
└────────────────────────────┘
```

## User Stories

### US-05-01: Expand Direct Connections

**As a** data analyst
**I want to** expand direct connections from a node
**So that I can** see what it's related to without loading the entire graph

**Acceptance Criteria**:
- ✅ Right-click node shows "Expand Connections" option
- ✅ Dialog shows all relationship types with counts
- ✅ Can select which relationship types to expand
- ✅ Expanded nodes appear on canvas with animation
- ✅ New nodes are auto-laid out

### US-05-02: Multi-Hop Traversal

**As a** data analyst
**I want to** expand connections 2 or 3 hops away
**So that I can** discover indirect relationships

**Acceptance Criteria**:
- ✅ Can set "Max Depth" to 1, 2, 3, 4, or 5
- ✅ Expanding 2 hops shows connections of connections
- ✅ Performance is acceptable (<2s for 2 hops)
- ✅ Can see which nodes are at which depth
- ✅ Nodes are color-coded by depth

### US-05-03: Find Paths Between Nodes

**As a** security analyst
**I want to** find all paths between two nodes
**So that I can** understand how entities are connected

**Acceptance Criteria**:
- ✅ "Find Path To..." option in context menu
- ✅ Can select target node from dropdown or canvas
- ✅ Shows all paths up to max length
- ✅ Paths sorted by distance (shortest first)
- ✅ Click path to highlight on canvas
- ✅ Shows path description (Node → Edge → Node)

### US-05-04: Filter Relationship Types

**As a** data analyst
**I want to** hide certain relationship types
**So that I can** focus on relevant connections

**Acceptance Criteria**:
- ✅ Relationship filter panel shows all types with checkboxes
- ✅ Unchecking type hides those edges on canvas
- ✅ Filter persists during session
- ✅ Can filter by direction (outgoing, incoming, both)
- ✅ Can toggle all on/off quickly

### US-05-05: Save Traversal Templates

**As a** data analyst
**I want to** save my traversal patterns as templates
**So that I can** reuse them and share with team

**Acceptance Criteria**:
- ✅ "Save as Template" option after expansion
- ✅ Dialog prompts for name and description
- ✅ Template saves filters, depth, and direction
- ✅ Can load template from dropdown
- ✅ Can share template with team (public checkbox)
- ✅ Examples: "Contract Dependencies", "User Access Paths"

## Implementation Notes

### Phase 1: Graph Traversal Service (Week 1)

```typescript
// 1. Create traversal service
core/src/services/ontology/traversal.ts

// BFS expansion algorithm
export async function expandNode(
  nodeId: string,
  relationshipTypes: string[],
  depth: number,
  direction: 'outgoing' | 'incoming' | 'both',
  credentials: AwsCredentials
): Promise<{ nodes: OntologyNode[]; edges: OntologyEdge[] }> {
  const discovered = { nodes: new Map(), edges: new Map() };
  const visited = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = [{ id: nodeId, depth: 0 }];

  while (queue.length > 0) {
    const { id, depth: d } = queue.shift()!;
    if (visited.has(id) || d >= depth) continue;

    visited.add(id);

    // Get node
    const node = await getNode(id, credentials);
    if (node) discovered.nodes.set(id, node);

    // Get edges
    const edges = await getEdgesForNode(id, credentials);
    for (const edge of edges) {
      // Apply filters
      if (relationshipTypes.length && !relationshipTypes.includes(edge.relation)) {
        continue;
      }
      if (direction === 'outgoing' && edge.source !== id) continue;
      if (direction === 'incoming' && edge.target !== id) continue;

      discovered.edges.set(edge.id, edge);

      // Queue next node
      const next = edge.source === id ? edge.target : edge.source;
      if (!visited.has(next)) {
        queue.push({ id: next, depth: d + 1 });
      }
    }
  }

  return {
    nodes: Array.from(discovered.nodes.values()),
    edges: Array.from(discovered.edges.values())
  };
}

// 2. Path finding algorithm
export async function findPaths(
  sourceId: string,
  targetId: string,
  maxDepth: number,
  credentials: AwsCredentials
): Promise<Path[]> {
  const paths: Path[] = [];

  async function dfs(current: string, target: string, depth: number, path: Path) {
    if (depth > maxDepth) return;
    if (current === target) {
      paths.push({ ...path, distance: depth });
      return;
    }

    const edges = await getEdgesForNode(current, credentials);
    for (const edge of edges) {
      const next = edge.source === current ? edge.target : edge.source;
      if (path.nodes.includes(next)) continue; // Prevent cycles

      await dfs(next, target, depth + 1, {
        nodes: [...path.nodes, next],
        edges: [...path.edges, edge.id],
        distance: 0
      });
    }
  }

  await dfs(sourceId, targetId, 0, { nodes: [sourceId], edges: [], distance: 0 });
  return paths.sort((a, b) => a.distance - b.distance);
}
```

### Phase 2: Search Around Dialog (Week 1-2)

```typescript
// 3. Create search around dialog component
platform/src/app/ontology/components/search-around-dialog.tsx

export function SearchAroundDialog({
  nodeId,
  nodeName,
  open,
  onClose,
  onExpand
}: SearchAroundDialogProps) {
  const [relationshipCounts, setRelationshipCounts] = useState<RelationshipCount[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [direction, setDirection] = useState<'outgoing' | 'incoming' | 'both'>('both');
  const [maxDepth, setMaxDepth] = useState(1);

  // Load relationship counts on open
  useEffect(() => {
    if (open) {
      loadRelationshipCounts(nodeId, credentials).then(setRelationshipCounts);
    }
  }, [open, nodeId]);

  // Estimate node count
  const estimatedNodes = useMemo(() => {
    return relationshipCounts
      .filter(r => selectedTypes.includes(r.relationshipType))
      .reduce((sum, r) => sum + r.totalCount, 0) * maxDepth;
  }, [selectedTypes, relationshipCounts, maxDepth]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Expand Connections for "{nodeName}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Direction selector */}
          <RadioGroup value={direction} onValueChange={setDirection}>
            <RadioGroupItem value="outgoing">Outgoing</RadioGroupItem>
            <RadioGroupItem value="incoming">Incoming</RadioGroupItem>
            <RadioGroupItem value="both">Both</RadioGroupItem>
          </RadioGroup>

          {/* Max depth selector */}
          <Select value={String(maxDepth)} onValueChange={(v) => setMaxDepth(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map(d => (
                <SelectItem key={d} value={String(d)}>{d} hop{d > 1 ? 's' : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Relationship type checkboxes */}
          <div className="border rounded p-4 max-h-64 overflow-y-auto">
            {relationshipCounts.map(rc => (
              <div key={rc.relationshipType} className="flex items-center space-x-2 py-1">
                <Checkbox
                  checked={selectedTypes.includes(rc.relationshipType)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTypes([...selectedTypes, rc.relationshipType]);
                    } else {
                      setSelectedTypes(selectedTypes.filter(t => t !== rc.relationshipType));
                    }
                  }}
                />
                <label>
                  {rc.relationshipType} ({rc.outgoingCount}→ / {rc.incomingCount}←)
                </label>
              </div>
            ))}
          </div>

          {/* Estimate */}
          <div className="text-sm text-muted-foreground">
            💡 This will add ~{estimatedNodes} nodes to the graph
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            onExpand(selectedTypes, maxDepth, direction);
            onClose();
          }}>
            Expand Connections
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Phase 3: Canvas Integration (Week 2)

```typescript
// 4. Handle expansion on canvas
async function handleExpand(
  nodeId: string,
  relationshipTypes: string[],
  maxDepth: number,
  direction: 'outgoing' | 'incoming' | 'both'
) {
  setLoading(true);

  try {
    const { nodes: newNodes, edges: newEdges } = await expandNode(
      nodeId,
      relationshipTypes,
      maxDepth,
      direction,
      credentials
    );

    // Filter out nodes/edges already on canvas
    const existingNodeIds = new Set(flowNodes.map(n => n.id));
    const existingEdgeIds = new Set(flowEdges.map(e => e.id));

    const nodesToAdd = newNodes.filter(n => !existingNodeIds.has(n.id));
    const edgesToAdd = newEdges.filter(e => !existingEdgeIds.has(e.id));

    // Convert to ReactFlow format
    const newFlowNodes = nodesToAdd.map(n => convertToFlowNode(n));
    const newFlowEdges = edgesToAdd.map(e => convertToFlowEdge(e));

    // Add to canvas
    setFlowNodes(prev => [...prev, ...newFlowNodes]);
    setFlowEdges(prev => [...prev, ...newFlowEdges]);

    // Mark node as expanded
    setExpandedNodes(prev => new Set([...prev, nodeId]));

    // Auto-layout
    const layouted = layout([...flowNodes, ...newFlowNodes], [...flowEdges, ...newFlowEdges]);
    setFlowNodes(layouted.nodes);

    toast.success(`Added ${nodesToAdd.length} nodes and ${edgesToAdd.length} edges`);
  } catch (error) {
    console.error('Failed to expand node:', error);
    toast.error('Failed to expand connections');
  } finally {
    setLoading(false);
  }
}

// 5. Context menu integration
const contextMenuItems = [
  {
    label: 'Expand Connections',
    icon: Search,
    onClick: (node) => {
      setSearchAroundNode(node);
      setSearchAroundOpen(true);
    }
  },
  {
    label: 'Find Path To...',
    icon: Target,
    onClick: (node) => {
      setPathFinderSource(node);
      setPathFinderOpen(true);
    }
  },
  // ... other menu items
];
```

### Phase 4: Path Highlighting (Week 2)

```typescript
// 6. Highlight path on canvas
function highlightPath(path: Path) {
  // Update node styles
  setFlowNodes(nodes => nodes.map(node => ({
    ...node,
    style: path.nodes.includes(node.id)
      ? { ...node.style, border: '3px solid #3b82f6', zIndex: 100 }
      : { ...node.style, opacity: 0.3 }
  })));

  // Update edge styles
  setFlowEdges(edges => edges.map(edge => ({
    ...edge,
    style: path.edges.includes(edge.id)
      ? { ...edge.style, stroke: '#3b82f6', strokeWidth: 3 }
      : { ...edge.style, opacity: 0.3 }
  })));

  // Fit to path
  const pathNodeIds = path.nodes;
  fitView({ nodes: pathNodeIds, duration: 500 });
}

// 7. Clear path highlight
function clearPathHighlight() {
  setFlowNodes(nodes => nodes.map(node => ({
    ...node,
    style: { ...node.style, border: undefined, opacity: 1, zIndex: 1 }
  })));

  setFlowEdges(edges => edges.map(edge => ({
    ...edge,
    style: { ...edge.style, stroke: undefined, strokeWidth: 1, opacity: 1 }
  })));
}
```

## Testing

```typescript
describe('Relationship Traversal', () => {
  it('expands direct connections', async () => {
    const { nodes, edges } = await expandNode(
      'contract-123',
      [],
      1,
      'both',
      credentials
    );

    expect(nodes.length).toBeGreaterThan(0);
    expect(edges.length).toBeGreaterThan(0);
  });

  it('expands 2 hops', async () => {
    const { nodes, edges } = await expandNode(
      'contract-123',
      [],
      2,
      'both',
      credentials
    );

    expect(nodes.length).toBeGreaterThan(10); // More nodes at depth 2
  });

  it('filters by relationship type', async () => {
    const { edges } = await expandNode(
      'contract-123',
      ['hasMany'],
      1,
      'both',
      credentials
    );

    edges.forEach(edge => {
      expect(edge.relation).toBe('hasMany');
    });
  });

  it('finds paths between nodes', async () => {
    const paths = await findPaths(
      'contract-123',
      'user-456',
      5,
      credentials
    );

    expect(paths.length).toBeGreaterThan(0);
    expect(paths[0].nodes[0]).toBe('contract-123');
    expect(paths[0].nodes[paths[0].nodes.length - 1]).toBe('user-456');
  });

  it('highlights path on canvas', async () => {
    render(<OntologyFlow />);
    const path = {
      nodes: ['contract-123', 'clin-456', 'budget-789'],
      edges: ['edge-1', 'edge-2'],
      distance: 2
    };

    highlightPath(path);

    await waitFor(() => {
      const highlightedNodes = screen.getAllByTestId(/^node-/).filter(n =>
        n.style.border.includes('3px')
      );
      expect(highlightedNodes.length).toBe(3);
    });
  });
});
```

## Dependencies

- `core/src/services/ontology/traversal.ts` - New service (to create)
- `core/src/services/ontology/node.ts` - Node operations
- `core/src/services/ontology/edge.ts` - Edge operations
- `core/src/components/flow` - Flow visualization
- Radix UI - Dialog, RadioGroup, Checkbox components

## Success Metrics

- **Usage**: 70%+ users use expansion feature weekly
- **Performance**: 1-hop <500ms, 2-hop <2s (95th percentile)
- **Adoption**: 50%+ users find paths between nodes
- **Satisfaction**: 4.5+ stars for traversal features

## Related Features

- Feature 4: Object Instance Explorer (provides objects to traverse)
- Feature 6: Action Integration (actions on traversed objects)
- Feature 9: Advanced Filtering (filter traversal results)
- Feature 10: Lineage Analysis (uses traversal for lineage)
