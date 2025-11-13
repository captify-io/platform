# Fabric - Living Documentation System

## Vision

Fabric is a Captify-inspired knowledge management system integrated with Captify's ontology architecture. It enables users to create living documentation that combines free-form note-taking with structured entity relationships, real-time collaboration, and AI-powered content generation. Fabric bridges the gap between unstructured knowledge capture and formal data modeling, allowing teams to document processes, build SOPs, and create interconnected knowledge graphs that evolve with the organization.

## Core Principles

### 1. **Captify-Inspired UX**
- Familiar wikilink syntax `[[note]]` for intuitive linking
- Markdown-based editing with Captify-flavored extensions
- Folder organization with tags and bidirectional links
- Canvas view for visual knowledge organization
- Fast, keyboard-driven workflow

### 2. **Ontology Integration**
- Notes can reference ontology entities (contracts, users, agents, etc.)
- Typed links create ontology edges: `[[contract::ABC-123]]`
- Schema validation for notes with entity types
- Bidirectional sync: notes ↔ ontology ↔ DynamoDB
- Access control follows ontology security model (IL5 NIST Rev 5)

### 3. **Real-Time Collaboration**
- Y.js CRDT for conflict-free concurrent editing
- Live presence awareness (see who's editing)
- Automatic merge of simultaneous edits
- Cursor and selection synchronization
- No manual conflict resolution needed

### 4. **Hybrid Storage Architecture**
- **DynamoDB primary**: Y.js state for active documents (<10ms latency)
- **S3 snapshots**: Periodic markdown exports for backup/search
- **Automatic sync**: Export to S3 every 5 min or on close
- **Version history**: S3 versioning tracks changes over time
- **Cost optimized**: TTL expires inactive docs from DynamoDB

### 5. **AI-Powered Authoring**
- "Ask Cappy" right-click menu for content generation
- Inline widgets executing agent queries
- Template system with variable substitution
- Dataview-style queries for dynamic content
- Loading states for async agent operations

### 6. **Enterprise Security**
- IL5 NIST 800-53 Rev 5 compliance
- Clearance-based access control
- Marking-based classification (PII, PHI, FIN, LEO, etc.)
- Organization boundaries enforced
- Audit trail for all changes

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Fabric Application                         │
│         platform/src/app/fabric/ (Next.js App Router)          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Three-Panel Layout (Spaces Pattern)                │
│  ┌──────────┐  ┌─────────────────────────┐  ┌──────────────┐  │
│  │ Sidebar  │  │ ProseMirror Editor (Y.js)│  │  Inspector   │  │
│  │          │  │                         │  │              │  │
│  │ Folders  │  │  [[wikilinks]]          │  │  Backlinks   │  │
│  │ Search   │  │  #tags                  │  │  Outline     │  │
│  │ Canvas   │  │  > [!info] callouts     │  │  Properties  │  │
│  │ Recents  │  │  {{widgets}}            │  │  Graph view  │  │
│  └──────────┘  └─────────────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Fabric Service Layer                          │
│            core/src/services/fabric/ (TypeScript)               │
│                                                                 │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐           │
│  │  note   │ │   yjs   │ │   sync   │ │ snapshot │           │
│  │  CRUD   │ │  state  │ │ real-time│ │ S3 export│           │
│  └─────────┘ └─────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐                        │
│  │ search  │ │wikilink │ │ template │                        │
│  │ query   │ │ parser  │ │ system   │                        │
│  └─────────┘ └─────────┘ └──────────┘                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Storage & Data Layer                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  DynamoDB (Primary - Real-Time State)                    │  │
│  │  ┌────────────────┐  ┌────────────────┐                 │  │
│  │  │ fabric-note    │  │ fabric-folder  │                 │  │
│  │  │ - yjsState     │  │ - path         │                 │  │
│  │  │ - title, tags  │  │ - noteCount    │                 │  │
│  │  │ - wikilinks    │  │ - security     │                 │  │
│  │  │ - frontmatter  │  └────────────────┘                 │  │
│  │  │ - security     │                                      │  │
│  │  │ - TTL (24h)    │  ┌────────────────┐                 │  │
│  │  └────────────────┘  │ fabric-template│                 │  │
│  │                      │ - content      │                 │  │
│  │  ┌────────────────┐  │ - variables    │                 │  │
│  │  │ fabric-canvas  │  │ - locked props │                 │  │
│  │  │ - nodes, edges │  └────────────────┘                 │  │
│  │  │ - Flow graph   │                                      │  │
│  │  └────────────────┘                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  S3 (Snapshots - Version History & Backup)              │  │
│  │  spaces/{spaceId}/fabric/                                │  │
│  │    notes/{noteId}/                                       │  │
│  │      latest.md                                           │  │
│  │      versions/v1-timestamp.md                            │  │
│  │    attachments/{noteId}/image.png                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Ontology Tables (Entity Relationships)                  │  │
│  │  - ontology-object-type (entity schemas)                 │  │
│  │  - ontology-link-type (relationship types)               │  │
│  │  - ontology-edge (fabric notes → entities links)         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

**Creating a Note:**
1. User creates note in Fabric UI
2. ProseMirror editor initializes Y.js document
3. User types content (Y.js tracks changes)
4. Service saves Y.js state to DynamoDB
5. Wikilink parser extracts `[[links]]`
6. Create ontology edges for typed links
7. Schedule S3 snapshot (5 min or on close)

**Real-Time Collaboration:**
1. User A opens note → Load Y.js state from DynamoDB
2. User B opens same note → Load same Y.js state
3. User A types → Y.js update applied locally
4. Poll service every 500ms → broadcast update
5. User B receives update → Y.js merges automatically
6. Both users see synchronized content (conflict-free)

**Ontology Integration:**
1. User types `[[contract::ABC-123]]` in note
2. Wikilink parser detects typed link
3. Query ontology for entity "contract" with ID "ABC-123"
4. Validate user has access to entity
5. Create ontology edge: note → references → contract
6. Backlink appears on contract detail page
7. Bidirectional navigation enabled

## Key Features

### Phase 1: Core Editing (MVP - Week 1-2)
- ✅ Create, edit, save notes with ProseMirror editor
- ✅ Y.js real-time state management
- ✅ Basic wikilink syntax `[[note]]`
- ✅ Folder organization (S3-backed)
- ✅ Full-text search by title/content
- ✅ Auto-save (debounced to DynamoDB)

### Phase 2: Collaboration (Week 3)
- ✅ Multi-user simultaneous editing (Y.js CRDT)
- ✅ Presence awareness (see who's editing)
- ✅ Polling-based sync (500ms interval)
- ✅ Automatic conflict resolution

### Phase 3: Captify Features (Week 3-4)
- ✅ Backlinks panel
- ✅ Document outline (from headings)
- ✅ Tags `#tag` with tag browser
- ✅ Embeds `![[note]]` transclusion
- ✅ Callouts `> [!info]` styling
- ✅ Block references `^block-id`
- ✅ YAML frontmatter editor

### Phase 4: Ontology Integration (Week 4)
- ✅ Typed links `[[contract::ABC-123]]`
- ✅ Create ontology edges from wikilinks
- ✅ Entity backlinks (contract page shows notes)
- ✅ Schema validation for typed notes
- ✅ Access control (IL5 security model)

### Phase 5: Canvas & Visualization (Week 4-5)
- ✅ Canvas view using Flow component
- ✅ Drag notes onto canvas
- ✅ Visual connections between notes
- ✅ Auto-layout algorithms
- ✅ Graph view (global & local)
- ✅ Export canvas to PNG/SVG

### Phase 6: Templates & Advanced (Week 5)
- ✅ Template library (SOP, contract, meeting notes)
- ✅ Variable substitution `{{date}}`, `{{user.name}}`
- ✅ Dataview queries `{{query: ...}}`
- ✅ Locked properties (template author control)

### Phase 7: S3 Snapshots & Export (Week 5-6)
- ✅ Automatic S3 snapshots (every 5 min)
- ✅ Version history browser
- ✅ Restore from snapshot
- ✅ Export to markdown/PDF/JSON
- ✅ S3 lifecycle policies (archive old versions)

### Phase 8: AI Integration (Week 6+)
- ✅ "Ask Cappy" right-click menu
- ✅ Inline content generation
- ✅ Dynamic widgets `{{widget:user-table}}`
- ✅ Loading states for async operations
- ✅ Widget caching and refresh

## Technology Stack

### Frontend
- **Next.js 15.5.2** - App Router with React Server Components
- **ProseMirror** - Modular rich text editing framework (MIT license)
- **Y.js 13.6.10** - CRDT for real-time collaboration
- **y-prosemirror** - ProseMirror Y.js binding for real-time sync
- **React Flow** - Canvas visualization (via core/components/flow)
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - Component library (via @captify-io/core)

### Backend Services
- **@captify-io/core/services/fabric** - Fabric service layer
- **@captify-io/core/services/ontology** - Entity operations
- **@captify-io/core/services/aws** - AWS integrations
- **@captify-io/core/lib/api** - API client (apiClient)

### Storage
- **DynamoDB** - Primary storage for Y.js state and metadata
- **S3** - Snapshots, version history, attachments
- **Ontology tables** - Entity relationships

### Security
- **AWS Cognito** - Authentication
- **IL5 NIST 800-53 Rev 5** - Compliance framework
- **Organization-based tenancy** - Multi-tenant isolation
- **Clearance levels** - UNCLASSIFIED, CUI, SECRET, TOP_SECRET
- **Markings** - PII, PHI, FIN, LEO, FOUO, NOFORN, SCI

## Success Criteria

### User Adoption
- **Target**: 80% of active users create at least one note per week
- **Measure**: DynamoDB query count for fabric-note creation
- **Goal**: Fabric becomes primary documentation tool

### Performance
- **Editor Load Time**: < 500ms for notes under 100KB
- **Real-Time Sync Latency**: < 1 second for updates to appear
- **Search Response**: < 200ms for full-text queries
- **S3 Snapshot Time**: < 2 seconds for 10KB markdown export

### Collaboration
- **Concurrent Users**: Support 10 users editing same note simultaneously
- **Conflict-Free**: Zero manual conflict resolutions needed (Y.js CRDT)
- **Presence**: 100% accuracy showing who's currently editing

### Integration
- **Ontology Links**: 50% of notes contain at least one entity reference
- **Backlinks**: Entities show all notes linking to them
- **Access Control**: Zero unauthorized access incidents

### Quality
- **Test Coverage**: ≥ 85% for fabric services
- **Uptime**: 99.9% availability
- **Data Loss**: Zero data loss incidents (S3 backup safety net)

## Related Documentation

- **Workshop Status**: [./status.md](./status.md) - Current implementation progress
- **Roadmap**: [./plan/implementation-roadmap.md](./plan/implementation-roadmap.md) - Phased implementation plan
- **Platform Architecture**: [/opt/captify-apps/CLAUDE.md](../../../../CLAUDE.md) - Overall platform documentation
- **Ontology System**: [/opt/captify-apps/core/src/services/ontology/](../../../../core/src/services/ontology/) - Ontology service implementation
- **Flow Component**: [/opt/captify-apps/core/src/components/flow/](../../../../core/src/components/flow/) - Canvas component docs

## Design Inspirations

- **Captify Platform** - Wikilink syntax, bidirectional linking, graph view
- **Notion** - Real-time collaboration, templates, databases
- **Roam Research** - Block references, daily notes
- **Confluence** - Enterprise documentation, permissions
- **GitHub Issues** - Markdown editing, @ mentions, # references

## Non-Goals

- ❌ **Not a** general-purpose note-taking app (no plugin ecosystem)
- ❌ **Not a** general-purpose document editor (focused on knowledge management)
- ❌ **Not a** project management tool (use Spaces for that)
- ❌ **Not a** file system browser (S3 is hidden from users)
- ❌ **Not a** CMS (content management system)

---

**Version**: 1.0
**Created**: 2025-11-10
**Status**: Planning → Implementation
**Owner**: Platform Team
