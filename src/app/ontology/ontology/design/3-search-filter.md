# 3. Advanced Search & Filter - Ontology Discovery

**Priority:** MEDIUM
**Estimated Time:** 3-4 hours
**Dependencies:** 1-indexes.md (REQUIRED), 2-flow-migration.md (recommended)
**Status:** Not Started

## Overview

Build comprehensive search and filtering capabilities for the ontology designer. Users need to quickly find nodes by name, filter by domain/category/app, and save common searches. This depends on the indexes created in step 1.

## Current State

**What Exists:**
- Basic dropdown search in header (scans all nodes)
- No filtering by domain, category, or app
- No date range filtering
- No saved searches
- No full-text search
- Poor performance on large ontologies (>100 nodes)

**What's Missing:**
- Advanced filter panel
- Multi-criteria search
- Search result sorting
- Search history
- Saved search presets
- Export filtered results

## Design Mockup

```
┌──────────────────────────────────────────────────────────────┐
│ Ontology Designer                          [Filter] [+ New]  │
├──────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌──────────────────────────────────────────┐ │
│ │  FILTERS    │ │  RESULTS (24 nodes)                      │ │
│ │             │ │  ┌────────────────────────────────────┐  │ │
│ │ Search:     │ │  │ Contract                            │  │ │
│ │ [_______]   │ │  │ Type: entity | Domain: Contract     │  │ │
│ │             │ │  │ App: pmbook  | Updated: 2 days ago  │  │ │
│ │ Domain:     │ │  └────────────────────────────────────┘  │ │
│ │ [Contract ▾]│ │  ┌────────────────────────────────────┐  │ │
│ │             │ │  │ ChangeRequest                       │  │ │
│ │ Category:   │ │  │ Type: entity | Domain: Workflow     │  │ │
│ │ [entity   ▾]│ │  │ App: pmbook  | Updated: 1 week ago  │  │ │
│ │             │ │  └────────────────────────────────────┘  │ │
│ │ App:        │ │  ...                                      │ │
│ │ [pmbook   ▾]│ │                                           │ │
│ │             │ │                                           │ │
│ │ Type:       │ │                                           │ │
│ │ [contract ▾]│ │                                           │ │
│ │             │ │                                           │ │
│ │ Created:    │ │                                           │ │
│ │ [Last 7 days▾]│                                          │ │
│ │             │ │                                           │ │
│ │ [Clear All] │ │                                           │ │
│ │ [Save ★]    │ │                                           │ │
│ └─────────────┘ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Implementation Details

### Component Structure

```
components/
├── ontology-search.tsx           # Filter panel (left side)
├── ontology-list.tsx             # Results table (right side)
├── ontology-card.tsx             # Individual result card
├── saved-searches.tsx            # Saved search management
└── search-preset-dialog.tsx      # Dialog for saving searches
```

### Search Hook

**File:** `hooks/use-ontology-search.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@captify-io/core/lib/api';

export interface OntologyFilters {
  query?: string;           // Text search
  domain?: string;          // Domain filter
  category?: string;        // Category filter
  app?: string;             // App filter
  type?: string;            // Type filter
  dateRange?: {             // Date range
    start: string;
    end: string;
  };
}

export function useOntologySearch(filters: OntologyFilters) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let queryResult;

      // Choose optimal index based on filters
      if (filters.query) {
        // Use name-index for exact name match
        queryResult = await apiClient.run({
          service: 'platform.dynamodb',
          operation: 'query',
          table: 'core-ontology-node',
          data: {
            IndexName: 'name-index',
            KeyConditionExpression: '#name = :name',
            ExpressionAttributeNames: { '#name': 'name' },
            ExpressionAttributeValues: { ':name': filters.query }
          }
        });
      } else if (filters.app) {
        // Use app-type-index for app filtering
        const keyCondition = filters.type
          ? 'app = :app AND begins_with(#type, :type)'
          : 'app = :app';

        queryResult = await apiClient.run({
          service: 'platform.dynamodb',
          operation: 'query',
          table: 'core-ontology-node',
          data: {
            IndexName: 'app-type-index',
            KeyConditionExpression: keyCondition,
            ExpressionAttributeNames: { '#type': 'type' },
            ExpressionAttributeValues: {
              ':app': filters.app,
              ...(filters.type && { ':type': filters.type })
            }
          }
        });
      } else if (filters.domain) {
        // Use domain-category-index
        const keyCondition = filters.category
          ? 'domain = :domain AND category = :category'
          : 'domain = :domain';

        queryResult = await apiClient.run({
          service: 'platform.dynamodb',
          operation: 'query',
          table: 'core-ontology-node',
          data: {
            IndexName: 'domain-category-index',
            KeyConditionExpression: keyCondition,
            ExpressionAttributeValues: {
              ':domain': filters.domain,
              ...(filters.category && { ':category': filters.category })
            }
          }
        });
      } else if (filters.dateRange) {
        // Use tenantId-createdAt-index for date filtering
        queryResult = await apiClient.run({
          service: 'platform.dynamodb',
          operation: 'query',
          table: 'core-ontology-node',
          data: {
            IndexName: 'tenantId-createdAt-index',
            KeyConditionExpression: 'tenantId = :tenant AND createdAt BETWEEN :start AND :end',
            ExpressionAttributeValues: {
              ':tenant': 'default',
              ':start': filters.dateRange.start,
              ':end': filters.dateRange.end
            }
          }
        });
      } else {
        // Fallback to scan (with limit)
        queryResult = await apiClient.run({
          service: 'platform.dynamodb',
          operation: 'scan',
          table: 'core-ontology-node',
          data: {
            Limit: 100
          }
        });
      }

      const items = queryResult.data?.Items || [];

      // Apply additional client-side filters
      let filtered = items;

      if (filters.query && !filters.query.match(/^\w+$/)) {
        // Fuzzy search on label/description
        const q = filters.query.toLowerCase();
        filtered = filtered.filter(item =>
          item.label?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
        );
      }

      setResults(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    search();
  }, [search]);

  return {
    results,
    loading,
    error,
    refetch: search,
  };
}
```

### Search Component

**File:** `components/ontology-search.tsx`

```typescript
"use client";

