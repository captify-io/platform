# Captify Ontology System

## Vision

The Captify Ontology System is a **world-class data modeling and management platform** that transforms how we define, validate, query, and interact with data across the entire Captify ecosystem. It provides a single source of truth for all entity types, relationships, schemas, and business logic, enabling type-safe operations, AI-powered features, and flexible data access patterns.

**System Purpose**: Define and manage the complete data model for all Captify applications through a visual ontology that makes data easier to use, provides a common operational vocabulary, supports operational decisions through well-defined actions, and powers AI solutions in an operational day-to-day context.

**Key Innovation**: Ontology-driven architecture where the data model IS the system - every entity type, property, relationship, and action is defined in the ontology and enforced automatically at runtime.

## Core Principles

### 1. Ontology as Single Source of Truth

**Problem**: Data models scattered across code, databases, and documentation become inconsistent.

**Solution**: All entity definitions live in the ontology - entity types, relationships, business keys, searchable properties, actions, and type schemas all defined in one place.

**Benefits**:
- One place to understand the data model
- Automatic enforcement of rules
- Changes propagate everywhere
- Self-documenting system
- AI-friendly metadata

### 2. Visual-First Data Modeling

**Problem**: Editing code to change schemas is slow and error-prone.

**Solution**: Visual ontology viewer for all operations - browse nodes, create/edit types through forms, visual schema editor, property inspector, relationship visualizer, and action builder.

**Benefits**:
- No code needed for schema changes
- Faster iteration
- Better discoverability
- Accessible to non-developers
- Real-time validation

### 3. Type-Safe and AI-Powered

**Problem**: Manual schema validation is tedious; AI agents can't understand data models.

**Solution**: Runtime validation, TypeScript type generation, semantic catalog for AI agents, natural language queries, and automatic API documentation.

**Benefits**:
- Catch errors at runtime
- IDE autocomplete for data access
- AI agents understand data model
- Self-documenting APIs
- Reduced development time

## Architecture Overview

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Ontology Layer                         │
│  Node definitions, schemas, relationships, actions          │
│  (Single source of truth for all data models)               │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼──────┐    ┌─────────▼────────┐    ┌──────▼──────┐
│ Universal    │    │  Query Engine    │    │  Real-Time  │
│ Data Service │    │  & Aggregations  │    │  Subs       │
│              │    │                  │    │             │
│ - CRUD ops   │    │ - Fluent API     │    │ - WebSocket │
│ - Validation │    │ - Joins          │    │ - Observable│
│ - Permissions│    │ - Aggregations   │    │ - Streams   │
└──────────────┘    └──────────────────┘    └─────────────┘
```

### Namespace API

Clean, organized API for all ontology operations:

```typescript
import { ontology } from '@captify-io/core';

// Node operations
const nodes = await ontology.node.getAllNodes(credentials);
const node = await ontology.node.getById(id, credentials);

// Interface operations
await ontology.interface.create('facility', [...], credentials);
const facilities = await ontology.interface.queryByInterface('facility', credentials);

// Primary key validation
const isUnique = await ontology.primaryKey.validate('contract', data, credentials);

