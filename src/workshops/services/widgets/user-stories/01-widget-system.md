# User Stories: Widget System

## Persona

**Primary**: Sarah - Product Manager building dashboards and pages
**Secondary**: Agent - AI assistant helping users visualize data
**Tertiary**: Alex - Developer building new features

## User Journey

### Sarah's Journey: Building a Contract Dashboard

1. Sarah logs into platform and navigates to `/widgets`
2. Browses widget catalog and finds "Data Table" widget
3. Clicks "Create New" to make a contract-specific table widget
4. Selects "Contract" as object type
5. Configures table columns (contract number, title, status, value)
6. Adds "Approve" action to row menu (condition: status == 'pending')
7. Previews widget with sample contract data
8. Saves as "Contract Summary Table"
9. Uses widget in dashboard page: `<Widget id="widget-contract-table" data={contracts} />`
10. Widget displays correctly with actions working

### Agent's Journey: Displaying Contract Data

1. User asks agent: "Show me all pending contracts"
2. Agent queries ontology for contract object type
3. Agent calls `widget.getByObjectType('contract')` to find suitable widgets
4. Agent receives list: ["Contract Summary Table", "Contract Timeline", "Contract Map"]
5. Agent selects "Contract Summary Table" (matches intent: display-list)
6. Agent fetches pending contracts from database
7. Agent returns widget config in tool response:
   ```json
   {
     "type": "widget",
     "widgetId": "widget-contract-table",
     "data": contracts
   }
   ```
8. Widget renders in chat interface
9. User clicks "Approve" on a row
10. Action triggers, status updates, widget refreshes

### Alex's Journey: Adding a New Widget Type

1. Alex implements `GanttWidget` at `core/components/widgets/display/gantt.tsx`
2. Adds to Widget component switch statement
3. Runs tests to verify it works
4. Creates widget definition in registry:
   ```typescript
   await widget.create({
     name: 'Project Gantt Chart',
     widgetType: 'gantt',
     objectTypes: ['project', 'task'],
     properties: {
       startDateField: 'startDate',
       endDateField: 'endDate',
       dependencyField: 'dependencies'
     }
   }, credentials);
   ```
5. Widget immediately available in catalog
6. Sarah can now use Gantt widget without waiting for deployment

---

## Stories

### US-1: Browse Widget Catalog

**As a** product manager
**I want** to browse all available widgets
**So that** I can find the right visualization for my data

**Acceptance Criteria**:
- ✅ Can navigate to `/widgets` page
- ✅ See grid of widget cards with preview thumbnails
- ✅ Each card shows: name, description, supported object types, category
- ✅ Can filter by category (display, capture, navigation)
- ✅ Can filter by object type (contract, clin, user, etc.)
- ✅ Can search by name or description
- ✅ Can sort by: name, date created, popularity
- ✅ Clicking card opens widget detail page

**Edge Cases**:
- Empty state when no widgets match filter
- Loading state while fetching widgets
- Error state if widget service fails

**Test Scenarios**:
```typescript
describe('Widget Catalog', () => {
  test('displays all widgets on load', async () => {
    render(<WidgetCatalog />);
    await waitFor(() => {
      expect(screen.getAllByTestId('widget-card')).toHaveLength(10);
    });
  });

  test('filters by category', () => {
    render(<WidgetCatalog />);
    fireEvent.click(screen.getByText('Display'));
    expect(screen.getAllByTestId('widget-card')).toHaveLength(6);
  });

  test('searches by name', () => {
    render(<WidgetCatalog />);
    fireEvent.change(screen.getByPlaceholderText('Search...'), {
      target: { value: 'table' }
    });
    expect(screen.getAllByTestId('widget-card')).toHaveLength(2);
  });
});
```

---

### US-2: Create Widget Definition

**As a** product manager
**I want** to create a new widget definition visually
**So that** I can customize data visualizations without coding

**Acceptance Criteria**:
- ✅ Can click "Create Widget" button in catalog
- ✅ Step 1: Select widget template (table, chart, card, etc.)
- ✅ Step 2: Select object types this widget works with
- ✅ Step 3: Configure widget properties (columns, axes, fields)
- ✅ Step 4: Add events (onClick, onRowSelect, etc.)
- ✅ Step 5: Add actions (from ontology action registry)
- ✅ Live preview updates as I configure
- ✅ Can save widget definition
- ✅ Widget immediately available in catalog

**Edge Cases**:
- Invalid configuration (missing required fields)
- Object type not found in ontology
- Action not found in ontology
- Preview fails to render

**Test Scenarios**:
```typescript
describe('Create Widget', () => {
  test('creates table widget successfully', async () => {
    render(<CreateWidget />);

    // Step 1: Select template
    fireEvent.click(screen.getByText('Data Table'));
    fireEvent.click(screen.getByText('Next'));

    // Step 2: Select object type
    fireEvent.click(screen.getByText('Contract'));
    fireEvent.click(screen.getByText('Next'));

    // Step 3: Configure
    // ... add columns
    fireEvent.click(screen.getByText('Next'));

    // Step 5: Save
    fireEvent.click(screen.getByText('Save Widget'));

    await waitFor(() => {
      expect(screen.getByText('Widget created successfully')).toBeInTheDocument();
    });
  });
});
```

