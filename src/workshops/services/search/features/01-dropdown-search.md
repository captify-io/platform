# Feature: Dropdown Search Component

## Overview

Real-time search component with dropdown results that searches across ontology nodes, entity records, and documents. Results appear as user types, grouped by type, with keyboard navigation support.

## Requirements

### Functional Requirements

1. **Real-Time Search**
   - Debounce user input (300ms)
   - Fire parallel searches to ontology, entities, and documents
   - Display results in dropdown below input

2. **Ontology Search**
   - Search core-ontology-node table by name field
   - Use full-text search service
   - Return top 20 matching nodes

3. **Entity Search**
   - Discover all entity types with fullTextSearch configured
   - Search each type using searchFullTextObjects
   - Return top 5 results per entity type

4. **Document Search**
   - Query Kendra indices for document matches
   - Support multiple Kendra indices (one per app)
   - Return top 10 document results

5. **Result Grouping**
   - Group by type: Ontology → Items → Documents
   - Show type headers
   - Prioritize exact matches

6. **Recent Items**
   - Show recent items when query is empty
   - Load from core-RecentActivity table
   - Display last 10 accessed items

7. **Keyboard Navigation**
   - Arrow Up/Down to navigate results
   - Enter to select result
   - Escape to close dropdown

8. **Result Click**
   - Ontology: Navigate to `/core/ontology/{domain}/{type}/{id}`
   - Entity: Navigate to `/{app}/items/{id}`
   - Document: Download or open document

### Non-Functional Requirements

1. **Performance**
   - Search results < 500ms (P95)
   - UI renders < 100ms
   - Support 100+ concurrent users

2. **Scalability**
   - Handle 10,000+ ontology nodes
   - Handle 100,000+ entity records
   - Handle 1,000+ documents per app

3. **Usability**
   - Clear visual grouping
   - Highlight matching text
   - Responsive on mobile
   - Accessible (ARIA labels)

4. **Reliability**
   - Graceful error handling
   - Fallback to empty results on error
   - Log errors for debugging

## Architecture

### Component Hierarchy

```
SearchDropdown
├── Input (debounced)
├── Dropdown (Popover)
│   ├── EmptyState (when no query)
│   │   ├── RecentItems
│   │   └── RecentTasks
│   ├── SearchResults (when query exists)
│   │   ├── OntologyGroup
│   │   │   └── OntologyResultItem[]
│   │   ├── EntityGroup
│   │   │   └── EntityResultItem[]
│   │   └── DocumentGroup
│   │       └── DocumentResultItem[]
│   └── LoadingState (while searching)
└── KeyboardNavigator
```

### Service Layer

```typescript
// Search orchestrator
async function performSearch(query: string) {
  const [ontologyResults, entityResults, documentResults] = await Promise.all([
    searchOntology(query),
    searchEntities(query),
    searchDocuments(query)
  ]);

  return mergeAndRank(ontologyResults, entityResults, documentResults);
}

// Ontology search
async function searchOntology(query: string) {
  const results = await searchFullTextObjects(
    'core-ontology-node',
    'name',
    query,
    credentials,
    schema
  );

  return results.slice(0, 20).map(formatOntologyResult);
}

// Entity search
async function searchEntities(query: string) {
  const nodes = await getAllNodes(credentials, schema);
  const entityTypes = nodes.filter(n =>
    n.category === 'entity' && n.properties?.fullTextSearch
  );

  const results = await Promise.all(
    entityTypes.map(type => searchEntityType(type, query))
  );

  return results.flat();
}

// Document search
async function searchDocuments(query: string) {
  const results = await Promise.all(
    kendraIndices.map(index => kendraQuery(index, query))
  );

  return results.flat().slice(0, 10);
}
```

## Data Model

### SearchResult Interface

```typescript
interface SearchResult {
  id: string;
  title: string;
  excerpt?: string;
  type: 'ONTOLOGY' | 'ITEM' | 'DOCUMENT';

  // Type-specific fields
  domain?: string;      // Ontology
  category?: string;    // Ontology
  icon?: string;        // Ontology, Item
  color?: string;       // Ontology

  table?: string;       // Item
  itemType?: string;    // Item
  appSource?: string;   // Item, Document

  documentUri?: string; // Document
  updatedAt?: string;   // Item, Document
}
```

