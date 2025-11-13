# Widget System - Implementation Roadmap

## Overview

Transform the widget system from agent-specific components into a comprehensive UI primitive library that serves all Captify applications. This roadmap outlines a 4-phase, 7-week implementation plan to refactor existing widgets, build a widget registry, implement 27 widget types, and integrate with the agent system.

**Total Duration**: 7 weeks
**Total Story Points**: 58
**Team**: 1-2 developers + 1 product manager

## Timeline

```
Week 1-2:  Phase 1 - Widget Refactor (8 pts)
Week 2-4:  Phase 2 - Widget Registry & UI (21 pts)
Week 4-6:  Phase 3 - Widget Templates (21 pts)
Week 6-7:  Phase 4 - Agent Integration (8 pts)
```

## Phases

### Phase 1: Widget Primitive Refactor (Week 1-2, 8 story points)

**Goal**: Move widgets from `core/components/agent/widgets/` to `core/components/widgets/` as true UI primitives that any component can use.

**Tasks**:
1. [ ] Create new directory structure
   ```
   core/src/components/widgets/
   ├── index.tsx                 # Main exports
   ├── widget.tsx                # Universal Widget wrapper
   ├── types.ts                  # Widget type definitions
   ├── display/                  # Display widgets
   │   ├── card.tsx
   │   ├── table.tsx             # Uses DataTable
   │   ├── chart.tsx
   │   ├── message.tsx
   │   └── markdown.tsx
   └── capture/                  # Capture widgets
       ├── text.tsx
       ├── select.tsx
       ├── date.tsx
       ├── file.tsx
       └── form.tsx
   ```

2. [ ] Refactor TableWidget to use existing DataTable
   - Import `DataTable` from `core/components/ui/data-table.tsx`
   - Wrap with widget-specific configuration
   - Add event handling for widget system
   - Maintain backward compatibility

3. [ ] Move existing widgets to new location
   - Copy files from `agent/widgets/` to `widgets/`
   - Update imports within widget files
   - Remove agent-specific dependencies
   - Make widgets pure UI components

4. [ ] Update all import paths
   - Find all files importing from `agent/widgets`
   - Update to `widgets` imports
   - Test each consumer after update
   ```bash
   # Search for old imports
   grep -r "agent/widgets" core/src/
   grep -r "agent/widgets" platform/src/
   ```

5. [ ] Create backward-compatible exports
   ```typescript
   // core/src/components/agent/widgets/index.tsx
   // Temporary re-exports for backward compatibility
   export * from '../../widgets';
   // TODO: Remove after all consumers updated
   ```

6. [ ] Update widget exports and types
   ```typescript
   // core/src/components/widgets/index.tsx
   export { Widget } from './widget';
   export type { WidgetConfig, WidgetType } from './types';

   // Display widgets
   export * from './display/card';
   export * from './display/table';
   export * from './display/chart';
   export * from './display/message';
   export * from './display/markdown';

   // Capture widgets
   export * from './capture/text';
   export * from './capture/select';
   export * from './capture/date';
   export * from './capture/file';
   export * from './capture/form';
   ```

7. [ ] Test all widget consumers
   - Agent chat interface
   - Workflow step renderer
   - Any page components using widgets
   - Run full test suite

8. [ ] Update documentation
   - Update import examples in docs
   - Update CLAUDE.md with new structure
   - Document migration path

**Deliverables**:
- Widgets at `core/components/widgets/`
- TableWidget uses DataTable
- All imports updated
- Tests passing
- Documentation updated

**Acceptance Criteria**:
- ✅ All widgets accessible at `@captify-io/core/components/widgets`
- ✅ Agent components work without changes
- ✅ Page components can import widgets directly
- ✅ TableWidget renders using DataTable component
- ✅ Zero breaking changes (backward compat exports in place)
- ✅ All existing tests pass

**Dependencies**:
- None (self-contained refactor)

**Risks**:
- **Risk**: Breaking existing agent functionality
  - **Mitigation**: Maintain backward compat exports, test thoroughly
- **Risk**: Missed import paths during update
  - **Mitigation**: Use grep/ripgrep to find all imports, systematic update

