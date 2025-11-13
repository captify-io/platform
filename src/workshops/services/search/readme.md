# Global Search System

## Vision

Provide a comprehensive, real-time search experience across all Captify data - ontology types, entities, and documents - with intelligent ranking, grouping, and instant-as-you-type results.

## Core Principles

1. **Unified Search** - Single search interface for ontology, entities, and documents
2. **Real-Time Results** - Show results as user types (debounced 300ms)
3. **Intelligent Grouping** - Group by type (Ontology → Items → Documents)
4. **AWS-Native** - Use Kendra for documents, DynamoDB full-text for entities
5. **Contextual Relevance** - Prioritize exact matches and recently accessed items

## Architecture Overview

### Three-Layer Search Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Search Component                         │
│  • Input with debounce (300ms)                             │
│  • Dropdown results grouped by type                         │
│  • Recent items when no query                               │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼──────┐    ┌─────────▼────────┐    ┌──────▼──────┐
│   Ontology   │    │     Entities     │    │  Documents  │
│    Search    │    │     Search       │    │   (Kendra)  │
│              │    │                  │    │             │
│ - core-      │    │ - Full-text      │    │ - S3 docs   │
│   ontology-  │    │   search         │    │ - Semantic  │
│   node       │    │ - DynamoDB       │    │   search    │
│ - Full-text  │    │   GSI queries    │    │             │
│   on 'name'  │    │ - Per entity     │    │             │
│              │    │   type           │    │             │
└──────────────┘    └──────────────────┘    └─────────────┘
```

### Data Flow

1. **User Types** → Input component (debounced)
2. **Parallel Searches** → Fire 3 concurrent searches:
   - Ontology nodes (searchFullTextObjects on 'core-ontology-node')
   - Entity items (searchFullTextObjects on each entity type with fullTextSearch)
   - Documents (Kendra query)
3. **Merge & Rank** → Sort by type priority and relevance
4. **Display** → Dropdown with grouped results
5. **Click** → Navigate to detail page

## Key Features

1. **Dropdown Search Component** - Real-time search with grouped results
2. **Ontology Search** - Find types, categories, domains
3. **Entity Search** - Find actual records (users, contracts, tasks, etc.)
4. **Document Search** - Find uploaded files via Kendra
5. **Recent Items** - Show recently viewed when no query
6. **Keyboard Navigation** - Arrow keys and Enter to select
7. **Detail View** - Click result to view full entity/document

## Technology Stack

- **Frontend**: React 19.1, Next.js 15.5, Tailwind CSS v4
- **Search Services**:
  - `@captify-io/core/services/data/search` - Full-text search
  - `@captify-io/core/services/aws/kendra` - Document search
  - `@captify-io/core/services/ontology` - Ontology queries
- **UI Components**: `@captify-io/core/components/ui` (Dialog, Input, ScrollArea, Badge)
- **AWS Services**: DynamoDB (GSI for full-text), Kendra (document search)

## Success Criteria

1. **Performance**: Results appear < 500ms from typing
2. **Accuracy**: Exact matches appear first in results
3. **Coverage**: Search finds ontology, entities, and documents
4. **Usability**: Users can find what they need in ≤ 3 keystrokes
5. **Adoption**: 80% of users use search vs manual navigation

## Related Documentation

- [Implementation Roadmap](./plan/implementation-roadmap.md)
- [Feature: Dropdown Search](./features/01-dropdown-search.md)
- [Core Search Service](../../core/src/services/data/search/fulltext.ts)
- [Search Component](../../core/src/components/layout/search.tsx)
