# New Ontology UI - Clean Rebuild

**Date:** 2025-11-10
**Status:** Implemented and Deployed

## Overview

Rebuilt the ontology management interface with a clean, simple structure focused on viewing and managing nodes, edges, and security features. The previous complex designer UI has been archived to `ontology-archive/`.

## Structure

```
/ontology
├── layout.tsx          - Main layout with tabs (Nodes, Edges, Activity, Compliance)
├── page.tsx            - Redirects to /ontology/nodes
├── nodes/
│   └── page.tsx        - List all ontology nodes with search and filters
├── edges/
│   └── page.tsx        - List all ontology edges with search and filters
├── activity/
│   └── page.tsx        - CloudTrail event viewer (placeholder)
└── compliance/
    └── page.tsx        - NIST 800-53 compliance tracking (placeholder)
```

## Features Implemented

### 1. Navigation Layout

**File:** [layout.tsx](file:///opt/captify-apps/platform/src/app/ontology/layout.tsx)

- Clean header with title and description
- Tab navigation for: Nodes, Edges, Activity, Compliance
- Icons from lucide-react (Database, GitBranch, Activity, Shield)
- Active tab highlighting

### 2. Nodes List Page

**Route:** `/ontology/nodes`
**File:** [nodes/page.tsx](file:///opt/captify-apps/platform/src/app/ontology/nodes/page.tsx)

**Features:**
- Loads all nodes from `captify-core-ontology-node` table
- Search by ID, name, or type
- Filter by category dropdown
- Results count display
- Table columns:
  - ID (monospace font)
  - Name (with icon/color badge)
  - Type
  - Category (badge)
  - Domain
  - Status (Active/Inactive badge)
  - Actions (View button)

**Data Loaded:**
```typescript
await apiClient.run({
  service: "platform.dynamodb",
  operation: "scan",
  table: "core-ontology-node",
  data: {
    ProjectionExpression: "id,#n,#t,category,domain,active,icon,color,createdAt,updatedAt",
    ExpressionAttributeNames: {
      "#n": "name",
      "#t": "type",
    },
  },
});
```

### 3. Edges List Page

**Route:** `/ontology/edges`
**File:** [edges/page.tsx](file:///opt/captify-apps/platform/src/app/ontology/edges/page.tsx)

**Features:**
- Loads all edges from `captify-core-ontology-edge` table
- Search by source, target, or relation
- Filter by relation type dropdown
- Results count display
- Table columns:
  - ID (monospace font)
  - Source (with type)
  - Relation (with arrows and badge)
  - Target (with type)
  - Description
  - Status (Active/Inactive badge)
  - Actions (View button)

**Data Loaded:**
```typescript
await apiClient.run({
  service: "platform.dynamodb",
  operation: "scan",
  table: "core-ontology-edge",
  data: {
    ProjectionExpression: "id,#src,#tgt,relation,sourceType,targetType,active,description,createdAt,updatedAt",
    ExpressionAttributeNames: {
      "#src": "source",
      "#tgt": "target",
    },
  },
});
```

### 4. Activity Page (Placeholder)

**Route:** `/ontology/activity`
**File:** [activity/page.tsx](file:///opt/captify-apps/platform/src/app/ontology/activity/page.tsx)

- Placeholder for CloudTrail event viewer
- Lists planned features:
  - Filter by date range, user, resource type
  - View allowed and denied access attempts
  - Export to CSV/JSON
  - Real-time event streaming

### 5. Compliance Page (Placeholder)

**Route:** `/ontology/compliance`
**File:** [compliance/page.tsx](file:///opt/captify-apps/platform/src/app/ontology/compliance/page.tsx)

- Placeholder for NIST 800-53 Rev 5 compliance tracking
- Lists planned features:
  - Control family overview (AC, AU, SC, etc.)
  - Implementation status tracking
  - Evidence links (code, CloudTrail queries)
  - Compliance reports (PDF export)

## Archived Content

The previous ontology UI has been moved to:
- **Location:** `/opt/captify-apps/platform/src/app/ontology-archive/`
- **Contents:** Designer canvas, node palette, property panels, chat interface, shapes, discovery nodes, decision nodes, context nodes

## Next Steps

### Immediate (Week 1)

1. **Node Detail View**
   - Click "View" button on node to see full details
   - Display all properties, schema, indexes
   - Edit node properties
   - View edges connected to this node

2. **Edge Detail View**
   - Click "View" button on edge to see full details
   - Display relationship properties
   - Edit edge properties
   - Navigate to source/target nodes

3. **Create Node Form**
   - Click "New Node" button
   - Form with fields: id, name, type, category, domain, icon, color
   - Properties editor (JSON or form)
   - Schema editor (JSON Schema)
   - Indexes configuration

4. **Create Edge Form**
   - Click "New Edge" button
   - Form with fields: source (dropdown), target (dropdown), relation
   - Properties editor
   - Relationship configuration

### Phase 2 (Week 2-3)

5. **Users Management** (`/ontology/users`)
   - Create `core.user` ontology object type
   - List users from Cognito + DynamoDB
   - Edit user security attributes (clearance, markings, org)
   - Sync from Cognito button
   - View user activity (CloudTrail)

6. **Organizations Management** (`/ontology/organizations`)
   - Create `core.organization` ontology object type
   - List organizations
   - Create/edit organizations
   - View users in organization
   - View objects owned by organization

7. **Markings Management** (`/ontology/markings`)
   - Create `core.marking` ontology object type
   - List data markings (PII, PHI, FIN, etc.)
   - Create/edit markings
   - View users authorized for marking
   - View objects with marking

### Phase 3 (Week 4)

8. **Activity Viewer Implementation**
   - Query CloudTrail via AWS SDK
   - Filter by date range, user, resource type, event type
   - Display allowed and denied access attempts
   - Export to CSV/JSON
   - Real-time streaming (WebSocket)

9. **Compliance Tracking Implementation**
   - NIST 800-53 Rev 5 control families
   - Implementation status per control
   - Evidence links (code, CloudTrail queries)
   - Compliance reports (PDF export)

## Technical Details

### Component Library

All UI components from `@captify-io/core/ui`:
- `Button` - Primary actions
- `Input` - Search fields
- Icons from `lucide-react`

### API Client

All data loading via `apiClient.run()` from `@captify-io/core/lib/api`:
```typescript
import { apiClient } from "@captify-io/core/lib/api";

const response = await apiClient.run({
  service: "platform.dynamodb",
  operation: "scan",
  table: "core-ontology-node",
  data: { /* DynamoDB params */ }
});
```

### Styling

- Tailwind CSS v4
- Consistent spacing: `px-6 py-4` for table cells, `px-6 py-3` for headers
- Color coding:
  - Active: `bg-green-500/10 text-green-500`
  - Inactive: `bg-gray-500/10 text-gray-500`
  - Category badges: `bg-primary/10 text-primary`
  - Relation badges: `bg-blue-500/10 text-blue-500`

### Routing

All routes server-side rendered (dynamic):
- `/ontology` → redirects to `/ontology/nodes`
- `/ontology/nodes` → Nodes list
- `/ontology/edges` → Edges list
- `/ontology/activity` → Activity viewer
- `/ontology/compliance` → Compliance tracking

## Benefits of New Structure

1. **Simplicity** - Clear, focused pages instead of complex designer
2. **Performance** - Direct DynamoDB scans instead of complex graph loading
3. **Maintainability** - Small, focused components instead of large designer
4. **Discoverability** - Tab navigation makes all features visible
5. **Extensibility** - Easy to add new tabs (Users, Organizations, Markings)
6. **Alignment** - Matches security architecture (ontology-integrated, not standalone)

## Integration with Security

This new ontology UI is the foundation for security management:

- **Users** will be managed at `/ontology/users` (ontology object type `core.user`)
- **Organizations** at `/ontology/organizations` (ontology object type `core.organization`)
- **Markings** at `/ontology/markings` (ontology object type `core.marking`)
- **Activity** at `/ontology/activity` (CloudTrail events)
- **Compliance** at `/ontology/compliance` (NIST 800-53 Rev 5)

All aligned with the AWS-native security approach where:
- AWS IAM enforces security (not application code)
- CloudTrail provides audit logging (no custom logging)
- Security entities are ontology objects (not separate module)

## Summary

The new ontology UI is clean, simple, and ready for expansion. It provides a solid foundation for managing ontology nodes and edges, with clear paths to add user management, organizations, markings, activity viewing, and compliance tracking.

**Status:** ✅ Deployed to production at `/ontology`
