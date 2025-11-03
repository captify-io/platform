# Ontology Builder

Visual designer for building and managing ontology nodes and relationships using React Flow (xyflow).

## Features

### Visual Canvas
- **Drag & Drop**: Freely position nodes on the canvas
- **Right-Click Menu**: Add new nodes anywhere on the canvas
- **Connect Nodes**: Click and drag between nodes to create relationships
- **Zoom & Pan**: Full canvas controls with minimap
- **Visual Feedback**: Animated edges, selection highlighting, hover states

### Node Management
- **Create Nodes**: Right-click canvas → select node type
- **Edit Properties**: Click any node to open comprehensive editor
- **Delete Nodes**: Remove nodes and their relationships
- **Data Attachment**: Connect DynamoDB tables to nodes
- **Visual Customization**: Set colors, icons, shapes for each node

### Relationship Management
- **Create Edges**: Drag from one node to another
- **Edit Relationships**: Click edges to modify properties
- **Set Cardinality**: one-to-one, one-to-many, many-to-many
- **Label Relationships**: Add descriptive labels to connections
- **Delete Edges**: Remove relationships between nodes

### Node Editor Tabs

#### 1. Basic
- Type, Label, Description
- Category, Domain, App
- Table name
- Visual properties (icon, color, shape)

#### 2. Relationships
- Allowed Sources: node types that can connect TO this node
- Allowed Targets: node types this node can connect TO
- Allowed Connectors: relationship types (e.g., "funds", "implements")

#### 3. Data
- Attach DynamoDB table data
- View record counts
- Preview data source

#### 4. Groups
- Organize nodes into logical groups
- Add multiple group tags

#### 5. Permissions
- Define roles that can access the node
- Set permissions per role

## Usage

### From Ontology List
1. Navigate to `/core/designer/ontology`
2. Click **"Open Builder"** button (top right) - opens full ontology
3. Or click **"Builder"** button on any row - opens that node's context

### Adding Nodes
1. **Right-click** anywhere on canvas
2. Select node type from menu
3. Node appears at cursor position

### Creating Relationships
1. Click and drag from one node's connection point
2. Drag to another node's connection point
3. Release to create edge
4. Click edge to edit properties

### Editing Nodes
1. Click on any node
2. Edit dialog opens with 5 tabs
3. Make changes
4. Click **Save Changes**

### Attaching Data
1. Click node to open editor
2. Go to **Data** tab
3. Ensure table name is set
4. Click **Attach Data**
5. Table data loads and count displays

### Saving
- Click **Save** in header to persist all changes to DynamoDB
- Auto-marks as "Unsaved changes" when modified

### Exporting
- Click **Export** to download ontology as JSON
- Includes all nodes, edges, and metadata

## Architecture

### Context
`OntologyContext.tsx` - State management
- Nodes and edges state
- CRUD operations
- Data attachment
- Persistence (save/load)
- Export functionality

### Components
- `OntologyCanvas.tsx` - React Flow canvas
- `OntologyNodeComponent.tsx` - Custom node renderer
- `OntologyNodeDialog.tsx` - Node editor with tabs
- `OntologyEdgeDialog.tsx` - Relationship editor

### Data Model

#### OntologyNode
```typescript
{
  id: string;
  type: string;
  label: string;
  category: string;
  domain: string;
  table: string;
  color: string;
  shape: string;
  allowedSources: string[];
  allowedTargets: string[];
  allowedConnectors: string[];
  groups?: string[];
  roles?: string[];
  permissions?: Record<string, any>;
  properties?: {
    attachedData?: any[];
    dataSource?: string;
    dataCount?: number;
  };
  position: { x: number; y: number };
}
```

#### OntologyEdge
```typescript
{
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
  properties?: {
    description?: string;
    cardinality?: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
    required?: boolean;
  };
}
```

## Database Tables

### core-OntologyNode
Stores node definitions and properties.

### core-OntologyEdge
Stores relationships between nodes.

## Keyboard Shortcuts

- **Right-Click**: Open context menu
- **Click + Drag**: Pan canvas
- **Scroll**: Zoom in/out
- **Ctrl/Cmd + Click**: Multi-select (future)
- **Delete**: Remove selected node/edge (future)

## Future Enhancements

- [ ] Multi-select nodes
- [ ] Copy/paste nodes
- [ ] Undo/redo functionality
- [ ] Import from JSON
- [ ] Node templates
- [ ] Auto-layout algorithms
- [ ] Collaborative editing
- [ ] Version history
- [ ] Search and filter in canvas
- [ ] Keyboard shortcuts for actions
