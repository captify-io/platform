# 4. Property Editor - Schema & Index Management

**Priority:** MEDIUM
**Estimated Time:** 5-6 hours
**Dependencies:** 2-flow-migration.md (recommended)
**Status:** Not Started

## Overview

Build a comprehensive property editor that allows users to define data schemas, manage DynamoDB indexes, configure relationships, and edit node properties visually. This replaces the basic form in `NodeConfigPanel.tsx`.

## Current State

**What Exists:**
- Basic form with text inputs for name, label, description
- Manual JSON editing for properties
- No schema validation
- No index configuration UI
- No relationship type templates
- No property type system

**What's Missing:**
- Visual schema editor (JSON Schema builder)
- DynamoDB index management UI
- Property type selector (string, number, boolean, etc.)
- Required field configuration
- Default value editor
- Relationship cardinality (one-to-one, one-to-many, etc.)
- Property validation rules

## Design Mockup

```
┌─────────────────────────────────────────────────────────┐
│ Properties Panel                                    [×] │
├─────────────────────────────────────────────────────────┤
│ ┌─ BASIC INFO ───────────────────────────────────────┐ │
│ │ Name: [Contract_________________]                  │ │
│ │ Label: [Contract________________]                  │ │
│ │ Type: [contract_________________]                  │ │
│ │ Domain: [Contract ▾]                               │ │
│ │ Category: [entity ▾]                               │ │
│ │ App: [pmbook ▾]                                    │ │
│ │ Icon: [📄 Select Icon...]                          │ │
│ │ Color: [🎨 #3b82f6___]                             │ │
│ │ Description:                                       │ │
│ │ [A legally binding agreement between parties...]   │ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─ DATA SCHEMA ──────────────────────────────────────┐ │
│ │ DataSource: [pmbook-contract__________] [Generate] │ │
│ │                                                    │ │
│ │ Properties:                          [+ Add Field] │ │
│ │ ┌────────────────────────────────────────────────┐ │ │
│ │ │ ☰ title        │ string │ required │ [×]      │ │ │
│ │ ├────────────────────────────────────────────────┤ │ │
│ │ │ ☰ value        │ number │          │ [×]      │ │ │
│ │ ├────────────────────────────────────────────────┤ │ │
│ │ │ ☰ startDate    │ date   │ required │ [×]      │ │ │
│ │ ├────────────────────────────────────────────────┤ │ │
│ │ │ ☰ status       │ enum   │ required │ [×]      │ │ │
│ │ │   Options: [active, completed, cancelled]      │ │ │
│ │ └────────────────────────────────────────────────┘ │ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─ INDEXES ──────────────────────────────────────────┐ │
│ │ DynamoDB Indexes:                  [+ Add Index]   │ │
│ │ ┌────────────────────────────────────────────────┐ │ │
│ │ │ status-startDate-index (GSI)                   │ │ │
│ │ │ HASH: status  RANGE: startDate                 │ │ │
│ │ │ Projection: ALL                       [Edit][×]│ │ │
│ │ ├────────────────────────────────────────────────┤ │ │
│ │ │ tenantId-createdAt-index (GSI)                 │ │ │
│ │ │ HASH: tenantId  RANGE: createdAt               │ │ │
│ │ │ Projection: ALL                       [Edit][×]│ │ │
│ │ └────────────────────────────────────────────────┘ │ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─ RELATIONSHIPS ────────────────────────────────────┐ │
│ │ Allowed Connections:               [+ Add Rule]    │ │
│ │ • Can connect FROM: User, Team                     │ │
│ │ • Can connect TO: Task, Deliverable                │ │
│ │ • Relationship types: owns, manages, references    │ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─ PERMISSIONS ──────────────────────────────────────┐ │
│ │ Visibility: [Public ▾]                             │ │
│ │ Edit Roles: [Admin, Editor]          [+ Add Role]  │ │
│ │ View Roles: [All]                    [+ Add Role]  │ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│ [Cancel]                                      [Save]   │
└─────────────────────────────────────────────────────────┘
```

## Component Structure

```
components/
├── property-panel.tsx               # Main panel (replaces NodeConfigPanel)
├── schema-editor/
│   ├── index.tsx                    # Schema editor container
│   ├── field-list.tsx               # List of schema fields
│   ├── field-editor.tsx             # Edit individual field
│   ├── type-selector.tsx            # Property type dropdown
│   └── enum-editor.tsx              # Enum value editor
├── index-manager/
│   ├── index.tsx                    # Index manager container
│   ├── index-list.tsx               # List of indexes
│   ├── index-dialog.tsx             # Create/edit index
│   └── key-selector.tsx             # Select hash/range keys
├── relationship-editor/
│   ├── index.tsx                    # Relationship config
│   ├── connection-rules.tsx         # Allowed connections
│   └── cardinality-selector.tsx    # One-to-one, one-to-many, etc.
└── icon-picker.tsx                  # Icon selection dialog
```

