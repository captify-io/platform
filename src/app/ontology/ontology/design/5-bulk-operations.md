# 5. Bulk Operations - Multi-Select & Batch Editing

**Priority:** LOW
**Estimated Time:** 3-4 hours
**Dependencies:** 2-flow-migration.md (required), 3-search-filter.md (recommended)
**Status:** Not Started

## Overview

Enable users to select multiple nodes/edges and perform bulk operations like delete, update properties, export, or change domain/category. This is essential for large ontologies with 100+ nodes.

## Current State

**What Exists:**
- Single node selection
- Single node editing
- Single node deletion
- No multi-select capability

**What's Missing:**
- Multi-select nodes (Shift+click, Ctrl+click)
- Bulk delete with cascade options
- Bulk property updates (change domain, category, app, etc.)
- Bulk export to JSON/CSV
- Bulk import from JSON/CSV
- Select all filtered results
- Undo bulk operations

## Design Mockup

```
┌──────────────────────────────────────────────────────────────┐
│ Ontology Designer              [Filter] [Select Mode] [+ New]│
├──────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌──────────────────────────────────────────┐ │
│ │  FILTERS    │ │  ☑ 3 selected         [Bulk Actions ▾]  │ │
│ │             │ │  ┌────────────────────────────────────┐  │ │
│ │             │ │  │ [☑] Contract                        │  │ │
│ │             │ │  │     Type: entity | Domain: Contract │  │ │
│ │             │ │  ├────────────────────────────────────┤  │ │
│ │             │ │  │ [☑] ChangeRequest                   │  │ │
│ │             │ │  │     Type: entity | Domain: Workflow │  │ │
│ │             │ │  ├────────────────────────────────────┤  │ │
│ │             │ │  │ [☑] User                            │  │ │
│ │             │ │  │     Type: entity | Domain: User     │  │ │
│ │             │ │  ├────────────────────────────────────┤  │ │
│ │             │ │  │ [ ] Task                            │  │ │
│ │             │ │  │     Type: entity | Domain: Workflow │  │ │
│ │             │ │  └────────────────────────────────────┘  │ │
│ │             │ │                                           │ │
│ │             │ │  [Select All] [Deselect All]             │ │
│ └─────────────┘ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘

Bulk Actions Menu:
┌─────────────────────────┐
│ Update Properties       │
│ Change Domain      →    │
│ Change Category    →    │
│ Change App         →    │
│ ─────────────────────── │
│ Export Selected         │
│ ─────────────────────── │
│ Delete Selected         │
└─────────────────────────┘
```

## Component Structure

```
components/
├── bulk-toolbar.tsx              # Toolbar shown when items selected
├── bulk-actions-menu.tsx         # Dropdown menu with bulk operations
├── bulk-property-dialog.tsx      # Dialog for bulk property update
├── bulk-delete-dialog.tsx        # Dialog for bulk delete with options
└── selection-summary.tsx         # Shows "3 items selected"
```

## Implementation Details

### Bulk Toolbar

**File:** `components/bulk-toolbar.tsx`

```typescript
"use client";

import { Button } from '@captify-io/core/components/ui';
import { X, ChevronDown } from 'lucide-react';
import { BulkActionsMenu } from './bulk-actions-menu';

interface BulkToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkAction: (action: string) => void;
}

export function BulkToolbar({ selectedCount, onClearSelection, onBulkAction }: BulkToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="h-12 bg-blue-50 dark:bg-blue-950 border-b flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium">
          {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        <BulkActionsMenu onAction={onBulkAction} />
      </div>
    </div>
  );
}
```

### Bulk Actions Menu

**File:** `components/bulk-actions-menu.tsx`

```typescript
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@captify-io/core/components/ui';
import { Button } from '@captify-io/core/components/ui';
import { ChevronDown, Edit, Download, Trash2 } from 'lucide-react';

interface BulkActionsMenuProps {
  onAction: (action: string, value?: any) => void;
}

export function BulkActionsMenu({ onAction }: BulkActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm">
          Bulk Actions
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => onAction('update-properties')}>
          <Edit className="w-4 h-4 mr-2" />
          Update Properties
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            Change Domain
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => onAction('change-domain', 'Contract')}>
              Contract
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('change-domain', 'User')}>
              User
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('change-domain', 'Workflow')}>
              Workflow
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('change-domain', 'Tool')}>
              Tool
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            Change Category
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => onAction('change-category', 'entity')}>
              Entity
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('change-category', 'concept')}>
              Concept
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('change-category', 'process')}>
              Process
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            Change App
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => onAction('change-app', 'core')}>
              Core
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('change-app', 'pmbook')}>
              PMBook
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('change-app', 'aihub')}>
              AI Hub
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => onAction('export-json')}>
          <Download className="w-4 h-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onAction('export-csv')}>
          <Download className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => onAction('delete')}
          className="text-red-600 dark:text-red-400"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Selected
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Bulk Operations Hook

**File:** `hooks/use-bulk-operations.ts`

```typescript
import { useState, useCallback } from 'react';
import { apiClient } from '@captify-io/core/lib/api';
import { toast } from 'sonner';

