# Ontology Designer - Master Design Document

**Status:** Planning Phase
**Last Updated:** 2025-10-27
**Owner:** Engineering Team

## Executive Summary

This document provides a complete redesign plan for the Ontology Designer to improve performance, maintainability, and user experience. The current implementation uses custom ReactFlow code that duplicates functionality available in the core Flow component and lacks essential features like advanced search, bulk operations, and schema management.

## Goals

### Primary Goals
1. **Reduce Code Complexity** - Cut 75% of custom code by migrating to core Flow component
2. **Improve Performance** - Add database indexes for sub-100ms queries
3. **Enhance Usability** - Add search, filters, bulk operations, and visual schema editing
4. **Maintain Consistency** - Use same patterns as workflow and agent designers

### Success Metrics
- Code reduced from ~2,000 lines to ~500 lines
- Search performance: <100ms (currently 500-1000ms)
- User satisfaction: 8/10+ (will survey after launch)
- Zero data loss during migration

## Current State Analysis

### What Exists
- Custom ReactFlow-based canvas (712 lines in OntologyCanvas.tsx)
- Basic node/edge CRUD operations
- Manual ELK layout integration
- Simple property editing with text fields
- Right-click context menu for adding nodes
- Export/import JSON

### Problems
1. **Reinventing the Wheel** - Custom canvas duplicates core Flow component
2. **Performance Issues** - All queries scan entire table (no indexes)
3. **Missing Features** - No search, filters, bulk ops, schema editor
4. **Maintenance Burden** - 2000+ lines of custom code to maintain
5. **Inconsistent UX** - Different from workflow/agent designers

### Database Schema Issues
**Ontology Node Table:**
- Primary Key: id (HASH)
- Only 1 GSI: category-type-index
- **Missing:** name-index, app-type-index, tenantId-createdAt-index

**Ontology Edge Table:**
- Primary Key: id (HASH)
- Only 1 GSI: type-index
- **Missing:** source-target-index, sourceType-targetType-index

Result: All searches require expensive table scans (800-1500ms).

## Implementation Plan

This redesign is broken into 6 sequential phases. Each phase has a dedicated design document with detailed checklists.

### Phase 0: Ontology Cleanup (CRITICAL - Must Do First)
**File:** [0-cleanup.md](./0-cleanup.md)
**Duration:** 3-4 hours
**Dependencies:** None

**STOP! READ THIS FIRST** - The ontology has **57 duplicate nodes** (114 total duplicate records) that must be removed before any other work:

**Critical Issues:**
- Every entity exists twice (e.g., `node-meeting` + `pmbook-meeting`)
- Naming inconsistencies (`cLIN`, `vendorEntity`, `SpaceKnowledge`)
- Misplaced domains (78 nodes in generic "PMBook" domain)
- 33 nodes with no app assignment

**Cleanup Actions:**
1. Remove 57 duplicate pairs (~25% reduction: 233 → 176 nodes)
2. Fix naming: `pmbook-cLIN` → `pmbook-clin`, `vendorEntity` → `vendor`
3. Reorganize domains following DDD principles:
   - Core: Data, People, Technology, Process, Governance
   - PMBook: Contracts, Programs, Performance, Vendors, Cybersecurity
4. Update all edge relationships to reference correct IDs
5. Add validation to prevent future duplicates

**Why First?** Duplicates corrupt search results, break relationships, and make every other phase harder. Must be cleaned before indexes or migration.

**Checklist:**
- [ ] Backup current ontology (nodes + edges)
- [ ] Analyze edge references for each duplicate
- [ ] Execute duplicate removal (dry-run, then live)
- [ ] Fix naming inconsistencies
- [ ] Reorganize domains by DDD
- [ ] Verify all edges reference valid nodes

### Phase 1: Database Indexes (CRITICAL - After Cleanup)
**File:** [1-indexes.md](./1-indexes.md)
**Duration:** 1-2 hours
**Dependencies:** None