## Implementation Details

### Property Panel

**File:** `components/property-panel.tsx`

```typescript
"use client";

import { useState, useEffect } from 'react';
import { useFlow } from '@captify-io/core/components/flow';
import { Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button, Card, CardHeader, CardTitle, CardContent } from '@captify-io/core/components/ui';
import { SchemaEditor } from './schema-editor';
import { IndexManager } from './index-manager';
import { RelationshipEditor } from './relationship-editor';
import { IconPicker } from './icon-picker';
import { apiClient } from '@captify-io/core/lib/api';
import { toast } from 'sonner';

export function PropertyPanel() {
  const { selectedNode, updateNode } = useFlow();
  const [node, setNode] = useState(selectedNode?.data);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      setNode(selectedNode.data);
    }
  }, [selectedNode]);

  if (!selectedNode || !node) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Select a node to edit properties
      </div>
    );
  }

  const handleSave = async () => {
    setLoading(true);
    try {
      await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'put',
        table: 'core-ontology-node',
        data: {
          Item: {
            ...selectedNode.data,
            ...node,
            updatedAt: new Date().toISOString()
          }
        }
      });

      updateNode(selectedNode.id, { data: node });
      toast.success('Node updated successfully');
    } catch (error) {
      toast.error('Failed to update node');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background border-l">
      <div className="h-14 border-b px-6 flex items-center justify-between">
        <h3 className="font-semibold">Properties</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <Input
                value={node.name || ''}
                onChange={(e) => setNode({ ...node, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Label</label>
              <Input
                value={node.label || ''}
                onChange={(e) => setNode({ ...node, label: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Domain</label>
                <Select
                  value={node.domain || ''}
                  onValueChange={(value) => setNode({ ...node, domain: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Workflow">Workflow</SelectItem>
                    <SelectItem value="Tool">Tool</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Category</label>
                <Select
                  value={node.category || ''}
                  onValueChange={(value) => setNode({ ...node, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entity">Entity</SelectItem>
                    <SelectItem value="concept">Concept</SelectItem>
                    <SelectItem value="process">Process</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Icon</label>
              <IconPicker
                value={node.icon || ''}
                onChange={(icon) => setNode({ ...node, icon })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea
                value={node.description || ''}
                onChange={(e) => setNode({ ...node, description: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Schema */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Schema</CardTitle>
          </CardHeader>
          <CardContent>
            <SchemaEditor
              schema={node.properties?.schema}
              onChange={(schema) => setNode({
                ...node,
                properties: { ...node.properties, schema }
              })}
            />
          </CardContent>
        </Card>

        {/* Indexes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Indexes</CardTitle>
          </CardHeader>
          <CardContent>
            <IndexManager
              indexes={node.properties?.indexes}
              schema={node.properties?.schema}
              onChange={(indexes) => setNode({
                ...node,
                properties: { ...node.properties, indexes }
              })}
            />
          </CardContent>
        </Card>

        {/* Relationships */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Relationships</CardTitle>
          </CardHeader>
          <CardContent>
            <RelationshipEditor
              allowedSources={node.allowedSources || []}
              allowedTargets={node.allowedTargets || []}
              onChange={(sources, targets) => setNode({
                ...node,
                allowedSources: sources,
                allowedTargets: targets
              })}
            />
          </CardContent>
        </Card>
      </div>

      <div className="h-16 border-t px-6 flex items-center justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
```

### Schema Editor Component

**File:** `components/schema-editor/index.tsx`

```typescript
"use client";

import { useState } from 'react';
import { Button } from '@captify-io/core/components/ui';
import { Plus } from 'lucide-react';
import { FieldList } from './field-list';
import { FieldDialog } from './field-dialog';

interface SchemaEditorProps {
  schema?: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  onChange: (schema: any) => void;
}

export function SchemaEditor({ schema, onChange }: SchemaEditorProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  const properties = schema?.properties || {};
  const required = schema?.required || [];

  const addField = (name: string, type: string, isRequired: boolean) => {
    const newProperties = {
      ...properties,
      [name]: { type }
    };

    const newRequired = isRequired
      ? [...required, name]
      : required;

    onChange({
      type: 'object',
      properties: newProperties,
      required: newRequired
    });
  };

  const removeField = (name: string) => {
    const { [name]: removed, ...rest } = properties;
    onChange({
      type: 'object',
      properties: rest,
      required: required.filter(r => r !== name)
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {Object.keys(properties).length} fields defined
        </div>
        <Button size="sm" onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Field
        </Button>
      </div>

      <FieldList
        properties={properties}
        required={required}
        onEdit={setEditingField}
        onRemove={removeField}
      />

      {showDialog && (
        <FieldDialog
          onClose={() => setShowDialog(false)}
          onSave={addField}
        />
      )}
    </div>
  );
}
```

