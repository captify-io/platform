# Feature: Advanced 3D Visualization

## Overview

Build an advanced 3D graph visualization system using xyflow and force-graph-3d capable of rendering hundreds of nodes and edges with smooth performance, multiple layout algorithms, clustering capabilities, and real-time collaborative editing.

### Current State

- Basic 2D xyflow canvas in `platform/src/app/ontology/ontology/builder/`
- ELK hierarchical layout implemented
- Simple node types (entity, concept, process)
- Basic drag-drop and connection creation
- No 3D visualization
- Limited to ~50 nodes before performance degrades
- No clustering or grouping
- No collaborative features

### Target State

- 3D xyflow-based graph visualization
- Smooth rendering of 500+ nodes and 1000+ edges at 60 FPS
- Multiple layout algorithms:
  - Force-directed (d3-force)
  - Hierarchical (dagre, ELK)
  - Circular layout
  - Radial layout
  - Timeline layout for temporal data
- Clustering by domain/category with collapsible groups
- Real-time collaborative editing with WebSocket
- Advanced interactions:
  - Multi-select and bulk operations
  - Minimap for navigation
  - Keyboard shortcuts
  - Undo/redo with history
- Performance optimizations:
  - Virtual rendering for large graphs
  - Level-of-detail (LOD) rendering
  - Progressive loading
  - Web Workers for layout calculations

## Requirements

### Functional Requirements

**FR1: 3D Visualization**
- FR1.1: 3D graph rendering with force-graph-3d
- FR1.2: Camera controls (orbit, pan, zoom, rotate)
- FR1.3: Node depth positioning based on hierarchy
- FR1.4: Edge curves and arrows in 3D space
- FR1.5: Toggle between 2D and 3D views
- FR1.6: VR mode for immersive exploration

**FR2: Layout Algorithms**
- FR2.1: Force-directed layout with configurable forces
- FR2.2: Hierarchical layout (top-down, left-right, radial)
- FR2.3: Circular layout with concentric rings
- FR2.4: Radial layout centered on selected node
- FR2.5: Timeline layout for temporal data
- FR2.6: Custom layout via API
- FR2.7: Layout animation with smooth transitions

**FR3: Clustering and Grouping**
- FR3.1: Auto-cluster by domain/category/type
- FR3.2: Manual grouping with drag-drop
- FR3.3: Collapsible/expandable groups
- FR3.4: Group labels and statistics
- FR3.5: Nested groups (groups within groups)
- FR3.6: Visual group boundaries (hulls, boxes)

**FR4: Performance Optimization**
- FR4.1: Virtual rendering for off-screen nodes
- FR4.2: Level-of-detail rendering (simplify distant nodes)
- FR4.3: Progressive loading (load visible area first)
- FR4.4: Web Workers for layout calculations
- FR4.5: GPU acceleration for rendering
- FR4.6: Debounced interactions
- FR4.7: FPS monitoring and throttling

**FR5: Advanced Interactions**
- FR5.1: Multi-select nodes with Shift+Click or box select
- FR5.2: Bulk operations (delete, update, move, group)
- FR5.3: Minimap with viewport indicator
- FR5.4: Keyboard shortcuts for all major actions
- FR5.5: Undo/redo with visual history timeline
- FR5.6: Search and highlight nodes
- FR5.7: Filter nodes/edges by properties

**FR6: Real-Time Collaboration**
- FR6.1: WebSocket for live updates
- FR6.2: User presence indicators (avatars)
- FR6.3: Cursor tracking for other users
- FR6.4: Lock nodes during editing
- FR6.5: Change conflict resolution
- FR6.6: Activity feed showing who did what

**FR7: Export and Sharing**
- FR7.1: Export graph as PNG/SVG/PDF
- FR7.2: Export subgraph selection
- FR7.3: Export layout positions for reuse
- FR7.4: Share graph view with permalink
- FR7.5: Embed graph in documentation

### Non-Functional Requirements

