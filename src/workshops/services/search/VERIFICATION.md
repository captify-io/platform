# Search Service - Verification ✅

## Integration Confirmed

The unified search service is **fully integrated** and accessible via **Ctrl+F** (or Cmd+F on Mac).

## Integration Chain

```
Platform Layout (platform/src/app/layout.tsx)
    ↓
CaptifyLayout (@captify-io/core/components/layout/captify-layout.tsx)
    ↓
KendraSearchModal (alias for SearchModal)
    ↓
SearchModal (@captify-io/core/components/layout/search.tsx)
    ↓ [Line 241-246]
performSearch() - Unified Search Service
    ↓
@captify-io/core/services/search
    ├─→ searchOntology()   [DynamoDB full-text]
    ├─→ searchEntities()   [DynamoDB full-text]
    └─→ searchDocuments()  [Kendra semantic]
```

## Keyboard Shortcut Configuration

**File**: `core/src/components/layout/captify-layout.tsx`

```typescript
// Line 170-177: Keyboard shortcut for search (Ctrl+F or Cmd+F)
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "f") {
      e.preventDefault();
      setSearchModalOpen(true);  // Opens the search modal
    }
  };
  // ...
});
```

**Also in**: `core/src/components/layout/search.tsx` (Line 222-233)
- Both components listen for Ctrl+F
- Ensures search opens regardless of which component renders first

## Search Implementation

**File**: `core/src/components/layout/search.tsx`

```typescript
// Line 235-254: performSearch function
const performSearch = async (searchQuery: string) => {
  setIsSearching(true);
  setResults([]);

  try {
    // Use unified search service - handles parallel execution and result merging
    const searchResults = await unifiedSearch(searchQuery, {
      kendraIndices: allIndices.length > 0 ? allIndices : (currentIndex ? [currentIndex] : []),
      selectedApp: selectedApp,
    });

    setResults(searchResults);
  } catch (error) {
    console.error("Search error:", error);
    setResults([]);
  } finally {
    setIsSearching(false);
  }
};
```

**Old implementation removed**: ~170 lines of duplicate search logic deleted

## How to Test

### 1. Manual Test (Recommended)

```bash
# Restart platform if not already running
cd /opt/captify-apps/platform
pm2 restart platform

# Open browser
open http://localhost:3000
```

**Test Steps**:
1. Login to platform
2. Press **Ctrl+F** (Windows/Linux) or **Cmd+F** (Mac)
3. Search modal should open
4. Type a search query (e.g., "admin", "user", "contract")
5. See results grouped by:
   - **Ontology** (entity types)
   - **Items** (actual records)
   - **Documents** (Kendra results, if configured)

### 2. Browser Console Test

Open browser console and run:

```javascript
// Test the search service directly
import('/core/services/search').then(async ({ performSearch }) => {
  const results = await performSearch('admin');
  console.log('Search results:', results);
});
```

### 3. Network Tab Verification

1. Open DevTools → Network tab
2. Press Ctrl+F
3. Type "admin"
4. Should see parallel API calls to:
   - `/api/captify` (for credentials)
   - Multiple search operations happening concurrently

## Expected Behavior

### Empty Query
- Shows "Recent Items" (if any)
- No search performed

### Query < 3 characters
- No search performed (minimum 3 chars required - Line 212)
- Debounced by 300ms (Line 217)

### Query >= 3 characters
- **Debounce**: Waits 300ms after last keystroke
- **Parallel Search**: Runs 3 searches concurrently
- **Results**: Grouped by type (Ontology → Items → Documents)
- **Exact Matches**: Prioritized at top within each group
- **Limit**: ~50 total results (20 ontology + 5/entity type + 10 docs)

### Performance
- **Target**: < 500ms total (all 3 searches complete)
- **Actual**: Depends on data size and network latency
- **Caching**: Ontology nodes cached 5 minutes

## Verification Checklist

### Build Verification
- ✅ Core library built successfully
- ✅ Platform built successfully
- ✅ No TypeScript errors in search service
- ✅ SearchModal component updated
- ✅ Old search functions removed

### Integration Verification
- ✅ SearchModal imported in CaptifyLayout
- ✅ Keyboard shortcut configured (Ctrl+F)
- ✅ performSearch() uses unified service
- ✅ Modal state managed correctly

### Runtime Verification
- ✅ Search service rewritten to use CLIENT-SIDE apiClient
- ✅ Removed credential fetching logic (handled by API layer)
- ✅ Core library rebuilt successfully
- ✅ Platform rebuilt and restarted
- ⚠️ **TODO**: Test Ctrl+F opens modal
- ⚠️ **TODO**: Test search returns results
- ⚠️ **TODO**: Test result grouping (Ontology/Items/Documents)
- ⚠️ **TODO**: Test clicking result navigates correctly
- ⚠️ **TODO**: Test performance (<500ms)

## Troubleshooting

### Ctrl+F doesn't work
**Check**:
1. Is platform running? `pm2 status`
2. Browser console errors? `F12 → Console`
3. Is modal state updating? Add console.log in handleKeyDown

**Fix**:
```bash
# Restart platform
pm2 restart platform
pm2 logs platform --lines 50
```

### No search results
**Check**:
1. Console errors? `F12 → Console → look for "Search error"`
2. Credentials valid? Check `/api/captify` endpoint
3. Tables exist? Check DynamoDB for `captify-core-search-index`

**Debug**:
```typescript
// In browser console
localStorage.setItem('debug', 'search:*');
// Refresh page, try search again
```

### Search is slow
**Check**:
1. Network tab → Check API response times
2. How many entity types? Too many = slower
3. Is search index populated? Check `captify-core-search-index` table

**Optimize**:
- Limit entity types with `fullTextSearch` property
- Add DynamoDB GSI indexes
- Reduce Kendra index count

### TypeScript errors
**Check**:
```bash
cd /opt/captify-apps/core
npm run build:types
# Look for errors in search service
```

## Code References

- **Search Service**: [core/src/services/search/index.ts](../../core/src/services/search/index.ts:1)
- **SearchModal**: [core/src/components/layout/search.tsx](../../core/src/components/layout/search.tsx:11)
- **CaptifyLayout**: [core/src/components/layout/captify-layout.tsx](../../core/src/components/layout/captify-layout.tsx:87)
- **Platform Layout**: [platform/src/app/layout.tsx](../../../platform/src/app/layout.tsx:1)

## Documentation

- [Usage Guide](./USAGE.md) - Complete API documentation
- [Quick Reference](./QUICK-REFERENCE.md) - Cheat sheet
- [Deployment Guide](./DEPLOYMENT.md) - Build and deployment info

## Status

**Build Status**: ✅ Complete
**Integration Status**: ✅ Complete
**Runtime Status**: ⚠️ Pending user testing

**Next Step**: Open platform and press **Ctrl+F** to test!
