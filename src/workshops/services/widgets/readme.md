# Captify Widget System

## Vision

The Captify Widget System is a **comprehensive UI primitive library** that provides reusable, configurable display and interaction components for visualizing and manipulating data across the entire Captify platform. Widgets are first-class primitives that can be used by pages, workflows, agents, and any component that needs to present data to users.

**System Purpose**: Provide a unified, ontology-driven widget framework where every widget is discoverable, configurable, and reusable across all applications - from hand-coded pages to AI-generated agent responses.

**Key Innovation**: Widgets are **primitive UI components** living at `core/components/widgets`, not buried in agent-specific code. Any consumer (pages, agents, workflows) can discover and use appropriate widgets for their data through a centralized registry.

## Core Principles

### 1. Widgets Are UI Primitives, Not Agent Features

**Problem**: Widgets currently live at `core/components/agent/widgets/`, implying they're agent-specific.

**Solution**: Refactor widgets to `core/components/widgets/` as standalone UI primitives. Agents, pages, and workflows all consume widgets equally.

**Benefits**:
- Clear separation of concerns
- Widgets reusable across all contexts
- Easier to discover and maintain
- Better architectural clarity

### 2. Leverage Existing Components

**Problem**: Don't reinvent the wheel - we have robust UI components already.

**Solution**: Build widgets on top of existing primitives:
- **DataTable widget** uses `core/components/ui/data-table.tsx`
- **Chart widgets** use existing Recharts integration
- **Form widgets** use existing form components
- **Map widgets** use existing mapping libraries

**Benefits**:
- Faster development
- Consistent UX
- Less maintenance burden
- Proven components

### 3. Ontology-Driven Widget Registry

**Problem**: Widgets are hard-coded TypeScript enums - can't be discovered or configured dynamically.

**Solution**: Store widget definitions in ontology as first-class entities:
- Widget templates stored in `captify-core-ontology-node` with `type='widget'`
- Configurable for specific object types (contract, clin, etc.)
- Discoverable via API by agents and builders
- Support for events and actions

**Benefits**:
- Dynamic widget discovery
- User-configurable without code
- AI agents can find appropriate widgets
- Central registry of all visualizations

### 4. Configuration Over Code

**Problem**: Creating new visualizations requires coding new components.

**Solution**: Visual widget builder in platform:
- Select widget template (table, chart, card, etc.)
- Configure for object type
- Map data fields to widget properties
- Define events and actions
- Save as reusable widget definition

**Benefits**:
- Non-developers can create widgets
- Faster iteration
- Consistent patterns
- Less code to maintain

## Architecture Overview

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Widget Primitive Layer                      │
│              core/components/widgets/                       │
│  Base widgets: Table, Chart, Card, Map, Form, etc.         │
│  (Pure UI components, no business logic)                   │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ uses
                              │
┌─────────────────────────────────────────────────────────────┐
│                 Widget Registry Layer                       │
│         captify-core-ontology-node (type=widget)           │
│  Widget definitions: object types, config, events, actions │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ discover & configure
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼──────┐    ┌─────────▼────────┐    ┌──────▼──────┐
│   Pages      │    │     Agents       │    │  Workflows  │
│              │    │                  │    │             │
│ Use widgets  │    │ Return widget    │    │ Display     │
│ directly     │    │ configs in       │    │ data with   │
│              │    │ tool responses   │    │ widgets     │
└──────────────┘    └──────────────────┘    └─────────────┘
```

### Widget Definition Structure

```typescript
// Stored in ontology as node with type='widget'
interface WidgetDefinition extends OntologyNode {
  type: 'widget';
  category: 'display' | 'capture' | 'navigation';

  // Template type (what kind of widget)
  widgetType:
    | 'data-table' | 'pivot-table' | 'resource-list'
    | 'chart-pie' | 'chart-xy' | 'chart-vega' | 'chart-waterfall'
    | 'map' | 'gantt' | 'timeline'
    | 'card' | 'metric-card'
    | 'markdown' | 'media-preview' | 'pdf-viewer' | 'image-annotation'
    | 'stepper' | 'status-tracker'
    | 'form' | 'button-group' | 'tabs' | 'inline-action'
    | 'free-form-analysis' | 'edit-history' | 'action-log';

  // What object types this widget works with
  objectTypes: string[];  // e.g., ['contract', 'clin']

