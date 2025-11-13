# Feature 4: Object Instance Explorer

**Status**: ❌ Not Started
**Priority**: P0 (Critical)
**Story Points**: 13
**Estimated Hours**: 40

## Overview

Enable exploration of real-world object instances (specific contracts, projects, users) rather than just ontology schemas. This transforms the ontology viewer from a developer-focused schema management tool into a user-facing data exploration platform where users can start from any object, view its full context, and navigate relationships.

**Problem**: Currently, users can only view ontology nodes (type definitions/schemas), not actual data instances. There's no way to explore a specific contract, project, or user and see all its properties, relationships, and available actions.

**Solution**: Add an "Instance View" mode that enables object-centric exploration with rich context panels, relationship navigation, and action execution.

## Requirements

### Functional Requirements

1. **Instance Selection Mode**
   - Toggle between "Schema View" (current) and "Instance View" (new)
   - Instance view starts with object type selector
   - Search and select specific object instances
   - Recent and favorite objects quick access

2. **Object Detail Panel**
   - Display all properties inline (not just ontology metadata)
   - Show relationship counts grouped by type
   - Available actions section
   - Change history timeline
   - Linked widgets/visualizations

3. **Instance-to-Type Navigation**
   - Click "View Type" to jump to ontology node definition
   - Breadcrumb navigation: Instance → Type → Domain
   - Compare instance properties with type schema

4. **Object Search & Filters**
   - Search across all object types
   - Filter by property values
   - Saved searches
   - Recent objects list

### Non-Functional Requirements

1. **Performance**: Load object with all relationships in <500ms
2. **Scalability**: Handle objects with 100+ relationships
3. **Caching**: Cache frequently accessed objects (5-minute TTL)
4. **Responsiveness**: Update UI in <100ms when switching objects

## Architecture

### Component Structure

```
platform/src/app/ontology/components/
├── instance-explorer.tsx          - Instance mode container
├── object-selector.tsx            - Search and select objects
├── object-detail-panel.tsx        - Rich object detail view
├── instance-properties.tsx        - Property display with editing
├── instance-relationships.tsx     - Relationship browser
├── instance-actions.tsx           - Available actions list
├── instance-history.tsx           - Change timeline
└── instance-widgets.tsx           - Embedded visualizations
```

### Data Flow

```
User Selects Object
  ↓
Load Object Data (ontology.query)
  ↓
Load Related Objects (ontology.edge.getForNode)
  ↓
Load Available Actions (from node properties)
  ↓
Display in Object Detail Panel
  ↓
User Navigates Relationship → Load Related Object
```

### State Management

```typescript
interface InstanceExplorerState {
  mode: 'schema' | 'instance';
  selectedType: string | null;
  selectedObject: {
    id: string;
    type: string;
    data: Record<string, any>;
    relationships: {
      outgoing: Array<{ type: string; target: string; count: number }>;
      incoming: Array<{ type: string; source: string; count: number }>;
    };
  } | null;
  recentObjects: Array<{ id: string; type: string; name: string }>;
  favoriteObjects: Array<{ id: string; type: string; name: string }>;
}
```

## Data Model

**Existing Tables** (reuse):
- `{schema}-{app}-{type}` - Object data tables
- `{schema}-core-ontology-node` - Type definitions
- `{schema}-core-ontology-edge` - Relationship definitions

**No new tables needed**

## API Actions

### Load Object Instance

```typescript
/**
 * Loads a specific object instance with all its data
 */
async function loadObjectInstance(
  typeId: string,
  objectId: string,
  credentials: AwsCredentials
): Promise<ObjectInstance> {
  // Get type definition
  const node = await ontology.node.getById(typeId, credentials);
  if (!node.properties?.dataSource) {
    throw new Error('Object type does not have a data source');
  }

  // Get object data
  const response = await apiClient.run({
    service: 'platform.dynamodb',
    operation: 'get',
    table: node.properties.dataSource,
    data: { Key: { id: objectId } }
  });

  if (!response.item) {
    throw new Error(`Object not found: ${objectId}`);
  }

  // Get relationship counts
  const edges = await ontology.edge.getEdgesForNode(typeId, credentials);
  const relationships = await loadRelationshipCounts(
    objectId,
    typeId,
    edges,
    credentials
  );

  return {
    id: objectId,
    type: typeId,
    data: response.item,
    relationships,
    node
  };
}
```

