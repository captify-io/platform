# Flow Component Migration - Analysis & Plan

**Created:** 2025-10-28
**Status:** Ready for Implementation
**Estimated Effort:** 4-6 hours

## Executive Summary

The current ontology builder uses **3,786 lines of custom code** across 10 files, with the main canvas alone at **711 lines**. The core library already has a fully-featured Flow component with ontology support that can replace ~80% of this code.

**Migration Benefits:**
- **Code Reduction**: 3,786 lines → ~800 lines (79% reduction)
- **Feature Addition**: Undo/redo, keyboard shortcuts, validation come free
- **Consistency**: Same UX as workflow and agent designers
- **Maintainability**: Bug fixes in one place benefit all designers

## Current State Analysis

### Existing Files (To Be Replaced)

```
platform/src/app/core/designer/ontology/
├── page.tsx (50 lines) → REPLACE with list view
└── builder/
    ├── page.tsx (120 lines) → REPLACE with [id]/page.tsx
    ├── context/
    │   └── OntologyContext.tsx (400 lines) → DELETE (Flow has context)
    └── components/
        ├── OntologyCanvas.tsx (711 lines) → DELETE (use Flow)
        ├── OntologyNodeComponent.tsx (200 lines) → DELETE (core has OntologyNode)
        ├── DataItemNode.tsx (150 lines) → DELETE or migrate if custom
        ├── OntologyNodeDialog.tsx (250 lines) → SIMPLIFY to property-panel.tsx
        ├── OntologyEdgeDialog.tsx (180 lines) → SIMPLIFY to relationship-panel.tsx
        ├── NodeConfigPanel.tsx (300 lines) → MIGRATE to property-panel.tsx
        └── EdgeConfigPanel.tsx (250 lines) → MIGRATE to relationship-panel.tsx

Total: 3,786 lines
```

### Core Flow Component (Already Available)

```
@captify-io/core/components/flow/
├── flow.tsx (87 lines) ✅ Main orchestrator
├── flow-context.tsx ✅ State management
├── toolbar.tsx ✅ Top actions bar
├── palette.tsx ✅ Node palette
├── grid.tsx ✅ Canvas with ReactFlow
├── sidebar/ ✅ Configuration panels
├── nodes/
│   └── ontology-node.tsx (115 lines) ✅ Already built!
└── edges/
    └── ontology-edge.tsx ✅ Already built!
```

**Key Discovery**: The core Flow component already has `mode="ontology"` support with pre-built ontology nodes and edges!

## Gap Analysis

### What Flow Component Provides ✅

- **Canvas**: ReactFlow-based canvas with pan/zoom
- **Ontology Nodes**: Pre-built OntologyNode component
- **Ontology Edges**: Pre-built OntologyEdge component
- **Handles**: Left/right/top/bottom connection points
- **Selection**: Single and multi-select
- **Drag & Drop**: Node dragging and positioning
- **Context**: Centralized state management
- **Styling**: Color, icon, badge support
- **Layout**: ELK auto-layout integration (if available)

### What Needs To Be Built 🔨

1. **List View** (`page.tsx`)
   - Table of all nodes
   - Search/filter UI
   - Create/edit/delete actions
   - Navigate to editor

2. **Editor Wrapper** (`[id]/page.tsx`)
   - Load graph from DynamoDB
   - Configure Flow component
   - Save handler
   - Error handling

3. **Data Hooks** (`hooks/`)
   - `use-ontology-graph.ts` - Load/save graph
   - `use-ontology-operations.ts` - CRUD operations
   - `use-ontology-search.ts` - Search/filter (Phase 3)

4. **Configuration Panels** (`components/`)
   - `property-panel.tsx` - Edit node properties
   - `relationship-panel.tsx` - Manage edges

5. **Data Format Adapter**
   - Convert DynamoDB ontology → Flow graph format
   - Convert Flow graph → DynamoDB ontology format

### What Can Be Deleted 🗑️

- ✅ OntologyCanvas.tsx (711 lines) - Flow handles this
- ✅ OntologyContext.tsx (400 lines) - Flow has context
- ✅ OntologyNodeComponent.tsx (200 lines) - core has OntologyNode
- ✅ DataItemNode.tsx (150 lines) - probably redundant
- ~50% of dialog code - simplify to panels

**Total Deletion**: ~1,600+ lines

## Proposed New Structure

```
platform/src/app/core/designer/ontology/
├── page.tsx (150 lines) - List view with search/filter
├── [id]/page.tsx (150 lines) - Flow-based editor
├── hooks/
│   ├── use-ontology-graph.ts (100 lines) - Load/save graph
│   └── use-ontology-operations.ts (100 lines) - CRUD ops
├── components/
│   ├── ontology-list.tsx (150 lines) - Table component
│   ├── property-panel.tsx (150 lines) - Node properties
│   └── relationship-panel.tsx (100 lines) - Edge management
└── lib/
    └── ontology-adapter.ts (100 lines) - Data format conversion

Total: ~900 lines (76% reduction)
```

## Data Format Mapping

### Current DynamoDB Ontology Node

```typescript
{
  id: "pmbook-contract",
  name: "Contract",
  type: "contract",
  domain: "Contracts",
  category: "legal",
  app: "pmbook",
  label: "Contract",
  icon: "FileContract",
  color: "#3b82f6",
  position: { x: 100, y: 200 }, // May be missing
  properties: {
    schema: { /* JSON Schema */ },
    table: "pmbook-contract",
    // ... other properties
  },
  tenantId: "default",
  createdAt: "2025-10-28T...",
  updatedAt: "2025-10-28T..."
}
```

### Flow Graph Node Format

