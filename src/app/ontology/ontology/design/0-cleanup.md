# 0. Ontology Cleanup - Remove Duplicates & Fix Organization

**Priority:** CRITICAL (Must be done before other work)
**Estimated Time:** 3-4 hours
**Dependencies:** None
**Status:** Not Started

## Overview

Analysis of the ontology revealed **57 duplicate nodes** and significant organizational issues. The ontology has 233 total nodes with inconsistent naming, domain assignment, and app ownership.

## Critical Issues Found

### 1. Duplicate Nodes (57 pairs = 114 nodes)

Every pmbook and core entity exists twice - once with `node-*` prefix and once with `app-*` prefix:
- `node-meeting` + `pmbook-meeting`
- `node-team` + `pmbook-team`
- `core-agent` + `node-agent`
- `core-user` + `node-user`
... and 53 more pairs

**Impact:**
- Breaks relationships (edges point to wrong IDs)
- Confuses API queries
- Wastes DynamoDB read capacity
- Makes ontology designer UI cluttered

### 2. Naming Issues

**Bad Casing:**
- `pmbook-cLIN` → Should be `pmbook-clin` or `pmbook-CLIN`
- `pmbook-kPIReading` → Should be `pmbook-kpi-reading`
- `pmbook-cDRL` → Should be `pmbook-cdrl`

**Redundant Suffixes:**
- `pmbook-vendorEntity` → Should be `pmbook-vendor`
- `VendorEntity` is redundant (everything in ontology is an entity)

**Inconsistent Terms:**
- `SpaceKnowledge` vs `Knowledge`
- `Use Guardrails` (workflow node - unclear naming)

### 3. Misplaced Nodes

**Should be in Core (not pmbook):**
- `node-team` / `pmbook-team` → Teams are cross-app concept
- `User Approval` nodes → Core workflow concept

**Should be in PMBook (not core):**
- Currently: 78 nodes in "PMBook" domain but scattered across apps
- Contract management is pmbook-specific

### 4. Domain Distribution Issues

**Current State:**
- PMBook domain: 78 nodes (too many in one domain)
- Core domain: 38 nodes (mixing concerns)
- 33 nodes with no app assignment (unspecified)

**DDD Domain Coverage:**
- ✅ Process: 7 nodes
- ✅ Technology: 9 nodes
- ✅ People: 5 nodes
- ✅ Data: 6 nodes
- ✅ Governance: 8 nodes
- ✅ Financial: 4 nodes

Good DDD domains exist, but pmbook nodes need redistribution.

## Cleanup Strategy

### Phase 1: Resolve Duplicates (CRITICAL)

**Decision Rule:** Keep the `{app}-{type}` format, delete `node-{type}` format

**Why?**
- `{app}-{type}` is more descriptive (pmbook-contract, core-user)
- Matches table naming convention (captify-pmbook-contract)
- Clear ownership (which app owns this node?)

**Process:**
1. For each duplicate pair, identify which ID is referenced by edges
2. Keep the ID with more edge references
3. Update all edges to point to kept ID
4. Delete the unused node
5. If equal references, prefer `{app}-{type}` format

### Phase 2: Fix Naming Issues

**Apply consistent kebab-case:**
- `pmbook-cLIN` → `pmbook-clin`
- `pmbook-vendorEntity` → `pmbook-vendor`
- `pmbook-kPIReading` → `pmbook-kpi-reading`
- `pmbook-cDRL` → `pmbook-cdrl`

**Update node properties:**
```typescript
{
  id: "pmbook-clin",          // lowercase kebab-case
  name: "CLIN",               // Display name (can be uppercase)
  type: "clin",               // lowercase type
  domain: "Contracts",        // DDD domain
  category: "financial",      // DDD category
  app: "pmbook"              // Owner app
}
```

### Phase 3: Reorganize by Domain-Driven Design

**Core Domains (cross-app concepts):**
```
Data Domain (app: core)
├── dataset
├── data-source
├── data-product
├── data-pipeline

People Domain (app: core)
├── user
├── role
├── organization
├── team (move from pmbook)
├── persona

Technology Domain (app: core)
├── infrastructure
├── service
├── api
├── integration

Process Domain (app: core)
├── workflow
├── sop
├── policy
├── procedure

Governance Domain (app: core)
├── audit
├── compliance
├── regulation
├── risk-assessment
```