### Get Relationship Counts

```typescript
/**
 * Counts related objects for each relationship type
 */
async function loadRelationshipCounts(
  objectId: string,
  typeId: string,
  edges: OntologyEdge[],
  credentials: AwsCredentials
): Promise<RelationshipCounts> {
  const outgoing = [];
  const incoming = [];

  for (const edge of edges) {
    if (edge.source === typeId) {
      // This object → other objects
      const targetNode = await ontology.node.getById(edge.target, credentials);
      if (targetNode.properties?.dataSource) {
        const count = await countRelatedObjects(
          targetNode.properties.dataSource,
          edge.properties?.foreignKey || `${typeId}Id`,
          objectId,
          credentials
        );
        outgoing.push({
          type: edge.relation,
          target: edge.target,
          targetName: targetNode.name,
          count
        });
      }
    } else if (edge.target === typeId) {
      // Other objects → this object
      const sourceNode = await ontology.node.getById(edge.source, credentials);
      if (sourceNode.properties?.dataSource) {
        const count = await countRelatedObjects(
          sourceNode.properties.dataSource,
          edge.properties?.foreignKey || `${typeId}Id`,
          objectId,
          credentials
        );
        incoming.push({
          type: edge.relation,
          source: edge.source,
          sourceName: sourceNode.name,
          count
        });
      }
    }
  }

  return { outgoing, incoming };
}
```

### Search Objects

```typescript
/**
 * Searches for objects across all types
 */
async function searchObjects(
  query: string,
  filters: {
    types?: string[];
    domains?: string[];
    limit?: number;
  },
  credentials: AwsCredentials
): Promise<SearchResult[]> {
  // Get all nodes with dataSources
  const nodes = await ontology.node.getAllNodes(credentials);
  const queryableNodes = nodes.filter(n =>
    n.properties?.dataSource &&
    (!filters.types || filters.types.includes(n.type)) &&
    (!filters.domains || filters.domains.includes(n.domain))
  );

  const results: SearchResult[] = [];

  for (const node of queryableNodes) {
    // Search in each table
    const response = await apiClient.run({
      service: 'platform.dynamodb',
      operation: 'scan',
      table: node.properties!.dataSource!,
      data: {
        FilterExpression: 'contains(#name, :query) OR contains(#desc, :query)',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#desc': 'description'
        },
        ExpressionAttributeValues: {
          ':query': query
        },
        Limit: filters.limit || 10
      }
    });

    if (response.data?.Items) {
      results.push(...response.data.Items.map(item => ({
        id: item.id,
        type: node.type,
        typeName: node.name,
        name: item.name || item.title || item.id,
        description: item.description || '',
        icon: node.icon,
        color: node.color
      })));
    }
  }

  return results.slice(0, filters.limit || 50);
}
```

## UI/UX

### Instance Explorer Layout

```
┌────────────────────────────────────────────────────────────────┐
│ [Schema View] [Instance View] ✓                        [Agent] │
├──────────────┬────────────────────────────────────────────────┤
│ Type Selector│ Object Detail Panel                             │
│              │                                                  │
│ 📦 Contract  │ Contract #ABC-123                               │
│ 👤 User      │ ┌───────────────────────────────────────────┐  │
│ 📋 Project   │ │ Properties                                 │  │
│              │ │ ├─ contractNumber: ABC-123                │  │
│ [Search...🔍]│ │ ├─ title: IT Infrastructure Modernization │  │
│              │ │ ├─ status: active                         │  │
│ Recent:      │ │ ├─ totalValue: $5,250,000                │  │
│ • Contract   │ │ └─ startDate: 2025-01-15                 │  │
│   ABC-123    │ └───────────────────────────────────────────┘  │
│ • User       │                                                  │
│   john.doe   │ ┌───────────────────────────────────────────┐  │
│              │ │ Relationships                              │  │
│ Favorites: ★ │ │ Outgoing:                                  │  │
│ • Project    │ │ • hasMany → CLIN (12) [Expand]            │  │
│   Phoenix    │ │ • funds → Budget (3) [Expand]             │  │
│              │ │ Incoming:                                  │  │
│              │ │ • belongsTo ← Agency (1) [View]           │  │
│              │ └───────────────────────────────────────────┘  │
│              │                                                  │
│              │ ┌───────────────────────────────────────────┐  │
│              │ │ Available Actions (5)                      │  │
│              │ │ • 🔄 Update Status                        │  │
│              │ │ • 💵 Add Funding                          │  │
│              │ │ • 📄 Generate Report                      │  │
│              │ └───────────────────────────────────────────┘  │
└──────────────┴────────────────────────────────────────────────┘
```