**NFR1: Performance**
- Render 500 nodes and 1000 edges at 60 FPS
- Layout calculation: < 3 seconds for 500 nodes
- Interaction latency: < 16ms (60 FPS)
- Initial load: < 2 seconds
- Memory usage: < 500 MB for 1000 nodes

**NFR2: Responsiveness**
- Support desktop (1920x1080+), tablet (1024x768+)
- Touch gestures for mobile (pinch zoom, two-finger pan)
- Adaptive rendering based on device capabilities
- Graceful degradation on low-end devices

**NFR3: Accessibility**
- Keyboard navigation for all features
- Screen reader support for graph structure
- High contrast mode
- Focus indicators
- ARIA labels

**NFR4: Browser Compatibility**
- Chrome 120+, Firefox 120+, Safari 17+, Edge 120+
- WebGL 2.0 required for 3D rendering
- Fallback to 2D for unsupported browsers

## Architecture

### Component Structure

```
platform/src/app/ontology/ontology/builder/
├── components/
│   ├── OntologyCanvas3D.tsx         # Main 3D canvas component
│   ├── OntologyCanvas2D.tsx         # 2D fallback canvas
│   ├── ViewToggle.tsx               # Switch between 2D/3D
│   │
│   ├── nodes/
│   │   ├── EntityNode3D.tsx         # 3D entity node
│   │   ├── ConceptNode3D.tsx        # 3D concept node
│   │   ├── ProcessNode3D.tsx        # 3D process node
│   │   └── ClusterNode.tsx          # Cluster/group node
│   │
│   ├── controls/
│   │   ├── LayoutSelector.tsx       # Layout algorithm picker
│   │   ├── ClusteringControls.tsx   # Clustering options
│   │   ├── FilterPanel.tsx          # Node/edge filters
│   │   ├── CameraControls.tsx       # 3D camera controls
│   │   ├── Minimap.tsx              # Navigation minimap
│   │   └── PerformanceMonitor.tsx   # FPS and metrics
│   │
│   ├── collaboration/
│   │   ├── UserPresence.tsx         # User avatars
│   │   ├── CursorTracking.tsx       # Other users' cursors
│   │   ├── ActivityFeed.tsx         # Recent changes
│   │   └── LockIndicator.tsx        # Locked nodes
│   │
│   ├── interactions/
│   │   ├── MultiSelect.tsx          # Box select tool
│   │   ├── BulkOperations.tsx       # Bulk action toolbar
│   │   ├── UndoRedo.tsx             # History controls
│   │   └── KeyboardShortcuts.tsx    # Shortcut overlay
│   │
│   └── export/
│       ├── ExportDialog.tsx         # Export options
│       ├── ShareDialog.tsx          # Sharing options
│       └── EmbedCode.tsx            # Embed code generator
│
├── hooks/
│   ├── useGraph3D.ts                # 3D graph state
│   ├── useLayout.ts                 # Layout algorithms
│   ├── useClustering.ts             # Clustering logic
│   ├── useCollaboration.ts          # WebSocket connection
│   ├── usePerformance.ts            # Performance monitoring
│   └── useHistory.ts                # Undo/redo state
│
├── layouts/
│   ├── ForceDirectedLayout.ts       # d3-force implementation
│   ├── HierarchicalLayout.ts        # dagre/ELK implementation
│   ├── CircularLayout.ts            # Circular algorithm
│   ├── RadialLayout.ts              # Radial algorithm
│   ├── TimelineLayout.ts            # Timeline algorithm
│   └── LayoutWorker.ts              # Web Worker for calculations
│
├── utils/
│   ├── clustering.ts                # Clustering algorithms
│   ├── lod.ts                       # Level-of-detail logic
│   ├── virtual-rendering.ts         # Virtual rendering
│   └── performance.ts               # Performance utilities
│
└── types/
    ├── graph.ts                     # Graph data types
    ├── layout.ts                    # Layout types
    └── collaboration.ts             # Collaboration types
```