// Searchable properties
await ontology.searchable.createIndex(nodeId, 'status', credentials);
```

### Ontology-Driven Table Resolution

API automatically resolves short table names to full names using ontology, enabling multi-tenant support with different schema prefixes per environment.

## Key Features

### ✅ Phase 1: Type System Foundation (COMPLETE)

**Feature #1: Interface System** - Polymorphic types with inheritance
- Object types implement shared interfaces (e.g., `airport` and `warehouse` implement `facility`)
- Schema merging with conflict detection
- Query across multiple types via interface
- Standard interfaces: Timestamped, Assignable, Taggable, Approval
- **Status**: ✅ Complete (2025-10-27)

**Feature #3: Primary Key System** - Business key uniqueness enforcement
- Enforce uniqueness on business keys (e.g., `contractNumber` must be unique)
- Composite key support
- Validation before save
- Duplicate detection
- **Status**: ✅ Complete (2025-10-28)

**Feature #5: Searchable Properties** - Automatic index creation
- Mark properties as searchable in ontology
- Auto-create GSIs for fast queries
- Full-text search support
- Composite indexes
- **Status**: ✅ Complete (2025-10-29)

### ❌ Phase 2: Enhanced Types & Semantics (NOT STARTED - 4 weeks)

**Feature #4: Advanced Property Types**
- Time series data (separate storage in S3 or time-series table)
- Attachments (S3 integration with presigned URLs)
- Geopoint and geoshape (coordinates, polygons)
- Struct types (nested objects with validation)
- Value types (custom validation rules: email, phone, SSN)
- **Status**: ❌ Not Started
- **Blockers**: S3 buckets not created, storage strategy not decided

**Feature #12: Semantic Catalog**
- AI-friendly YAML/JSON catalog stored in S3
- Natural language descriptions for LLM agents
- Example questions for each entity
- TypeScript type generation from catalog
- Automatic documentation
- **Status**: ❌ Not Started
- **Blockers**: S3 bucket not created, catalog schema not finalized

### ❌ Phase 3: Relationships & Actions (NOT STARTED - 4 weeks)

**Feature #2: Object-Backed Links**
- Relationships as full ontology nodes with properties
- Graph traversal (BFS path finding)
- Link indexes for fast queries
- Deprecate simple edges
- **Status**: ❌ Not Started
- **Blockers**: Link type definitions needed, graph query API design

**Feature #6: Action System**
- Actions with input schemas and validation rules
- Side effects (create, update, notify)
- External function storage (S3/DynamoDB, not inline code)
- Function versioning and integrity checks
- Visual editor for function code
- **Status**: ❌ Not Started
- **Blockers**: S3 bucket needed, sandbox execution environment, security review

### ❌ Phase 4: Data Services (NOT STARTED - 4 weeks)

**Feature #7: Universal Data Service**
- Single CRUD API (`captify.create`, `read`, `update`, `delete`)
- Automatic schema validation
- Primary key uniqueness enforcement
- Permission checking
- Auto-set audit fields
- Performance-first design
- **Status**: ❌ Not Started
- **Blockers**: Permission system design, session/context architecture

**Feature #8: Query Engine & Aggregations**
- Fluent query builder API
- Aggregations (count, sum, avg, min, max)
- Graph traversal queries
- Index-optimized execution
- Post-processing filters
- **Status**: ❌ Not Started
- **Blockers**: Depends on Feature #7, query planner design needed

### ❌ Phase 5: Advanced Features (NOT STARTED - 6-8 weeks)

**Feature #9: Edit History & Versioning**
- Immutable audit trail of all changes
- Version snapshots
- Time travel queries
- Change tracking
- **Status**: ❌ Not Started

**Feature #10: Advanced Query Features**
- Field selection (GraphQL-style)
- Nested includes with DataLoader batching
- Fragments (reusable field sets)
- Introspection API
- N+1 query prevention
- **Status**: ❌ Not Started
- **Blockers**: Depends on Features #7 and #8

**Feature #11: Real-Time Subscriptions**
- WebSocket server for live updates
- Observable pattern (RxJS-style)
- DynamoDB Streams integration
- Type-specific and object-specific subscriptions
- **Status**: ❌ Not Started
- **Blockers**: WebSocket server infrastructure, Lambda for DynamoDB Streams

## Technology Stack

- **TypeScript** - Strict mode, comprehensive types
- **DynamoDB** - Single-table design with GSIs
- **S3** - Function storage, semantic catalog, attachments
- **AWS Bedrock** - AI integration (Claude 3.5 Sonnet)
- **React 19** - Latest React with Server Components
- **Next.js 15** - App router with streaming
- **Tailwind CSS v4** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **ReactFlow** - Graph visualization
- **Zod** - Runtime schema validation
- **React Hook Form** - Form state management
- **React Query** - Data fetching and caching

## Success Criteria

### Developer Adoption
- **Target**: 80%+ developers use Universal Data Service (Feature #7)
- **Current**: 0% (not yet implemented)

### Data Quality
- **Target**: 100% ontology changes via UI (not code)
- **Current**: ~30%

### Performance
- **Target**: <100ms for simple CRUD operations
- **Target**: <500ms for complex aggregations
- **Current**: N/A (features not implemented)

### AI Integration
- **Target**: 90%+ LLM agents use semantic catalog
- **Current**: 0% (Feature #12 not implemented)

## Related Documentation

- **Implementation Status**: [status.md](./status.md) - Detailed progress tracking
- **Implementation Roadmap**: [plan/implementation-roadmap.md](./plan/implementation-roadmap.md) - Phased plan
- **Feature Specifications**: [features/](./features/) - Detailed feature specs
- **User Stories**: [user-stories/](./user-stories/) - User scenarios

## Getting Started

### Quick Start

```typescript
import { ontology } from '@captify-io/core';

// Get all nodes
const nodes = await ontology.node.getAllNodes(credentials);

// Create an interface
await ontology.interface.create('facility', ['name', 'location', 'capacity'], credentials);

// Query by interface
const facilities = await ontology.interface.queryByInterface('facility', credentials);

// Validate primary key
const isUnique = await ontology.primaryKey.validate(
  'contract',
  { contractNumber: 'ABC123' },
  credentials
);

// Mark property as searchable (creates GSI)
const node = {
  properties: {
    schema: {
      properties: {
        status: {
          type: 'string',
          searchable: true,
          indexType: 'GSI'
        }
      }
    }
  }
};
```

See detailed quickstart guides in [features/](./features/) directory.

---

**Documentation Version**: 2.1 (Consolidated format)
**Last Updated**: 2025-11-02
**Status**: Phase 1 Complete (25%) - Phase 2 Planning
**Total Scope**: 12 features, 20-22 weeks