### Object Detail Panel Tabs

```typescript
const objectDetailTabs = [
  { id: 'properties', label: 'Properties', icon: List },
  { id: 'relationships', label: 'Relationships', icon: Link2, badge: totalRelationships },
  { id: 'actions', label: 'Actions', icon: Zap, badge: availableActions.length },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'widgets', label: 'Visualizations', icon: BarChart3 }
];
```

### Relationship Expansion

```
Relationships (Outgoing)
┌─────────────────────────────────────────────────────────┐
│ hasMany → CLIN (12)                          [Expand ▼]│
├─────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────┐  │
│ │ 001 - Core IT Services          [$2.1M] [View] │  │
│ │ 002 - Cloud Migration           [$1.8M] [View] │  │
│ │ 003 - Security Operations       [$1.4M] [View] │  │
│ │ ... 9 more                      [View All]      │  │
│ └───────────────────────────────────────────────────┘  │
│                                                          │
│ funds → Budget (3)                           [Expand ▼]│
│ ...                                                      │
└─────────────────────────────────────────────────────────┘
```

## User Stories

### US-04-01: Switch to Instance View

**As a** program manager
**I want to** switch from schema view to instance view
**So that I can** explore actual data, not just type definitions

**Acceptance Criteria**:
- ✅ View mode toggle at top of page (Schema | Instance)
- ✅ Instance view shows type selector
- ✅ Can search for specific objects
- ✅ View mode persists in session

### US-04-02: Search for Objects

**As a** program manager
**I want to** search for specific contracts, projects, or users
**So that I can** quickly find the object I need to work with

**Acceptance Criteria**:
- ✅ Search box accepts object name, ID, or properties
- ✅ Search returns results across all object types
- ✅ Results show object type, name, and icon
- ✅ Click result to open in detail panel
- ✅ Recent searches are saved

### US-04-03: View Object Details

**As a** program manager
**I want to** see all properties and relationships for an object
**So that I can** understand its complete context

**Acceptance Criteria**:
- ✅ Detail panel shows all object properties
- ✅ Properties are formatted based on type (dates, currency, etc.)
- ✅ Relationship section shows counts grouped by type
- ✅ Can expand relationships to see related objects
- ✅ Actions section shows available operations

### US-04-04: Navigate Relationships

**As a** program manager
**I want to** navigate from one object to related objects
**So that I can** explore the data graph interactively

**Acceptance Criteria**:
- ✅ Click relationship to expand and see related objects
- ✅ Click related object to navigate to it
- ✅ Breadcrumb trail shows navigation path
- ✅ "Back" button returns to previous object
- ✅ Relationship counts are accurate

### US-04-05: View Type Definition

**As a** developer
**I want to** view the ontology node definition for an object's type
**So that I can** understand the schema and validation rules

**Acceptance Criteria**:
- ✅ "View Type" button in object detail panel
- ✅ Clicking navigates to schema view with type selected
- ✅ Can return to instance view with object still selected
- ✅ Breadcrumb shows: Instance → Type → Domain

## Implementation Notes

### Phase 1: Mode Toggle & Object Selector (Week 1)