```typescript
{
  id: "pmbook-contract",
  type: "ontology", // Tells Flow to use OntologyNode component
  position: { x: 100, y: 200 },
  data: {
    label: "Contract",
    icon: "FileContract",
    color: "#3b82f6",
    properties: {
      category: "legal",
      domain: "Contracts",
      schema: { /* JSON Schema */ },
      // ... everything from DynamoDB properties
    },
    // Additional metadata
    ontologyNodeId: "pmbook-contract", // Original ID
    domain: "Contracts", // For filtering
    category: "legal", // For palette grouping
  }
}
```

### Adapter Implementation

```typescript
// lib/ontology-adapter.ts

export function toFlowNode(ontologyNode: OntologyNode): FlowNode {
  return {
    id: ontologyNode.id,
    type: 'ontology',
    position: ontologyNode.position || { x: 0, y: 0 },
    data: {
      label: ontologyNode.label || ontologyNode.name,
      icon: ontologyNode.icon,
      color: ontologyNode.color,
      properties: {
        category: ontologyNode.category,
        domain: ontologyNode.domain,
        ...ontologyNode.properties,
      },
      ontologyNodeId: ontologyNode.id,
      domain: ontologyNode.domain,
      category: ontologyNode.category,
    }
  };
}

export function fromFlowNode(flowNode: FlowNode): Partial<OntologyNode> {
  return {
    id: flowNode.id,
    position: flowNode.position,
    label: flowNode.data.label,
    icon: flowNode.data.icon,
    color: flowNode.data.color,
    domain: flowNode.data.domain,
    category: flowNode.data.category,
    properties: {
      ...flowNode.data.properties,
    },
    updatedAt: new Date().toISOString(),
  };
}
```

## Implementation Steps

### Phase 1: Setup (30 min)

1. Create new directory structure
2. Create adapter utilities
3. Create data hooks skeleton

### Phase 2: List View (1 hour)

1. Create `page.tsx` with table layout
2. Implement `ontology-list.tsx` component
3. Add search input and filters
4. Wire up navigation to editor

### Phase 3: Flow Integration (2 hours)

1. Create `[id]/page.tsx` with Flow component
2. Configure toolbar, palette, sidebar
3. Implement `use-ontology-graph.ts` hook
4. Test loading existing graphs

### Phase 4: Configuration Panels (1.5 hours)

1. Create `property-panel.tsx`
2. Create `relationship-panel.tsx`
3. Integrate with Flow sidebar
4. Test CRUD operations

### Phase 5: Testing & Cleanup (1 hour)

1. Test all workflows
2. Delete old code
3. Update navigation links
4. Verify no regressions

### Phase 6: Documentation (30 min)

1. Update README
2. Document new structure
3. Add usage examples

## Migration Checklist

### Pre-Migration

- [ ] Create backup branch: `git checkout -b backup/ontology-before-flow`
- [ ] List custom features to preserve
- [ ] Test current functionality
- [ ] Document any workarounds

### Implementation

- [ ] Create new directory structure
- [ ] Create `lib/ontology-adapter.ts`
- [ ] Create `hooks/use-ontology-graph.ts`
- [ ] Create `hooks/use-ontology-operations.ts`
- [ ] Create `page.tsx` (list view)
- [ ] Create `[id]/page.tsx` (Flow editor)
- [ ] Create `components/ontology-list.tsx`
- [ ] Create `components/property-panel.tsx`
- [ ] Create `components/relationship-panel.tsx`
- [ ] Test node creation
- [ ] Test node editing
- [ ] Test relationship creation
- [ ] Test save/load
- [ ] Delete old `builder/` directory
- [ ] Delete `context/OntologyContext.tsx`
- [ ] Update navigation links

### Verification

- [ ] All nodes load correctly
- [ ] All edges load correctly
- [ ] Can create new nodes
- [ ] Can edit node properties
- [ ] Can delete nodes
- [ ] Can create relationships
- [ ] Can delete relationships
- [ ] Save persists to DynamoDB
- [ ] No console errors
- [ ] Dark mode works
- [ ] Existing data intact

## Risk Mitigation

### Risk: Data Loss During Migration

**Mitigation:**
- Create full DynamoDB backup before starting
- Test with sample data first
- Implement data validation in adapter
- Keep old code in git history

### Risk: Missing Custom Features

**Mitigation:**
- Audit `DataItemNode.tsx` for unique features
- Check if dialogs have custom logic
- Implement missing features as Flow extensions

### Risk: Performance Degradation

**Mitigation:**
- Flow component is optimized with ReactFlow
- Should be faster than custom implementation
- Load test with 100+ nodes before deploying

## Success Criteria

- [ ] Code reduced by >70%
- [ ] All existing features work
- [ ] No data loss
- [ ] Tests pass
- [ ] Performance equal or better
- [ ] Consistent UX with workflow designer

## Next Steps

**After Flow migration completes:**
1. Phase 3: Advanced Search & Filter (build on new indexes)
2. Phase 4: Property Editor (visual schema editing)
3. Phase 5: Bulk Operations (multi-select, batch edit)

## Questions for Review

1. **DataItemNode.tsx**: Does this have unique functionality or can we delete it?
2. **Position Data**: Do all nodes have position data? Need backfill?
3. **Custom Features**: Any custom context menu items to preserve?
4. **Validation**: What validation rules exist in current implementation?

## Recommendation

✅ **Proceed with migration**

The Flow component is mature, already has ontology support, and will drastically simplify the codebase. The migration is low-risk with high reward.

**Suggested Timeline**: Start after Phase 1 (indexes) completes, allocate 1 full day for implementation and testing.