---

### Phase 2: Widget Registry & Management UI (Week 2-4, 21 story points)

**Goal**: Create widget registry in ontology and build platform UI for managing widget definitions.

#### Week 2-3: Widget Registry API (8 story points)

**Tasks**:
1. [ ] Define WidgetDefinition schema
   ```typescript
   // core/src/services/ontology/types.ts
   export interface WidgetDefinition extends Ontology {
     type: 'widget';
     category: 'display' | 'capture' | 'navigation';
     widgetType: string;
     objectTypes: string[];
     properties: WidgetProperties;
     events?: WidgetEvent[];
     actions?: WidgetAction[];
   }
   ```

2. [ ] Create widget service
   ```typescript
   // core/src/services/ontology/widget.ts
   export const widget = {
     create(definition, credentials): Promise<OntologyNode>
     update(id, updates, credentials): Promise<void>
     delete(id, credentials): Promise<void>
     getById(id, credentials): Promise<WidgetDefinition>
     getByObjectType(type, credentials): Promise<WidgetDefinition[]>
     getByCategory(category, credentials): Promise<WidgetDefinition[]>
     search(query, credentials): Promise<WidgetDefinition[]>
   }
   ```

3. [ ] Add widget service to ontology namespace
   ```typescript
   // core/src/services/ontology/index.ts
   export { widget } from './widget';
   ```

4. [ ] Enhance Widget component to load from registry
   ```typescript
   export function Widget({ id, type, config, data, ...props }) {
     // If id provided, load from registry
     const definition = id ? useWidgetDefinition(id) : null;

     // Use definition config or provided config
     const widgetType = definition?.widgetType || type;
     const widgetConfig = definition?.properties || config;

     // Render widget...
   }
   ```

5. [ ] Create useWidgetDefinition hook
   ```typescript
   // core/src/hooks/use-widget-definition.ts
   export function useWidgetDefinition(widgetId: string) {
     return useQuery({
       queryKey: ['widget', widgetId],
       queryFn: () => widget.getById(widgetId, credentials)
     });
   }
   ```

6. [ ] Seed initial widget definitions
   - Create definitions for existing widget types
   - Store in ontology
   - Tag with appropriate object types

**Deliverables**:
- Widget service API
- Widget definitions in ontology
- Widget component loads from registry
- Seeded widget definitions

**Acceptance Criteria**:
- ✅ Can create widget definition via API
- ✅ Can query widgets by object type
- ✅ Widget component renders from registry ID
- ✅ At least 5 widget definitions seeded

#### Week 3-4: Widget Management UI (13 story points)

**Tasks**:
1. [ ] Create widget pages structure
   ```
   platform/src/app/widgets/
   ├── page.tsx                  # Widget catalog
   ├── new/
   │   └── page.tsx              # Create new widget
   ├── [id]/
   │   ├── page.tsx              # Widget details
   │   └── edit/
   │       └── page.tsx          # Edit widget
   └── components/
       ├── widget-card.tsx       # Widget card in catalog
       ├── widget-form.tsx       # Create/edit form
       ├── widget-preview.tsx    # Live preview
       └── widget-config-editor.tsx  # Visual config editor
   ```

2. [ ] Build widget catalog page
   - Grid view of all widgets
   - Filter by category, object type
   - Search by name, description
   - Sort by name, date, usage

3. [ ] Build widget detail page
   - Show widget configuration
   - Preview with sample data
   - List of pages/agents using this widget
   - Edit and delete actions

4. [ ] Build widget form
   - Select widget type (dropdown)
   - Select object types (multi-select)
   - Configure widget properties (dynamic form based on type)
   - Define events (event builder)
   - Add actions (action selector)

5. [ ] Build widget preview component
   - Load widget with sample data
   - Show how it will render
   - Test events and actions
   - Responsive preview (desktop/mobile)

6. [ ] Build config editor for each widget type
   - Table: column mapper, sort/filter config
   - Chart: axis selector, series config
   - Card: field layout editor
   - Map: field mappers (lat/lng)
   - Form: field builder