## Implementation Checklist

### Schema Editor

- [ ] Create `schema-editor/index.tsx`
  - [ ] Field list with drag-to-reorder
  - [ ] Add field button and dialog
  - [ ] Edit field inline or in dialog
  - [ ] Remove field with confirmation

- [ ] Create `schema-editor/field-editor.tsx`
  - [ ] Field name input
  - [ ] Type selector (string, number, boolean, date, enum, object, array)
  - [ ] Required checkbox
  - [ ] Default value editor (type-specific)
  - [ ] Validation rules (min, max, pattern, etc.)

- [ ] Create `schema-editor/type-selector.tsx`
  - [ ] Dropdown with all JSON Schema types
  - [ ] Type-specific options (e.g., enum values, array item type)
  - [ ] Format selector (date, email, uri, etc.)

### Index Manager

- [ ] Create `index-manager/index.tsx`
  - [ ] List existing indexes
  - [ ] Add index button
  - [ ] Edit index
  - [ ] Delete index (with warning about AWS operation)

- [ ] Create `index-manager/index-dialog.tsx`
  - [ ] Index name input
  - [ ] Type selector (GSI or LSI)
  - [ ] Hash key selector (from schema fields)
  - [ ] Range key selector (optional)
  - [ ] Projection type (ALL, KEYS_ONLY, INCLUDE)
  - [ ] Capacity units (RCU/WCU)

- [ ] Create `index-manager/key-selector.tsx`
  - [ ] Dropdown showing available fields from schema
  - [ ] Filter by compatible types
  - [ ] Show field type next to name

### Relationship Editor

- [ ] Create `relationship-editor/index.tsx`
  - [ ] Allowed source types list
  - [ ] Allowed target types list
  - [ ] Add connection rule dialog
  - [ ] Remove rule button

- [ ] Create `relationship-editor/connection-rules.tsx`
  - [ ] List of allowed source→target pairs
  - [ ] Verb/relationship type for each pair
  - [ ] Cardinality selector (1:1, 1:N, N:M)

### Visual Enhancements

- [ ] Create `icon-picker.tsx`
  - [ ] Grid of Lucide icons
  - [ ] Search icons by name
  - [ ] Recently used icons
  - [ ] Custom icon upload (optional)

- [ ] Create `color-picker.tsx`
  - [ ] Preset colors
  - [ ] Custom color input
  - [ ] Color preview

### Integration

- [ ] Update Flow sidebar to use new PropertyPanel
- [ ] Test save/load with complex schemas
- [ ] Validate schema before saving
- [ ] Show validation errors to user

### Testing

- [ ] Test adding fields of all types
- [ ] Test required field validation
- [ ] Test enum field with multiple values
- [ ] Test nested object schemas
- [ ] Test array schemas
- [ ] Test index creation UI (don't actually create in AWS)
- [ ] Test relationship rules
- [ ] Test icon picker
- [ ] Test color picker

### Documentation

- [ ] Document schema structure
- [ ] Document index configuration
- [ ] Add examples for common patterns
- [ ] Document relationship types

## Success Criteria

- [ ] Can create schema visually without JSON editing
- [ ] Can define all JSON Schema types
- [ ] Can configure indexes from UI
- [ ] Can set relationship rules
- [ ] Changes save to DynamoDB correctly
- [ ] Schema validates before saving
- [ ] UI is intuitive and responsive

## Notes for Future Agents

### JSON Schema Support

The schema editor creates JSON Schema-compliant definitions. This is important because:
1. Zod can generate schemas from JSON Schema
2. Form builders can auto-generate UIs
3. API documentation can be auto-generated
4. Validation is standardized

Example schema structure:
```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "value": {
      "type": "number",
      "minimum": 0
    },
    "status": {
      "type": "string",
      "enum": ["active", "completed", "cancelled"]
    }
  },
  "required": ["title", "status"]
}
```

### Index Management Warnings

⚠️ **Creating/deleting indexes in DynamoDB takes time (5-10 minutes) and costs money.**

The UI should:
1. Show a warning before creating indexes
2. Explain that this is an AWS operation, not just metadata
3. Provide estimated cost impact
4. Allow "draft" mode where indexes are saved but not created
5. Batch index operations to minimize API calls

### Why Visual Schema Editor?

Manual JSON editing is error-prone and requires technical knowledge. A visual editor:
- Prevents syntax errors
- Enforces valid schema structure
- Provides type-specific options
- Shows validation in real-time
- Lowers barrier to entry for non-technical users

## Next Steps

After completing property editor, proceed to:
- **5-bulk-operations.md** - Multi-select and bulk edit using the new property editor