```typescript
// 1. Add mode toggle to main page
platform/src/app/ontology/page.tsx

// Add state
const [viewMode, setViewMode] = useState<'schema' | 'instance'>('schema');

// Add toggle UI
<Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
  <TabsList>
    <TabsTrigger value="schema">Schema View</TabsTrigger>
    <TabsTrigger value="instance">Instance View</TabsTrigger>
  </TabsList>
</Tabs>

// 2. Create object selector component
components/object-selector.tsx

// Type selector dropdown
const [selectedType, setSelectedType] = useState<string | null>(null);
const queryableTypes = nodes.filter(n => n.properties?.dataSource);

<Select value={selectedType} onValueChange={setSelectedType}>
  <SelectTrigger>
    <SelectValue placeholder="Select object type..." />
  </SelectTrigger>
  <SelectContent>
    {queryableTypes.map(type => (
      <SelectItem key={type.id} value={type.id}>
        {type.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// 3. Object search
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

async function handleSearch() {
  const results = await searchObjects(searchQuery, { types: [selectedType] }, credentials);
  setSearchResults(results);
}
```

### Phase 2: Object Detail Panel (Week 1-2)

```typescript
// 4. Load object instance
async function loadObject(typeId: string, objectId: string) {
  setLoading(true);
  try {
    const instance = await loadObjectInstance(typeId, objectId, credentials);
    setSelectedObject(instance);

    // Add to recent objects
    addToRecent({ id: objectId, type: typeId, name: instance.data.name });
  } catch (error) {
    console.error('Failed to load object:', error);
    toast.error('Failed to load object');
  } finally {
    setLoading(false);
  }
}

// 5. Display properties
<Card>
  <CardHeader>
    <CardTitle>Properties</CardTitle>
  </CardHeader>
  <CardContent>
    {Object.entries(selectedObject.data).map(([key, value]) => (
      <div key={key} className="grid grid-cols-3 gap-4 py-2 border-b">
        <div className="font-medium">{key}</div>
        <div className="col-span-2">
          {formatPropertyValue(key, value, selectedObject.node.properties.schema)}
        </div>
      </div>
    ))}
  </CardContent>
</Card>

// 6. Format property values based on type
function formatPropertyValue(key: string, value: any, schema: PropertySchema) {
  const property = schema?.properties[key];
  if (!property) return String(value);

  switch (property.type) {
    case 'date':
      return new Date(value).toLocaleDateString();
    case 'number':
      if (key.includes('value') || key.includes('amount') || key.includes('cost')) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
      }
      return value.toLocaleString();
    case 'boolean':
      return value ? '✓ Yes' : '✗ No';
    case 'array':
      return `${value.length} items`;
    default:
      return String(value);
  }
}
```

### Phase 3: Relationship Navigation (Week 2)

```typescript
// 7. Display relationships
<Card>
  <CardHeader>
    <CardTitle>Relationships</CardTitle>
  </CardHeader>
  <CardContent>
    <Accordion type="single" collapsible>
      {selectedObject.relationships.outgoing.map(rel => (
        <AccordionItem key={rel.type} value={rel.type}>
          <AccordionTrigger>
            {rel.type} → {rel.targetName} ({rel.count})
          </AccordionTrigger>
          <AccordionContent>
            <RelatedObjectsList
              typeId={rel.target}
              foreignKey={rel.foreignKey}
              foreignValue={selectedObject.id}
              onSelectObject={(objId) => loadObject(rel.target, objId)}
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </CardContent>
</Card>

// 8. Related objects list component
async function loadRelatedObjects(
  typeId: string,
  foreignKey: string,
  foreignValue: string
) {
  const node = await ontology.node.getById(typeId, credentials);
  const response = await apiClient.run({
    service: 'platform.dynamodb',
    operation: 'query',
    table: node.properties.dataSource,
    data: {
      IndexName: `${foreignKey}-index`,
      KeyConditionExpression: `${foreignKey} = :value`,
      ExpressionAttributeValues: {
        ':value': foreignValue
      },
      Limit: 10
    }
  });

  return response.data?.Items || [];
}
```

### Phase 4: Navigation & History (Week 2)