export function useBulkOperations() {
  const [processing, setProcessing] = useState(false);

  const updateProperties = useCallback(async (nodeIds: string[], updates: Record<string, any>) => {
    setProcessing(true);
    try {
      const results = await Promise.allSettled(
        nodeIds.map(id =>
          apiClient.run({
            service: 'platform.dynamodb',
            operation: 'update',
            table: 'core-ontology-node',
            data: {
              Key: { id },
              UpdateExpression: `SET ${Object.keys(updates).map((key, i) => `#k${i} = :v${i}`).join(', ')}, updatedAt = :updatedAt`,
              ExpressionAttributeNames: Object.keys(updates).reduce((acc, key, i) => ({
                ...acc,
                [`#k${i}`]: key
              }), {}),
              ExpressionAttributeValues: {
                ...Object.values(updates).reduce((acc, val, i) => ({
                  ...acc,
                  [`:v${i}`]: val
                }), {}),
                ':updatedAt': new Date().toISOString()
              }
            }
          })
        )
      );

      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (failed === 0) {
        toast.success(`Updated ${succeeded} nodes successfully`);
      } else {
        toast.warning(`Updated ${succeeded} nodes, ${failed} failed`);
      }
    } catch (error) {
      toast.error('Bulk update failed');
    } finally {
      setProcessing(false);
    }
  }, []);

  const deleteNodes = useCallback(async (nodeIds: string[], cascadeDelete: boolean = false) => {
    setProcessing(true);
    try {
      // If cascade, also delete edges
      if (cascadeDelete) {
        // Delete all edges connected to these nodes
        await Promise.allSettled(
          nodeIds.map(async (nodeId) => {
            // Query source-target-index for edges
            const edgesResult = await apiClient.run({
              service: 'platform.dynamodb',
              operation: 'query',
              table: 'core-ontology-edge',
              data: {
                IndexName: 'source-target-index',
                KeyConditionExpression: 'source = :source',
                ExpressionAttributeValues: { ':source': nodeId }
              }
            });

            const edges = edgesResult.data?.Items || [];
            return Promise.all(
              edges.map((edge: any) =>
                apiClient.run({
                  service: 'platform.dynamodb',
                  operation: 'delete',
                  table: 'core-ontology-edge',
                  data: { Key: { id: edge.id } }
                })
              )
            );
          })
        );
      }

      // Delete nodes
      const results = await Promise.allSettled(
        nodeIds.map(id =>
          apiClient.run({
            service: 'platform.dynamodb',
            operation: 'delete',
            table: 'core-ontology-node',
            data: { Key: { id } }
          })
        )
      );

      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      toast.success(`Deleted ${succeeded} nodes${cascadeDelete ? ' and their relationships' : ''}`);
    } catch (error) {
      toast.error('Bulk delete failed');
    } finally {
      setProcessing(false);
    }
  }, []);

  const exportJSON = useCallback(async (nodeIds: string[]) => {
    try {
      const nodes = await Promise.all(
        nodeIds.map(id =>
          apiClient.run({
            service: 'platform.dynamodb',
            operation: 'get',
            table: 'core-ontology-node',
            data: { Key: { id } }
          }).then(r => r.data)
        )
      );

      const json = JSON.stringify(nodes, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ontology-nodes-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Exported nodes to JSON');
    } catch (error) {
      toast.error('Export failed');
    }
  }, []);

  const exportCSV = useCallback(async (nodeIds: string[]) => {
    try {
      const nodes = await Promise.all(
        nodeIds.map(id =>
          apiClient.run({
            service: 'platform.dynamodb',
            operation: 'get',
            table: 'core-ontology-node',
            data: { Key: { id } }
          }).then(r => r.data)
        )
      );

      // Create CSV
      const headers = ['id', 'name', 'label', 'type', 'domain', 'category', 'app'];
      const rows = nodes.map((node: any) =>
        headers.map(h => `"${node[h] || ''}"`).join(',')
      );
      const csv = [headers.join(','), ...rows].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ontology-nodes-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Exported nodes to CSV');
    } catch (error) {
      toast.error('Export failed');
    }
  }, []);

  return {
    processing,
    updateProperties,
    deleteNodes,
    exportJSON,
    exportCSV,
  };
}
```

### Integration with List View

Update `components/ontology-list.tsx` to support selection:

```typescript
interface OntologyListProps {
  results: any[];
  loading: boolean;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function OntologyList({ results, loading, selectedIds, onSelectionChange }: OntologyListProps) {
  const handleRowClick = (id: string, event: React.MouseEvent) => {
    if (event.shiftKey) {
      // Range selection
      // ...
    } else if (event.ctrlKey || event.metaKey) {
      // Toggle selection
      if (selectedIds.includes(id)) {
        onSelectionChange(selectedIds.filter(sid => sid !== id));
      } else {
        onSelectionChange([...selectedIds, id]);
      }
    } else {
      // Navigate to editor
      router.push(`/core/designer/ontology/${id}`);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={selectedIds.length === results.length}
              onCheckedChange={(checked) => {
                if (checked) {
                  onSelectionChange(results.map(r => r.id));
                } else {
                  onSelectionChange([]);
                }
              }}
            />
          </TableHead>
          <TableHead>Name</TableHead>
          {/* ... other columns */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((node) => (
          <TableRow
            key={node.id}
            className={cn(
              "cursor-pointer hover:bg-muted/50",
              selectedIds.includes(node.id) && "bg-blue-50 dark:bg-blue-950"
            )}
            onClick={(e) => handleRowClick(node.id, e)}
          >
            <TableCell>
              <Checkbox
                checked={selectedIds.includes(node.id)}
                onClick={(e) => e.stopPropagation()}
              />
            </TableCell>
            <TableCell>{node.label}</TableCell>
            {/* ... other cells */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## Implementation Checklist

### Selection System

- [ ] Add selection state to list view
- [ ] Implement Checkbox in table header (select all)
- [ ] Implement Checkbox in table rows (select individual)
- [ ] Support Ctrl+click for toggle selection
- [ ] Support Shift+click for range selection
- [ ] Highlight selected rows
- [ ] Show selection count

### Bulk Toolbar

- [ ] Create `bulk-toolbar.tsx`
  - [ ] Show selection count
  - [ ] Clear selection button
  - [ ] Bulk actions dropdown

- [ ] Create `bulk-actions-menu.tsx`
  - [ ] Update properties action
  - [ ] Change domain submenu
  - [ ] Change category submenu
  - [ ] Change app submenu
  - [ ] Export JSON action
  - [ ] Export CSV action
  - [ ] Delete action

### Bulk Operations Hook

- [ ] Create `hooks/use-bulk-operations.ts`
  - [ ] `updateProperties()` - Update multiple nodes
  - [ ] `deleteNodes()` - Delete with cascade option
  - [ ] `exportJSON()` - Export selected to JSON
  - [ ] `exportCSV()` - Export selected to CSV
  - [ ] Handle partial success/failure
  - [ ] Show progress for long operations

### Dialogs

- [ ] Create `bulk-property-dialog.tsx`
  - [ ] Select which properties to update
  - [ ] Input new values
  - [ ] Preview changes
  - [ ] Confirm button

- [ ] Create `bulk-delete-dialog.tsx`
  - [ ] Warning about deletion
  - [ ] Cascade delete checkbox
  - [ ] Show affected relationships count
  - [ ] Confirm button

### Testing

- [ ] Test select all
- [ ] Test deselect all
- [ ] Test Ctrl+click selection
- [ ] Test Shift+click range selection
- [ ] Test bulk update properties
- [ ] Test bulk delete without cascade
- [ ] Test bulk delete with cascade
- [ ] Test export JSON
- [ ] Test export CSV
- [ ] Test partial failures (some succeed, some fail)
- [ ] Test with 100+ nodes selected

### Performance

- [ ] Optimize DynamoDB batch operations (use BatchWriteItem)
- [ ] Show progress bar for long operations
- [ ] Allow cancellation of long operations
- [ ] Handle rate limiting (DynamoDB has limits)

## Success Criteria

- [ ] Can select multiple nodes via checkboxes
- [ ] Can select range with Shift+click
- [ ] Can toggle with Ctrl/Cmd+click
- [ ] Bulk update works for all properties
- [ ] Bulk delete works with/without cascade
- [ ] Export JSON/CSV works correctly
- [ ] Performance is acceptable for 100+ nodes
- [ ] Partial failures are handled gracefully

## Notes for Future Agents

### Why Bulk Operations?

Large ontologies can have 500+ nodes. Manually updating or deleting nodes one-by-one is tedious. Bulk operations are essential for:
- Migrating domains (move all Contract nodes to new domain)
- Cleanup (delete deprecated nodes)
- Export/Import (backup and restore)
- Reorganization (change categories in bulk)

### DynamoDB Batch Operations

DynamoDB supports batch operations but with limits:
- **BatchWriteItem**: Max 25 items per request
- **BatchGetItem**: Max 100 items per request
- Need to split large operations into chunks

Example chunking:
```typescript
const chunks = [];
for (let i = 0; i < items.length; i += 25) {
  chunks.push(items.slice(i, i + 25));
}

for (const chunk of chunks) {
  await batchWrite(chunk);
}
```

### Cascade Delete Considerations

When deleting nodes, relationships can become orphaned. Options:
1. **Cascade delete**: Delete node + all connected edges
2. **Warn only**: Show warning but don't delete edges
3. **Block delete**: Don't allow deletion if edges exist

Current implementation uses option 1 (cascade delete) with checkbox to enable/disable.

### Undo for Bulk Operations

Bulk operations should be undoable. Implementation options:
1. Store operation log in localStorage
2. Store backup in DynamoDB before deletion
3. Use DynamoDB Streams to capture changes

For MVP, show confirmation dialog with detailed preview. Add undo in future iteration.

## Next Steps

After completing bulk operations:
- **Review all 5 design docs** for consistency
- **Create implementation timeline**
- **Assign work to development sprints**
