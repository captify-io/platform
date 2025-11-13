# Captify Workshops - Application Index

**Last Updated**: 2025-11-02

This index lists all applications and components with active workshops. For the workshop process standard, see [readme.md](./readme.md).

---

## Active Workshops

### 1. Application Management System

**Location**: [`./app/`](./app/)

**Status**: Design Phase - 5% implemented

**Vision**: Enable dynamic app discovery, IAM-backed access control, and self-service app provisioning within the Captify platform. All applications run as folders inside `platform/src/app/`, with centralized access control at the platform layout level.

**Key Features**:
- Folder-based app architecture (if folder exists in `platform/src/app/`, it's an app)
- Platform layout validates access before rendering
- IAM role-based permissions (technical, manager, executive, admin)
- Self-service access requests and approval workflow
- Admin control center for app management
- Automatic IAM credential provisioning

**Timeline**: 6-8 weeks

**Priority**: **P0 - Critical** (Foundational infrastructure for all apps)

**Current Phase**: Phase 1 - Ontology & Data Model

**Next Actions**:
1. Create `core-app-member` ontology node and DynamoDB table
2. Create `core-app-role` ontology node and DynamoDB table
3. Define IAM roles for pmbook (4 roles: technical, manager, executive, admin)
4. Create IAM policies with DynamoDB conditions
5. Implement backend services (app, app-member, app-role, app-access-request)

**Documentation**:
- [Vision & Architecture](./app/readme.md)
- [Implementation Status](./app/status.md)
- [Implementation Roadmap](./app/plan/implementation-roadmap.md)
- [Feature: Platform Layout Access Control](./app/features/01-platform-layout-access-control.md)

---

### 2. Captify Spaces (Work Management Platform)

**Location**: [`./spaces/`](./spaces/)

**Status**: Design Complete - 0% implemented

**Vision**: Comprehensive work management platform for government contract teams, providing complete traceability from strategic objectives through execution to financial reporting, with AI-powered time tracking and request intake.

**Key Features**:
- Four persona system (Technical, Manager, Executive, Financial)
- AI-powered time tracking: 10-15 min → <2 min (85% reduction)
- AI-powered request intake: 30+ min → <5 min (83% reduction)
- Automatic financial traceability (time → task → feature → capability → workstream → CLIN)
- Capability-driven development (customer needs → capabilities → features)
- Real-time burn rate tracking with AI-powered depletion forecasting
- 42 features across 7 implementation phases

**Timeline**: 24 weeks (484 story points)

**Priority**: **P1 - High** (Major revenue opportunity)

**Current Phase**: Phase 0 - Pre-implementation (awaiting App Management completion)

**Next Actions**:
1. Create 21 ontology nodes (Contract, CLIN, Workstream, Capability, Feature, Task, etc.)
2. Create 21 DynamoDB tables with 46 GSIs
3. Implement core services (contract, clin, workstream, capability, feature, task, time-entry, etc.)
4. Build Technical persona features (Home Dashboard, AI Daily Checkin, Task Board, Time Tracking)
5. Build AI features (AI Request Intake, Semantic Search, Cappy Navigation AI)

**Documentation**:
- [Vision & Architecture](./spaces/readme.md)
- [Implementation Status](./spaces/status.md)
- [42 Feature Specifications](./spaces/features/)
- [User Stories](./spaces/user-stories/)
- [Original Design Docs](../core/src/components/spaces/design/) (legacy reference)

---

### 3. Widget System

**Location**: [`./widgets/`](./widgets/)

**Status**: Planning Complete - 0% implemented

**Vision**: Comprehensive UI primitive library providing reusable, configurable display and interaction components for visualizing data across the entire Captify platform. Widgets are first-class primitives used by pages, workflows, agents, and any component that needs to present data to users.

**Key Features**:
- Refactor widgets from agent folder to `core/components/widgets` as true primitives
- Widget registry in ontology for discovery and configuration
- Visual widget builder in platform (no code required)
- 27 widget types: charts, tables, maps, timelines, forms, navigation
- Agent integration for dynamic widget discovery
- Events and actions system for interactivity

**Timeline**: 7 weeks (58 story points)

**Priority**: **P0 - Critical** (Foundation for all UI development, agent responses)

**Current Phase**: Planning Complete - Ready for Phase 1

**Next Actions**:
1. Phase 1 (Week 1-2): Refactor widgets from `agent/widgets/` to `widgets/`
2. Integrate TableWidget with existing DataTable component
3. Update all import paths across codebase
4. Phase 2 (Week 2-4): Build widget registry and platform UI
5. Phase 3 (Week 4-6): Implement 27 widget templates

**Documentation**:
- [Vision & Architecture](./widgets/readme.md)
- [Implementation Status](./widgets/status.md)
- [Implementation Roadmap](./widgets/plan/implementation-roadmap.md)
- [Feature 1: Widget Refactor](./widgets/features/01-widget-refactor.md)
- [Feature 2: Widget Registry](./widgets/features/02-widget-registry.md)
- [User Stories](./widgets/user-stories/01-widget-system.md)

---

### 4. NextGen DataOps (The "Facebook for Data")

**Location**: [`./dataops/`](./dataops/)

**Status**: Planning Complete - 0% implemented

**Vision**: AI-powered data operations platform where every data asset has a profile, lineage, quality score, and community ratings. Think of it as "Facebook for Data" - a social, visual, and intelligent platform that combines enterprise data mesh principles with mission-specific context.

**Key Features**:
- Unified data catalog with semantic search (Kendra-powered)
- Visual pipeline builder using @xyflow/react (18+ node types)
- Automated quality monitoring (6 dimensions, 0-100 score)
- Interactive lineage graph with impact analysis
- AI agent for discovery, pipeline generation, quality assistance
- Full AWS integration (Glue, Athena, S3, QuickSight, Kendra, SageMaker)
- Enterprise connectors (Databricks, Snowflake)
- Mission context (classification, PII detection, policy compliance, audit)

**Timeline**: 28-32 weeks (7-8 months)

**Priority**: **P0 - Critical** (Foundational data infrastructure for AI-powered analytics)

**Current Phase**: Planning Complete

**Next Actions**:
1. Review and approve vision with stakeholders
2. Clarify enterprise integration priorities (AWS vs Databricks vs Snowflake)
3. Clarify AI capabilities priority (discovery vs pipeline gen vs quality)
4. Create ontology nodes (6 entity types)
5. Begin Phase 1 - Foundation (4 weeks)

**Documentation**:
- [Vision & Architecture](./dataops/readme.md)
- [Implementation Status](./dataops/status.md)
- [Implementation Roadmap](./dataops/plan/implementation-roadmap.md)
- [Feature 01: Data Catalog](./dataops/features/01-data-catalog.md)
- [Feature 02: Pipeline Builder](./dataops/features/02-pipeline-builder.md)
- [Feature 03: Quality Engine](./dataops/features/03-quality-engine.md)
- [Feature 04: Lineage Graph](./dataops/features/04-lineage-graph.md)
- [Feature 05: AI Agent](./dataops/features/05-ai-agent.md)
- [Feature 06: Enterprise Integration](./dataops/features/06-enterprise-integration.md)
- [Feature 07: Mission Context](./dataops/features/07-mission-context.md)

---

## Planned Workshops

### 5. Agent Builder

**Status**: Not Started

**Vision**: Visual interface for building, configuring, and deploying AI agents with custom tools, knowledge bases, and workflows.

**Priority**: **P1 - High**

**Expected Start**: After Spaces Phase 3

---

### 6. Ontology Manager

**Status**: Not Started

**Vision**: Visual interface for managing the Captify ontology - creating nodes, edges, schemas, and visualizing relationships.

**Priority**: **P2 - Medium**

**Expected Start**: TBD

---

## Completed Workshops

*No completed workshops yet*

---

## Workshop Statistics

| Metric | Value |
|--------|-------|
| **Total Workshops** | 4 active |
| **Total Features** | 56 (1 app + 42 spaces + 6 widgets + 7 dataops) |
| **Features Complete** | 0 |
| **Features In Progress** | 0 |
| **Overall Progress** | 2% |

---

## Priority Summary

| Priority | Count | Applications |
|----------|-------|--------------|
| **P0 - Critical** | 3 | Application Management, Widget System, NextGen DataOps |
| **P1 - High** | 2 | Captify Spaces, Agent Builder (planned) |
| **P2 - Medium** | 1 | Ontology Manager (planned) |
| **P3 - Low** | 0 | - |

---

## Current Focus

**This Week**:
- Application Management: Create ontology nodes and tables
- Application Management: Define IAM roles and policies

**This Month**:
- Application Management: Complete Phase 1-3 (Ontology, IAM, Backend)
- Application Management: Start Phase 4 (Platform Layout Integration)

**This Quarter**:
- Application Management: Complete implementation (Phases 1-7)
- Captify Spaces: Begin Foundation phase (Phases 1-2)

---

## How to Update This Index

When creating a new workshop:
1. Add entry under "Active Workshops" or "Planned Workshops"
2. Include all required fields (Location, Status, Vision, etc.)
3. Update "Workshop Statistics" section
4. Update "Priority Summary" table
5. Update "Current Focus" if applicable

When completing a workshop:
1. Move entry to "Completed Workshops"
2. Update statistics
3. Add completion date and final metrics

---

**Index Version**: 1.0
**Maintained By**: Product Management + Tech Leads
**Update Frequency**: Weekly (or when workshops are added/completed)
**Purpose**: Quick reference for all active development work
