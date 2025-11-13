# Ontology System - Implementation Roadmap

**Version**: 2.0
**Last Updated**: 2025-11-02
**Status**: Phase 1 Complete (25%), Phase 2 Planning

## Executive Summary

The Captify Ontology System is a 12-feature upgrade transforming our data platform into a world-class ontology-driven architecture. This roadmap outlines a phased 20-22 week implementation plan, building upon the completed foundation (Features #1, #3, #5).

**Key Milestones**:
- ✅ **Phase 1 Complete** (6 weeks): Type system foundation with interfaces, primary keys, and searchable properties
- 🎯 **Phase 2 Next** (4 weeks): Advanced property types and semantic catalog for AI integration
- 📅 **Target Completion**: Q2 2026 (April-June)

## Architecture Principles

These principles guide all implementation decisions:

1. **Extend, Don't Recreate** - Build on existing code (`ontology/node.ts`, `dynamodb.execute()`, etc.)
2. **Performance First** - Fast writes, lazy loading, targeted validation only
3. **Visual Editing** - Node/edge properties editable in UI, not hardcoded in code
4. **External Code Storage** - Functions in S3/DynamoDB (Feature #6), not inline strings
5. **crypto.randomUUID()** - No UUID collision checking (performance optimization)
6. **Targeted Validation** - Only validate fields defined in ontology schema

## Phase Overview

| Phase | Duration | Features | Story Points | Dependencies | Status |
|-------|----------|----------|--------------|--------------|--------|
| **Phase 1** | 6 weeks | #1, #3, #5 | ~60 pts | None | ✅ Complete |
| **Phase 2** | 4 weeks | #4, #12 | 34 pts | S3 buckets | ❌ Not Started |
| **Phase 3** | 4 weeks | #2, #6 | 34 pts | Phase 2 | ❌ Not Started |
| **Phase 4** | 4 weeks | #7, #8 | 42 pts | Phase 3 | ❌ Not Started |
| **Phase 5** | 6-8 weeks | #9, #10, #11 | 55 pts | Phase 4 | ❌ Not Started |

**Total**: 20-22 weeks, 225 story points

## Phase 1: Type System Foundation ✅ COMPLETE

**Duration**: Weeks 1-6 (Completed)
**Story Points**: ~60
**Status**: ✅ Complete

### Objectives
Build the foundational type system enabling polymorphic types, business key uniqueness, and automatic indexing.

### Features Delivered

#### Feature #1: Interface System ✅
**Delivered**: 2025-10-27

Polymorphic types where object types implement shared interfaces (e.g., `airport` and `warehouse` both implement `facility`).

**Deliverables**:
- ✅ `core/src/services/ontology/interface.ts` - Interface CRUD, schema merging, query operations
- ✅ `core/src/services/ontology/migrations/create-standard-interfaces.ts` - Standard interfaces (Timestamped, Assignable, Taggable, Approval)
- ✅ `INTERFACE-QUICKSTART.md` - Quick start guide
- ✅ Extended `Ontology` interface with `implements`, `isInterface`, `sharedProperties`

**Key Capabilities**:
```typescript
// Create interface
await ontology.interface.create('facility', [...], credentials);

// Query all types implementing interface
const facilities = await ontology.interface.queryByInterface('facility', credentials);

// Get merged schema
const schema = await ontology.interface.getMergedSchema('airport', credentials);
```

#### Feature #3: Primary Key System ✅
**Delivered**: 2025-10-28

Business-level uniqueness enforcement (e.g., `contractNumber` must be unique across all contracts).

**Deliverables**:
- ✅ `core/src/services/ontology/primary-key.ts` - PK validation, duplicate detection
- ✅ `core/src/services/ontology/migrations/add-primary-keys.ts` - Add PKs to existing types
- ✅ `PRIMARY-KEY-QUICKSTART.md` - Quick start guide
- ✅ `PRIMARY-KEY-IMPLEMENTATION.md` - Implementation details
- ✅ Extended `Ontology` interface with `primaryKey` field

**Key Capabilities**:
```typescript
// Validate uniqueness before save
const isUnique = await ontology.primaryKey.validate('contract', data, credentials);

// Find duplicates
const dupes = await ontology.primaryKey.findDuplicates('contract', credentials);
```

#### Feature #5: Searchable Properties & Indexing ✅
**Delivered**: 2025-10-29

Mark properties as searchable in ontology definition, automatically create GSIs for fast queries.

**Deliverables**:
- ✅ `core/src/services/ontology/searchable.ts` - Auto-create GSIs, full-text search
- ✅ `core/src/services/ontology/migrations/add-searchable-properties.ts` - Add searchable to existing
- ✅ `SEARCHABLE-PROPERTIES-QUICKSTART.md` - Quick start guide
- ✅ `SEARCHABLE-PROPERTIES-IMPLEMENTATION.md` - Implementation details
- ✅ Extended `PropertyDefinition` with `searchable`, `indexType`, `indexName`

**Key Capabilities**:
```typescript
// Mark property searchable (creates GSI automatically)
properties: {
  contractNumber: {
    type: 'string',
    searchable: true,
    indexType: 'GSI'
  }
}

// Automatically uses index for queries
```

### Achievements
- ✅ Namespace API for clean imports: `import { ontology } from '@captify-io/core'`
- ✅ Comprehensive migration system for updating existing data
- ✅ 5-minute cache TTL for ontology nodes (performance optimization)
- ✅ Standard interfaces for common patterns (Timestamped, Assignable, etc.)
- ✅ Quickstart guides and implementation documentation

### Lessons Learned
- Namespace API pattern is excellent for discoverability
- Migration scripts are critical for updating existing data
- Caching ontology nodes dramatically improves performance
- Comprehensive documentation accelerates adoption

---

## Phase 2: Enhanced Types & Semantics ❌ NOT STARTED

**Duration**: Weeks 7-10 (4 weeks)
**Story Points**: 34
**Dependencies**: S3 bucket configuration
**Status**: ❌ Not Started

### Objectives
Enable advanced property types (time series, attachments, geo data) and create AI-friendly semantic catalog for LLM integration.

### Feature #4: Advanced Property Types

**Priority**: P0 (Critical for data richness)
**Story Points**: 21

Support time series data, file attachments, geopoint/geoshape, structured types, and value types with custom validation.

**New Property Types**:
- `timeSeries` - Sensor data, metrics (separate storage in S3 or time-series table)
- `attachment` - Files (S3 integration with presigned URLs)
- `geopoint` - Coordinates (WGS84, EPSG:3857)
- `geoshape` - Polygons, boundaries
- `struct` - Nested objects with validation
- `valueType` - Custom validation rules (e.g., email, phone, SSN)

**Implementation Plan**:

| Week | Task | Deliverable |
|------|------|-------------|
| 7 | Design time-series storage strategy | Architecture doc (S3 vs table) |
| 7 | Create S3 bucket for attachments | `captify-attachments` bucket |
| 7 | Extend PropertyDefinition interface | Updated `types.ts` |
| 8 | Implement time-series service | `property-types/time-series.ts` |
| 8 | Implement attachment service | `property-types/attachment.ts` |
| 8 | Implement geospatial validation | `property-types/geospatial.ts` |
| 9 | Implement value type system | `property-types/value-type.ts` |
| 9 | Create value type table | `captify-core-value-type` |
| 9 | Create time-series metadata table | `captify-core-time-series-meta` |
| 10 | UI for advanced types | Property editor components |
| 10 | Testing and documentation | Quickstart guide |

**New Files** (~800 lines total):
```
core/src/services/ontology/property-types/
├── time-series.ts        (~200 lines) - Time-series read/write
├── attachment.ts         (~150 lines) - S3 upload/download
├── geospatial.ts         (~150 lines) - Geopoint/geoshape validation
├── value-type.ts         (~200 lines) - Custom validation rules
└── index.ts              (~100 lines) - Unified API
```

**Modified Files**:
- `core/src/services/ontology/types.ts` - Add property type enums, config fields
- `core/src/services/ontology/validation.ts` - Add type-specific validators

**Tables**:
- `captify-core-value-type` (NEW) - Value type definitions
- `captify-core-time-series-meta` (NEW) - Time series config (NOT data!)
- Time-series data: Separate tables or S3 (decision required)

**Blockers**:
- ❌ Need S3 bucket `captify-attachments` created
- ❌ Need S3 bucket `captify-timeseries` created (if S3 storage chosen)
- ❌ Need time-series storage decision (S3 vs DynamoDB vs Aurora)

**Success Criteria**:
- ✅ Can attach PDF files to ontology nodes
- ✅ Can store sensor readings as time series
- ✅ Can validate coordinates (geopoint)
- ✅ Can create custom value types (e.g., "Email", "SSN")

### Feature #12: Semantic Catalog

**Priority**: P1 (Important for AI integration)
**Story Points**: 13

Generate AI-friendly semantic catalog from ontology, stored in S3 as YAML/JSON for LLM agents to understand the data model.

**Catalog Contents**:
- Entity descriptions (human-readable)
- Property schemas with descriptions
- Relationships with cardinality
- Example questions for each entity
- Use cases and data grain
- TypeScript type generation

**Implementation Plan**:

| Week | Task | Deliverable |
|------|------|-------------|
| 8 | Design catalog YAML schema | Schema specification |
| 8 | Create S3 bucket | `captify-semantic-catalog` |
| 8 | Extend OntologyNode with catalog metadata | `properties.catalog` field |
| 9 | Implement catalog generator | `catalog/generator.ts` |
| 9 | Implement catalog storage | `catalog/storage.ts` |
| 10 | Implement TypeScript generator | `catalog/type-generator.ts` |
| 10 | Create CLI scripts | `scripts/generate-catalog.ts` |
| 10 | Build catalog viewer UI | Catalog browser component |

**New Files** (~950 lines total):
```
core/src/services/ontology/catalog/
├── generator.ts          (~500 lines) - Generate catalog from ontology
├── storage.ts            (~200 lines) - S3 upload/download
├── type-generator.ts     (~250 lines) - TypeScript type generation
└── index.ts              (~50 lines) - API exports

scripts/
├── generate-catalog.ts   (~100 lines) - CLI for catalog generation
└── generate-types.ts     (~100 lines) - CLI for type generation
```

**Modified Files**:
- `core/src/services/ontology/types.ts` - Add `properties.catalog` field

**Infrastructure**:
- S3 bucket: `captify-semantic-catalog`
- Catalog structure:
  ```
  captify-semantic-catalog/
  ├── catalog/
  │   ├── v1.0.0/
  │   │   ├── catalog.yaml        - Full catalog
  │   │   ├── catalog.json        - JSON version
  │   │   └── entities/           - Individual entities
  │   └── latest/                 - Symlink to latest version
  └── types/
      ├── pmbook.generated.ts
      ├── core.generated.ts
      └── ...
  ```

**Catalog YAML Example**:
```yaml
entities:
  - name: Contract
    type: pmbook-contract
    grain: one row per government contract
    description: >-
      Government contracts with funding, CLINs, modifications, and deliverables.
      Used for contract portfolio management and burn rate tracking.
    fields:
      - name: contractNumber
        type: string
        primaryKey: true
        searchable: true
        description: Unique contract identifier (e.g., W912HZ24C0001)
    relationships:
      - name: clins
        type: hasMany
        target: CLIN
        foreignKey: contractId
        description: Contract line items for this contract
    exampleQuestions:
      - How many active contracts are there?
      - What is the total value of all contracts?
      - Which contracts are expiring in the next 90 days?
    useCases: >-
      Contract portfolio management, funding tracking, burn rate analysis,
      deliverable tracking, contract modifications
```

**Blockers**:
- ❌ Need S3 bucket `captify-semantic-catalog` created
- ❌ Need catalog YAML schema finalized
- ❌ Need catalog versioning strategy

**Success Criteria**:
- ✅ Can generate full catalog from ontology in <10 seconds
- ✅ Catalog includes all entities, relationships, and example questions
- ✅ LLM agents can read catalog and understand data model
- ✅ TypeScript types auto-generated from catalog
- ✅ Catalog viewer UI shows entity relationships

### Phase 2 Deliverables

**Code**:
- ~1,750 lines of new service code
- 2 new DynamoDB tables
- 2 S3 buckets
- CLI tools for catalog generation

**Documentation**:
- Advanced property types quickstart
- Semantic catalog quickstart
- TypeScript type generation guide
- LLM integration guide

**Infrastructure**:
- S3: `captify-attachments`
- S3: `captify-semantic-catalog`
- S3: `captify-timeseries` (optional)
- Table: `captify-core-value-type`
- Table: `captify-core-time-series-meta`

### Phase 2 Risks

| Risk | Mitigation |
|------|------------|
| Time-series storage costs too high | Use S3 with compression, implement retention policies |
| Catalog becomes stale | Automate catalog generation on ontology updates |
| TypeScript generation breaks on complex types | Comprehensive test suite, validation |
| S3 upload/download performance | Use presigned URLs, implement caching |

---

## Phase 3: Relationships & Actions ❌ NOT STARTED

**Duration**: Weeks 11-14 (4 weeks)
**Story Points**: 34
**Dependencies**: Phase 2 complete
**Status**: ❌ Not Started

### Objectives
Enable rich relationships as first-class objects with properties, and create powerful action system with validation and side effects.

### Feature #2: Object-Backed Links

**Priority**: P0 (Critical for relationship modeling)
**Story Points**: 13

Relationships become full ontology nodes with properties and lifecycle, replacing simple edges.

**Old Approach** (simple edges):
```typescript
{
  id: 'edge-123',
  source: 'contract-123',
  target: 'clin-456',
  type: 'funds'
  // ❌ Can't add: amount, fiscalYear, status, approvedBy
}
```

**New Approach** (link nodes):
```typescript
{
  id: 'link-123',
  type: 'fundingRelationship',  // This is an ontology node!
  isLink: true,
  linkSource: 'contractId',     // Property name for source
  linkTarget: 'clinId',          // Property name for target

  // Now queryable with properties!
  contractId: 'contract-123',
  clinId: 'clin-456',
  amount: 500000,
  fiscalYear: '2024',
  status: 'active',
  approvedBy: 'user-xyz',
  approvedAt: '2024-01-15T10:00:00Z'
}
```

**Implementation Plan**:

| Week | Task | Deliverable |
|------|------|-------------|
| 11 | Design link type ontology nodes | Link type specifications |
| 11 | Extend Ontology interface | Add `isLink`, `linkSource`, `linkTarget` |
| 11 | Implement auto-index creation | `ensureLinkIndexes()` function |
| 12 | Implement graph traversal | `query/traversal.ts` (~200 lines) |
| 12 | Create path finding | BFS algorithm for shortest path |
| 13 | Build link editor UI | Visual relationship editor |
| 13 | Deprecate simple edges | Add deprecation notices |
| 14 | Migration script | Convert edges to link nodes |
| 14 | Testing and documentation | Quickstart guide |

**New Files** (~400 lines total):
```
core/src/services/data/query/
└── traversal.ts              (~200 lines) - Graph traversal, path finding

core/src/services/ontology/
└── link.ts                   (~200 lines) - Link-specific operations
```

**Modified Files**:
- `core/src/services/ontology/types.ts` - Add `isLink`, `linkSource`, `linkTarget`
- `core/src/services/ontology/node.ts` - Add `ensureLinkIndexes()`
- `core/src/services/ontology/edge.ts` - Add deprecation notices

**Key Capabilities**:
```typescript
// Query links with properties
const bigFunding = await captify.query
  .from('fundingRelationship')
  .where('amount', '>', 1000000)
  .execute();

// Follow links (graph traversal)
const results = await captify.query
  .from('contract')
  .where('contractNumber', '=', 'ABC123')
  .follow('fundingRelationship')  // Link type
  .to('clin')
  .execute();

// Find path between nodes
const path = await ontology.link.findPath('contract-123', 'task-789', 3, credentials);
```

**Auto-Created GSIs**:
- `{linkSource}-index` - For outgoing links
- `{linkTarget}-index` - For incoming links

**Blockers**:
- ❌ Need link type definitions (which relationships should be link nodes?)
- ❌ Need graph query API design review

**Success Criteria**:
- ✅ Can create link types with properties
- ✅ Can query links like any other object
- ✅ Can traverse graph (follow relationships)
- ✅ Can find shortest path between nodes
- ✅ All existing edges migrated to link nodes

### Feature #6: Action System Redesign

**Priority**: P0 (Critical for business logic)
**Story Points**: 21

Actions with input schemas, validation rules, side effects, and **externally stored functions** (S3/DynamoDB, not inline code).

**Example Action**:
```typescript
{
  id: 'action-approve-contract',
  type: 'action',
  name: 'approveContract',
  objectType: 'contract',
  parameters: {
    contractId: { type: 'string', required: true },
    approverComments: { type: 'string', required: false }
  },
  validation: {
    rules: [
      {
        field: 'status',
        condition: 'equals',
        value: 'pending',
        errorMessage: 'Can only approve pending contracts'
      }
    ]
  },
  sideEffects: [
    {
      type: 'update',
      target: 'self',
      properties: {
        status: 'approved',
        approvedAt: '{{timestamp}}',
        approvedBy: '{{userId}}'
      }
    },
    {
      type: 'create',
      targetType: 'notification',
      properties: {
        userId: '{{contract.ownerId}}',
        message: 'Contract {{contract.contractNumber}} approved'
      }
    }
  ],
  function: {
    functionId: 'approve-contract-v1',
    runtime: 'node:20',
    storage: 's3://captify-functions/approve-contract-v1.js',
    hash: 'sha256:abc123...'  // Integrity check
  }
}
```

**Implementation Plan**:

| Week | Task | Deliverable |
|------|------|-------------|
| 11 | Create S3 bucket for functions | `captify-functions` |
| 11 | Create DynamoDB tables | `captify-core-function`, `captify-core-action-execution` |
| 11 | Design action types | ActionType, ValidationConfig, SideEffect interfaces |
| 12 | Implement function loader | `action/function-loader.ts` (~150 lines) |
| 12 | Implement action executor | `action/executor.ts` (~250 lines) |
| 12 | Implement validation | `action/validator.ts` (~200 lines) |
| 13 | Build action builder UI | Visual editor with code editor |
| 13 | Implement side effects engine | Template variable substitution |
| 14 | Security audit | Code execution review |
| 14 | Testing and documentation | Security guide, quickstart |

**New Files** (~750 lines total):
```
core/src/services/ontology/action/
├── executor.ts           (~250 lines) - Execute actions with validation
├── function-loader.ts    (~150 lines) - Load functions from S3/DynamoDB
├── validator.ts          (~200 lines) - Validate rules against objects
└── index.ts              (~150 lines) - Action API
```

**Modified Files**:
- `core/src/services/ontology/types.ts` - Add ActionType, FunctionReference, ValidationConfig, SideEffect
- `core/src/services/ontology/capabilities.ts` - Deprecate ToolCapability

**Tables**:
```
captify-core-function (NEW)
  - id (PK)
  - functionId
  - version
  - code (function code as text)
  - runtime
  - hash
  - createdAt, updatedAt

captify-core-action-execution (NEW)
  - id (PK)
  - actionId
  - userId
  - params
  - result
  - timestamp
```

**S3 Bucket**:
```
captify-functions/
├── approve-contract-v1.js
├── approve-contract-v2.js
└── [other functions]
```

**Key Capabilities**:
```typescript
// Execute action
const result = await captify.action.execute('approveContract', {
  contractId: 'contract-123',
  approverComments: 'Looks good'
}, context);

// List actions for object type
const actions = await ontology.action.listForType('contract', credentials);

// Get action execution history
const history = await ontology.action.getHistory('action-approve-contract', credentials);
```

**Security Measures**:
- Code stored in S3 (not inline)
- SHA256 hash verification
- Sandbox execution (VM2 or Lambda)
- Audit trail of all executions
- Code review before deployment

**Blockers**:
- ❌ Need S3 bucket `captify-functions` created
- ❌ Need sandbox execution environment (VM2 vs Lambda decision)
- ❌ Need security audit for code execution
- ❌ Need code scanning tool integration

**Success Criteria**:
- ✅ Can create actions with validation rules
- ✅ Can execute actions with side effects
- ✅ Functions stored externally (S3)
- ✅ Audit trail of all executions
- ✅ Visual editor for creating actions
- ✅ Security audit passed

### Phase 3 Deliverables

**Code**:
- ~1,150 lines of new service code
- 2 new DynamoDB tables
- 1 S3 bucket
- Visual editors for links and actions

**Documentation**:
- Object-backed links quickstart
- Action system quickstart
- Security guide for function execution
- Graph traversal guide

**Infrastructure**:
- S3: `captify-functions`
- Table: `captify-core-function`
- Table: `captify-core-action-execution`
- Sandbox execution environment

### Phase 3 Risks

| Risk | Mitigation |
|------|------------|
| Code execution security vulnerability | Sandbox execution, code review, hash verification, security audit |
| Function loading performance | Cache loaded functions, use Lambda for execution |
| Action side effects create data inconsistency | Transactional updates, rollback on error |
| Complex graph queries perform poorly | Index optimization, query planner, caching |

---

## Phase 4: Data Services ❌ NOT STARTED

**Duration**: Weeks 15-18 (4 weeks)
**Story Points**: 42
**Dependencies**: Phase 3 complete
**Status**: ❌ Not Started

### Objectives
Build unified data service layer (`captify` API) that enforces all ontology rules, and powerful query engine with aggregations.

### Feature #7: Universal Data Service

**Priority**: P0 (Critical for developer adoption)
**Story Points**: 21

Single CRUD API that validates schemas, enforces primary keys, checks permissions, and auto-links relationships.

**Old Way** (bypasses ontology):
```typescript
await dynamodb.execute({
  service: 'platform.dynamodb',
  operation: 'put',
  table: 'pmbook-contract',
  data: {
    Item: {
      id: 'manual-uuid',
      contractNumber: 'ABC123',  // No uniqueness check!
      status: 'invalid',  // No schema validation!
      // Missing required fields - no error!
    }
  }
});
```

**New Way** (enforces ontology):
```typescript
const contract = await captify.create('contract', {
  contractNumber: 'ABC123',
  status: 'active',
  title: 'My Contract'
}, context);

// ✅ Auto UUID (crypto.randomUUID())
// ✅ Validates contractNumber unique (primary key)
// ✅ Validates status enum (schema)
// ✅ Validates required fields (schema)
// ✅ Sets createdAt, createdBy, tenantId (auto)
// ✅ Checks permissions (groups/roles)
```

**Implementation Plan**:

| Week | Task | Deliverable |
|------|------|-------------|
| 15 | Design permission system | Permission model, RBAC integration |
| 15 | Design session/context architecture | DataContext interface |
| 15 | Implement create operation | `data/create.ts` (~200 lines) |
| 16 | Implement read operation | `data/read.ts` (~150 lines) |
| 16 | Implement update operation | `data/update.ts` (~200 lines) |
| 16 | Implement delete operation | `data/delete.ts` (~150 lines) |
| 17 | Implement batch operations | `createMany`, `updateMany` |
| 17 | Build main API | `data/index.ts` (~150 lines) |
| 18 | Testing and documentation | Universal data service guide |
| 18 | Migration guide | How to migrate from raw DynamoDB |

**New Files** (~900 lines total):
```
core/src/services/data/
├── index.ts              (~150 lines) - Main captify API
├── create.ts             (~200 lines) - Create operation
├── read.ts               (~150 lines) - Read operation
├── update.ts             (~200 lines) - Update operation
├── delete.ts             (~150 lines) - Delete operation
└── types.ts              (~100 lines) - DataContext, UserSession
```

**Key Capabilities**:
```typescript
// Create with validation
const obj = await captify.create('contract', data, context);

// Read with permissions check
const obj = await captify.read('contract', id, context);

// Update with schema validation
const updated = await captify.update('contract', id, changes, context);

// Delete with relationship check
await captify.delete('contract', id, context);

// Batch create
const objs = await captify.createMany('task', [data1, data2, data3], context);
```

**Performance Optimizations**:
- ✅ Use `crypto.randomUUID()` (no uniqueness check)
- ✅ Only validate fields defined in schema
- ✅ Lazy load relationships (don't auto-fetch)
- ✅ Batch operations for multiple creates/updates
- ✅ No automatic side effects (explicit only)

**Blockers**:
- ❌ Need permission system design (RBAC integration)
- ❌ Need session/context architecture
- ❌ Need migration plan for existing code

**Success Criteria**:
- ✅ 80%+ developers use `captify` API instead of raw DynamoDB
- ✅ All ontology rules enforced automatically
- ✅ <100ms for simple CRUD operations
- ✅ Comprehensive error messages
- ✅ Migration guide for existing code

### Feature #8: Query Engine & Aggregations

**Priority**: P0 (Critical for data access)
**Story Points**: 21

Fluent query API with filters, aggregations, and graph traversal.

**Example Queries**:
```typescript
// Simple query (uses index)
const contracts = await captify.query
  .from('contract')
  .where('status', '=', 'active')
  .limit(100)
  .execute();

// Aggregation
const stats = await captify.query
  .from('contract')
  .groupBy('status')
  .aggregate({
    count: 'count()',
    totalValue: 'sum(totalValue)',
    avgValue: 'avg(totalValue)'
  })
  .execute();

// Graph traversal
const results = await captify.query
  .from('contract')
  .where('contractNumber', '=', 'ABC123')
  .follow('fundingRelationship')
  .to('clin')
  .execute();
```

**Implementation Plan**:

| Week | Task | Deliverable |
|------|------|-------------|
| 16 | Design query builder API | Query builder interface |
| 16 | Implement query builder | `query/builder.ts` (~250 lines) |
| 17 | Implement query executor | `query/executor.ts` (~250 lines) |
| 17 | Implement aggregator | `query/aggregator.ts` (~200 lines) |
| 17 | Implement query planner | `query/planner.ts` (~150 lines) |
| 18 | Build query builder UI | Visual query constructor |
| 18 | Testing and documentation | Query engine guide |

**New Files** (~900 lines total):
```
core/src/services/data/query/
├── builder.ts            (~250 lines) - Fluent query builder
├── executor.ts           (~250 lines) - Execute queries
├── aggregator.ts         (~200 lines) - Aggregation functions
└── planner.ts            (~150 lines) - Select optimal index
```

**Key Capabilities**:
```typescript
// Fluent API
captify.query
  .from('contract')
  .where('status', '=', 'active')
  .where('totalValue', '>', 1000000)
  .orderBy('createdAt', 'desc')
  .limit(50)
  .execute();

// Aggregations
captify.query
  .from('contract')
  .groupBy('status')
  .aggregate({
    count: 'count()',
    total: 'sum(totalValue)',
    avg: 'avg(totalValue)',
    min: 'min(totalValue)',
    max: 'max(totalValue)'
  })
  .execute();
```

**Query Optimization**:
- Automatic index selection (uses Feature #5 searchable properties)
- Query planner chooses optimal GSI
- Post-processing for complex filters
- Pagination support

**Blockers**:
- ❌ Depends on Feature #7 (Universal Data Service)
- ❌ Need query planner algorithm design

**Success Criteria**:
- ✅ Can query with complex filters
- ✅ Can perform aggregations (count, sum, avg, min, max)
- ✅ Can traverse relationships
- ✅ Queries use optimal indexes
- ✅ <500ms for complex aggregations

### Phase 4 Deliverables

**Code**:
- ~1,800 lines of new service code
- No new tables (uses existing)
- Visual query builder UI

**Documentation**:
- Universal data service guide
- Query engine reference
- Migration guide from raw DynamoDB
- Performance optimization guide

**Developer Experience**:
- Single `captify` API for all operations
- Fluent query builder
- Automatic validation and indexing
- Comprehensive error messages

### Phase 4 Risks

| Risk | Mitigation |
|------|------------|
| Developer adoption resistance | Excellent docs, migration guide, examples |
| Performance regression | Benchmark against raw DynamoDB, optimize |
| Breaking changes to existing code | Phased rollout, backward compatibility layer |
| Query planner selects wrong index | Manual index hints, query plan inspection |

---

## Phase 5: Advanced Features ❌ NOT STARTED

**Duration**: Weeks 19-26 (6-8 weeks)
**Story Points**: 55
**Dependencies**: Phase 4 complete
**Status**: ❌ Not Started

### Objectives
Add edit history, advanced query features (field selection, DataLoader), and real-time subscriptions.

### Feature #9: Edit History & Versioning

**Priority**: P1 (Important for audit compliance)
**Story Points**: 13

Immutable audit trail of all changes, version snapshots, and time travel queries.

**Example**:
```typescript
// All writes automatically tracked
await captify.update('contract', 'contract-123', {
  status: 'approved'
}, context);
// → History entry created automatically

// View history
const history = await captify.history('contract', 'contract-123', context);

// Create version snapshot
await captify.version.create('contract', 'contract-123', {
  description: 'Before major changes'
}, context);

// Restore version
await captify.version.restore('contract', 'contract-123', 'version-456', context);
```

**Implementation Plan**:

| Week | Task | Deliverable |
|------|------|-------------|
| 19 | Design history schema | History table schema |
| 19 | Create tables | `captify-core-edit-history` (verify `object-version` exists) |
| 19 | Implement tracker | `history/tracker.ts` (~150 lines) |
| 20 | Implement versioner | `history/versioner.ts` (~150 lines) |
| 20 | Integrate with CRUD | Add tracking to create/update/delete |
| 21 | Build history viewer UI | Timeline component |
| 21 | Testing and documentation | History quickstart |

**New Files** (~300 lines total):
```
core/src/services/data/history/
├── tracker.ts            (~150 lines) - Track changes
├── versioner.ts          (~150 lines) - Version snapshots
└── index.ts              (~50 lines) - API exports
```

**Modified Files**:
- `core/src/services/data/create.ts` - Add tracking
- `core/src/services/data/update.ts` - Add tracking
- `core/src/services/data/delete.ts` - Add tracking

**Tables**:
- `captify-core-edit-history` (NEW) - Immutable change log
- `captify-core-object-version` (VERIFY) - Version snapshots

**Blockers**:
- ❌ Need retention policy (how long to keep history?)
- ❌ Need storage cost analysis

**Success Criteria**:
- ✅ All changes tracked automatically
- ✅ Can view complete audit trail
- ✅ Can create version snapshots
- ✅ Can restore previous versions
- ✅ History viewer UI functional

### Feature #10: Advanced Query Features

**Priority**: P1 (Important for performance)
**Story Points**: 21

Field selection, nested includes with DataLoader batching, fragments, and introspection.

**Example**:
```typescript
// Field selection (reduce data transfer)
const contract = await captify.query
  .from('contract')
  .where('id', '=', 'abc123')
  .select(['contractNumber', 'title', 'status'])
  .execute();

// Nested includes (one request)
const result = await captify.query
  .from('contract')
  .where('status', '=', 'active')
  .include({
    clins: {
      select: ['clinNumber', 'name', 'value'],
      include: {
        tasks: {
          select: ['taskNumber', 'status'],
          limit: 10
        }
      }
    },
    owner: {
      select: ['name', 'email']
    }
  })
  .execute();

// Fragments (reusable field sets)
const ContractSummary = captify.fragment('contract', [
  'contractNumber', 'title', 'status', 'totalValue'
]);

const active = await captify.query
  .from('contract')
  .where('status', '=', 'active')
  .select(ContractSummary)
  .execute();
```

**Implementation Plan**:

| Week | Task | Deliverable |
|------|------|-------------|
| 22 | Extend query builder | Add `select()` and `include()` |
| 22 | Implement DataLoader | `query/dataloader.ts` (~250 lines) |
| 23 | Implement nested includes | `query/include.ts` (~300 lines) |
| 23 | Implement fragments | `query/fragment.ts` (~100 lines) |
| 24 | Implement introspection | `query/introspection.ts` (~200 lines) |
| 24 | Testing and documentation | Advanced query guide |

**New Files** (~900 lines total):
```
core/src/services/data/query/
├── include.ts            (~300 lines) - Nested includes
├── dataloader.ts         (~250 lines) - N+1 prevention
├── fragment.ts           (~100 lines) - Reusable field sets
└── introspection.ts      (~200 lines) - Schema introspection
```

**Modified Files**:
- `core/src/services/data/query/builder.ts` - Add `select()`, `include()`
- `core/src/services/data/query/executor.ts` - Add DataLoader

**Key Capabilities**:
- Field selection (GraphQL-style)
- Nested includes (one request for complex data)
- Automatic DataLoader batching (N+1 prevention)
- Fragments for reusable field sets
- Introspection API for self-documentation

**Blockers**:
- ❌ Depends on Feature #7 and #8
- ❌ Need DataLoader implementation strategy

**Success Criteria**:
- ✅ Can select specific fields (50-90% data reduction)
- ✅ Can include nested relationships in one request
- ✅ DataLoader prevents N+1 queries
- ✅ Fragments work across queries
- ✅ Introspection API functional

### Feature #11: Real-Time Subscriptions

**Priority**: P2 (Nice to have)
**Story Points**: 21

WebSocket-based live updates when data changes.

**Example**:
```typescript
// Subscribe to object changes
const subscription = captify.subscribe(
  'contract',
  'contract-123',
  (updated) => {
    console.log('Contract updated:', updated);
    setContract(updated);
  },
  context
);

// Observable pattern
const contract$ = captify.observe('contract', 'contract-123', context);
contract$.subscribe((data) => {
  console.log('New data:', data);
});

// Subscribe to query results
const activeContracts$ = captify.query
  .from('contract')
  .where('status', '=', 'active')
  .observe(context);

activeContracts$.subscribe((contracts) => {
  console.log('Active contracts:', contracts.length);
});
```

**Implementation Plan**:

| Week | Task | Deliverable |
|------|------|-------------|
| 24 | Design WebSocket architecture | Architecture doc |
| 24 | Create WebSocket server | Port 3100, PM2 process |
| 25 | Implement server | `subscriptions/server.ts` (~300 lines) |
| 25 | Implement client | `subscriptions/client.ts` (~250 lines) |
| 25 | Integrate DynamoDB Streams | Lambda trigger |
| 26 | Implement observable pattern | `subscriptions/observable.ts` (~200 lines) |
| 26 | Testing and documentation | Subscriptions guide |

**New Files** (~1,050 lines total):
```
core/src/services/data/subscriptions/
├── server.ts             (~300 lines) - WebSocket server
├── client.ts             (~250 lines) - Client SDK
├── dynamodb-streams.ts   (~250 lines) - Streams integration
├── observable.ts         (~200 lines) - Observable pattern
└── index.ts              (~50 lines) - API exports
```

**Infrastructure**:
- WebSocket server on port 3100
- PM2 process: `captify-subscriptions`
- Lambda function for DynamoDB Streams
- DynamoDB Streams enabled on all entity tables

**Key Capabilities**:
```typescript
// Subscribe to object
captify.subscribe('contract', id, callback, context);

// Observable pattern
captify.observe('contract', id, context);

// Subscribe to many
captify.subscribeMany('contract', [id1, id2], callback, context);

// Subscribe to type
captify.subscribeToType('notification', callback, context);
```

**Blockers**:
- ❌ Need WebSocket server infrastructure
- ❌ Need Lambda for DynamoDB Streams
- ❌ Need port allocation (3100 proposed)
- ❌ Need DynamoDB Streams enabled on tables

**Success Criteria**:
- ✅ Real-time updates working
- ✅ WebSocket server handles 1000+ connections
- ✅ Observable pattern functional
- ✅ DynamoDB Streams integration working
- ✅ Client SDK easy to use

### Phase 5 Deliverables

**Code**:
- ~2,250 lines of new service code
- 1 new table (edit-history)
- WebSocket server
- Lambda function

**Documentation**:
- Edit history guide
- Advanced query features guide
- Real-time subscriptions guide
- Performance optimization guide

**Infrastructure**:
- WebSocket server (port 3100)
- Lambda for DynamoDB Streams
- Table: `captify-core-edit-history`

### Phase 5 Risks

| Risk | Mitigation |
|------|------------|
| WebSocket scaling issues | Load balancing, connection pooling |
| DynamoDB Streams throttling | Batch processing, exponential backoff |
| History table storage costs | Retention policies, archive to S3 |
| DataLoader complexity | Comprehensive testing, simple API |

---

## Cross-Phase Concerns

### Documentation Strategy

**Per Feature**:
- Quickstart guide (getting started in 5 minutes)
- API reference (complete function signatures)
- Implementation guide (how it works internally)
- Migration guide (from old to new approach)

**Overall**:
- Architecture overview
- Performance optimization guide
- Security best practices
- Troubleshooting guide

### Testing Strategy

**Unit Tests**:
- Every service function
- 90%+ code coverage
- Mocked AWS services

**Integration Tests**:
- End-to-end workflows
- Real DynamoDB tables (test environment)
- Performance benchmarks

**E2E Tests**:
- UI components
- User workflows
- Cross-browser testing

### Migration Strategy

**Backward Compatibility**:
- Maintain old APIs for 6 months
- Clear deprecation notices
- Migration scripts provided

**Phased Rollout**:
1. Deploy new services (opt-in)
2. Migrate one app (pmbook)
3. Migrate remaining apps
4. Deprecate old APIs
5. Remove old code

### Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Simple CRUD | <100ms | Create, read, update, delete |
| Complex query | <500ms | With filters and aggregations |
| Graph traversal | <1s | Up to 3 hops |
| DataLoader batch | <10ms | Per batched load |
| WebSocket message | <50ms | Publish to subscribers |
| Catalog generation | <10s | Full catalog from ontology |

### Security Checklist

- [ ] Code execution sandboxed (Feature #6)
- [ ] Function hash verification (Feature #6)
- [ ] Permission checks on all operations (Feature #7)
- [ ] SQL injection prevention (query builder)
- [ ] XSS prevention (UI components)
- [ ] CSRF protection (WebSocket server)
- [ ] Rate limiting (all APIs)
- [ ] Audit trail (all writes)

---

## Resource Requirements

### Team

**Recommended Team** (4 people for 22 weeks):
- 1 Senior Backend Engineer (lead)
- 1 Backend Engineer
- 1 Frontend Engineer
- 1 Security Engineer (part-time for Feature #6)

**Alternative** (2 people for 44 weeks):
- 1 Full-Stack Senior Engineer
- 1 Full-Stack Engineer

### AWS Resources

**S3 Buckets** (4 total):
- `captify-attachments` - File storage (~$20/month initially)
- `captify-functions` - Function code (~$5/month)
- `captify-semantic-catalog` - Catalog (~$1/month)
- `captify-timeseries` - Optional time-series data (~$50/month if used)

**DynamoDB Tables** (6 new):
- `captify-core-value-type` (~1000 items, <$1/month)
- `captify-core-time-series-meta` (~100 items, <$1/month)
- `captify-core-function` (~50 items, <$1/month)
- `captify-core-action-execution` (~10k items/month, ~$5/month)
- `captify-core-edit-history` (~100k items/month, ~$20/month)
- `captify-core-index-metadata` (~100 items, <$1/month)

**Compute**:
- WebSocket server (EC2 t3.small, ~$15/month)
- Lambda (DynamoDB Streams, ~$5/month)

**Estimated Monthly Cost**: ~$125/month

### Development Environment

**Required**:
- Node.js 20+
- TypeScript 5+
- AWS CLI configured
- Local DynamoDB for testing
- VSCode with extensions

---

## Success Metrics

### Developer Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Developers using Universal Data Service | 80%+ | 0% |
| Code using `captify` API vs raw DynamoDB | 70%+ | 0% |
| Ontology changes via UI vs code | 100% | ~30% |
| Average time to add new entity type | <10 min | ~2 hours |

### Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Simple CRUD operations | <100ms | N/A |
| Complex aggregations | <500ms | N/A |
| Graph traversal (3 hops) | <1s | N/A |
| Query with nested includes | <300ms | N/A |

### Quality Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Unit test coverage | 90%+ | 75% |
| Integration test coverage | 80%+ | 50% |
| Documentation completeness | 100% | 85% |
| Security audit pass rate | 100% | N/A |

### Adoption Metrics

| Metric | Target | Current |
|--------|--------|---------|
| LLM agents using semantic catalog | 90%+ | 0% |
| Actions created via UI | 100% | 0% |
| Real-time subscriptions in use | 20%+ | 0% |
| Edit history queries per week | 50+ | 0% |

---

## Dependencies & Blockers

### External Dependencies

| Dependency | Status | Impact | Mitigation |
|------------|--------|--------|------------|
| S3 bucket creation permissions | ✅ Available | High | None needed |
| WebSocket server hosting | ⚠️ Pending | Medium | Use EC2 (approved) |
| Lambda deployment permissions | ✅ Available | Low | None needed |
| Security review for code exec | ❌ Not Scheduled | Critical | Schedule with security team |

### Internal Dependencies

| Dependency | Status | Impact | Phase |
|------------|--------|--------|-------|
| Permission/RBAC system | ❌ Not Designed | Critical | Phase 4 |
| Session/context architecture | ❌ Not Designed | High | Phase 4 |
| Time-series storage decision | ❌ Not Decided | Medium | Phase 2 |
| Catalog schema finalization | ❌ Not Finalized | Medium | Phase 2 |

### Current Blockers

**Phase 2 Blockers**:
1. ❌ S3 bucket `captify-attachments` not created
2. ❌ S3 bucket `captify-semantic-catalog` not created
3. ❌ Time-series storage strategy not decided

**Phase 3 Blockers**:
1. ❌ S3 bucket `captify-functions` not created
2. ❌ Security audit for code execution not scheduled
3. ❌ Sandbox execution environment not chosen

**Phase 4 Blockers**:
1. ❌ Permission system not designed
2. ❌ Session/context architecture not finalized

**Phase 5 Blockers**:
1. ❌ WebSocket server infrastructure not provisioned
2. ❌ DynamoDB Streams not enabled on tables

---

## Next Steps

### Immediate Actions (This Week)

1. **Complete workshop documentation**
   - ✅ Create `status.md`
   - ⏳ Create this `implementation-roadmap.md`
   - ❌ Create user stories for ontology viewer
   - ❌ Update README.md with current state

2. **Resolve Phase 2 blockers**
   - ❌ Create S3 bucket `captify-attachments`
   - ❌ Create S3 bucket `captify-semantic-catalog`
   - ❌ Decide time-series storage strategy
   - ❌ Finalize catalog YAML schema

3. **Plan ontology viewer enhancements**
   - ❌ Design sidebar menu
   - ❌ Design Objects tab
   - ❌ Design Links tab
   - ❌ Design Health tab

### Next 2 Weeks

4. **Start Phase 2 implementation**
   - ❌ Implement advanced property types (Feature #4)
   - ❌ Implement semantic catalog (Feature #12)
   - ❌ Build property type UI components
   - ❌ Build catalog viewer

5. **Prepare for Phase 3**
   - ❌ Schedule security audit
   - ❌ Design link types
   - ❌ Design action system security

### Next Month

6. **Complete Phase 2**
   - ❌ All advanced property types working
   - ❌ Semantic catalog generated and published
   - ❌ Documentation complete

7. **Start Phase 3**
   - ❌ Implement object-backed links (Feature #2)
   - ❌ Implement action system (Feature #6)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-30 | System | Initial roadmap created |
| 2.0 | 2025-11-02 | Claude | Updated with Phase 1 completion, detailed phase plans |

---

**Status**: 🟢 Active Development - Phase 1 Complete, Phase 2 Planning
**Next Review**: 2025-11-09 (Weekly)
**Target Completion**: Q2 2026 (April-June)