### 3D Rendering Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      React Component                         │
│  - User interactions (click, drag, select)                  │
│  - State management (nodes, edges, selection)               │
│  - Event handlers                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                  force-graph-3d Instance                     │
│  - Three.js scene management                                 │
│  - Camera controls                                           │
│  - Node/edge rendering                                       │
│  - Interaction handling                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ↓               ↓               ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Layout       │  │ LOD          │  │ Virtual      │
│ Worker       │  │ Manager      │  │ Rendering    │
│              │  │              │  │              │
│ - Calculate  │  │ - Simplify   │  │ - Cull       │
│   positions  │  │   distant    │  │   off-screen │
│ - Physics    │  │   nodes      │  │   nodes      │
│   simulation │  │ - Adjust     │  │ - Lazy load  │
│              │  │   detail     │  │   on demand  │
└──────────────┘  └──────────────┘  └──────────────┘
         │               │               │
         └───────────────┴───────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                      GPU (WebGL 2.0)                         │
│  - Vertex/fragment shaders                                   │
│  - Instanced rendering                                       │
│  - Texture atlasing                                          │
└─────────────────────────────────────────────────────────────┘
```

### Layout Algorithm Flow

```
User selects layout
       ↓
┌──────────────────────────────────────┐
│  Layout Algorithm Selection          │
│  - Force-directed, hierarchical, etc │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Send graph data to Web Worker       │
│  - Nodes, edges, configuration       │
└──────────────┬───────────────────────┘
               │
               ↓  (runs in background)
┌──────────────────────────────────────┐
│  Web Worker: Calculate Layout        │
│  - Run algorithm iterations           │
│  - Compute node positions             │
│  - Apply constraints                  │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Receive positions from Worker       │
│  - Update node coordinates            │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Animate Transition                  │
│  - Smooth position interpolation      │
│  - 1 second duration                  │
└──────────────────────────────────────┘
```

## Data Model

### Graph Data

```typescript
interface Graph3D {
  nodes: Node3D[];
  edges: Edge3D[];
  clusters?: Cluster[];
  metadata: GraphMetadata;
}

interface Node3D {
  id: string;
  label: string;
  type: string;                      // 'entity', 'concept', 'process'
  category: string;
  domain: string;

  // 3D position
  x?: number;
  y?: number;
  z?: number;

  // Visual properties
  color?: string;
  size?: number;
  opacity?: number;
  shape?: 'sphere' | 'cube' | 'cone' | 'cylinder';

  // LOD properties
  lodLevel?: number;                 // Current level of detail
  minLOD?: number;                   // Minimum LOD to render

  // Clustering
  clusterId?: string;                // Parent cluster
  isClusterNode?: boolean;           // Is this a cluster node?

  // State
  selected?: boolean;
  highlighted?: boolean;
  locked?: boolean;                  // Locked by another user

  // Metadata
  properties?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface Edge3D {
  id: string;
  source: string;                    // Source node ID
  target: string;                    // Target node ID
  relation: string;

  // Visual properties
  color?: string;
  width?: number;
  opacity?: number;
  curvature?: number;               // For 3D curves
  arrow?: boolean;

  // State
  selected?: boolean;
  highlighted?: boolean;

  // Metadata
  properties?: Record<string, any>;
}

interface Cluster {
  id: string;
  label: string;
  nodeIds: string[];                 // Nodes in this cluster
  collapsed?: boolean;               // Is cluster collapsed?

  // Visual properties
  color?: string;
  boundaryType?: 'hull' | 'box' | 'sphere';

  // Position (for collapsed cluster)
  x?: number;
  y?: number;
  z?: number;

  // Statistics
  nodeCount: number;
  edgeCount: number;
}

interface GraphMetadata {
  nodeCount: number;
  edgeCount: number;
  clusterCount?: number;
  bounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
  layout?: string;                   // Current layout algorithm
  lastModified: string;
}
```

### Layout Configuration

```typescript
interface LayoutConfig {
  algorithm: 'force' | 'hierarchical' | 'circular' | 'radial' | 'timeline';
  dimensions: 2 | 3;                 // 2D or 3D layout

