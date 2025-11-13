# Search Service Usage Guide

## Overview

The unified search service provides comprehensive search across ontology, entities, and documents with a simple API.

## Installation

The search service is available in `@captify-io/core`:

```typescript
import { performSearch, searchService } from '@captify-io/core/services/search';
// Or individual functions
import { searchOntology, searchEntities, searchDocuments } from '@captify-io/core/services/search';
```

## Basic Usage

### Unified Search (Recommended)

Search across all types (ontology, entities, documents) in parallel:

```typescript
import { performSearch } from '@captify-io/core/services/search';

// Simple search
const results = await performSearch('contract');

// With options
const results = await performSearch('admin', {
  credentials,              // Optional: AWS credentials (auto-fetched if not provided)
  schema: 'captify',        // Optional: Schema prefix (default: 'captify')
  kendraIndices: [],        // Optional: Kendra index configurations
  selectedApp: 'pmbook',    // Optional: Filter by app ('all' or specific app)
});

// Results are automatically:
// - Grouped by type (Ontology → Items → Documents)
// - Sorted by relevance (exact matches first)
// - Limited (20 ontology + 5/entity type + 10 documents)
```

### Search Ontology Only

Search ontology nodes by name:

```typescript
import { searchOntology } from '@captify-io/core/services/search';

const ontologyResults = await searchOntology('user');
// Returns: [
//   { id: 'core-user', title: 'User', type: 'ONTOLOGY', domain: 'Core', ... },
//   { id: 'pmbook-admin', title: 'Admin', type: 'ONTOLOGY', domain: 'PMBook', ... }
// ]
```

### Search Entities Only

Search all entity types with full-text search configured:

```typescript
import { searchEntities } from '@captify-io/core/services/search';

const entityResults = await searchEntities('john');
// Returns: [
//   { id: 'user-123', title: 'John Doe', type: 'ITEM', itemType: 'User', ... },
//   { id: 'contact-456', title: 'John Smith', type: 'ITEM', itemType: 'Contact', ... }
// ]

// Filter by app
const pmbookOnly = await searchEntities('contract', undefined, 'captify', 'pmbook');
```

### Search Documents Only

Search documents via Kendra indices:

```typescript
import { searchDocuments } from '@captify-io/core/services/search';

const kendraIndices = [
  { indexId: 'kendra-123', appName: 'PMBook', appSlug: 'pmbook' },
  { indexId: 'kendra-456', appName: 'MI', appSlug: 'mi' }
];

const documentResults = await searchDocuments('contract', kendraIndices);
// Returns: [
//   { id: 'doc-789', title: 'Service Contract.pdf', type: 'DOCUMENT', documentUri: 's3://...', ... }
// ]
```

## SearchResult Interface

All search functions return `SearchResult[]`:

```typescript
interface SearchResult {
  id: string;
  title: string;
  excerpt?: string;
  type: 'ONTOLOGY' | 'ITEM' | 'DOCUMENT';

  // Ontology-specific
  domain?: string;
  category?: string;
  icon?: string;
  color?: string;

  // Entity-specific
  table?: string;
  itemType?: string;
  appSource?: string;

  // Document-specific
  documentUri?: string;
  updatedAt?: string;

  // Generic attributes
  attributes?: Record<string, any>;
}
```

## Integration Examples

### React Component

```typescript
'use client';

import { useState, useEffect } from 'react';
import { performSearch } from '@captify-io/core/services/search';
import type { SearchResult } from '@captify-io/core/services/search';

export function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const searchResults = await performSearch(query);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      {isSearching && <div>Searching...</div>}
      <div>
        {results.map((result) => (
          <div key={result.id}>
            <strong>{result.title}</strong>
            <span>{result.type}</span>
            {result.excerpt && <p>{result.excerpt}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### SearchModal Integration

The existing [SearchModal component](../../core/src/components/layout/search.tsx) has been updated to use the unified search service:

```typescript
import { performSearch } from '../../services/search';