7. [ ] Add widget management to ontology viewer
   - Add "Widgets" tab to node detail
   - Show widgets that use this object type
   - Quick create widget button

**Deliverables**:
- Widget catalog UI
- Widget create/edit forms
- Widget preview
- Integration with ontology viewer

**Acceptance Criteria**:
- ✅ Users can browse widget catalog
- ✅ Users can search and filter widgets
- ✅ Users can create new widget definition
- ✅ Users can edit existing widget
- ✅ Preview shows live rendering
- ✅ Can see which widgets work with specific object types

**Dependencies**:
- Widget Registry API (previous task)
- Ontology viewer (`platform/src/app/ontology/`)

**Risks**:
- **Risk**: Complex config editor for each widget type
  - **Mitigation**: Start with simple JSON editor, enhance iteratively
- **Risk**: Preview not matching actual rendering
  - **Mitigation**: Use actual Widget component for preview

---

### Phase 3: Widget Templates (Week 4-6, 21 story points)

**Goal**: Implement all 27 widget types from specification.

#### Week 4: Chart & Data Widgets (8 story points)

**Tasks**:
1. [ ] Refactor existing chart widgets
   - Chart: Pie/Donut
   - Chart: XY (bar, line, scatter, area)
   - Ensure configuration via widget properties

2. [ ] Implement Chart: Vega
   - Install Vega-Lite dependencies
   - Create VegaWidget component
   - Support Vega-Lite spec as config

3. [ ] Implement Chart: Waterfall
   - Use Recharts or custom SVG
   - Configure series and axes

4. [ ] Refactor Data Table
   - Already using DataTable internally
   - Add configuration for filters, pagination
   - Add row actions support

5. [ ] Implement Pivot Table
   - Dynamic grouping interface
   - Aggregation functions (sum, count, avg, min, max)
   - Drill-down support

6. [ ] Implement Resource List
   - List Foundry resources
   - Type filtering
   - Link to resources

**Deliverables**:
- 6 chart widgets
- 3 data widgets
- All registered in widget registry

**Acceptance Criteria**:
- ✅ All chart types render correctly
- ✅ Vega-Lite integration works
- ✅ Pivot table supports grouping and aggregation
- ✅ Resource list displays correctly

#### Week 5: Spatial, Content & Status Widgets (8 story points)

**Tasks**:
1. [ ] Implement Map widget
   - Choose Leaflet or MapLibre
   - Latitude/longitude field mapping
   - Marker configuration
   - Popup templates

2. [ ] Implement Gantt Chart
   - Timeline rendering
   - Task dependencies
   - Date range configuration

3. [ ] Implement Timeline
   - Event timeline
   - Temporal data rendering
   - Zoom and pan

4. [ ] Enhance existing content widgets
   - Markdown (already exists)
   - Card (already exists)

5. [ ] Implement Metric Card
   - Highlight key metrics
   - Comparison values
   - Trend indicators

6. [ ] Implement Media Preview
   - Image preview (PNG, JPEG)
   - PDF preview (first page)
   - Video thumbnail

7. [ ] Implement PDF Viewer
   - Full PDF rendering with PDF.js
   - Page navigation
   - Keyword search

8. [ ] Implement Image Annotation
   - Fabric.js integration
   - Rectangle drawing
   - Save annotations

9. [ ] Implement Stepper
   - Linear progress
   - Non-linear support
   - Step completion tracking

10. [ ] Implement Status Tracker
    - Process timeline
    - Status indicators
    - Date tracking

11. [ ] Implement Edit History
    - Object edit timeline
    - User attribution
    - Diff viewing

12. [ ] Implement Action Log Timeline
    - Action logs in temporal view
    - Filtering by action type
    - User filtering

**Deliverables**:
- 3 spatial/temporal widgets
- 6 content widgets
- 4 status/progress widgets

**Acceptance Criteria**:
- ✅ Map renders geospatial data
- ✅ Gantt shows task dependencies
- ✅ PDF viewer has search
- ✅ Image annotation saves rectangles
- ✅ Status widgets show timeline

#### Week 6: Navigation & Event Widgets (5 story points)

