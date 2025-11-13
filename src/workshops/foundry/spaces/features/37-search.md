# Feature 37: Global Search

**Persona:** System
**Priority:** High
**Effort:** Large
**Status:** Sprint 2

## Overview
Global semantic search across all entities (spaces, workstreams, tasks, features, documents, contracts) using AWS Kendra with natural language queries and faceted filtering.

## Requirements
### Functional: Search all entity types, Natural language queries, Faceted filters, Recent searches, Saved searches, Search suggestions, Result ranking
### Non-Functional: Results <1s, Support 100K+ documents, Real-time indexing, Mobile search experience

## Ontology
### Nodes Used: All entity types (Space, Workstream, Task, Feature, Document, Contract, etc.)

## Components
```typescript
// /opt/captify-apps/core/src/components/spaces/features/search/global-search.tsx (REUSABLE)
export function GlobalSearch()

// /opt/captify-apps/core/src/components/spaces/features/search/search-results.tsx (REUSABLE)
export function SearchResults({ query, filters }: SearchResultsProps)

// /opt/captify-apps/core/src/components/spaces/features/search/search-filters.tsx (REUSABLE)
export function SearchFilters({ onFilterChange }: SearchFiltersProps)
```

## Actions
### 1. Global Search
```typescript
interface GlobalSearchRequest {
  service: 'platform.kendra';
  operation: 'query';
  data: {
    indexId: string;
    queryText: string;
    facets?: Array<{ field: string; values: string[] }>;
    pageSize?: number;
  };
}

interface SearchResponse {
  results: Array<{
    id: string;
    type: string; // 'space', 'task', 'document', etc.
    title: string;
    excerpt: string;
    url: string;
    score: number;
  }>;
  facets: { [key: string]: Array<{ value: string; count: number }> };
  total: number;
}
```

### 2. Index Entity
```typescript
interface IndexEntityRequest {
  entityType: string;
  entityId: string;
  content: {
    title: string;
    body: string;
    metadata: Record<string, any>;
  };
}
```

## User Stories
### Story 1: User Searches Globally
**Tasks:** Enter query, show all results, filter by type, click to view
**Acceptance:** Results appear in <1s, relevant items ranked first

### Story 2: User Filters Search Results
**Tasks:** Apply entity type filter, date range, status, refine results
**Acceptance:** Filters update results instantly

## Implementation
```typescript
async function globalSearch(
  query: string,
  filters?: SearchFilters,
  credentials?: AwsCredentials
): Promise<SearchResponse> {
  const kendraResponse = await kendra.query({
    indexId: 'captify-main-index',
    queryText: query,
    attributeFilter: buildFilterExpression(filters),
    facets: [
      { documentAttributeKey: 'entityType' },
      { documentAttributeKey: 'status' },
      { documentAttributeKey: 'priority' }
    ]
  }, credentials);

  return {
    results: kendraResponse.ResultItems.map(item => ({
      id: item.Id,
      type: item.DocumentAttributes.entityType,
      title: item.DocumentTitle.Text,
      excerpt: item.DocumentExcerpt.Text,
      url: buildEntityUrl(item.DocumentAttributes.entityType, item.Id),
      score: item.ScoreAttributes.ScoreConfidence
    })),
    facets: kendraResponse.Facets,
    total: kendraResponse.TotalNumberOfResults
  };
}
```

## Dependencies: AWS Kendra, All entity features
## Status: Sprint 2, Not Started