**PMBook Domains (app-specific):**
```
Contracts Domain (app: pmbook)
├── contract
├── clin
├── cdrl
├── mod
├── invoice
├── payment

Products Domain (app: pmbook)  ← RENAMED from "Programs"
├── product
├── initiative
├── capability
├── feature
├── backlog-item
├── task

Performance Domain (app: pmbook)
├── outcome
├── kpi
├── kpi-reading
├── metric
├── report
├── weekly-update

Vendors Domain (app: pmbook)
├── vendor (not vendorEntity)
├── customer
├── stakeholder

Cybersecurity Domain (app: pmbook)
├── cyber-assessment
├── cyber-control
├── cyber-finding
├── cyber-poam
├── cyber-incident
├── cyber-artifact
```

**Note:** "Products" better aligns with modern small business terminology and product management language.

### Phase 4: Update Edge Relationships

After node cleanup, verify and update edges:
- All edge `source` and `target` fields must reference valid node IDs
- Remove orphaned edges (edges to deleted nodes)
- Add missing `sourceType` and `targetType` fields

## Implementation Checklist

### Step 1: Backup Current State
- [ ] Export all ontology nodes to JSON: `/tmp/ontology-backup-$(date +%Y%m%d).json`
- [ ] Export all ontology edges to JSON: `/tmp/edges-backup-$(date +%Y%m%d).json`
- [ ] Document current edge count and node count

### Step 2: Analyze Edge References
- [ ] For each duplicate pair, count edge references:
  ```typescript
  // Count edges referencing each duplicate
  const edgeCount = await apiClient.run({
    service: 'platform.dynamodb',
    operation: 'scan',
    table: 'core-ontology-edge',
    data: {
      FilterExpression: 'source = :id OR target = :id',
      ExpressionAttributeValues: { ':id': nodeId }
    }
  });
  ```
- [ ] Create mapping: `duplicates-resolution.json` with keep/delete decisions

### Step 3: Create Migration Script
- [ ] Script: `scripts/cleanup-ontology-duplicates.ts`
  ```typescript
  // For each duplicate pair:
  // 1. Get edge references for both
  // 2. Keep node with more references (or {app}-{type} format)
  // 3. Update all edges to point to kept ID
  // 4. Delete unused node
  ```

### Step 4: Execute Duplicate Removal (DRY RUN)
- [ ] Run script with `--dry-run` flag
- [ ] Review console output showing:
  - Which nodes will be kept
  - Which nodes will be deleted
  - How many edges will be updated
- [ ] Verify no production impact

### Step 5: Execute Duplicate Removal (LIVE)
- [ ] Run script without `--dry-run`
- [ ] Verify node count drops from 233 to ~176 (57 duplicates removed)
- [ ] Verify all edges still valid
- [ ] Test ontology designer UI loads correctly

### Step 6: Fix Naming Issues
- [ ] Create script: `scripts/rename-ontology-nodes.ts`
- [ ] Update IDs with kebab-case:
  ```typescript
  const renames = [
    { from: 'pmbook-cLIN', to: 'pmbook-clin' },
    { from: 'pmbook-vendorEntity', to: 'pmbook-vendor' },
    { from: 'pmbook-kPIReading', to: 'pmbook-kpi-reading' },
    { from: 'pmbook-cDRL', to: 'pmbook-cdrl' },
  ];
  // For each rename:
  // 1. Update node ID
  // 2. Update all edges referencing old ID
  // 3. Update node.type field
  ```
- [ ] Run with `--dry-run`
- [ ] Execute live
- [ ] Verify all references updated

### Step 7: Reorganize Domains
- [ ] Update domain assignments:
  ```typescript
  const domainUpdates = [
    // Move to Core
    { id: 'pmbook-team', domain: 'People', app: 'core' },

    // Organize PMBook nodes
    { id: 'pmbook-contract', domain: 'Contracts', category: 'legal' },
    { id: 'pmbook-clin', domain: 'Contracts', category: 'financial' },
    { id: 'pmbook-vendor', domain: 'Vendors', category: 'stakeholder' },

    // Rename Programs → Products
    { id: 'pmbook-program', domain: 'Products', category: 'product' },
    { id: 'pmbook-initiative', domain: 'Products', category: 'product' },
    { id: 'pmbook-capability', domain: 'Products', category: 'product' },
    { id: 'pmbook-feature', domain: 'Products', category: 'product' },
    { id: 'pmbook-backlog-item', domain: 'Products', category: 'product' },
    { id: 'pmbook-task', domain: 'Products', category: 'product' },
    // ... etc
  ];
  ```
