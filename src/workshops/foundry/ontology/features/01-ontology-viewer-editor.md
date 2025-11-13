# Feature 1: Ontology Viewer & Editor

**Status**: ✅ Completed
**Priority**: P0 (Critical)
**Story Points**: 21

## Overview

Build the main ontology management interface at `/ontology/page.tsx` with a sidebar menu, central content area, and interactive flow visualization. Users can browse, filter, create, and edit all ontology elements (objects, links, actions, pipelines, datasets, views, etc.) with changes reflected in real-time on the flow diagram.

## Requirements

### Functional Requirements

1. **Sidebar Navigation** (Left side)
   - Objects - All ontology nodes grouped by domain/category
   - Links - All relationships/edges
   - Actions - Business logic and workflows
   - Pipelines - Data processing workflows
   - Datasets - Data sources and collections
   - Views - Custom saved views
   - Health - Ontology health metrics
   - Documents - Documentation
   - Files - File attachments
   - Schedules - Scheduled tasks

2. **Content Area** (Middle)
   - List view with filtering and search
   - Detail view when item selected
   - Create/edit forms
   - Bulk operations

3. **Flow Visualization** (Right side)
   - Interactive graph using `core/src/components/flow`
   - Nodes represent objects
   - Edges represent links/relationships
   - Real-time updates as user makes changes
   - Zoom, pan, auto-layout
   - Click node to select in sidebar

4. **Real-Time Sync**
   - Selecting item in sidebar highlights in flow
   - Clicking node in flow opens in sidebar
   - Creating/editing updates flow immediately
   - Filter in sidebar filters flow visualization

### Non-Functional Requirements

1. **Performance**: Load 100+ nodes in <2 seconds
2. **Responsiveness**: Flow updates in <100ms
3. **Usability**: Intuitive drag-and-drop interface

## Architecture

### Component Structure

```
platform/src/app/ontology/
├── page.tsx                    - Main layout (sidebar + content + flow)
├── layout.tsx                  - Full-screen layout
└── components/
    ├── ontology-sidebar.tsx    - Left navigation menu
    ├── ontology-content.tsx    - Middle content area
    ├── ontology-flow.tsx       - Right flow visualization
    ├── ontology-filters.tsx    - Search and filter controls
    ├── node-list.tsx           - List of nodes
    ├── node-detail.tsx         - Node detail view
    ├── node-form.tsx           - Create/edit node
    ├── link-list.tsx           - List of edges
    ├── link-form.tsx           - Create/edit link
    └── health-dashboard.tsx    - Health metrics
```

### Data Flow

```
User Action (Sidebar)
  ↓
Update State (React Context)
  ↓
Sync to Flow (ReactFlow)
  ↓
Update DynamoDB (ontology-node/edge tables)
```

### State Management

```typescript
interface OntologyViewerState {
  selectedTab: 'objects' | 'links' | 'actions' | 'pipelines' | 'datasets' | 'views' | 'health';
  selectedNodeId: string | null;
  filter: {
    search: string;
    domain?: string;
    category?: string;
    app?: string;
  };
  nodes: OntologyNode[];
  edges: OntologyEdge[];
  flowNodes: ReactFlowNode[];
  flowEdges: ReactFlowEdge[];
}
```

## Data Model

**Existing Tables** (reuse):
- `captify-core-ontology-node` - All nodes
- `captify-core-ontology-edge` - All relationships

**No new tables needed**

## API Actions

### Load Ontology
```typescript
// Get all nodes and edges
const { nodes, edges } = await loadOntology(credentials);

// Implementation
async function loadOntology(credentials: AwsCredentials) {
  const [nodes, edges] = await Promise.all([
    ontology.node.getAllNodes(credentials),
    ontology.edge.getAllEdges(credentials)
  ]);
  return { nodes, edges };
}
```

### Create Node
```typescript
// Create new ontology node
const node = await ontology.node.create({
  id: generateUUID(),
  type: 'contract',
  name: 'Contract',
  category: 'entity',
  domain: 'Contract',
  app: 'pmbook',
  properties: { schema: {...} }
}, credentials);
```

### Update Node
```typescript
// Update existing node
await ontology.node.update(nodeId, updates, credentials);
```

### Delete Node
```typescript
// Delete node (with cascade options)
await ontology.node.delete(nodeId, { cascade: false }, credentials);
```

### Create Link
```typescript
// Create relationship
const edge = await ontology.edge.create({
  id: `edge-${sourceId}-${relation}-${targetId}`,
  source: sourceId,
  target: targetId,
  relation: 'hasMany',
  properties: { cardinality: 'one-to-many' }
}, credentials);
```

