# User Story: Browse Ontology

**Feature**: Ontology Viewer
**Priority**: P0 (Critical)
**Story Points**: 5

## User Story

**As a** data architect or developer
**I want to** browse all ontology nodes, edges, and their properties visually
**So that I can** understand the data model and find the types I need to work with

## Acceptance Criteria

### AC1: Sidebar Navigation
**Given** I'm on the ontology page
**When** I view the left sidebar
**Then** I see a menu with the following sections:
- Objects
- Links
- Actions
- Pipelines
- Datasets
- Views
- Health
- Documents
- Files
- Schedules

### AC2: Objects Tab
**Given** I click on "Objects" in the sidebar
**When** the Objects view loads
**Then** I see:
- List of all ontology nodes grouped by domain
- Node count badge for each domain
- Search/filter box at the top
- Each node showing:
  - Icon and color
  - Name and type
  - Category badge
  - Quick stats (properties count, relationships count)

### AC3: Filter and Search
**Given** I'm viewing the Objects list
**When** I type in the search box
**Then** the list filters in real-time to show matching nodes by:
- Name
- Type
- Category
- Domain
- Description

**And** I can filter by:
- Domain (dropdown)
- Category (checkbox list)
- App (checkbox list)
- Active status (toggle)

### AC4: Node Selection
**Given** I'm viewing the Objects list
**When** I click on a node card
**Then**:
- The node is selected (highlighted)
- The content area shows the node details
- The flow visualization updates to show the node and its connections

### AC5: Links Tab
**Given** I click on "Links" in the sidebar
**When** the Links view loads
**Then** I see:
- List of all ontology edges (relationships)
- Grouped by relationship type (hasMany, belongsTo, references, etc.)
- Each edge showing:
  - Source type → Target type
  - Relationship label
  - Cardinality
  - Properties count (for object-backed links)

### AC6: Health Tab
**Given** I click on "Health" in the sidebar
**When** the Health view loads
**Then** I see ontology health metrics:
- Orphaned nodes (no incoming or outgoing edges)
- Missing indexes (searchable properties without GSI)
- Duplicate primary keys
- Invalid schemas
- Broken relationships (references to non-existent nodes)

**And** each issue has:
- Severity badge (error, warning, info)
- Count
- "Fix" button for automated fixes

## Wireframe

```
┌────────────────────────────────────────────────────────────────┐
│ Ontology Management                                     [Agent]│
├──────────────┬─────────────────────────────────────────────────┤
│ Sidebar      │ Content Area                                    │
│              │                                                  │
│ 📦 Objects   │ ┌─────────────────────────────────────────────┐│
│ 🔗 Links     │ │ Search: [____________] 🔍                   ││
│ ⚡ Actions   │ │                                              ││
│ 🔄 Pipelines │ │ Domain: [All ▼]  Category: [All ▼]         ││
│ 📊 Datasets  │ └─────────────────────────────────────────────┘│
│ 👁 Views     │                                                  │
│ ❤ Health    │ Contract Domain (12)                            │
│ 📄 Documents │ ┌───────────────────────────────────────────┐  │
│ 📁 Files     │ │ 📄 Contract               Properties: 23  │  │
│ ⏱ Schedules  │ │ Type: contract            Edges: 8        │  │
│              │ │ Category: entity                            │  │
│              │ └───────────────────────────────────────────┘  │
│              │                                                  │
│              │ ┌───────────────────────────────────────────┐  │
│              │ │ 📊 CLIN                   Properties: 15  │  │
│              │ │ Type: clin                Edges: 5        │  │
│              │ │ Category: entity                            │  │
│              │ └───────────────────────────────────────────┘  │
│              │                                                  │
└──────────────┴─────────────────────────────────────────────────┘
```

## Technical Notes

### Components
- `OntologySidebar` - Left sidebar navigation
- `OntologyObjectsList` - Grid of node cards
- `OntologyLinksList` - List of edges
- `OntologyHealthDashboard` - Health metrics
- `OntologySearch` - Search and filter controls

### Data Loading
- Fetch all nodes on mount: `await ontology.node.getAllNodes(credentials)`
- Fetch all edges on mount: `await ontology.edge.getAllEdges(credentials)`
- Use React Query for caching (5-minute stale time)
- Implement virtual scrolling for large lists (>100 items)

### Performance
- Virtualize lists with `react-window` or `@tanstack/react-virtual`
- Debounce search input (300ms)
- Cache node/edge data in React Query
- Load health metrics lazily (only when Health tab opened)

## Dependencies

- `core/src/services/ontology/node.ts` - Node operations
- `core/src/services/ontology/edge.ts` - Edge operations
- `core/src/components/ontology/viewer.tsx` - Existing viewer component
- React Query for data fetching
- Radix UI for sidebar and tabs

## Definition of Done

- [ ] Sidebar navigation working with all tabs
- [ ] Objects tab shows all nodes grouped by domain
- [ ] Search and filter working with real-time updates
- [ ] Links tab shows all edges with source/target
- [ ] Health tab shows ontology issues
- [ ] Click on node opens detail view
- [ ] Performance acceptable with 100+ nodes
- [ ] Responsive design works on all screen sizes
- [ ] Unit tests for components (80%+ coverage)
- [ ] Integration tests for data loading
- [ ] Documentation updated

## Related Stories

- [02-create-node.md](./02-create-node.md) - Create new ontology node
- [03-edit-properties.md](./03-edit-properties.md) - Edit node properties
- [04-visualize-relationships.md](./04-visualize-relationships.md) - Graph visualization
- [05-search-ontology.md](./05-search-ontology.md) - AI-powered search

## Notes

- This is the foundation story for the ontology viewer
- Must be completed before other viewer stories
- Design should match existing Captify UI patterns
- Use existing flow components where possible
- Consider accessibility (keyboard navigation, screen readers)