### RecentItem Interface

```typescript
interface RecentItem {
  id: string;
  title: string;
  type: string;
  app: string;
  timestamp: string;
  icon?: string;
}
```

## API Actions

### searchOntology(query: string)

**Purpose**: Search ontology nodes by name

**Input**:
- `query`: string - Search term

**Output**:
- `SearchResult[]` - Top 20 matching nodes

**Example**:
```typescript
const results = await searchOntology('admin');
// Returns: [
//   { id: 'core-user', title: 'User', type: 'ONTOLOGY', domain: 'Core', category: 'entity', icon: 'User' },
//   { id: 'pmbook-admin', title: 'Admin', type: 'ONTOLOGY', domain: 'PMBook', category: 'role' }
// ]
```

### searchEntities(query: string)

**Purpose**: Search all entity types with full-text search configured

**Input**:
- `query`: string - Search term

**Output**:
- `SearchResult[]` - Top 5 results per entity type

**Example**:
```typescript
const results = await searchEntities('john');
// Returns: [
//   { id: 'user-123', title: 'John Doe', type: 'ITEM', itemType: 'User', table: 'core-user', appSource: 'Core' },
//   { id: 'contact-456', title: 'John Smith', type: 'ITEM', itemType: 'Contact', table: 'pmbook-contact' }
// ]
```

### searchDocuments(query: string)

**Purpose**: Search documents via Kendra

**Input**:
- `query`: string - Search term

**Output**:
- `SearchResult[]` - Top 10 documents

**Example**:
```typescript
const results = await searchDocuments('contract');
// Returns: [
//   { id: 'doc-789', title: 'Service Contract', type: 'DOCUMENT', documentUri: 's3://...', appSource: 'PMBook' }
// ]
```

## UI/UX

### Search Input
- Placeholder: "Search across ontology, items, and documents..."
- Search icon on left
- Loading spinner on right (when searching)
- Clear button (X) when has value

### Dropdown Results
- **Position**: Below input, full width
- **Max Height**: 500px with scrolling
- **Grouping**: 3 sections with headers
- **Item Display**:
  - Icon (left)
  - Title (bold)
  - Subtitle (type • app)
  - Excerpt (truncated, 2 lines max)

### Empty State
- Recent Items section (last 10)
- Recent Tasks section (last 10)
- Message: "Start typing to search..."

### Loading State
- Skeleton loaders for result items
- Spinner in input field

### Keyboard Navigation
- **Up/Down Arrow**: Navigate through results
- **Enter**: Select highlighted result
- **Escape**: Close dropdown
- **Tab**: Focus next result, or close if at end

## User Stories

See [user-stories/01-dropdown-search.yaml](../user-stories/01-dropdown-search.yaml)

## Implementation Notes

### Debouncing
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    if (query.length >= 2) {
      performSearch(query);
    }
  }, 300);

  return () => clearTimeout(timer);
}, [query]);
```

### Parallel Searches
Use `Promise.all()` to run searches concurrently for best performance.

### Error Handling
- Each search function catches its own errors
- Failed searches return empty array
- At least one search type must succeed
- Log errors to console for debugging

### Caching
- Ontology nodes cached for 5 minutes
- Recent items cached until modal closes
- Search results not cached (always fresh)

## Testing

### Unit Tests
- Search orchestration logic
- Result merging and ranking
- Keyboard navigation handlers
- URL building for navigation

### Integration Tests
- Full search flow (input → results → click)
- Ontology search integration
- Entity search integration
- Document search integration
- Recent items loading

### E2E Tests
- User types and sees results
- User clicks result and navigates
- User uses keyboard navigation
- Empty state shows recent items

## Dependencies

- `@captify-io/core/services/data/search` - Full-text search
- `@captify-io/core/services/ontology/node` - Ontology queries
- `@captify-io/core/services/aws/kendra` - Document search
- `@captify-io/core/lib/api` - API client
- `@captify-io/core/components/ui` - UI components

## Success Metrics

1. **Performance**: 95% of searches < 500ms
2. **Accuracy**: 90% of users find result in top 5
3. **Usage**: 80% of users use search vs navigation
4. **Satisfaction**: 4.5/5 user rating