const performSearch = async (searchQuery: string) => {
  setIsSearching(true);
  try {
    const searchResults = await performSearch(searchQuery, {
      kendraIndices: allIndices,
      selectedApp: selectedApp,
    });
    setResults(searchResults);
  } catch (error) {
    console.error('Search error:', error);
    setResults([]);
  } finally {
    setIsSearching(false);
  }
};
```

### Server-Side API Route

```typescript
// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { performSearch } from '@captify-io/core/services/search';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }

  try {
    const results = await performSearch(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
```

## Performance Considerations

### Parallel Execution

All searches run in parallel using `Promise.all()`:

```typescript
const [ontologyResults, entityResults, documentResults] = await Promise.all([
  searchOntology(query, credentials, schema),
  searchEntities(query, credentials, schema, selectedApp),
  searchDocuments(query, kendraIndices, selectedApp)
]);
```

**Target Performance**: < 500ms for complete search (P95)

### Result Limits

To maintain performance:
- **Ontology**: Top 20 results
- **Entities**: Top 5 per entity type
- **Documents**: Top 10 total

### Caching

- Ontology nodes are cached for 5 minutes (via `getAllNodes`)
- Credentials auto-fetched and reused within same search
- Search results are NOT cached (always fresh)

## Error Handling

All search functions gracefully handle errors:

```typescript
try {
  const results = await searchOntology('test');
} catch (error) {
  // Error logged to console
  // Empty array returned
  console.error('Ontology search failed:', error);
}
```

**Behavior on Error**:
- Individual search failures return `[]`
- Other search types still return results
- At least one search type must succeed for results

## Requirements

### DynamoDB Tables

- `captify-core-search-index` - Full-text search index
- `captify-core-ontology-node` - Ontology data
- Entity tables with `fullTextSearch` property configured

### Ontology Configuration

Entity types must have `fullTextSearch` configured in their ontology node:

```json
{
  "id": "core-user",
  "category": "entity",
  "properties": {
    "fullTextSearch": [
      {
        "field": "name",
        "analyzer": "standard"
      }
    ],
    "dataSource": "core-user"
  }
}
```

### Kendra Indices (Optional)

For document search, provide Kendra index configurations:

```typescript
const kendraIndices = [
  {
    indexId: 'your-kendra-index-id',
    appName: 'PMBook',
    appSlug: 'pmbook'
  }
];
```

## Testing

See [generated tests](./tests/01-dropdown-search.test.ts) for comprehensive test examples.

### Unit Test Example

```typescript
import { searchOntology } from '@captify-io/core/services/search';
import { apiClient } from '@captify-io/core/lib/api';

jest.mock('@captify-io/core/lib/api');

describe('searchOntology', () => {
  it('should return ontology results', async () => {
    (apiClient.run as jest.Mock).mockResolvedValue({
      success: true,
      data: { credentials: mockCredentials }
    });

    const results = await searchOntology('admin');

    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].type).toBe('ONTOLOGY');
  });
});
```

## Troubleshooting

### No Results Returned

1. **Check full-text index**: Ensure `captify-core-search-index` table exists
2. **Check ontology**: Verify entity types have `fullTextSearch` configured
3. **Check credentials**: Ensure user has valid AWS credentials
4. **Check logs**: Look for errors in console

### Slow Performance

1. **Check result limits**: Verify not returning too many results
2. **Check indexes**: Ensure DynamoDB GSIs exist (`token-index`, `typeId-index`)
3. **Check network**: Verify low latency to AWS services
4. **Monitor logs**: Check for timeout errors

### TypeScript Errors

Ensure you're importing types correctly:

```typescript
import type { SearchResult } from '@captify-io/core/services/search';
```

## Related Documentation

- [Search Feature Spec](./features/01-dropdown-search.md)
- [YAML User Stories](./user-stories/01-dropdown-search.yaml)
- [Search Service Source](../../core/src/services/search/index.ts)
- [SearchModal Component](../../core/src/components/layout/search.tsx)
- [Full-Text Search Service](../../core/src/services/data/search/fulltext.ts)
