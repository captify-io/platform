# Feature: Advanced Features and UX Polish

## Overview

Implement power-user features, keyboard shortcuts, command palette, undo/redo, real-time collaboration, export/import capabilities, and version control to create a production-ready, professional-grade ontology management system.

### Current State

- Basic mouse interactions (click, drag)
- No keyboard shortcuts
- No undo/redo
- Manual page refresh for updates
- Limited export (PNG only)
- No version control
- No collaboration features

### Target State

- Comprehensive keyboard shortcuts for all operations
- Command palette (Cmd+K) for quick access
- Full undo/redo with visual history timeline
- Real-time WebSocket updates with presence indicators
- Export to multiple formats (JSON, CSV, GraphML, PNG, SVG, PDF)
- Import from various sources (CSV, JSON, GraphML)
- Version control with branching and merging
- Change tracking and audit log
- Automated backups

## Requirements

### Functional Requirements

**FR1: Keyboard Shortcuts**
- FR1.1: Global shortcuts (Cmd+K command palette, Cmd+Z undo, Cmd+Shift+Z redo)
- FR1.2: Node operations (N create node, E create edge, Delete remove, D duplicate)
- FR1.3: Selection (Cmd+A select all, Escape clear selection)
- FR1.4: Navigation (Arrow keys move, +/- zoom, 0 fit to view)
- FR1.5: Layout (L toggle layouts, C cluster, G group)
- FR1.6: View (V toggle 2D/3D, M toggle minimap, F search)
- FR1.7: Collaboration (U show users, P toggle presence)
- FR1.8: Customizable shortcuts with conflict detection

**FR2: Command Palette**
- FR2.1: Fuzzy search across all commands
- FR2.2: Recent commands at top
- FR2.3: Command categories (Node, Edge, View, Layout, Tools)
- FR2.4: Keyboard navigation (arrows, Enter)
- FR2.5: Command aliases (synonyms)
- FR2.6: Help text with keyboard shortcuts
- FR2.7: Context-aware commands (show relevant commands for selection)

**FR3: Undo/Redo System**
- FR3.1: Stack-based undo/redo with unlimited history
- FR3.2: Group operations (batch undo)
- FR3.3: Visual history timeline with thumbnails
- FR3.4: Selective undo (undo specific operation)
- FR3.5: Branching history (undo to earlier state, create branch)
- FR3.6: Persistent history (survives page refresh)
- FR3.7: History export/import

**FR4: Real-Time Updates**
- FR4.1: WebSocket connection for live updates
- FR4.2: Automatic reconnection with exponential backoff
- FR4.3: Optimistic updates with rollback
- FR4.4: Conflict detection and resolution
- FR4.5: Update notifications (toast, activity feed)
- FR4.6: Selective sync (subscribe to specific entities)
- FR4.7: Offline mode with queue

**FR5: Export Capabilities**
- FR5.1: Export formats:
  - JSON (ontology data)
  - CSV (nodes and edges separately)
  - GraphML (standard graph format)
  - PNG (high-res image)
  - SVG (vector graphics)
  - PDF (multi-page document)
  - Markdown (documentation)
- FR5.2: Export options (selected nodes only, include/exclude properties)
- FR5.3: Export templates (predefined export configs)
- FR5.4: Scheduled exports (daily, weekly)
- FR5.5: Export to S3 bucket

**FR6: Import Capabilities**
- FR6.1: Import formats:
  - JSON (ontology data)
  - CSV (nodes and edges)
  - GraphML
  - YAML
- FR6.2: Import validation with error reporting
- FR6.3: Mapping UI (map CSV columns to node properties)
- FR6.4: Merge strategy (update existing, skip, error)
- FR6.5: Dry-run preview before import
- FR6.6: Import history and rollback

**FR7: Version Control**
- FR7.1: Git-like version control (commit, branch, merge)
- FR7.2: Commit message and metadata
- FR7.3: Branch visualization (tree view)
- FR7.4: Diff view (compare versions)
- FR7.5: Merge with conflict resolution
- FR7.6: Rollback to previous version
- FR7.7: Tags and releases