---

### US-3: Use Widget in Page

**As a** developer
**I want** to use widgets from the registry in my pages
**So that** I can quickly build UIs with consistent visualizations

**Acceptance Criteria**:
- ✅ Can import Widget component from core
- ✅ Can use widget by ID: `<Widget id="widget-contract-table" data={data} />`
- ✅ Widget loads definition from registry
- ✅ Widget renders correctly with provided data
- ✅ Events and actions work as configured
- ✅ Can override config properties if needed
- ✅ Loading state while widget definition loads
- ✅ Error state if widget not found

**Edge Cases**:
- Widget ID doesn't exist
- Data doesn't match expected object type
- Action referenced doesn't exist
- Network error loading definition

**Test Scenarios**:
```typescript
describe('Widget in Page', () => {
  test('renders widget from registry', async () => {
    render(<Widget id="widget-contract-table" data={contracts} />);

    await waitFor(() => {
      expect(screen.getByText('Contract #')).toBeInTheDocument();
      expect(screen.getAllByRole('row')).toHaveLength(11); // header + 10 rows
    });
  });

  test('triggers action on row click', async () => {
    const onAction = jest.fn();

    render(
      <Widget
        id="widget-contract-table"
        data={contracts}
        onAction={onAction}
      />
    );

    fireEvent.click(screen.getByText('ABC-123'));

    expect(onAction).toHaveBeenCalledWith('rowClick', expect.any(Object));
  });
});
```

---

### US-4: Agent Discovers Widgets

**As an** agent
**I want** to discover available widgets for an object type
**So that** I can display data appropriately in my responses

**Acceptance Criteria**:
- ✅ Can query widgets by object type
- ✅ Receive list of suitable widgets
- ✅ Each widget has name, description, configuration requirements
- ✅ Can select widget based on intent (summary vs detail vs analysis)
- ✅ Return widget config in tool response
- ✅ Widget renders correctly in chat interface

**Edge Cases**:
- No widgets available for object type
- Multiple widgets equally suitable
- Widget requires data fields not available
- User doesn't have permission for widget

**Test Scenarios**:
```typescript
describe('Agent Widget Discovery', () => {
  test('finds widgets for object type', async () => {
    const widgets = await widget.getByObjectType('contract', credentials);

    expect(widgets).toHaveLength(3);
    expect(widgets[0].name).toBe('Contract Summary Table');
  });

  test('recommends appropriate widget', async () => {
    const recommended = await widget.recommend({
      objectType: 'contract',
      intent: 'display-summary',
      context: 'chat'
    }, credentials);

    expect(recommended[0].widgetType).toBe('table');
  });
});
```

---

### US-5: Edit Widget Definition

**As a** product manager
**I want** to edit an existing widget definition
**So that** I can improve visualizations based on user feedback

**Acceptance Criteria**:
- ✅ Can navigate to widget detail page
- ✅ Click "Edit" to open edit form
- ✅ Form pre-populated with current configuration
- ✅ Can modify any configuration
- ✅ Preview updates in real-time
- ✅ Can save changes
- ✅ All pages using this widget automatically get updates
- ✅ Version history shows previous configurations

**Edge Cases**:
- Breaking change (remove required field)
- Widget in use by many pages
- Concurrent edit by another user

**Test Scenarios**:
```typescript
describe('Edit Widget', () => {
  test('updates widget configuration', async () => {
    render(<EditWidget widgetId="widget-contract-table" />);

    // Modify configuration
    fireEvent.click(screen.getByText('Add Column'));
    // ... add new column

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Widget updated')).toBeInTheDocument();
    });

    // Verify update
    const updated = await widget.getById('widget-contract-table', credentials);
    expect(updated.properties.columns).toHaveLength(5); // was 4
  });
});
```

---

## Additional Scenarios

### Scenario: Responsive Widget

**Given** Sarah creates a widget for mobile users
**When** she configures the widget
**Then** she can set responsive breakpoints
**And** preview the widget on different screen sizes
**And** the widget adapts layout for mobile

### Scenario: Widget Permissions

**Given** Alex creates an admin-only widget
**When** he sets permissions to "admin" role
**Then** only admin users can see this widget in catalog
**And** non-admin users cannot use this widget
**And** agents respect permission restrictions

### Scenario: Widget Analytics

**Given** a widget has been used in production for 1 month
**When** Sarah views widget details
**Then** she sees usage analytics:
- Number of pages using this widget
- Number of times displayed
- User engagement metrics
- Performance metrics (load time)

---

## Success Criteria

### User Adoption
- ✅ 50%+ of new pages use widgets from registry
- ✅ 80%+ of visualizations use widget system
- ✅ 10+ widget definitions created by non-developers

### User Satisfaction
- ✅ Users can find appropriate widget in < 30 seconds
- ✅ Users can create widget in < 5 minutes
- ✅ 90%+ satisfaction score for widget builder

### Agent Usage
- ✅ 90%+ agent responses use widgets from registry
- ✅ Agents select appropriate widget 95%+ of time
- ✅ Widget rendering in chat works 99%+ of time

---

**User Stories Version**: 1.0
**Created**: 2025-11-02
**Status**: Ready for Review