Add 6 missing Global Secondary Indexes (GSIs) to enable efficient querying:

**Node Indexes:**
1. name-index - Fast lookup by exact name
2. app-type-index - Filter by application and type
3. domain-category-index - Filter by domain/category
4. tenantId-createdAt-index - Multi-tenant + date filtering

**Edge Indexes:**
1. source-target-index - Find edges from a node
2. sourceType-targetType-index - Query by relationship type

**Why After Cleanup?** Indexes will work better with clean data. No point indexing duplicates that will be deleted.

**Checklist:**
- [ ] Create 4 node indexes
- [ ] Create 2 edge indexes
- [ ] Test queries with each index
- [ ] Verify no table scans in CloudWatch
- [ ] Update code to use indexes

### Phase 2: Flow Component Migration (HIGH)
**File:** [2-flow-migration.md](./2-flow-migration.md)
**Duration:** 4-6 hours
**Dependencies:** 1-indexes.md (recommended)

Replace custom ReactFlow implementation with core Flow component:

**Before:**
```
builder/
├── page.tsx (150 lines)
├── components/
│   ├── OntologyCanvas.tsx (712 lines)
│   ├── OntologyNodeComponent.tsx (200 lines)
│   ├── NodeConfigPanel.tsx (300 lines)
│   └── EdgeConfigPanel.tsx (250 lines)
└── context/
    └── OntologyContext.tsx (400 lines)
Total: ~2,000 lines
```

**After:**
```
page.tsx (100 lines - list view)
[id]/page.tsx (150 lines - Flow editor)
components/
├── ontology-list.tsx (150 lines)
├── property-panel.tsx (100 lines)
└── relationship-panel.tsx (100 lines)
Total: ~500 lines
```

**Benefits:**
- 75% code reduction
- Built-in toolbar, palette, sidebar
- Auto-layout, validation, undo/redo
- Consistent with other designers

**Checklist:**
- [ ] Create new list page
- [ ] Create Flow-based editor page
- [ ] Create hooks for data fetching
- [ ] Migrate config panels
- [ ] Test all CRUD operations
- [ ] Delete old code

### Phase 3: Advanced Search & Filter (MEDIUM)
**File:** [3-search-filter.md](./3-search-filter.md)
**Duration:** 3-4 hours
**Dependencies:** 1-indexes.md (REQUIRED), 2-flow-migration.md (recommended)

Build comprehensive search and filtering:

**Features:**
- Text search by name
- Filter by domain, category, app, type
- Date range filtering
- Saved search presets
- Export filtered results

**Performance Targets:**
| Operation | Current | Target |
|-----------|---------|--------|
| Name search | 800ms | <50ms |
| App filter | 1200ms | <80ms |
| Domain filter | 900ms | <60ms |

**Checklist:**
- [ ] Create filter panel component
- [ ] Create search hook with index selection
- [ ] Create results list component
- [ ] Add saved searches feature
- [ ] Test all filter combinations

### Phase 4: Property Editor (MEDIUM)
**File:** [4-property-editor.md](./4-property-editor.md)
**Duration:** 5-6 hours
**Dependencies:** 2-flow-migration.md (recommended)

Build visual schema and index management:

**Features:**
- Visual JSON Schema editor
- DynamoDB index configuration UI
- Property type selector (string, number, date, enum, etc.)
- Relationship cardinality editor
- Icon and color pickers

**Replaces:** Manual JSON editing in text area

**Checklist:**
- [ ] Create schema editor with field list
- [ ] Create field editor dialog
- [ ] Create index manager component
- [ ] Create relationship editor
- [ ] Add icon/color pickers
- [ ] Integrate with Flow sidebar

### Phase 5: Bulk Operations (LOW)
**File:** [5-bulk-operations.md](./5-bulk-operations.md)
**Duration:** 3-4 hours
**Dependencies:** 2-flow-migration.md (required), 3-search-filter.md (recommended)