**Tasks**:
1. [ ] Implement Button Group
   - Multiple buttons
   - Each triggers action, URL, or event
   - Style configuration

2. [ ] Implement Tabs
   - Tab navigation
   - Trigger events on tab change
   - Lazy load tab content

3. [ ] Implement Inline Action
   - Render action form inline
   - Show action results in table
   - Link to action definitions

4. [ ] Implement Comments
   - Comment thread
   - User attribution
   - Timestamps
   - Mentions support

5. [ ] Implement Media Uploader
   - File upload
   - Preview
   - Trigger action with uploaded file

6. [ ] Implement Linked Compass Resources
   - Display linked Compass resources
   - Navigate to resources
   - Filter by type

7. [ ] Implement Free-form Analysis
   - Interactive data exploration
   - Dynamic filtering
   - Chart generation

**Deliverables**:
- 5 navigation/event widgets
- 2 integration widgets

**Acceptance Criteria**:
- ✅ Button group triggers actions
- ✅ Tabs navigate correctly
- ✅ Inline action renders forms
- ✅ Comments support threading
- ✅ Media uploader triggers actions

**Dependencies**:
- Action System (for Inline Action widget)
- File upload service

**Risks**:
- **Risk**: External library integration issues
  - **Mitigation**: Test early, have fallback implementations
- **Risk**: Performance with complex widgets (Gantt, Free-form)
  - **Mitigation**: Virtual scrolling, lazy loading

---

### Phase 4: Agent Integration (Week 6-7, 8 story points)

**Goal**: Enable agents to discover and use widgets programmatically.

**Tasks**:
1. [ ] Build widget recommendation system
   ```typescript
   // core/src/services/ontology/widget-recommendation.ts
   export async function recommendWidgets(params: {
     objectType: string;
     intent?: 'display-summary' | 'display-detail' | 'capture-input' | 'analyze';
     context?: 'chat' | 'page' | 'dashboard';
     userRole?: string;
   }, credentials): Promise<WidgetDefinition[]> {
     // Score widgets based on:
     // 1. Object type match
     // 2. Intent match (display vs capture)
     // 3. Context appropriateness
     // 4. User permissions
     // 5. Historical usage patterns
   }
   ```

2. [ ] Auto-generate widget tools for agents
   ```typescript
   // core/src/services/agent/widget-tools.ts
   export async function generateWidgetTools(
     objectType: string,
     credentials: AwsCredentials
   ): Promise<Tool[]> {
     const widgets = await widget.getByObjectType(objectType, credentials);

     return widgets.map(w => ({
       name: `display_${w.widgetType}`,
       description: `Display ${objectType} data using ${w.name}`,
       parameters: generateParameterSchema(w),
       execute: async (params) => ({
         type: 'widget',
         widgetId: w.id,
         config: params
       })
     }));
   }
   ```

3. [ ] Create widget selection context for agents
   ```typescript
   // Add to agent instructions
   const widgetContext = `
   You have access to these visualization widgets for ${objectType}:
   ${widgets.map(w => `- ${w.name}: ${w.description}`).join('\n')}

   Use the appropriate widget based on:
   - Summary data → Table or Card widget
   - Trends over time → Chart: XY (line) widget
   - Geographic data → Map widget
   - User input needed → Form or capture widgets
   `;
   ```

4. [ ] Update workflow step renderer for widget configs
   ```typescript
   // core/src/components/agent/tool/workflow-step-renderer.tsx
   function WorkflowStepItem({ step }) {
     if (step.widgetId) {
       return (
         <Widget
           id={step.widgetId}
           data={step.data}
           onAction={(action, params) => {
             // Handle action triggered from widget
             onToolCall(action, params);
           }}
         />
       );
     }
     // ... existing logic
   }
   ```

5. [ ] Add widget analytics
   - Track widget usage by agents
   - Track widget effectiveness (user engagement)
   - Improve recommendations based on usage

6. [ ] Test agent widget integration
   - Agent selects appropriate widget
   - Widget renders in chat
   - Events and actions work
   - Multiple widgets in one response

