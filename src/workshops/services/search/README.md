# Global Search Workshop

## Quick Links

- 📖 **[Vision & Architecture](./readme.md)** - High-level overview
- 📊 **[Implementation Status](./status.md)** - Current progress (90% complete)
- 🗺️ **[Implementation Roadmap](./plan/implementation-roadmap.md)** - Phased plan
- 📝 **[Feature Specification](./features/01-dropdown-search.md)** - Detailed requirements
- ✅ **[User Stories (YAML)](./user-stories/01-dropdown-search.yaml)** - Machine-readable requirements
- 🧪 **[Auto-Generated Tests](./tests/01-dropdown-search.test.ts)** - Jest test suite
- 💻 **[Search Service Source](../../core/src/services/search/index.ts)** - Implementation
- 📚 **[Usage Guide](./USAGE.md)** - Complete API documentation
- ⚡ **[Quick Reference](./QUICK-REFERENCE.md)** - Cheat sheet

## What Was Built

### Unified Search Service

A comprehensive search service that searches across:
- **Ontology** - Entity types, categories, domains
- **Entities** - Actual records (users, contracts, tasks, etc.)
- **Documents** - Files via Kendra semantic search

**Key Features**:
- ✅ Parallel execution - all searches run concurrently
- ✅ Automatic result merging and ranking
- ✅ Type-safe TypeScript with strict types
- ✅ Graceful error handling
- ✅ Automatic credential management
- ✅ App filtering support

### Files Created (9)

**Workshop Documentation**:
1. `readme.md` - Vision and architecture
2. `status.md` - Implementation tracking
3. `plan/implementation-roadmap.md` - Phased plan
4. `features/01-dropdown-search.md` - Feature spec
5. `SESSION-2025-11-04.md` - Session summary

**Development Artifacts**:
6. `user-stories/01-dropdown-search.yaml` - YAML user stories (6 stories, 14 test scenarios)
7. `tests/01-dropdown-search.test.ts` - Auto-generated Jest tests
8. `USAGE.md` - Complete usage guide
9. `QUICK-REFERENCE.md` - Quick reference card

**Core Library Updates**:
- `core/src/services/search/index.ts` - Search service (~500 lines)
- `core/src/services/index.ts` - Service exports
- `core/src/components/layout/search.tsx` - Updated SearchModal component

## Usage

### Basic Search

```typescript
import { performSearch } from '@captify-io/core/services/search';

const results = await performSearch('admin');
// Returns: Ontology nodes, entity records, and documents matching "admin"
```

### Advanced Search

```typescript
const results = await performSearch('contract', {
  selectedApp: 'pmbook',        // Filter by app
  kendraIndices: [              // Kendra indices for document search
    { indexId: '...', appName: 'PMBook', appSlug: 'pmbook' }
  ]
});
```

See [USAGE.md](./USAGE.md) for complete API documentation.

## Implementation Progress

**Status**: 90% Complete (7.2/8 story points)

**Completed**:
- ✅ Workshop structure and documentation
- ✅ YAML user stories (6 stories, 14 test scenarios)
- ✅ Auto-generated tests from YAML
- ✅ Unified search service implementation
- ✅ Core services integration
- ✅ SearchModal component integration
- ✅ Usage documentation

**Remaining**:
- ⚠️ Build core library
- ⚠️ Run and verify tests
- ❌ Workshop demo page
- ❌ Real data testing

## Architecture

### Three-Layer Search

```
performSearch()
    ├─→ searchOntology()   → DynamoDB full-text search
    ├─→ searchEntities()   → DynamoDB full-text search (per entity type)
    └─→ searchDocuments()  → Kendra semantic search

All run in parallel via Promise.all()
Results merged and sorted by type + relevance
```

### Performance

- **Target**: < 500ms response time (P95)
- **Execution**: Parallel with `Promise.all()`
- **Limits**: 20 ontology + 5/entity + 10 documents = ~50 max results
- **Caching**: Ontology nodes cached 5 minutes

## Testing

### Auto-Generated Tests

14 test scenarios generated from YAML:
- 2 ontology search tests
- 2 entity search tests
- 2 document search tests
- 3 UI interaction tests
- 3 keyboard navigation tests
- 2 click navigation tests

Run tests:
```bash
npm test -- 01-dropdown-search.test.ts
```

## Next Steps

### 1. Build Core Library
```bash
cd /opt/captify-apps/core
npm run build
```

### 2. Run Tests
```bash
npm test -- workshops/search/tests/01-dropdown-search.test.ts
```

### 3. Deploy
```bash
# Update consuming apps
cd /opt/captify-apps/platform && npm install
cd /opt/captify-apps/workshops && npm install

# Restart services
pm2 restart all
```

### 4. Test with Real Data
- Verify ontology search works
- Test entity search across types
- Validate Kendra integration
- Check performance metrics

## Related Documentation

- [Workshop Process](../readme.md) - TDD workflow
- [Core Library](../../core/README.md) - Package info
- [Platform Architecture](../../CLAUDE.md) - Overall system

## Questions?

See [USAGE.md](./USAGE.md) for complete documentation or [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) for quick examples.