## UI/UX

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│ Ontology Management                                   [Agent]│
├────────────┬──────────────────────┬─────────────────────────┤
│ Sidebar    │ Content Area         │ Flow Visualization      │
│            │                      │                         │
│ 📦 Objects │ ┌──────────────────┐ │  ┌────┐    ┌────┐     │
│ 🔗 Links   │ │ Search: [____]🔍 │ │  │Node│───→│Node│     │
│ ⚡ Actions │ │                   │ │  └────┘    └────┘     │
│ 🔄 Pipes   │ │ Domain: [All  ▼] │ │     ↓                  │
│ 📊 Datasets│ └──────────────────┘ │  ┌────┐                │
│ 👁 Views   │                      │  │Node│                │
│ ❤ Health   │ Contract (12)        │  └────┘                │
│ 📄 Docs    │ ┌──────────────────┐ │                         │
│ 📁 Files   │ │ 📄 Contract      │ │ [Zoom] [Pan] [Reset]   │
│ ⏱ Schedule │ │ Properties: 23   │ │                         │
│            │ └──────────────────┘ │                         │
└────────────┴──────────────────────┴─────────────────────────┘
```

### Sidebar Menu

```typescript
const menuItems = [
  { id: 'objects', icon: Package, label: 'Objects', count: nodes.length },
  { id: 'links', icon: Link, label: 'Links', count: edges.length },
  { id: 'actions', icon: Zap, label: 'Actions', count: actions.length },
  { id: 'pipelines', icon: GitBranch, label: 'Pipelines', count: pipelines.length },
  { id: 'datasets', icon: Database, label: 'Datasets', count: datasets.length },
  { id: 'views', icon: Eye, label: 'Views', count: views.length },
  { id: 'health', icon: Heart, label: 'Health', badge: issues > 0 ? issues : null },
  { id: 'documents', icon: FileText, label: 'Documents', count: docs.length },
  { id: 'files', icon: Folder, label: 'Files', count: files.length },
  { id: 'schedules', icon: Clock, label: 'Schedules', count: schedules.length }
];
```

### Flow Integration

Use existing `core/src/components/flow` with ontology mode:

```typescript
import { Flow } from '@captify-io/core/components/flow';

<Flow
  mode="ontology"
  nodes={flowNodes}
  edges={flowEdges}
  onNodeClick={(node) => handleNodeSelect(node.id)}
  onEdgeClick={(edge) => handleEdgeSelect(edge.id)}
  onNodesChange={(changes) => handleFlowChange(changes)}
  autoLayout={true}
/>
```

## User Stories

### US-1: Browse Ontology

**As a** data architect
**I want to** browse all ontology nodes and relationships
**So that I can** understand the complete data model

**Acceptance Criteria**:
- ✅ Can see all sections in sidebar (Objects, Links, Actions, etc.)
- ✅ Can switch between sections
- ✅ Each section shows count badge
- ✅ Flow visualization shows all nodes and edges
- ✅ Can search and filter in content area

### US-2: Filter and Search

**As a** developer
**I want to** filter ontology nodes by domain, category, and app
**So that I can** find specific types quickly

**Acceptance Criteria**:
- ✅ Search box filters nodes in real-time
- ✅ Can filter by domain (dropdown)
- ✅ Can filter by category (checkboxes)
- ✅ Can filter by app (checkboxes)
- ✅ Flow updates to show only filtered nodes
- ✅ Filter state persists during session

### US-3: Create Node Visually

**As a** data architect
**I want to** create new ontology nodes through a form
**So that I can** define new types without writing code

**Acceptance Criteria**:
- ✅ "Create Node" button opens form dialog
- ✅ Form has all required fields (name, type, category, domain, app)
- ✅ Schema editor for defining properties
- ✅ Can mark properties as searchable, required, primary key
- ✅ Node appears in flow immediately after creation
- ✅ Node saved to DynamoDB

### US-4: Edit Node Properties

**As a** data architect
**I want to** edit node properties and schema
**So that I can** update types as requirements change

**Acceptance Criteria**:
- ✅ Click node in flow or list to open detail view
- ✅ "Edit" button opens form with current values
- ✅ Can modify all editable fields
- ✅ Cannot change immutable fields (id, type, app)
- ✅ Changes reflected in flow immediately
- ✅ Breaking changes show warnings

### US-5: Create Links

**As a** data architect
**I want to** create relationships between nodes
**So that I can** define the data model structure

**Acceptance Criteria**:
- ✅ Can drag from one node to another in flow to create link
- ✅ OR use "Create Link" button to select source/target
- ✅ Can specify relationship type (hasMany, belongsTo, etc.)
- ✅ Can set cardinality (one-to-one, one-to-many, many-to-many)
- ✅ Link appears in flow immediately
- ✅ Link saved to DynamoDB

### US-6: View Health Metrics

**As a** data architect
**I want to** see ontology health issues
**So that I can** maintain data model quality

**Acceptance Criteria**:
- ✅ Health tab shows all issues
- ✅ Issues categorized by severity (error, warning, info)
- ✅ Can see: orphaned nodes, missing indexes, broken links, schema errors
- ✅ Click issue to jump to affected node
- ✅ "Fix" button for auto-fixable issues

## Implementation Notes

### Phase 1: Layout & Data Loading (Week 1)
```typescript
// 1. Create page layout
platform/src/app/ontology/page.tsx