**Deliverables**:
- Widget recommendation system
- Auto-generated widget tools
- Agent integration tested
- Analytics tracking

**Acceptance Criteria**:
- ✅ Agents can query widgets for object type
- ✅ Recommendation scores widgets appropriately
- ✅ Agents return widget configs in responses
- ✅ Widgets render in chat interface
- ✅ Actions triggered from widgets work
- ✅ Analytics track widget usage

**Dependencies**:
- All widget templates implemented (Phase 3)
- Agent system

**Risks**:
- **Risk**: Poor widget recommendations
  - **Mitigation**: Start with simple rules, improve based on feedback
- **Risk**: Performance with widget discovery
  - **Mitigation**: Cache widget definitions in agent context

---

## Cross-Phase Concerns

### Documentation
- **Week 1-2**: Update CLAUDE.md with new widget structure
- **Week 3-4**: Create widget builder documentation
- **Week 5-6**: Document each widget type (props, config, examples)
- **Week 7**: Create developer guide for creating new widgets

### Testing
- **Week 1**: Unit tests for refactored widgets
- **Week 2**: API tests for widget service
- **Week 3-4**: Integration tests for widget UI
- **Week 5-6**: Visual regression tests for widget templates
- **Week 7**: End-to-end tests for agent integration

### Performance
- **Week 2**: Benchmark widget registry queries
- **Week 4**: Performance testing for complex widgets (Gantt, Pivot)
- **Week 6**: Agent widget discovery performance
- **Week 7**: Optimize based on findings

---

## Success Metrics

### Week 2 (After Phase 1)
- ✅ All widgets accessible at `core/components/widgets`
- ✅ Zero breaking changes
- ✅ All tests passing

### Week 4 (After Phase 2)
- ✅ 10+ widget definitions in registry
- ✅ Widget catalog UI functional
- ✅ Users can create widget without code

### Week 6 (After Phase 3)
- ✅ 27 widget types implemented
- ✅ All widgets registered
- ✅ Examples for each widget

### Week 7 (After Phase 4)
- ✅ Agents use widget registry
- ✅ 80%+ agent responses use registered widgets
- ✅ Widget discovery <200ms

---

## Risk Mitigation Strategy

| Risk | Phase | Mitigation | Owner |
|------|-------|------------|-------|
| Breaking changes during refactor | 1 | Maintain backward compat, phased migration | Dev |
| Complex widget configurations | 2 | Start with JSON, enhance to visual editor | Product |
| External library integration | 3 | Test integrations early, have fallbacks | Dev |
| Poor widget recommendations | 4 | Simple rules first, iterate based on usage | Product |
| Performance issues | All | Monitor, optimize hot paths, lazy load | Dev |

---

## Rollout Strategy

### Internal Release (Week 7)
- Deploy to staging environment
- Internal team testing
- Gather feedback
- Fix critical bugs

### Beta Release (Week 8)
- Select 5-10 power users
- Enable widget system
- Monitor usage
- Collect feedback

### General Availability (Week 9)
- Roll out to all users
- Announce in platform
- Provide training materials
- Monitor adoption metrics

---

## Dependencies

### Internal
- ✅ Ontology System (for widget registry)
- ⚠️ Action System (for widget actions) - Feature 1a not started
- ✅ Agent System (already exists)
- ✅ DataTable Component (already exists)

### External
- Vega-Lite (charts)
- Leaflet/MapLibre (maps)
- PDF.js (PDF viewer)
- Fabric.js (image annotation)

---

## Post-Launch Activities

### Week 8-9
- Monitor widget usage analytics
- Gather user feedback
- Create video tutorials
- Write blog post

### Month 2
- Add more widget templates based on demand
- Enhance recommendation algorithm
- Performance optimizations
- A/B test different widget configurations

### Month 3
- Advanced widget builder features
- Widget marketplace (share widgets across tenants)
- Widget versioning
- Widget permissions

---

**Roadmap Version**: 1.0
**Created**: 2025-11-02
**Total Duration**: 7 weeks
**Total Story Points**: 58
**Status**: Planning Complete, Ready for Implementation