Enable multi-select and batch editing:

**Features:**
- Multi-select with Shift+click, Ctrl+click
- Bulk property updates
- Bulk delete with cascade options
- Export selected nodes to JSON/CSV
- Import from JSON/CSV

**Checklist:**
- [ ] Add selection system to list view
- [ ] Create bulk toolbar
- [ ] Create bulk operations hook
- [ ] Implement bulk update
- [ ] Implement bulk delete with cascade
- [ ] Add export/import features

## Timeline Estimate

### Pre-Sprint: Cleanup (3-4 hours)
- **Phase 0:** Ontology Cleanup
  - Backup ontology data
  - Remove 57 duplicate nodes
  - Fix naming issues
  - Reorganize domains
  - Update edge relationships
  - **MUST COMPLETE BEFORE SPRINT 1**

### Sprint 1 (Week 1)
- **Day 1-2:** Phase 1 - Database Indexes
  - Create all 6 indexes
  - Test queries
  - Update code to use indexes

- **Day 3-5:** Phase 2 - Flow Migration
  - Create new page structure
  - Migrate to Flow component
  - Test all operations

### Sprint 2 (Week 2)
- **Day 1-2:** Phase 3 - Search & Filter
  - Build filter panel
  - Implement search logic
  - Add saved searches

- **Day 3-5:** Phase 4 - Property Editor
  - Build schema editor
  - Build index manager
  - Build relationship editor

### Sprint 3 (Week 3)
- **Day 1-2:** Phase 5 - Bulk Operations
  - Add multi-select
  - Implement bulk update/delete
  - Add export/import

- **Day 3-5:** Testing & Polish
  - End-to-end testing
  - Performance optimization
  - Documentation updates

**Total Duration:** 3-4 hours cleanup + 3 weeks (15 working days)

## Dependencies

```
0-cleanup.md (CRITICAL - MUST DO FIRST)
     ↓
1-indexes.md (CRITICAL)
     ↓
2-flow-migration.md (HIGH)
     ↓
3-search-filter.md (MEDIUM) ← depends on indexes
     ↓
4-property-editor.md (MEDIUM) ← can run in parallel with 3
     ↓
5-bulk-operations.md (LOW) ← depends on 2, benefits from 3
```

**Recommended Order:**
1. **MUST START:** 0-cleanup.md (remove duplicates, fix naming, reorganize domains)
2. Then: 1-indexes.md (no breaking changes, immediate benefit)
3. Continue: 2-flow-migration.md (biggest code impact)
4. Run in parallel: 3-search-filter.md and 4-property-editor.md
5. Finish: 5-bulk-operations.md

## Risk Assessment

### High Risk
1. **Data Loss During Migration**
   - **Mitigation:** Create full database backup before starting
   - **Rollback Plan:** Keep old code in git, document restore procedure

2. **Breaking Changes to Existing Ontology**
   - **Mitigation:** Test with copy of production data first
   - **Validation:** Run migration script, verify all nodes/edges still accessible

### Medium Risk
1. **Performance Degradation**
   - **Mitigation:** Load test with 1000+ nodes before deploy
   - **Monitoring:** Set up CloudWatch alarms for slow queries

2. **User Confusion with New UI**
   - **Mitigation:** Document changes, provide training
   - **Support:** Create migration guide with screenshots

### Low Risk
1. **Missing Custom Features**
   - **Mitigation:** Inventory all features before migration
   - **Workaround:** Extend Flow component if needed

## Testing Strategy

### Unit Tests
- [ ] Search hook with all filter combinations
- [ ] Bulk operations hook (update, delete, export)
- [ ] Schema editor validation logic
- [ ] Index configuration validation

### Integration Tests
- [ ] Create node → save → reload → verify
- [ ] Create relationship → save → reload → verify
- [ ] Search by name → verify results
- [ ] Bulk delete with cascade → verify edges deleted

