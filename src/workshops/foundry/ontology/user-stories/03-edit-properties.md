# User Story: Edit Node Properties

**Feature**: Ontology Viewer
**Priority**: P0 (Critical)
**Story Points**: 5

## User Story

**As a** data architect
**I want to** edit ontology node properties visually
**So that I can** update schemas and configurations without modifying code

## Acceptance Criteria

### AC1: Select Node for Editing
**Given** I'm viewing the Objects list
**When** I click on a node
**Then** the node details appear in the content area with an "Edit" button

### AC2: Open Edit Dialog
**Given** I'm viewing node details
**When** I click the "Edit" button
**Then** an edit dialog opens pre-filled with current values

### AC3: Edit Basic Properties
**Given** the edit dialog is open
**When** I modify fields
**Then** I can edit:
- Name
- Description
- Icon
- Color
- Active status
- Domain (with autocomplete)

**And** I cannot edit:
- Type (immutable after creation)
- App (immutable after creation)
- ID (immutable)

### AC4: Add Properties to Schema
**Given** I'm editing a node
**When** I click "Add Property" in the schema section
**Then**:
- A new property form appears
- I can specify all property attributes
- The property is added to the schema on save

### AC5: Edit Existing Properties
**Given** I'm editing a node with existing properties
**When** I click on a property in the schema editor
**Then**:
- The property form expands
- I can modify all attributes
- Changes are saved to the schema

**And** if I change:
- **Type**: Warning shown if data exists in table
- **Required**: Warning shown if existing records have null values
- **Primary Key**: Error shown (cannot change after creation)
- **Searchable**: GSI will be created/removed

### AC6: Remove Properties
**Given** I'm editing a node with properties
**When** I click the delete icon on a property
**Then**:
- Confirmation dialog appears
- Warning shown if property is referenced in edges or actions
- If confirmed, property is removed from schema

**And** I cannot delete:
- Properties marked as primary key (must remove PK flag first)
- Properties required by implemented interfaces

### AC7: Add/Remove Interfaces
**Given** I'm editing a node
**When** I modify the interfaces list
**Then**:
- I can add new interfaces
- I can remove interfaces
- I see which properties will be inherited
- Conflicts are highlighted and must be resolved

### AC8: Validation
**Given** I've modified the node
**When** I click "Save"
**Then** the system validates:
- Required fields are filled
- Schema is valid JSON Schema
- No duplicate property names
- Interface implementations are valid
- No breaking changes to existing data

### AC9: Save Changes
**Given** validation passes
**When** the node is saved
**Then**:
- Node updated in `captify-core-ontology-node`
- GSIs created/updated for searchable properties
- Success notification shown
- Dialog closes
- Node details refresh with new values

### AC10: Audit Trail
**Given** I've saved changes
**When** I view the node history
**Then** I see:
- Who made the change
- When the change was made
- What was changed (diff view)
- Previous values

## Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ Edit Node: Contract                                [✕ Close]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─ Basic Information ────────────────────────────────────┐  │
│ │ Name*        [Contract__________________]               │  │
│ │ Type         contract (immutable)                       │  │
│ │ App          pmbook (immutable)                         │  │
│ │ Category*    [Entity ▼]                                 │  │
│ │ Domain*      [Contract ▼]                               │  │
│ │ Description  [Government contracts with CLINs...]       │  │
│ │ Icon         [📄 ▼]  Color [#3b82f6 ▼]                │  │
│ │ Active       [✓]                                        │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌─ Schema ───────────────────────────────────────────────┐  │
│ │ Properties:                           [+ Add Property]  │  │
│ │                                                          │  │
│ │ ┌────────────────────────────────────────────────────┐ │  │
│ │ │ contractNumber                          [✕] [⌄]   │ │  │
│ │ │ Type: string  Required: ✓  PK: ✓  Searchable: ✓  │ │  │
│ │ │ ⚠️ Primary key cannot be changed                   │ │  │
│ │ └────────────────────────────────────────────────────┘ │  │
│ │                                                          │  │
│ │ ┌────────────────────────────────────────────────────┐ │  │
│ │ │ ▼ status (expanded)                        [✕] [⌃]│ │  │
│ │ │                                                    │ │  │
│ │ │ Name         [status_______]                      │ │  │
│ │ │ Type         [enum ▼]                             │ │  │
│ │ │ Enum Values  draft, active, completed, cancelled  │ │  │
│ │ │              [+ Add value]                        │ │  │
│ │ │ Description  [Contract status_________________]   │ │  │
│ │ │ Required     [✓]                                  │ │  │
│ │ │ Searchable   [✓]  ⓘ Will create GSI              │ │  │
│ │ │ Default      [draft_]                             │ │  │
│ │ │                                                    │ │  │
│ │ │                                    [Cancel] [Save]│ │  │
│ │ └────────────────────────────────────────────────────┘ │  │
│ │                                                          │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌─ Interfaces ───────────────────────────────────────────┐  │
│ │ Implements:                                              │  │
│ │ • Timestamped [✕]                                        │  │
│ │ • Assignable [✕]                                         │  │
│ │                                                          │  │
│ │ [+ Add interface]                                        │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌─ Change History ───────────────────────────────────────┐  │
│ │ Last modified: 2025-11-01 by john.smith@captify.io      │  │
│ │ Created: 2025-10-15 by jane.doe@captify.io              │  │
│ │                                        [View Full History]│  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                               │
│                                     [Cancel] [Save Changes]  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Breaking Change Warnings

| Change | Warning | Severity |
|--------|---------|----------|
| Change property type | "Existing data may become invalid" | High |
| Add required field | "Existing records will fail validation" | High |
| Remove property | "Data will be lost" | Critical |
| Change primary key | "Not allowed - create new node" | Error |
| Remove interface | "Inherited properties will be lost" | High |

## Technical Notes

### Components
```
components/ontology/dialogs/
├── node-edit-dialog.tsx         - Main dialog
├── property-editor.tsx          - Inline property editor
├── breaking-change-warning.tsx  - Warning for breaking changes
└── node-history-viewer.tsx      - Change history
```

### API Calls
```typescript
// Update node
await ontology.node.update(nodeId, {
  name: formData.name,
  description: formData.description,
  icon: formData.icon,
  color: formData.color,
  active: formData.active,
  domain: formData.domain,
  properties: {
    ...existingProperties,
    schema: formData.schema
  },
  implements: formData.interfaces,
  updatedAt: new Date().toISOString(),
  updatedBy: session.user.id
}, credentials);

// Update indexes if searchable properties changed
const searchableChanges = detectSearchableChanges(
  existingNode.properties.schema,
  formData.schema
);

for (const change of searchableChanges) {
  if (change.added) {
    await ontology.searchable.createIndex(nodeId, change.property, credentials);
  } else if (change.removed) {
    await ontology.searchable.removeIndex(nodeId, change.property, credentials);
  }
}
```

### Change Detection
```typescript
function detectSearchableChanges(oldSchema, newSchema) {
  const changes = [];

  // Check for added searchable properties
  for (const [name, prop] of Object.entries(newSchema.properties)) {
    const oldProp = oldSchema.properties[name];
    if (prop.searchable && (!oldProp || !oldProp.searchable)) {
      changes.push({ type: 'added', property: name });
    }
  }

  // Check for removed searchable properties
  for (const [name, prop] of Object.entries(oldSchema.properties)) {
    const newProp = newSchema.properties[name];
    if (prop.searchable && (!newProp || !newProp.searchable)) {
      changes.push({ type: 'removed', property: name });
    }
  }

  return changes;
}
```

## Dependencies

- `core/src/services/ontology/node.ts` - Node update
- `core/src/services/ontology/searchable.ts` - Index management
- Feature #9 (Edit History) - For change tracking
- Radix UI Dialog
- React Hook Form
- Zod validation

## Definition of Done

- [ ] Edit dialog opens with pre-filled values
- [ ] Can edit basic properties
- [ ] Can add/edit/remove properties in schema
- [ ] Can add/remove interfaces
- [ ] Breaking change warnings shown
- [ ] Validation prevents invalid changes
- [ ] Save button updates node
- [ ] GSIs created/removed for searchable changes
- [ ] Success notification shown
- [ ] Node details refresh
- [ ] Change history tracked (Feature #9)
- [ ] Error handling for all cases
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] Documentation updated

## Related Stories

- [01-browse-ontology.md](./01-browse-ontology.md) - Browse ontology
- [02-create-node.md](./02-create-node.md) - Create node
- [07-manage-indexes.md](./07-manage-indexes.md) - Manage indexes
- Feature #9 - Edit History & Versioning

## Notes

- Warn before making breaking changes
- Provide "duplicate node" option for major changes
- Allow reverting to previous version (Feature #9)
- Consider schema migration wizard for type changes
- Real-time validation as user types
- Show count of affected records for breaking changes