  // Widget-specific configuration
  properties: {
    // For table widgets
    columns?: ColumnConfig[];
    sortable?: boolean;
    filterable?: boolean;

    // For chart widgets
    chartType?: 'bar' | 'line' | 'pie' | 'scatter' | 'area';
    xAxis?: string;
    yAxis?: string;
    series?: SeriesConfig[];

    // For map widgets
    latitudeField?: string;
    longitudeField?: string;
    markerConfig?: MarkerConfig;

    // For card widgets
    layout?: 'compact' | 'expanded';
    fields?: FieldConfig[];

    // Generic config storage
    config?: Record<string, any>;
  };

  // Events that can be triggered
  events?: WidgetEvent[];

  // Actions available in widget
  actions?: WidgetAction[];
}

interface WidgetEvent {
  trigger: 'onClick' | 'onRowSelect' | 'onChange' | 'onSubmit' | 'onTabChange';
  targetProperty?: string;
  actionType: 'navigate' | 'action' | 'event';

  // Navigation
  url?: string;

  // Action (reference to ontology action)
  actionId?: string;
  actionParams?: Record<string, string>; // Template vars

  // Custom event
  eventName?: string;
  eventData?: Record<string, any>;
}

interface WidgetAction {
  id: string;              // Action ID from ontology
  label: string;
  placement: 'toolbar' | 'context-menu' | 'inline' | 'row-action';
  condition?: string;      // When to show
  icon?: string;
  variant?: 'default' | 'destructive' | 'outline';
}
```

### Widget Primitive API

```typescript
// All widgets live at core/components/widgets/
import { Widget } from '@captify-io/core/components/widgets';

// Use with widget definition ID
<Widget
  id="widget-contract-summary-table"
  data={contractData}
  onAction={handleAction}
  onEvent={handleEvent}
/>

// Or use directly with type (backward compatible)
<Widget
  type="data-table"
  config={{
    columns: [...],
    sortable: true
  }}
  data={rows}
  onRowClick={handleRowClick}