### Performance Tests
- [ ] Query performance with 100 nodes
- [ ] Query performance with 1,000 nodes
- [ ] Query performance with 10,000 nodes
- [ ] Bulk operation with 100+ nodes

### User Acceptance Tests
- [ ] Can create new ontology node
- [ ] Can edit properties visually
- [ ] Can configure schema without JSON
- [ ] Can search and filter efficiently
- [ ] Can perform bulk operations

## Rollback Plan

If migration fails or causes issues:

1. **Immediate Rollback (< 1 hour)**
   ```bash
   git revert <migration-commit>
   npm run build
   pm2 restart platform
   ```

2. **Database Rollback** (if indexes cause issues)
   ```bash
   aws dynamodb delete-table --table-name <index-name>
   ```

3. **Data Restoration** (worst case)
   ```bash
   aws dynamodb restore-table-from-backup \
     --target-table-name captify-core-ontology-node \
     --backup-arn <backup-arn>
   ```

## Success Criteria

### Code Quality
- [ ] Code reduced by >50%
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings < 10
- [ ] Test coverage > 70%

### Performance
- [ ] All queries complete in <200ms
- [ ] No table scans in CloudWatch logs
- [ ] Bulk operations handle 100+ nodes
- [ ] UI remains responsive with 1000+ nodes

### Functionality
- [ ] All existing features still work
- [ ] New features match requirements
- [ ] No data loss
- [ ] No broken relationships

### User Experience
- [ ] UI is intuitive (no training needed for basic ops)
- [ ] Search is fast and accurate
- [ ] Error messages are clear
- [ ] Dark mode works correctly

## Post-Launch Tasks

After successful launch:

1. **Monitoring** (Week 1)
   - Watch CloudWatch metrics for slow queries
   - Monitor error logs for issues
   - Track user feedback

2. **Optimization** (Week 2-3)
   - Optimize slow queries
   - Add caching where beneficial
   - Improve UI responsiveness

3. **Documentation** (Week 4)
   - Update developer docs
   - Create user guide
   - Record demo video

4. **Future Enhancements** (Backlog)
   - Version control for ontology changes
   - Diff visualization
   - Collaborative editing
   - API access for external tools

## Notes for Future Agents

### Why This Approach?

This redesign prioritizes:
1. **Safety** - Indexes first (no breaking changes)
2. **Impact** - Flow migration second (biggest code reduction)
3. **Value** - Search/editor/bulk in order of user value

### Key Learnings

1. **Use Core Components** - Don't reinvent wheels. The Flow component exists specifically to solve this problem.

2. **Index Early** - Database indexes should be added as soon as you need to query anything other than primary key.

3. **Plan for Scale** - Design for 10,000 nodes even if you only have 100 today.

4. **Batch Operations** - DynamoDB has strict limits. Always chunk large operations.

5. **User Testing** - Test with real users early. Their workflow may differ from your assumptions.

### Common Pitfalls

⚠️ **Don't skip the indexes** - Without indexes, performance will be terrible at scale

⚠️ **Don't try to do everything at once** - Follow the phases in order

⚠️ **Don't forget cascade delete** - Orphaned edges are confusing for users

⚠️ **Don't ignore partial failures** - Bulk operations can succeed for some items and fail for others

⚠️ **Don't assume the Flow component supports everything** - Check its capabilities before committing to migration

## Questions or Issues?

If you encounter problems during implementation:

1. **Check the phase-specific design doc** for detailed guidance
2. **Review existing Flow component code** in core/src/components/flow/
3. **Test queries in DynamoDB console** before adding to code
4. **Ask in team chat** if blocked

## Approval & Sign-Off

Before starting implementation:
- [ ] Engineering lead reviews design
- [ ] Product manager approves features
- [ ] Database admin approves index plan
- [ ] QA team understands test requirements
- [ ] DevOps team aware of deployment needs

---

**Ready to start?** Begin with [1-indexes.md](./1-indexes.md) - it's the foundation for everything else.
