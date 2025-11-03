# 2. Flow Component Migration - Replace Custom Canvas

**Priority:** HIGH
**Estimated Time:** 4-6 hours
**Dependencies:** 1-indexes.md (recommended but not required)
**Status:** Not Started

## Overview

Replace the custom ReactFlow implementation in `OntologyCanvas.tsx` (~712 lines) with the reusable Flow component from `@captify-io/core/components/flow`. This will reduce code by 75%, add missing features, and provide a consistent UX across all designers.

## Current Problems

### Code Duplication
- Custom ReactFlow setup duplicates flow component functionality
- Manual node type registration
- Custom context menu implementation
- Manual layout algorithm integration
- Reinventing toolbar, palette, sidebar patterns

### Missing Features
- No undo/redo
- No keyboard shortcuts
- No node templates
- No proper validation
- No mode switching
- Limited customization

### Maintenance Burden
- 712 lines in `OntologyCanvas.tsx` alone
- 2000+ total lines across all ontology builder files
- Every bug fix must be duplicated in workflow/agent designers
- Inconsistent UX between different designer pages

## Migration Strategy

### Phase 1: Understand Core Flow Component

Before migration, understand what's available:

**Flow Component Structure:**
```
@captify-io/core/components/flow/
├── flow.tsx                   # Main orchestrator
├── flow-context.tsx           # State management
├── toolbar.tsx                # Top toolbar
├── palette.tsx                # Left/right node palette
├── grid.tsx                   # Center canvas
├── sidebar/                   # Right config panel
│   ├── node-configuration.tsx
│   └── edge-configuration.tsx
├── nodes/
│   ├── ontology-node.tsx      # Pre-built ontology node
│   ├── workflow-node.tsx      # Pre-built workflow node
│   └── default-node.tsx
├── edges/
│   ├── ontology-edge.tsx
│   └── workflow-edge.tsx
└── hooks/
    ├── use-ontology-node.ts   # Ontology-specific logic
    ├── use-auto-layout.ts     # Layout algorithms
    └── use-validation.ts      # Graph validation
```

**Key Capabilities:**
- ✅ Multi-mode support (ontology, workflow, designer, custom)
- ✅ Configurable toolbar, palette, sidebar
- ✅ Built-in node types for ontology
- ✅ Auto-layout with ELK
- ✅ Validation framework
- ✅ Undo/redo support
- ✅ Keyboard shortcuts
- ✅ Dark mode support

### Phase 2: Create New Ontology List Page

**File:** `platform/src/app/core/designer/ontology/page.tsx`

This will be the new entry point with search/filter capabilities.

```tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@captify-io/core/components/ui';
import { OntologyList } from './components/ontology-list';
import { OntologySearch } from './components/ontology-search';
import { Plus, Filter } from 'lucide-react';

export default function OntologyPage() {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      <div className="h-14 border-b flex items-center justify-between px-6">
        <h1 className="text-lg font-semibold">Ontology Designer</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button onClick={() => router.push('/core/designer/ontology/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Node
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {showFilters && (
          <div className="w-80 border-r p-4">
            <OntologySearch />
          </div>
        )}
        <div className="flex-1">
          <OntologyList />
        </div>
      </div>
    </div>
  );
}
```

### Phase 3: Create Flow-Based Editor

**File:** `platform/src/app/core/designer/ontology/[id]/page.tsx`

This replaces the current `builder/page.tsx`.

```tsx
"use client";

import { Suspense } from 'react';
import { Flow, FlowProvider } from '@captify-io/core/components/flow';
import { PropertyPanel } from '../components/property-panel';
import { RelationshipPanel } from '../components/relationship-panel';
import { useOntologyGraph } from '../hooks/use-ontology-graph';
import { useCaptify } from '@captify-io/core/components';
import { toast } from 'sonner';

function OntologyEditorContent({ params }: { params: { id: string } }) {
  const { setPageReady } = useCaptify();
  const {
    nodes,
    edges,
    loading,
    saveGraph
  } = useOntologyGraph(params.id);

  if (loading) {
    return <div>Loading...</div>;
  }

  setPageReady();

  return (
    <Flow
      mode="ontology"
      graphId={params.id}
      initialNodes={nodes}
      initialEdges={edges}
      onSave={async (graph) => {
        try {
          await saveGraph(graph);
          toast.success('Ontology saved successfully');
        } catch (error) {
          toast.error('Failed to save ontology');
        }
      }}
      config={{
        toolbar: {
          showSave: true,
          showUndo: true,
          showFit: true,
          customButtons: [
            {
              id: 'validate',
              label: 'Validate',
              onClick: () => {/* validation logic */}
            }
          ]
        },
        palette: {
          position: 'left',
          width: 280,
          categories: ['entity', 'concept', 'process', 'system'],
          searchable: true,
        },
        sidebar: {
          position: 'right',
          width: 400,
          defaultOpen: false,
          tabs: [
            {
              id: 'properties',
              label: 'Properties',
              content: <PropertyPanel />
            },
            {
              id: 'relationships',
              label: 'Relationships',
              content: <RelationshipPanel />
            }
          ]
        },
        canvas: {
          snapToGrid: true,
          gridSize: 20,
          showMiniMap: true,
          showControls: true,
          showBackground: true,
          autoLayout: true,
        },
        mode: {
          readonly: false,
          allowMultiSelect: true,
        }
      }}
    />
  );
}

export default function OntologyEditor({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FlowProvider>
        <OntologyEditorContent params={params} />
      </FlowProvider>
    </Suspense>
  );
}

export const dynamic = "force-dynamic";
```