import { useState } from 'react';
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button } from '@captify-io/core/components/ui';
import { Search, X, Star } from 'lucide-react';
import type { OntologyFilters } from '../hooks/use-ontology-search';

interface OntologySearchProps {
  onFilterChange: (filters: OntologyFilters) => void;
  onSaveSearch?: (name: string, filters: OntologyFilters) => void;
}

export function OntologySearch({ onFilterChange, onSaveSearch }: OntologySearchProps) {
  const [filters, setFilters] = useState<OntologyFilters>({});

  const updateFilter = (key: keyof OntologyFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAll = () => {
    setFilters({});
    onFilterChange({});
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold flex-1">Filters</h3>
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Text Search */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Node name..."
            value={filters.query || ''}
            onChange={(e) => updateFilter('query', e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Domain Filter */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Domain</label>
        <Select
          value={filters.domain || ''}
          onValueChange={(value) => updateFilter('domain', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All domains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All domains</SelectItem>
            <SelectItem value="Contract">Contract</SelectItem>
            <SelectItem value="User">User</SelectItem>
            <SelectItem value="Workflow">Workflow</SelectItem>
            <SelectItem value="Tool">Tool</SelectItem>
            <SelectItem value="Editor">Editor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category Filter */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Category</label>
        <Select
          value={filters.category || ''}
          onValueChange={(value) => updateFilter('category', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            <SelectItem value="entity">Entity</SelectItem>
            <SelectItem value="concept">Concept</SelectItem>
            <SelectItem value="process">Process</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* App Filter */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Application</label>
        <Select
          value={filters.app || ''}
          onValueChange={(value) => updateFilter('app', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All apps" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All apps</SelectItem>
            <SelectItem value="core">Core</SelectItem>
            <SelectItem value="pmbook">PMBook</SelectItem>
            <SelectItem value="aihub">AI Hub</SelectItem>
            <SelectItem value="mi">Materiel Insights</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Type Filter */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Type</label>
        <Input
          placeholder="contract, user, etc."
          value={filters.type || ''}
          onChange={(e) => updateFilter('type', e.target.value)}
        />
      </div>

      {/* Date Range */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Created</label>
        <Select
          onValueChange={(value) => {
            const now = new Date();
            let start: Date;

            switch (value) {
              case 'today':
                start = new Date(now.setHours(0, 0, 0, 0));
                break;
              case 'week':
                start = new Date(now.setDate(now.getDate() - 7));
                break;
              case 'month':
                start = new Date(now.setMonth(now.getMonth() - 1));
                break;
              default:
                return;
            }

            updateFilter('dateRange', {
              start: start.toISOString(),
              end: new Date().toISOString()
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Save Search */}
      {onSaveSearch && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            const name = prompt('Save search as:');
            if (name) onSaveSearch(name, filters);
          }}
        >
          <Star className="w-4 h-4 mr-2" />
          Save Search
        </Button>
      )}
    </div>
  );
}
```

### Results List Component

**File:** `components/ontology-list.tsx`

```typescript
"use client";

import { useRouter } from 'next/navigation';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@captify-io/core/components/ui';
import { formatDistanceToNow } from 'date-fns';
import { OntologyCard } from './ontology-card';

interface OntologyListProps {
  results: any[];
  loading: boolean;
  viewMode?: 'table' | 'grid';
}

export function OntologyList({ results, loading, viewMode = 'table' }: OntologyListProps) {
  const router = useRouter();

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (results.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No nodes found. Try adjusting your filters.
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {results.map((node) => (
          <OntologyCard
            key={node.id}
            node={node}
            onClick={() => router.push(`/core/designer/ontology/${node.id}`)}
          />
        ))}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Domain</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>App</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((node) => (
          <TableRow
            key={node.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => router.push(`/core/designer/ontology/${node.id}`)}
          >
            <TableCell className="font-medium">{node.label || node.name}</TableCell>
            <TableCell>
              <span className="text-xs bg-muted px-2 py-1 rounded">{node.type}</span>
            </TableCell>
            <TableCell>{node.domain}</TableCell>
            <TableCell>{node.category}</TableCell>
            <TableCell>{node.app}</TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {node.updatedAt ? formatDistanceToNow(new Date(node.updatedAt), { addSuffix: true }) : 'Unknown'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## Implementation Checklist

### Prerequisites

- [ ] Verify 1-indexes.md is complete (all GSIs created)
- [ ] Test queries work with new indexes
- [ ] Measure baseline search performance

### Create Components

- [ ] Create `components/ontology-search.tsx`
  - [ ] Text search input
  - [ ] Domain dropdown
  - [ ] Category dropdown
  - [ ] App dropdown
  - [ ] Type input
  - [ ] Date range selector
  - [ ] Clear all button
  - [ ] Save search button

- [ ] Create `components/ontology-list.tsx`
  - [ ] Table view mode
  - [ ] Grid view mode
  - [ ] Loading state
  - [ ] Empty state
  - [ ] Row click handler

- [ ] Create `components/ontology-card.tsx`
  - [ ] Node icon
  - [ ] Node name
  - [ ] Type badge
  - [ ] Domain/category tags
  - [ ] Updated timestamp

- [ ] Create `components/saved-searches.tsx`
  - [ ] List saved searches
  - [ ] Load saved search
  - [ ] Delete saved search
  - [ ] Rename saved search

### Create Hooks

- [ ] Create `hooks/use-ontology-search.ts`
  - [ ] Index selection logic
  - [ ] Query building
  - [ ] Client-side filtering
  - [ ] Error handling
  - [ ] Loading states

- [ ] Create `hooks/use-saved-searches.ts`
  - [ ] Load from localStorage
  - [ ] Save to localStorage
  - [ ] Delete search
  - [ ] List all searches

### Update Pages

- [ ] Update `page.tsx`
  - [ ] Add filter panel toggle
  - [ ] Add view mode switcher (table/grid)
  - [ ] Integrate search hook
  - [ ] Show result count

### Testing

- [ ] Test exact name search (name-index)
- [ ] Test app filter (app-type-index)
- [ ] Test domain filter (domain-category-index)
- [ ] Test date range (tenantId-createdAt-index)
- [ ] Test combined filters
- [ ] Test search performance (<100ms)
- [ ] Test with 0 results
- [ ] Test with 1000+ results
- [ ] Test save/load searches
- [ ] Test clear filters

### Performance Testing

- [ ] Measure query time with indexes
- [ ] Verify no full table scans in CloudWatch
- [ ] Test with production data volume
- [ ] Optimize slow queries

### Documentation

- [ ] Document search patterns
- [ ] Add examples for each filter
- [ ] Document index usage
- [ ] Add troubleshooting guide

## Performance Targets

| Operation | Before Indexes | After Indexes | Target |
|-----------|---------------|---------------|--------|
| Name search | 800ms (scan) | 50ms (query) | <100ms |
| App filter | 1200ms (scan) | 80ms (query) | <100ms |
| Domain filter | 900ms (scan) | 60ms (query) | <100ms |
| Date range | N/A (not possible) | 100ms (query) | <150ms |
| Combined filters | 1500ms+ (scan) | 120ms (query) | <200ms |

## Success Criteria

- [ ] All filter combinations work correctly
- [ ] Search results appear in <200ms
- [ ] Saved searches persist across sessions
- [ ] UI is responsive and intuitive
- [ ] No full table scans (verify in CloudWatch)
- [ ] Tests pass for all query patterns

## Notes for Future Agents

### Index Selection Strategy

The hook chooses the most efficient index based on which filters are set:

1. **name-index**: If `query` is an exact node name
2. **app-type-index**: If `app` is set (with optional `type`)
3. **domain-category-index**: If `domain` is set (with optional `category`)
4. **tenantId-createdAt-index**: If `dateRange` is set
5. **Scan**: Fallback with limit=100

This prioritization minimizes query time by using the most selective index first.

### Why Client-Side Filtering?

Some filters (like fuzzy text search) require client-side filtering because DynamoDB doesn't support LIKE queries. The strategy is:
1. Use index to get a small subset (~10-50 items)
2. Apply fuzzy matching in JavaScript
3. Return filtered results

This is much faster than scanning the entire table client-side.

### Saved Searches Storage

Saved searches are stored in localStorage, not DynamoDB, because:
- They're user-specific preferences
- No need for cross-device sync
- Fast access without API calls
- Simple implementation

For enterprise features, consider storing in `core-user-state` table instead.

## Next Steps

After completing search/filter, proceed to:
- **4-property-editor.md** - Enhanced property editing with schema validation
- **5-bulk-operations.md** - Multi-select and bulk operations on filtered results