**FR8: Change Tracking**
- FR8.1: Audit log for all operations
- FR8.2: Change history per entity
- FR8.3: User attribution (who changed what when)
- FR8.4: Change notifications (email, Slack)
- FR8.5: Change review workflow (approve/reject)
- FR8.6: Rollback individual changes

**FR9: Automated Backups**
- FR9.1: Scheduled backups (hourly, daily)
- FR9.2: Incremental backups (only changed data)
- FR9.3: Backup to S3 with versioning
- FR9.4: Restore from backup
- FR9.5: Backup verification
- FR9.6: Retention policy (30 days, 90 days, 1 year)

### Non-Functional Requirements

**NFR1: Performance**
- Keyboard shortcuts: < 50ms response time
- Command palette: < 100ms to open
- Undo/redo: < 200ms to apply
- Real-time updates: < 500ms latency
- Export: < 5 seconds for 500 nodes

**NFR2: Usability**
- All shortcuts discoverable via command palette
- Clear visual feedback for all operations
- Non-blocking exports (background processing)
- Intuitive import mapping UI

**NFR3: Reliability**
- WebSocket reconnection: 3 retries with exponential backoff
- Undo/redo: No data loss on stack overflow
- Import: Atomic operations (all or nothing)
- Backups: Verified and tested regularly

**NFR4: Security**
- Audit log: Tamper-proof with checksums
- Version control: Signed commits
- Backups: Encrypted at rest
- Export: PII masking option

## Architecture

### Component Structure

```
platform/src/app/ontology/ontology/builder/
├── components/
│   ├── keyboard/
│   │   ├── KeyboardShortcutsProvider.tsx  # Global shortcuts
│   │   ├── ShortcutOverlay.tsx            # Help overlay (show shortcuts)
│   │   └── ShortcutEditor.tsx             # Customize shortcuts
│   │
│   ├── command-palette/
│   │   ├── CommandPalette.tsx             # Main palette (Cmd+K)
│   │   ├── CommandSearch.tsx              # Fuzzy search
│   │   ├── CommandList.tsx                # Command results
│   │   └── CommandItem.tsx                # Individual command
│   │
│   ├── history/
│   │   ├── UndoRedoControls.tsx           # Undo/redo buttons
│   │   ├── HistoryTimeline.tsx            # Visual timeline
│   │   ├── HistoryBranching.tsx           # Branch visualization
│   │   └── SelectiveUndo.tsx              # Pick specific operation
│   │
│   ├── real-time/
│   │   ├── WebSocketProvider.tsx          # WebSocket connection
│   │   ├── UpdateNotification.tsx         # Update toast
│   │   ├── ConflictResolution.tsx         # Merge conflicts
│   │   └── OfflineIndicator.tsx           # Offline status
│   │
│   ├── export/
│   │   ├── ExportDialog.tsx               # Export options
│   │   ├── FormatSelector.tsx             # Choose format
│   │   ├── ExportOptions.tsx              # Format-specific options
│   │   ├── ExportPreview.tsx              # Preview export
│   │   └── ExportProgress.tsx             # Progress indicator
│   │
│   ├── import/
│   │   ├── ImportDialog.tsx               # Import wizard
│   │   ├── FileUpload.tsx                 # Upload file
│   │   ├── MappingEditor.tsx              # Map CSV columns
│   │   ├── ValidationResults.tsx          # Show errors
│   │   └── ImportPreview.tsx              # Dry-run preview
│   │
│   ├── version-control/
│   │   ├── VersionPanel.tsx               # Version history
│   │   ├── CommitDialog.tsx               # Commit message
│   │   ├── BranchTree.tsx                 # Branch visualization
│   │   ├── DiffViewer.tsx                 # Compare versions
│   │   ├── MergeDialog.tsx                # Merge branches
│   │   └── RollbackDialog.tsx             # Restore version
│   │
│   └── backup/
│       ├── BackupStatus.tsx               # Backup indicator
│       ├── BackupHistory.tsx              # Past backups
│       ├── RestoreDialog.tsx              # Restore from backup
│       └── BackupSettings.tsx             # Configure backups
│
├── hooks/
│   ├── useKeyboardShortcuts.ts            # Shortcuts hook
│   ├── useCommandPalette.ts               # Palette state
│   ├── useUndoRedo.ts                     # History management
│   ├── useWebSocket.ts                    # Real-time connection
│   ├── useExport.ts                       # Export logic
│   ├── useImport.ts                       # Import logic
│   ├── useVersionControl.ts               # Version control
│   └── useBackup.ts                       # Backup management
│
├── services/
│   ├── keyboard-manager.ts                # Keyboard event handling
│   ├── command-registry.ts                # Command registration
│   ├── history-manager.ts                 # Undo/redo stack
│   ├── websocket-client.ts                # WebSocket client
│   ├── export-engine.ts                   # Export generators
│   ├── import-engine.ts                   # Import parsers
│   ├── version-control.ts                 # Git-like operations
│   └── backup-service.ts                  # Backup/restore
│
└── workers/
    ├── export-worker.ts                   # Background exports
    ├── import-worker.ts                   # Background imports
    └── backup-worker.ts                   # Background backups
```