### Phase 4: Create Hooks

#### use-ontology-graph.ts

**File:** `platform/src/app/core/designer/ontology/hooks/use-ontology-graph.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@captify-io/core/lib/api';
import type { FlowNode, FlowEdge, FlowGraph } from '@captify-io/core/components/flow';

export function useOntologyGraph(nodeId?: string) {
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGraph = useCallback(async () => {
    setLoading(true);
    try {
      // Load specific node or all nodes
      const nodeResult = nodeId
        ? await apiClient.run({
            service: 'platform.dynamodb',
            operation: 'get',
            table: 'core-ontology-node',
            data: { Key: { id: nodeId } }
          })
        : await apiClient.run({
            service: 'platform.dynamodb',
            operation: 'scan',
            table: 'core-ontology-node',
          });

      // Load edges
      const edgeResult = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-ontology-edge',
      });

      // Convert to Flow format
      const flowNodes = (nodeResult.data?.Items || []).map(node => ({
        id: node.id,
        type: 'ontology',
        ontologyNodeId: node.id,
        domain: node.domain,
        category: node.category,
        position: node.position || { x: 0, y: 0 },
        data: {
          label: node.label || node.name,
          icon: node.icon,
          color: node.color,
          properties: node.properties || {},
          description: node.description,
        }
      }));

      const flowEdges = (edgeResult.data?.Items || []).map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'default',
        data: {
          label: edge.label,
          properties: edge.properties || {},
        },
        animated: true,
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error('Failed to load ontology:', error);
    } finally {
      setLoading(false);
    }
  }, [nodeId]);

  const saveGraph = useCallback(async (graph: FlowGraph) => {
    // Save all nodes
    await Promise.all(
      graph.nodes.map(node =>
        apiClient.run({
          service: 'platform.dynamodb',
          operation: 'put',
          table: 'core-ontology-node',
          data: {
            Item: {
              id: node.id,
              type: node.type,
              domain: node.domain,
              category: node.category,
              position: node.position,
              label: node.data.label,
              icon: node.data.icon,
              color: node.data.color,
              properties: node.data.properties,
              description: node.data.description,
              updatedAt: new Date().toISOString(),
            }
          }
        })
      )
    );

    // Save all edges
    await Promise.all(
      graph.edges.map(edge =>
        apiClient.run({
          service: 'platform.dynamodb',
          operation: 'put',
          table: 'core-ontology-edge',
          data: {
            Item: {
              id: edge.id,
              source: edge.source,
              target: edge.target,
              type: edge.type,
              label: edge.data?.label,
              properties: edge.data?.properties,
              updatedAt: new Date().toISOString(),
            }
          }
        })
      )
    );
  }, []);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  return {
    nodes,
    edges,
    loading,
    saveGraph,
    reload: loadGraph,
  };
}
```

### Phase 5: Migrate Components

Move existing config panels to new structure:

```
OLD:
builder/components/NodeConfigPanel.tsx
builder/components/EdgeConfigPanel.tsx

NEW:
components/property-panel.tsx      # Simpler name
components/relationship-panel.tsx  # Clearer purpose
```

Update imports and simplify logic since Flow handles selection state.

## Implementation Checklist

### Pre-Migration Preparation

- [ ] Read through core Flow component documentation
- [ ] Review existing OntologyCanvas.tsx to understand features
- [ ] List all custom features that need preservation
- [ ] Create backup branch: `git checkout -b backup/ontology-pre-migration`

### Create New Structure

- [ ] Create `platform/src/app/core/designer/ontology/page.tsx` (list view)
- [ ] Create `platform/src/app/core/designer/ontology/[id]/page.tsx` (editor)
- [ ] Create `hooks/use-ontology-graph.ts`
- [ ] Create `hooks/use-ontology-search.ts`
- [ ] Create `hooks/use-ontology-operations.ts`

### Create Components

- [ ] Create `components/ontology-list.tsx`
  - [ ] Table view with columns: Name, Type, Domain, Category, Updated
  - [ ] Row click opens editor
  - [ ] Row actions: Edit, Delete, Duplicate

