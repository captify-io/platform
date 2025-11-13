# Search Service - Quick Reference

## Import

```typescript
import { performSearch, searchService } from '@captify-io/core/services/search';
import type { SearchResult } from '@captify-io/core/services/search';
```

## Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `performSearch(query, options?)` | Unified search (all types) | `SearchResult[]` |
| `searchOntology(query, credentials?, schema?)` | Search ontology nodes | `SearchResult[]` |
| `searchEntities(query, credentials?, schema?, app?)` | Search entity records | `SearchResult[]` |
| `searchDocuments(query, indices?, app?)` | Search documents (Kendra) | `SearchResult[]` |

## Basic Examples

### Unified Search (Recommended)

```typescript
// Simple
const results = await performSearch('admin');

// With options
const results = await performSearch('contract', {
  selectedApp: 'pmbook',
  kendraIndices: [{ indexId: '...', appName: 'PMBook', appSlug: 'pmbook' }]
});
```

### Individual Searches

```typescript
// Ontology only
const ontology = await searchOntology('user');

// Entities only
const entities = await searchEntities('john');

// Documents only
const docs = await searchDocuments('contract', kendraIndices);
```

## SearchResult Interface

```typescript
{
  id: string;              // Unique identifier
  title: string;           // Display title
  excerpt?: string;        // Result excerpt
  type: 'ONTOLOGY' | 'ITEM' | 'DOCUMENT';

  // Type-specific fields
  domain?: string;         // Ontology
  category?: string;       // Ontology
  icon?: string;           // Ontology, Item
  table?: string;          // Item
  itemType?: string;       // Item
  documentUri?: string;    // Document
}
```

## React Hook Example

```typescript
function useSearch(query: string) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      const data = await performSearch(query);
      setResults(data);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return { results, loading };
}
```

## Performance

- **Target**: < 500ms (P95)
- **Parallel**: All searches run concurrently
- **Limits**: 20 ontology + 5/entity type + 10 documents
- **Caching**: Ontology nodes cached 5 min

## Error Handling

All functions return `[]` on error and log to console. No exceptions thrown.

```typescript
try {
  const results = await performSearch('test');
} catch (error) {
  // Won't throw - returns [] on error
}
```

## Requirements

- ✅ DynamoDB: `captify-core-search-index` table
- ✅ Ontology: Entity types with `fullTextSearch` configured
- ✅ Kendra: Optional for document search
- ✅ Cognito: For AWS credentials

## Common Use Cases

| Use Case | Function | Example |
|----------|----------|---------|
| Global search bar | `performSearch` | Search everything |
| Type-ahead | `searchOntology` | Find entity types |
| User lookup | `searchEntities` | Find specific records |
| Document finder | `searchDocuments` | Find files |
| App-specific search | `performSearch` | Filter by app |

## See Also

- [Complete Usage Guide](./USAGE.md)
- [Feature Specification](./features/01-dropdown-search.md)
- [Source Code](../../core/src/services/search/index.ts)