### Undo/Redo Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Action                               │
│  (Create node, Update property, Delete edge, etc.)          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                  History Manager                             │
│  - Create operation object                                   │
│  - Execute operation (apply to state)                        │
│  - Push to undo stack                                        │
│  - Clear redo stack                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    Undo Stack                                │
│  [Op5] ← [Op4] ← [Op3] ← [Op2] ← [Op1]                      │
│                           ↑                                  │
│                      Current State                           │
└─────────────────────────────────────────────────────────────┘

// Undo operation
User presses Cmd+Z
       ↓
┌──────────────────────────────────────┐
│  Pop from undo stack                 │
│  Execute inverse operation           │
│  Push to redo stack                  │
└──────────────────────────────────────┘

// Redo operation
User presses Cmd+Shift+Z
       ↓
┌──────────────────────────────────────┐
│  Pop from redo stack                 │
│  Execute operation                   │
│  Push to undo stack                  │
└──────────────────────────────────────┘
```

### Real-Time Updates Flow

```
┌─────────────────────────────────────────────────────────────┐
│                User 1: Makes Change                          │
│  - Create node                                               │
│  - Update locally (optimistic)                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                WebSocket Server                              │
│  - Receive change event                                      │
│  - Validate change                                           │
│  - Broadcast to all connected users                          │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ↓               ↓               ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ User 1       │  │ User 2       │  │ User 3       │
│ (originator) │  │              │  │              │
│              │  │ - Receive    │  │ - Receive    │
│ - Confirm    │  │   update     │  │   update     │
│   change     │  │ - Apply to   │  │ - Apply to   │
│              │  │   local      │  │   local      │
│              │  │   state      │  │   state      │
│              │  │ - Show       │  │ - Show       │
│              │  │   toast      │  │   toast      │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Data Model

### Keyboard Shortcut

```typescript
interface KeyboardShortcut {
  id: string;
  command: string;                   // Command ID
  keys: string[];                    // ['cmd', 'k']
  description: string;
  category: string;                  // 'node', 'edge', 'view', etc.
  enabled: boolean;
  custom?: boolean;                  // User-defined shortcut
}
```

### Command

```typescript
interface Command {
  id: string;
  name: string;
  description: string;
  category: string;
  aliases?: string[];                // Alternative names
  shortcut?: string;                 // Keyboard shortcut
  icon?: string;

  // Execution
  execute: (context: CommandContext) => Promise<void>;

  // Availability
  enabled?: (context: CommandContext) => boolean;
  visible?: (context: CommandContext) => boolean;
}

interface CommandContext {
  selectedNodes: string[];
  selectedEdges: string[];
  graph: Graph3D;
  user: User;
}
```

### History Operation