- [ ] Create `components/ontology-search.tsx`
  - [ ] Search input
  - [ ] Filter by domain, category, type, app
  - [ ] Date range filter
  - [ ] Save search presets

- [ ] Create `components/property-panel.tsx`
  - [ ] Basic info fields
  - [ ] Icon picker
  - [ ] Color picker
  - [ ] Properties editor (JSON or form)

- [ ] Create `components/relationship-panel.tsx`
  - [ ] List of connected nodes
  - [ ] Add relationship button
  - [ ] Relationship type selector
  - [ ] Delete relationship button

### Integrate Flow Component

- [ ] Update `[id]/page.tsx` to use `<Flow>` component
- [ ] Configure toolbar with custom buttons
- [ ] Configure palette with node categories
- [ ] Configure sidebar with property/relationship tabs
- [ ] Test node creation
- [ ] Test node dragging
- [ ] Test edge creation
- [ ] Test save functionality

### Data Migration

- [ ] Ensure position field exists on all nodes
- [ ] Backfill missing positions with auto-layout
- [ ] Test loading existing graphs
- [ ] Test saving modified graphs

### Remove Old Code

- [ ] Delete `builder/` directory
- [ ] Delete `context/OntologyContext.tsx`
- [ ] Remove old imports from other files
- [ ] Clean up unused dependencies

### Testing

- [ ] Test creating new node
- [ ] Test editing node properties
- [ ] Test deleting node
- [ ] Test creating relationship
- [ ] Test deleting relationship
- [ ] Test auto-layout
- [ ] Test save/load
- [ ] Test undo/redo (if Flow supports it)
- [ ] Test keyboard shortcuts
- [ ] Test dark mode
- [ ] Test with existing ontology data

### Documentation

- [ ] Update README with new structure
- [ ] Document new hooks
- [ ] Add usage examples
- [ ] Document Flow configuration options

## Code Comparison

### Before (Custom Implementation)

**Lines of Code:** ~2,000
**Files:** 10+
**Features:** Basic canvas, manual layout, no undo

```tsx
// OntologyCanvas.tsx (712 lines)
export function OntologyCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [contextMenu, setContextMenu] = useState(null);
  // ... 700+ more lines of custom logic
}
```

### After (Flow Component)

**Lines of Code:** ~500
**Files:** 8
**Features:** Full canvas, auto-layout, undo, validation, etc.

```tsx
// [id]/page.tsx (150 lines)
export default function OntologyEditor({ params }) {
  const { nodes, edges, saveGraph } = useOntologyGraph(params.id);

  return (
    <Flow
      mode="ontology"
      initialNodes={nodes}
      initialEdges={edges}
      onSave={saveGraph}
      config={{ /* ... */ }}
    />
  );
}
```

## Migration Risks & Mitigation

### Risk: Breaking Existing Ontology Data

**Mitigation:**
- Create backup before migration
- Test with copy of production data
- Implement data migration script if schema changes
- Rollback plan: Keep old code in git history

### Risk: Missing Custom Features

**Mitigation:**
- List all custom features before starting
- Check if Flow component supports them
- Implement missing features as Flow extensions
- Document workarounds for unavailable features

### Risk: User Training Required

**Mitigation:**
- New UI will be similar to workflow designer
- Document changes in changelog
- Provide migration guide for users
- Keep old screenshots for reference

## Success Criteria

- [ ] Code reduced by >50%
- [ ] All existing features still work
- [ ] New features available (undo, validation, etc.)
- [ ] Performance is equal or better
- [ ] Tests pass
- [ ] No data loss
- [ ] Users can work without retraining

## Notes for Future Agents

### Why Migrate?

The custom ReactFlow implementation was built before the core Flow component existed. Now that we have a standardized, reusable component with more features, continuing to maintain duplicate code is wasteful.

### What Gets Easier?

1. **Consistency:** All designers (ontology, workflow, agent) use same component
2. **Features:** Undo, validation, keyboard shortcuts come free
3. **Maintenance:** Bug fixes in one place benefit all designers
4. **Testing:** Shared test suite for Flow component
5. **Onboarding:** New developers learn one pattern

### What Gets Harder?

Temporarily: Migration takes time and testing. Team must learn Flow component API.

Long-term: Nothing. This is strictly an improvement.

### Key Learning from Migration

The Flow component was designed specifically to solve this problem. Its mode-based configuration (`mode="ontology"`) automatically:
- Loads ontology-specific node types
- Applies ontology validation rules
- Uses ontology color schemes
- Enables ontology-specific features

This means the majority of custom code can be deleted, not rewritten.

## Next Steps

After completing Flow migration, proceed to:
- **3-search-filter.md** - Build advanced search UI
- **4-property-editor.md** - Enhanced property editing
- **5-bulk-operations.md** - Multi-select and bulk edit