/>
```

## Key Features

### Phase 1: Widget Refactor (Week 1-2) - 8 story points

**Feature #1: Move Widgets to Primitives**

Refactor existing widgets from `core/components/agent/widgets/` to `core/components/widgets/`:

**Current widgets to refactor:**
- ✅ CardWidget → `core/components/widgets/card.tsx`
- ✅ TableWidget → `core/components/widgets/table.tsx` (use existing DataTable)
- ✅ MessageWidget → `core/components/widgets/message.tsx`
- ✅ ChartWidget → `core/components/widgets/chart.tsx`
- ✅ TextWidget → `core/components/widgets/text.tsx`
- ✅ SelectWidget → `core/components/widgets/select.tsx`
- ✅ DateWidget → `core/components/widgets/date.tsx`
- ✅ FileWidget → `core/components/widgets/file.tsx`
- ✅ FormWidget → `core/components/widgets/form.tsx`

**Implementation:**
1. Create new directory structure at `core/components/widgets/`
2. Refactor TableWidget to use existing `DataTable` component
3. Move all widget files to new location
4. Update all import paths across codebase
5. Update widget index exports
6. Ensure backward compatibility during transition

**Status**: ❌ Not Started

### Phase 2: Widget Registry (Week 2-3) - 13 story points

**Feature #2: Widget Definition Storage**

Store widget definitions in ontology for discovery and configuration:

**Implementation:**
1. Define `WidgetDefinition` schema
2. Store in `captify-core-ontology-node` with `type='widget'`
3. Create widget service API:
   ```typescript
   // core/src/services/ontology/widget.ts
   export const widget = {
     create(definition: WidgetDefinition, credentials): Promise<OntologyNode>
     update(id, updates, credentials): Promise<void>
     getById(id, credentials): Promise<WidgetDefinition>
     getByObjectType(objectType, credentials): Promise<WidgetDefinition[]>
     getByCategory(category, credentials): Promise<WidgetDefinition[]>
     search(query, credentials): Promise<WidgetDefinition[]>
   }
   ```
4. Enhance Widget component to load from registry by ID

**Status**: ❌ Not Started

**Feature #3: Widget Management UI**

Platform UI for browsing and managing widget definitions:

**Location**: `platform/src/app/widgets/`

**Pages:**
- `/widgets` - Browse widget catalog
- `/widgets/new` - Create new widget
- `/widgets/[id]` - View widget details
- `/widgets/[id]/edit` - Edit widget configuration

**Status**: ❌ Not Started

### Phase 3: Widget Templates (Week 4-6) - 21 story points

**Feature #4: Display Widget Templates**

Implement all display widget types as templates:

**Charts:**
- ✅ Chart: Pie/Donut (refactor existing)
- ✅ Chart: XY (bar, line, scatter) (refactor existing)
- ❌ Chart: Vega (Vega-Lite integration)
- ❌ Chart: Waterfall

**Spatial/Temporal:**
- ❌ Map (geospatial visualization)
- ❌ Gantt Chart (timeline with dependencies)
- ❌ Timeline (event timeline)

**Data Display:**
- ✅ Data Table (using existing DataTable)
- ❌ Pivot Table (dynamic grouping/aggregation)
- ❌ Resource List
- ❌ Free-form Analysis

**Content:**
- ✅ Markdown (refactor existing)
- ✅ Card (refactor existing)
- ❌ Metric Card
- ❌ Media Preview
- ❌ PDF Viewer
- ❌ Image Annotation

**Status/Progress:**
- ❌ Stepper
- ❌ Status Tracker
- ❌ Edit History
- ❌ Action Log Timeline

**Integration:**
- ❌ Linked Compass Resources

**Status**: Partially complete (basic widgets exist)

**Feature #5: Navigation & Event Widgets**

Implement event-triggering widgets:

**Widgets:**
- ❌ Button Group (trigger actions, URLs, events)
- ❌ Tabs (navigation between views)
- ❌ Inline Action (action forms/tables)
- ❌ Comments (collaboration)
- ❌ Media Uploader (file upload + action trigger)

**Status**: ❌ Not Started

### Phase 4: Agent Integration (Week 6-7) - 8 story points

**Feature #6: Widget Discovery for Agents**

Agents can discover and use appropriate widgets:

**Implementation:**
1. Widget recommendation system:
   ```typescript
   const widgets = await widget.recommend({
     objectType: 'contract',
     intent: 'display-summary',
     context: 'chat'
   }, credentials);
   ```

2. Auto-register widget tools:
   ```typescript
   // Each widget template becomes an agent tool
   tools.push({
     name: 'display_data_table',
     description: 'Display object data in a sortable, filterable table',
     parameters: { /* generated from widget schema */ },
     execute: (params) => ({
       type: 'widget',
       widgetId: 'widget-data-table',
       config: params
     })
   });
   ```

3. Agent returns widget configs in tool responses

**Status**: ❌ Not Started

## Technology Stack

- **React 19** - Widget components
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **Radix UI** - Base primitives
- **Recharts** - Chart widgets
- **React Hook Form** - Form widgets
- **Vega-Lite** - Advanced charts
- **Leaflet/MapLibre** - Map widgets
- **PDF.js** - PDF viewer
- **Fabric.js** - Image annotation

## Success Criteria

### Widget Adoption
- **Target**: 80%+ of data visualizations use widget system
- **Current**: ~30% (agent widgets only)

### Widget Discoverability
- **Target**: Users can find appropriate widget in <30 seconds
- **Current**: N/A (no widget catalog)

### Development Speed
- **Target**: Create new visualization in <15 minutes (vs 2+ hours coding)
- **Current**: N/A (requires coding)

### Agent Usage
- **Target**: 90%+ agent responses use widgets from registry
- **Current**: 100% (but limited widget types)

## Related Documentation

- **Implementation Status**: [status.md](./status.md)
- **Implementation Roadmap**: [plan/implementation-roadmap.md](./plan/implementation-roadmap.md)
- **Feature Specifications**: [features/](./features/)
- **User Stories**: [user-stories/](./user-stories/)

## Quick Start

### Using Widgets (After Refactor)

```typescript
import { Widget } from '@captify-io/core/components/widgets';

// Use widget by ID (from registry)
<Widget
  id="widget-contract-table"
  data={contracts}
  onAction={handleAction}
/>

// Use widget by type (direct)
<Widget
  type="data-table"
  config={{
    columns: [
      { accessorKey: 'contractNumber', header: 'Contract #' },
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'status', header: 'Status' }
    ]
  }}
  data={contracts}
/>
```

### Creating Widget Definitions

```typescript
import { widget } from '@captify-io/core/services/ontology';

const contractTableWidget = await widget.create({
  name: 'Contract Summary Table',
  widgetType: 'data-table',
  objectTypes: ['contract'],
  properties: {
    columns: [
      { accessorKey: 'contractNumber', header: 'Contract #', sortable: true },
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'status', header: 'Status' }
    ],
    sortable: true,
    filterable: true
  },
  actions: [
    {
      id: 'action-approve-contract',
      label: 'Approve',
      placement: 'row-action',
      condition: 'status == "pending"'
    }
  ]
}, credentials);
```

---

**Documentation Version**: 1.0
**Created**: 2025-11-02
**Last Updated**: 2025-11-02
**Status**: Planning Phase
**Total Scope**: 6 features, 6-7 weeks