```typescript
interface HistoryOperation {
  id: string;
  type: 'create_node' | 'update_node' | 'delete_node' | 'create_edge' | 'delete_edge' | 'move_nodes' | 'group' | 'ungroup';
  timestamp: Date;
  userId: string;

  // Operation data
  forward: {                         // How to redo this operation
    fn: string;                      // Function name
    args: any[];
  };
  backward: {                        // How to undo this operation
    fn: string;
    args: any[];
  };

  // Metadata
  description: string;               // Human-readable description
  thumbnail?: string;                // Visual preview
  grouped?: string;                  // Group ID for batch operations
}
```

### Export Configuration

```typescript
interface ExportConfig {
  format: 'json' | 'csv' | 'graphml' | 'png' | 'svg' | 'pdf' | 'markdown';
  scope: 'all' | 'selection' | 'visible';
  includeProperties?: boolean;
  includeMetadata?: boolean;

  // Format-specific options
  json?: {
    pretty: boolean;
    indent: number;
  };
  csv?: {
    delimiter: string;
    includeHeaders: boolean;
    nodesFile: string;
    edgesFile: string;
  };
  image?: {
    width: number;
    height: number;
    backgroundColor: string;
    transparent: boolean;
  };
  pdf?: {
    pageSize: 'A4' | 'Letter';
    orientation: 'portrait' | 'landscape';
    includeMetadata: boolean;
  };
}
```

### Version Control

```typescript
interface Version {
  id: string;                        // Commit hash
  message: string;                   // Commit message
  author: string;
  timestamp: Date;
  parent?: string;                   // Parent commit ID
  branch: string;
  tag?: string;                      // Optional tag

  // Changes
  changes: {
    nodesAdded: number;
    nodesModified: number;
    nodesDeleted: number;
    edgesAdded: number;
    edgesDeleted: number;
  };

  // Snapshot
  snapshot?: string;                 // S3 key for full snapshot
}

interface Branch {
  id: string;
  name: string;
  head: string;                      // Current commit
  created: Date;
  createdBy: string;
  active: boolean;
}
```

## API Actions

### Keyboard Shortcuts API

```typescript
// Get all shortcuts
export function getKeyboardShortcuts(): KeyboardShortcut[];

// Update shortcut
export async function updateShortcut(
  id: string,
  keys: string[]
): Promise<KeyboardShortcut>;

// Reset to defaults
export async function resetShortcuts(): Promise<void>;
```

### History API

```typescript
// Undo operation
export async function undo(): Promise<void>;

// Redo operation
export async function redo(): Promise<void>;

// Get history
export function getHistory(): {
  undoStack: HistoryOperation[];
  redoStack: HistoryOperation[];
  current: number;
};

// Undo to specific operation
export async function undoTo(operationId: string): Promise<void>;

// Clear history
export function clearHistory(): void;
```

### Export API

```typescript
// Export graph
export async function exportGraph(
  config: ExportConfig
): Promise<{
  data: Blob | string;
  filename: string;
}>;

// Export to S3
export async function exportToS3(
  config: ExportConfig,
  bucket: string,
  key: string
): Promise<{ location: string }>;
```

### Import API

```typescript
// Import graph
export async function importGraph(
  file: File,
  options: {
    format: 'json' | 'csv' | 'graphml' | 'yaml';
    mergeStrategy: 'update' | 'skip' | 'error';
    mapping?: Record<string, string>;  // CSV column mapping
  }
): Promise<{
  success: boolean;
  nodesImported: number;
  edgesImported: number;
  errors: string[];
}>;

// Validate import
export async function validateImport(
  file: File,
  format: string
): Promise<{
  valid: boolean;
  errors: string[];
  preview: { nodes: number; edges: number };
}>;
```

### Version Control API