// 2. Create sidebar component
components/ontology-sidebar.tsx

// 3. Load data on mount
useEffect(() => {
  loadOntology(credentials).then(({ nodes, edges }) => {
    setNodes(nodes);
    setEdges(edges);
    setFlowNodes(convertToFlowNodes(nodes));
    setFlowEdges(convertToFlowEdges(edges));
  });
}, []);
```

### Phase 2: Flow Integration (Week 1)
```typescript
// 4. Convert ontology to ReactFlow format
function convertToFlowNodes(nodes: OntologyNode[]): ReactFlowNode[] {
  return nodes.map(node => ({
    id: node.id,
    type: 'ontology',
    position: node.position || { x: 0, y: 0 },
    data: {
      label: node.name,
      icon: node.icon,
      color: node.color,
      properties: node.properties
    }
  }));
}

// 5. Auto-layout using existing hook
const { layout } = useAutoLayout();
useEffect(() => {
  if (autoLayoutEnabled) {
    const layouted = layout(flowNodes, flowEdges, 'TB');
    setFlowNodes(layouted.nodes);
  }
}, [nodes, edges]);
```

### Phase 3: CRUD Operations (Week 2)
```typescript
// 6. Create node form
async function handleCreateNode(formData) {
  const node = await ontology.node.create(formData, credentials);

  // Update local state
  setNodes(prev => [...prev, node]);
  setFlowNodes(prev => [...prev, convertToFlowNode(node)]);

  // Auto-layout
  const layouted = layout([...flowNodes, convertToFlowNode(node)], flowEdges);
  setFlowNodes(layouted.nodes);
}

// 7. Update node
async function handleUpdateNode(nodeId, updates) {
  await ontology.node.update(nodeId, updates, credentials);

  // Update local state
  setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, ...updates } : n));
  setFlowNodes(prev => prev.map(n => n.id === nodeId ? updateFlowNode(n, updates) : n));
}

// 8. Delete node
async function handleDeleteNode(nodeId) {
  await ontology.node.delete(nodeId, credentials);

  // Remove from state
  setNodes(prev => prev.filter(n => n.id !== nodeId));
  setFlowNodes(prev => prev.filter(n => n.id !== nodeId));
  setFlowEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
}
```

### Phase 4: Filtering & Search (Week 2)
```typescript
// 9. Filter nodes
const filteredNodes = useMemo(() => {
  return nodes.filter(node => {
    if (filter.search && !node.name.toLowerCase().includes(filter.search.toLowerCase())) {
      return false;
    }
    if (filter.domain && node.domain !== filter.domain) {
      return false;
    }
    if (filter.category && node.category !== filter.category) {
      return false;
    }
    if (filter.app && node.app !== filter.app) {
      return false;
    }
    return true;
  });
}, [nodes, filter]);

// 10. Update flow when filter changes
useEffect(() => {
  const filteredFlowNodes = flowNodes.filter(fn =>
    filteredNodes.some(n => n.id === fn.id)
  );
  setVisibleFlowNodes(filteredFlowNodes);
}, [filteredNodes, flowNodes]);
```

## Testing

```typescript
describe('Ontology Viewer', () => {
  it('loads ontology on mount', async () => {
    render(<OntologyPage />);
    await waitFor(() => {
      expect(screen.getByText(/objects/i)).toBeInTheDocument();
    });
  });

  it('filters nodes by search', async () => {
    render(<OntologyPage />);
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'contract' } });

    await waitFor(() => {
      expect(screen.getByText(/contract/i)).toBeInTheDocument();
      expect(screen.queryByText(/user/i)).not.toBeInTheDocument();
    });
  });

  it('creates node and updates flow', async () => {
    render(<OntologyPage />);
    fireEvent.click(screen.getByText(/create node/i));

    // Fill form and submit
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'NewType' } });
    fireEvent.click(screen.getByText(/create/i));

    await waitFor(() => {
      expect(screen.getByText(/newtype/i)).toBeInTheDocument();
    });
  });
});
```

## Dependencies

- `core/src/components/flow` - Flow visualization (already exists)
- `core/src/services/ontology/node.ts` - Node CRUD operations (already exists)
- `core/src/services/ontology/edge.ts` - Edge CRUD operations (already exists)
- Radix UI - Dialog, Select, Checkbox components
- React Hook Form - Form state management
- Zustand or React Context - Global state

## Success Metrics

- ✅ Can load and display 100+ nodes in <2 seconds
- ✅ Flow updates in <100ms after user action
- ✅ 100% of ontology changes made via UI (not code)
- ✅ Users can create/edit nodes without documentation
- ✅ Zero data loss during operations

## Related Features

- Feature 1a: Action System (builds on this viewer)
- Feature 2: DataOps (integrates with this viewer)
- Feature 3: Advanced Queries (uses this as foundation)
