# Feature 2: Widget Registry & Management UI

**Status**: ❌ Not Started
**Priority**: P0 (Critical)
**Story Points**: 21
**Timeline**: Week 2-4
**Depends On**: Feature 1 (Widget Refactor)

## Overview

Create a centralized widget registry in the ontology system and build a platform UI for discovering, creating, and managing widget definitions. This enables dynamic widget discovery by agents, reusable widget configurations across applications, and visual widget building without code.

## Requirements

### Functional Requirements

1. **Widget Definition Storage**:
   - Store widget definitions in `captify-core-ontology-node` with `type='widget'`
   - Support configuration for object types, view config, events, actions
   - Enable querying by object type, category, usage

2. **Widget Service API**:
   - CRUD operations for widget definitions
   - Query widgets by object type
   - Search and filter capabilities
   - Widget recommendation system

3. **Platform Management UI**:
   - Widget catalog (browse all widgets)
   - Widget creation wizard
   - Widget configuration editor
   - Live preview with sample data

4. **Integration with Ontology Viewer**:
   - Show widgets for specific object types
   - Quick create widget from node detail
   - Visual mapping of widget relationships

### Non-Functional Requirements

1. **Performance**: Widget discovery < 200ms
2. **Usability**: Create widget in < 5 minutes
3. **Scalability**: Support 100+ widget definitions

## Architecture

See [readme.md](../readme.md#widget-definition-structure) for complete WidgetDefinition schema.

### Widget Service API

```typescript
// core/src/services/ontology/widget.ts
export const widget = {
  // CRUD
  create(definition: WidgetDefinition, credentials): Promise<OntologyNode>,
  update(id: string, updates: Partial<WidgetDefinition>, credentials): Promise<void>,
  delete(id: string, credentials): Promise<void>,

  // Query
  getById(id: string, credentials): Promise<WidgetDefinition>,
  getByObjectType(objectType: string, credentials): Promise<WidgetDefinition[]>,
  getByCategory(category: 'display' | 'capture' | 'navigation', credentials): Promise<WidgetDefinition[]>,
  search(query: string, credentials): Promise<WidgetDefinition[]>,

  // Recommendation
  recommend(params: RecommendationParams, credentials): Promise<WidgetDefinition[]>
};
```

### Platform UI Structure

```
platform/src/app/widgets/
├── page.tsx                  # Widget catalog
├── new/page.tsx              # Create widget
├── [id]/page.tsx             # Widget details
├── [id]/edit/page.tsx        # Edit widget
└── components/
    ├── widget-card.tsx       # Catalog card
    ├── widget-form.tsx       # Create/edit form
    ├── widget-preview.tsx    # Live preview
    └── config-editors/
        ├── table-config.tsx  # Table widget config
        ├── chart-config.tsx  # Chart widget config
        └── ...
```

## Implementation Plan

See [plan/implementation-roadmap.md](../plan/implementation-roadmap.md#phase-2-widget-registry--management-ui-week-2-4-21-story-points) for detailed tasks.

### Week 2-3: Widget Service API (8 story points)

1. Define WidgetDefinition schema
2. Create widget service in `core/src/services/ontology/widget.ts`
3. Add to ontology namespace exports
4. Enhance Widget component to load from registry
5. Create `useWidgetDefinition` hook
6. Seed initial widget definitions

### Week 3-4: Management UI (13 story points)

1. Create widget pages structure
2. Build widget catalog (browse, search, filter)
3. Build widget detail page
4. Build widget creation/edit forms
5. Build live preview component
6. Build config editors for each widget type
7. Integrate with ontology viewer

## Success Metrics

- ✅ 10+ widget definitions in registry
- ✅ Widget catalog UI functional
- ✅ Users can create widget in < 5 minutes
- ✅ Widget discovery < 200ms
- ✅ Agents can query widgets by object type

## Related Features

- Feature 1: Widget Refactor (prerequisite)
- Feature 3: Widget Templates (adds more widget types to registry)
- Feature 4: Agent Integration (uses registry for widget discovery)

---

**Feature Version**: 1.0
**Created**: 2025-11-02