  // Force-directed config
  force?: {
    strength?: number;               // Link strength (-100 to 100)
    distance?: number;               // Target link distance
    chargeStrength?: number;         // Node repulsion (-1000 to 0)
    centerStrength?: number;         // Center attraction (0 to 1)
    iterations?: number;             // Simulation iterations
  };

  // Hierarchical config
  hierarchical?: {
    direction?: 'TB' | 'BT' | 'LR' | 'RL';  // Top-bottom, left-right, etc
    nodeSpacing?: number;
    levelSpacing?: number;
    sortMethod?: 'hubsize' | 'directed';
  };

  // Circular config
  circular?: {
    radius?: number;
    startAngle?: number;
    endAngle?: number;
    sortBy?: string;                 // Node property to sort by
  };

  // Radial config
  radial?: {
    centerNodeId?: string;           // Center node
    radiusStep?: number;             // Radius increment per level
  };

  // Timeline config
  timeline?: {
    dateField: string;               // Node property with date
    orientation?: 'horizontal' | 'vertical';
  };

  // Animation
  animate?: boolean;
  animationDuration?: number;        // Milliseconds
}
```

### Collaboration State

```typescript
interface CollaborationState {
  users: CollaborationUser[];
  locks: NodeLock[];
  activity: ActivityEvent[];
}

interface CollaborationUser {
  id: string;
  name: string;
  avatar?: string;
  color: string;                     // User color for cursor/selection
  position?: { x: number; y: number; z: number };  // Camera position
  selectedNodes?: string[];          // Currently selected nodes
  online: boolean;
  lastSeen: string;
}

interface NodeLock {
  nodeId: string;
  userId: string;
  lockedAt: string;
  expiresAt: string;
}

interface ActivityEvent {
  id: string;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'move' | 'connect';
  entityType: 'node' | 'edge' | 'cluster';
  entityId: string;
  timestamp: string;
  details?: Record<string, any>;
}
```

## API Actions

### Graph Data API

```typescript
// Load graph data with pagination/filtering
export async function loadGraphData(
  options: {
    limit?: number;
    offset?: number;
    filters?: Record<string, any>;
    includeEdges?: boolean;
  },
  credentials?: AwsCredentials
): Promise<Graph3D>;

// Load subgraph around a node
export async function loadSubgraph(
  nodeId: string,
  depth: number,
  credentials?: AwsCredentials
): Promise<Graph3D>;

// Save graph layout positions
export async function saveGraphLayout(
  graphId: string,
  layout: {
    algorithm: string;
    positions: Record<string, { x: number; y: number; z?: number }>;
  },
  credentials?: AwsCredentials
): Promise<void>;
```

### Layout API

```typescript
// Calculate layout in Web Worker
export async function calculateLayout(
  graph: Graph3D,
  config: LayoutConfig
): Promise<Record<string, { x: number; y: number; z?: number }>>;

// Get available layout algorithms
export function getLayoutAlgorithms(): LayoutAlgorithm[];

interface LayoutAlgorithm {
  id: string;
  name: string;
  description: string;
  dimensions: 2 | 3;
  config: LayoutConfig;
}
```

### Clustering API

```typescript
// Auto-cluster nodes by property
export function clusterByProperty(
  nodes: Node3D[],
  property: string
): Cluster[];

// Merge clusters
export function mergeClusters(
  clusterIds: string[]
): Cluster;

// Collapse/expand cluster
export function toggleCluster(
  clusterId: string,
  collapsed: boolean
): void;
```

### Collaboration API

```typescript
// Connect to collaboration session
export async function joinSession(
  graphId: string,
  userId: string
): Promise<WebSocket>;

// Broadcast user action
export async function broadcastAction(
  action: ActivityEvent
): Promise<void>;

// Lock node for editing
export async function lockNode(
  nodeId: string,
  userId: string
): Promise<NodeLock>;

// Unlock node
export async function unlockNode(
  nodeId: string
): Promise<void>;
```

## Implementation Notes

### Phase 3A: 3D Foundation (Week 5)

1. Install and configure force-graph-3d
2. Create OntologyCanvas3D component with basic rendering
3. Implement camera controls (orbit, zoom, pan)
4. Add 2D/3D toggle with smooth transition
5. Migrate existing node types to 3D

### Phase 3B: Layout Algorithms (Week 5)

1. Implement force-directed layout with d3-force
2. Port hierarchical layout to 3D (dagre)
3. Add circular and radial layouts
4. Create layout selector UI
5. Move layout calculations to Web Worker

### Phase 3C: Performance Optimization (Week 6)

1. Implement LOD system (simple distant nodes)
2. Add virtual rendering (cull off-screen nodes)
3. Progressive loading with viewport detection
4. GPU instanced rendering for nodes
5. FPS monitoring and adaptive quality

### Phase 3D: Advanced Interactions (Week 6)

1. Multi-select with box select tool
2. Bulk operations toolbar
3. Minimap with viewport indicator
4. Keyboard shortcuts
5. Undo/redo with history timeline

### Phase 3E: Clustering and Collaboration (Week 6)

1. Auto-clustering by domain/category
2. Collapsible cluster nodes
3. WebSocket for real-time updates
4. User presence indicators
5. Activity feed

### Testing Strategy

```typescript
// Performance test
describe('3D Canvas Performance', () => {
  it('renders 500 nodes at 60 FPS', async () => {
    const nodes = generateTestNodes(500);
    const edges = generateTestEdges(1000);

    const { container, fps } = renderCanvas3D({ nodes, edges });

    await waitForStableFramerate();

    expect(fps).toBeGreaterThan(55);  // Allow 5 FPS buffer
  });

  it('calculates layout in < 3 seconds', async () => {
    const nodes = generateTestNodes(500);
    const edges = generateTestEdges(1000);

    const startTime = Date.now();
    await calculateLayout({ nodes, edges }, { algorithm: 'force' });
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(3000);
  });
});

// Interaction test
describe('Multi-Select', () => {
  it('selects multiple nodes with box select', async () => {
    const { canvas } = render(<OntologyCanvas3D nodes={testNodes} />);

    // Simulate box select
    await userEvent.dragBox({ start: { x: 0, y: 0 }, end: { x: 200, y: 200 } });

    const selectedNodes = canvas.getSelectedNodes();
    expect(selectedNodes.length).toBeGreaterThan(1);
  });
});
```

### Performance Benchmarks

Target benchmarks for 500 nodes, 1000 edges:

| Metric | Target | Current (2D) |
|--------|--------|--------------|
| FPS (idle) | 60 | 45 |
| FPS (interacting) | 60 | 30 |
| Layout calc | < 3s | 8s |
| Initial load | < 2s | 5s |
| Memory usage | < 500 MB | 800 MB |

## Success Metrics

### Performance
- Render 500+ nodes at 60 FPS
- Layout calculation < 3s
- Interaction latency < 16ms
- Memory usage < 500 MB

### Adoption
- 80% of users prefer 3D view
- Average session time increases 50%
- 20+ users collaborate simultaneously

### Quality
- 0 crashes with large graphs
- < 1% users report performance issues
- 95% of interactions complete in < 16ms

## Related Documentation

- [xyflow Documentation](https://reactflow.dev/docs)
- [force-graph-3d](https://github.com/vasturiano/3d-force-graph)
- [d3-force Documentation](https://d3js.org/d3-force)
- [Three.js Documentation](https://threejs.org/docs/)

---

**Feature Owner**: Platform Team
**Priority**: P0 (Critical)
**Estimated Effort**: 2 weeks
**Dependencies**: AI SDK Tool Standardization (Phase 1)
