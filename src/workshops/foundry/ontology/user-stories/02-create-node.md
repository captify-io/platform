# User Story: Create Ontology Node

**Feature**: Ontology Viewer
**Priority**: P0 (Critical)
**Story Points**: 8

## User Story

**As a** data architect
**I want to** create new ontology nodes through a visual interface
**So that I can** define new entity types without writing code

## Acceptance Criteria

### AC1: Create Button
**Given** I'm viewing the Objects tab
**When** I click the "Create Node" button
**Then** a dialog opens with a form to create a new node

### AC2: Basic Information Form
**Given** the create dialog is open
**When** I fill in the form
**Then** I can specify:
- **Name** (required, text input)
- **Type** (required, kebab-case slug, auto-generated from name)
- **Category** (required, dropdown: entity, concept, process, workflow, interface, value-type, link-type)
- **Domain** (required, text input with autocomplete from existing domains)
- **App** (required, dropdown: core, pmbook, aihub, mi, etc.)
- **Description** (optional, textarea)
- **Icon** (optional, icon picker)
- **Color** (optional, color picker)
- **Active** (toggle, defaults to true)

### AC3: Table Mapping
**Given** I'm filling in the create form
**When** I reach the "Data Source" section
**Then** I can:
- Specify table name (auto-generated as `{app}-{type}`)
- Override table name if needed
- Choose to create table immediately or later

### AC4: Schema Definition
**Given** I'm filling in the create form
**When** I reach the "Schema" section
**Then** I can:
- Add properties one by one
- For each property specify:
  - Name (required)
  - Type (dropdown: string, number, boolean, object, array, date, enum, timeSeries, attachment, geopoint, geoshape, struct, valueType)
  - Description
  - Required (checkbox)
  - Default value
  - Searchable (checkbox - auto-creates GSI)
  - Primary key (checkbox)
  - Enum values (if type is enum)
  - Advanced options (min, max, pattern, format, etc.)

### AC5: Interface Implementation
**Given** I'm filling in the create form
**When** I reach the "Interfaces" section
**Then** I can:
- Select multiple interfaces this type implements
- See which properties will be inherited from each interface
- See conflicts if property names overlap
- Resolve conflicts by choosing which interface takes precedence

### AC6: Primary Key Configuration
**Given** I'm defining the schema
**When** I mark a property as "Primary Key"
**Then**:
- The property is automatically marked as required
- The property is automatically marked as searchable
- A GSI will be auto-created for this property
- I see a warning if another property is already the primary key

### AC7: Validation
**Given** I've filled in the form
**When** I click "Create"
**Then** the system validates:
- Name is unique within the app
- Type is valid kebab-case
- At least one property is defined (if not an interface)
- Primary key is a valid field type (string, number, or composite)
- Required fields have no default value conflicts
- Schema is valid JSON Schema

### AC8: Table Creation
**Given** validation passes
**When** the node is created
**Then**:
- Node is saved to `captify-core-ontology-node`
- If "Create table" was selected, DynamoDB table is created
- GSIs are created for searchable properties
- GSI is created for primary key (if defined)
- Success notification shown
- Dialog closes
- Objects list updates to show new node

### AC9: Error Handling
**Given** creation fails
**When** an error occurs
**Then**:
- Clear error message shown
- Form stays open with data intact
- User can fix errors and retry
- Specific field errors highlighted

## Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ Create Ontology Node                               [✕ Close]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─ Basic Information ────────────────────────────────────┐  │
│ │                                                          │  │
│ │ Name*        [________________________]                 │  │
│ │ Type*        [contract-modification___] (auto-generated)│  │
│ │ Category*    [Entity ▼]                                 │  │
│ │ Domain*      [Contract ▼] (autocomplete)                │  │
│ │ App*         [pmbook ▼]                                 │  │
│ │ Description  [____________________________________]      │  │
│ │              [____________________________________]      │  │
│ │                                                          │  │
│ │ Icon         [📄 Choose icon...]  Color [#3b82f6 ▼]   │  │
│ │                                                          │  │
│ │ Active       [✓]                                        │  │
│ │                                                          │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌─ Data Source ──────────────────────────────────────────┐  │
│ │                                                          │  │
│ │ Table Name   [pmbook-contract-modification]             │  │
│ │              (auto-generated, editable)                  │  │
│ │                                                          │  │
│ │ [✓] Create DynamoDB table on save                       │  │
│ │                                                          │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌─ Schema ───────────────────────────────────────────────┐  │
│ │                                                          │  │
│ │ Properties:                           [+ Add Property]  │  │
│ │                                                          │  │
│ │ ┌────────────────────────────────────────────────────┐ │  │
│ │ │ modificationNumber                          [✕]    │ │  │
│ │ │ Type: string  Required: ✓  PK: ✓  Searchable: ✓  │ │  │
│ │ └────────────────────────────────────────────────────┘ │  │
│ │                                                          │  │
│ │ ┌────────────────────────────────────────────────────┐ │  │
│ │ │ status                                      [✕]    │ │  │
│ │ │ Type: enum (draft, active, cancelled)              │ │  │
│ │ │ Required: ✓  Searchable: ✓                        │ │  │
│ │ └────────────────────────────────────────────────────┘ │  │
│ │                                                          │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌─ Interfaces ───────────────────────────────────────────┐  │
│ │                                                          │  │
│ │ Implements:  [Select interfaces...              ▼]     │  │
│ │                                                          │  │
│ │ Selected:                                                │  │
│ │ • Timestamped (inherits: createdAt, updatedAt)          │  │
│ │ • Assignable (inherits: ownerId, assignedTo)            │  │
│ │                                                          │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                               │
│                                     [Cancel] [Create Node]   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Form Validation Rules

| Field | Validation | Error Message |
|-------|------------|---------------|
| Name | Required, 3-50 chars | "Name is required and must be 3-50 characters" |
| Type | Required, kebab-case, unique | "Type must be kebab-case and unique" |
| Category | Required | "Category is required" |
| Domain | Required | "Domain is required" |
| App | Required | "App is required" |
| Schema | At least 1 property | "At least one property is required" |
| Primary Key | Valid type (string/number) | "Primary key must be string or number type" |

## Technical Notes

### Components
```
components/ontology/dialogs/
├── node-create-dialog.tsx      - Main dialog
├── node-basic-form.tsx          - Basic information form
├── node-schema-editor.tsx       - Schema editor
├── property-form.tsx            - Individual property form
├── interface-selector.tsx       - Interface selection
└── table-config.tsx             - Table configuration
```

### API Calls
```typescript
// Create node
await ontology.node.create({
  id: generateUUID(),
  name: formData.name,
  type: formData.type,
  category: formData.category,
  domain: formData.domain,
  app: formData.app,
  description: formData.description,
  icon: formData.icon,
  color: formData.color,
  active: formData.active,
  properties: {
    dataSource: formData.tableName,
    schema: formData.schema,
    primaryKey: formData.primaryKey,
    indexes: generateIndexes(formData.schema)
  },
  implements: formData.interfaces,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}, credentials);

// Create table (if selected)
if (formData.createTable) {
  await createTable({
    tableName: formData.tableName,
    schema: formData.schema,
    primaryKey: formData.primaryKey,
    indexes: generateIndexes(formData.schema)
  }, credentials);
}
```

### Auto-Generated Values
- `id`: `crypto.randomUUID()`
- `type`: Kebab-case from name (e.g., "Contract Modification" → "contract-modification")
- `tableName`: `{app}-{type}` (e.g., "pmbook-contract-modification")
- `slug`: Kebab-case from name
- `createdAt`, `updatedAt`: Current timestamp
- `createdBy`, `updatedBy`: Current user ID from session

### Schema Generation
```typescript
function generateIndexes(schema: Schema): IndexDefinition[] {
  const indexes = [];

  // Primary key index
  if (schema.primaryKey) {
    indexes.push({
      indexName: `${schema.primaryKey}-index`,
      hashKey: schema.primaryKey,
      type: 'GSI'
    });
  }

  // Searchable property indexes
  for (const [name, prop] of Object.entries(schema.properties)) {
    if (prop.searchable) {
      indexes.push({
        indexName: `${name}-index`,
        hashKey: name,
        type: 'GSI'
      });
    }
  }

  return indexes;
}
```

## Dependencies

- `core/src/services/ontology/node.ts` - Node creation
- `core/src/services/ontology/interface.ts` - Interface queries
- `core/src/services/ontology/primary-key.ts` - PK validation
- `core/src/services/ontology/searchable.ts` - Index creation
- `core/src/services/aws/dynamodb.ts` - Table creation
- Radix UI Dialog
- React Hook Form for form state
- Zod for validation

## Definition of Done

- [ ] Create dialog opens with form
- [ ] All form fields working with validation
- [ ] Schema editor allows adding/removing properties
- [ ] Interface selection shows inherited properties
- [ ] Primary key checkbox marks property as required and searchable
- [ ] Searchable checkbox shown for all properties
- [ ] Table name auto-generated and editable
- [ ] Create button validates and saves node
- [ ] Table creation option works
- [ ] GSIs auto-created for searchable properties
- [ ] Success notification shown
- [ ] Objects list refreshes with new node
- [ ] Error handling for all failure cases
- [ ] Form state preserved on error
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests for node creation
- [ ] Documentation updated

## Related Stories

- [01-browse-ontology.md](./01-browse-ontology.md) - Browse ontology
- [03-edit-properties.md](./03-edit-properties.md) - Edit node properties
- [06-create-interface.md](./06-create-interface.md) - Create interface node
- [07-manage-indexes.md](./07-manage-indexes.md) - Manage indexes

## Notes

- Form should be multi-step for better UX (wizard)
- Consider template/presets for common node types
- Auto-save draft to localStorage to prevent data loss
- Provide "Create from existing" to copy from another node
- Show preview of generated JSON Schema
- Allow importing schema from JSON file