```typescript
// Commit changes
export async function commit(
  message: string,
  author: string
): Promise<Version>;

// Create branch
export async function createBranch(
  name: string
): Promise<Branch>;

// Checkout branch/version
export async function checkout(
  branchOrVersionId: string
): Promise<void>;

// Merge branches
export async function merge(
  sourceBranch: string,
  targetBranch: string
): Promise<{
  success: boolean;
  conflicts?: Array<{
    nodeId: string;
    property: string;
    sourceValue: any;
    targetValue: any;
  }>;
}>;

// Get version diff
export async function diff(
  versionA: string,
  versionB: string
): Promise<{
  nodesAdded: Node3D[];
  nodesModified: Array<{ id: string; changes: Record<string, any> }>;
  nodesDeleted: string[];
  edgesAdded: Edge3D[];
  edgesDeleted: string[];
}>;
```

## Implementation Notes

### Phase 5A: Keyboard and Command Palette (Week 9)

1. Implement keyboard shortcut system with tinykeys
2. Create command registry and palette UI
3. Add shortcut customization
4. Implement fuzzy search with fuse.js
5. Add command categories and help

### Phase 5B: Undo/Redo (Week 9)

1. Implement history manager with stack
2. Create operation objects for all actions
3. Add visual history timeline
4. Implement branching history
5. Persist history to localStorage

### Phase 5C: Real-Time Updates (Week 9)

1. Set up WebSocket server (ws or Socket.io)
2. Implement client-side connection management
3. Add optimistic updates
4. Create conflict resolution UI
5. Implement offline mode with queue

### Phase 5D: Export/Import (Week 10)

1. Implement export to JSON, CSV, GraphML
2. Add image export (PNG, SVG) with html2canvas
3. Create PDF export with jsPDF
4. Implement CSV import with mapping UI
5. Add validation and preview

### Phase 5E: Version Control and Backup (Week 10)

1. Implement Git-like version control
2. Create commit/branch/merge UI
3. Add diff viewer
4. Implement automated backups to S3
5. Create restore functionality

### Testing Strategy

```typescript
// Keyboard shortcuts test
describe('Keyboard Shortcuts', () => {
  it('executes command on shortcut', async () => {
    const { container } = render(<OntologyBuilder />);

    // Press Cmd+K
    await userEvent.keyboard('{Meta>}k{/Meta}');

    const palette = screen.getByRole('dialog');
    expect(palette).toBeInTheDocument();
  });
});

// Undo/Redo test
describe('Undo/Redo', () => {
  it('undoes node creation', async () => {
    const { history } = render(<OntologyBuilder />);

    // Create node
    await createNode({ label: 'Test', type: 'entity' });
    expect(screen.getByText('Test')).toBeInTheDocument();

    // Undo
    await history.undo();
    expect(screen.queryByText('Test')).not.toBeInTheDocument();

    // Redo
    await history.redo();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});

// Real-time updates test
describe('Real-Time Updates', () => {
  it('receives updates from other users', async () => {
    const ws = mockWebSocket();
    render(<OntologyBuilder />);

    // Simulate update from other user
    ws.emit('node:created', {
      node: { id: 'n1', label: 'Remote Node', type: 'entity' }
    });

    await waitFor(() => {
      expect(screen.getByText('Remote Node')).toBeInTheDocument();
    });
  });
});
```

## Success Metrics

### Adoption
- 80% of users use keyboard shortcuts
- Command palette opened 1000+ times per day
- 500+ undo/redo operations per day
- 50+ imports/exports per week

### Performance
- Keyboard response: < 50ms
- Undo/redo: < 200ms
- Export 500 nodes: < 5s
- Import 1000 nodes: < 10s

### Quality
- 0 undo/redo bugs
- 100% WebSocket uptime
- 0 data loss in imports
- 100% backup success rate

## Related Documentation

- [tinykeys Documentation](https://github.com/jamiebuilds/tinykeys)
- [fuse.js Documentation](https://fusejs.io/)
- [Socket.io Documentation](https://socket.io/docs/)
- [html2canvas Documentation](https://html2canvas.hertzen.com/)

---

**Feature Owner**: Platform Team
**Priority**: P1 (Important)
**Estimated Effort**: 2 weeks
**Dependencies**: Phases 1-4