```typescript
// 9. Navigation stack
const [navigationStack, setNavigationStack] = useState<Array<{ typeId: string; objectId: string }>>([]);

function navigateToObject(typeId: string, objectId: string) {
  // Push current object to stack
  if (selectedObject) {
    setNavigationStack(prev => [...prev, { typeId: selectedObject.type, objectId: selectedObject.id }]);
  }

  // Load new object
  loadObject(typeId, objectId);
}

function navigateBack() {
  if (navigationStack.length === 0) return;

  const prev = navigationStack[navigationStack.length - 1];
  setNavigationStack(stack => stack.slice(0, -1));
  loadObject(prev.typeId, prev.objectId);
}

// 10. Breadcrumb trail
<Breadcrumb>
  {navigationStack.map((nav, index) => (
    <BreadcrumbItem key={index} onClick={() => {
      // Navigate to this point in history
      setNavigationStack(stack => stack.slice(0, index));
      loadObject(nav.typeId, nav.objectId);
    }}>
      {nav.objectId}
    </BreadcrumbItem>
  ))}
  {selectedObject && (
    <BreadcrumbItem>
      {selectedObject.data.name || selectedObject.id}
    </BreadcrumbItem>
  )}
</Breadcrumb>
```

## Testing

```typescript
describe('Object Instance Explorer', () => {
  it('switches to instance view', async () => {
    render(<OntologyPage />);
    fireEvent.click(screen.getByText(/instance view/i));

    await waitFor(() => {
      expect(screen.getByText(/select object type/i)).toBeInTheDocument();
    });
  });

  it('searches for objects', async () => {
    render(<OntologyPage />);
    // Switch to instance view
    fireEvent.click(screen.getByText(/instance view/i));

    const searchInput = screen.getByPlaceholderText(/search objects/i);
    fireEvent.change(searchInput, { target: { value: 'ABC-123' } });
    fireEvent.click(screen.getByText(/search/i));

    await waitFor(() => {
      expect(screen.getByText(/contract #abc-123/i)).toBeInTheDocument();
    });
  });

  it('loads object details', async () => {
    render(<ObjectDetailPanel objectId="contract-123" typeId="pmbook-contract" />);

    await waitFor(() => {
      expect(screen.getByText(/properties/i)).toBeInTheDocument();
      expect(screen.getByText(/relationships/i)).toBeInTheDocument();
      expect(screen.getByText(/actions/i)).toBeInTheDocument();
    });
  });

  it('navigates to related object', async () => {
    render(<ObjectDetailPanel objectId="contract-123" typeId="pmbook-contract" />);

    // Expand relationships
    fireEvent.click(screen.getByText(/hasMany → CLIN/i));

    await waitFor(() => {
      expect(screen.getByText(/001 - Core IT Services/i)).toBeInTheDocument();
    });

    // Click related object
    fireEvent.click(screen.getByText(/001 - Core IT Services/i));

    await waitFor(() => {
      expect(screen.getByText(/CLIN #001/i)).toBeInTheDocument();
    });
  });

  it('navigates back in history', async () => {
    render(<ObjectDetailPanel />);
    // Assume we've navigated: Contract → CLIN → Budget

    fireEvent.click(screen.getByText(/back/i));

    await waitFor(() => {
      // Should return to CLIN
      expect(screen.getByText(/CLIN/i)).toBeInTheDocument();
    });
  });
});
```

## Dependencies

- `core/src/services/ontology/node.ts` - Load type definitions
- `core/src/services/ontology/edge.ts` - Load relationships
- `core/src/services/ontology/entity.ts` - Query object data
- `core/src/lib/api.ts` - API client for DynamoDB
- Radix UI - Accordion, Tabs, Card components
- React Hook Form - Search form
- Zustand - Instance explorer state

## Success Metrics

- **Adoption**: 60%+ users use instance view weekly
- **Performance**: Object loads in <500ms (95th percentile)
- **Navigation**: Users navigate 3+ hops on average
- **Satisfaction**: 4.5+ stars in user feedback

## Related Features

- Feature 5: Relationship Traversal (builds on instance explorer)
- Feature 6: Action Integration (executes actions on objects)
- Feature 7: Widget Integration (displays widgets for objects)
- Feature 9: Advanced Filtering (filters object lists)