- [ ] Update node records in DynamoDB
- [ ] Verify domain distribution makes sense
- [ ] Confirm "Products" domain instead of "Programs"

### Step 8: Clean Up Edges
- [ ] Find orphaned edges: `SELECT * FROM edges WHERE source NOT IN nodes OR target NOT IN nodes`
- [ ] Delete orphaned edges
- [ ] Add sourceType/targetType fields:
  ```typescript
  // For each edge:
  const sourceNode = await getNode(edge.source);
  const targetNode = await getNode(edge.target);
  await updateEdge({
    ...edge,
    sourceType: sourceNode.type,
    targetType: targetNode.type
  });
  ```

### Step 9: Validation
- [ ] Final node count matches expected (~150-170 nodes)
- [ ] No duplicate names in same app/domain
- [ ] All edges reference valid nodes
- [ ] All nodes have proper app assignment
- [ ] Domain distribution follows DDD principles:
  - Core: Data, People, Technology, Process, Governance
  - PMBook: Contracts, Programs, Performance, Vendors, Cybersecurity

### Step 10: Update Documentation
- [ ] Document final domain structure in `ontology-domains.md`
- [ ] Create naming convention guide
- [ ] Update ontology designer to enforce rules

## Success Criteria

- [ ] **No duplicate nodes** - Each entity exists exactly once
- [ ] **Consistent naming** - All IDs use kebab-case, no "Entity" suffixes
- [ ] **Clear ownership** - Every node has `app` assignment
- [ ] **Organized domains** - Follows DDD principles
- [ ] **Valid relationships** - All edges reference existing nodes
- [ ] **Reduced count** - From 233 nodes to ~150-170 nodes (25-35% reduction)

## Rollback Plan

If issues occur:
1. Stop all writes to ontology tables
2. Restore from backup:
   ```bash
   aws dynamodb batch-write-item --request-items file:///tmp/ontology-backup-$(date +%Y%m%d).json
   aws dynamodb batch-write-item --request-items file:///tmp/edges-backup-$(date +%Y%m%d).json
   ```
3. Clear any indexes if corrupted
4. Verify data integrity
5. Document what went wrong

## Risk Assessment

**High Risk Items:**
- ⚠️ **Edge updates** - If not done atomically, can break relationships
- ⚠️ **ID changes** - Any code hardcoding old IDs will break

**Mitigation:**
- Use transactions where possible
- Run in maintenance window
- Test thoroughly in dev/staging first
- Keep backups for 30 days

## Notes for Future Agents

### Why So Many Duplicates?

Likely causes:
1. Initial ontology created with `node-*` convention
2. Later, table-based nodes added with `{app}-{type}` convention
3. No deduplication ever performed
4. No unique constraints on name+app combination

### Prevention Going Forward

Add validation rules to ontology API:
```typescript
// Before creating node, check for duplicates
const existing = await query({
  IndexName: 'app-type-index',
  KeyConditionExpression: 'app = :app',
  FilterExpression: '#name = :name OR #type = :type',
  ExpressionAttributeValues: {
    ':app': newNode.app,
    ':name': newNode.name,
    ':type': newNode.type
  }
});

if (existing.length > 0) {
  throw new Error(`Node ${newNode.name} already exists in ${newNode.app}`);
}
```

### Domain-Driven Design Guidance

**Core vs App-Specific Decision Tree:**

```
Is this concept used by multiple apps?
├─ YES → Core domain
│   └─ Examples: user, role, team, dataset, workflow
└─ NO → App-specific domain
    └─ Examples: contract, clin, payment (pmbook only)

Is this a business subdomain?
├─ YES → Create new domain (e.g., Contracts, Vendors)
└─ NO → Use existing domain (e.g., Financial, Legal)
```

**Good Domain Examples:**
- ✅ Contracts (legal agreements, CLINs, CDRLs)
- ✅ Vendors (suppliers, customers, stakeholders)
- ✅ Performance (KPIs, outcomes, metrics)
- ✅ Data (datasets, products, pipelines)

**Bad Domain Examples:**
- ❌ PMBook (too generic, mixes everything)
- ❌ General (meaningless category)
- ❌ Core (should be specific domain like "People" or "Data")

## Next Steps

After cleanup completion:
1. Proceed to **1-indexes.md** - Create database indexes
2. Continue to **2-flow-migration.md** - Migrate to Flow component
