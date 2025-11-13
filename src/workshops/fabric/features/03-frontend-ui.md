# Feature: Fabric Frontend UI Components

## Overview

The Fabric UI provides an Captify-inspired knowledge management interface integrated with Captify's ontology system. It features a three-panel layout with tabbed sidebar, multi-tab editor area, and contextual inspector panel. The UI is built using the existing Spaces architecture pattern and Next.js App Router.

## Requirements

### Functional Requirements

#### Panel 1: Tabbed Sidebar (Left)

**Tab Navigation Bar:**
- `[Folder] [Ontology] [Search] [Bookmarks] ───────── [◀]`
- Tabs switch content view below
- Open/close button (◀/▶) collapses entire sidebar
- Active tab highlighted with accent color

**Folder View:**
```
Toolbar: [+ Note] [+ Folder] [Sort ▼]

📁 Root
  📁 SOPs
    📄 Contract Review Process
    📄 Security Clearance Guide
  📁 Contracts
    📄 ABC-123 Notes
  📄 Daily Note - 2025-11-10
```

**Features:**
- Show all notes/folders in current space
- Hierarchical folder tree with expand/collapse
- Custom folder icons and colors
- Drag-and-drop to move notes between folders
- Quick filters: [By Tag] [By Type] [By Owner]
- Pinned notes always at top (⭐ icon)
- **Toolbar Actions:**
  - `+ Note`: Create new note (opens immediately in editor)
  - `+ Folder`: Create new folder
  - `Sort ▼`: Change sort order (Name, Modified, Created)

**Ontology View:**
```
Toolbar: [Objects] [Links] [Actions] [Workflows] [Tools] [+]

Contract (12)
  📄 ABC-123
  📄 DEF-456
CLIN (45)
  📄 ABC-123-001
  📄 ABC-123-002
```

**Features:**
- Browse ontology objects linked to notes
- Sub-tabs for: Objects, Links, Actions, Workflows, Tools
- `+` button: Create new ontology entity
- Count badge shows number of items
- Click entity to open detail page
- Show notes that reference each entity

**Search View:**
```
Toolbar: [🔍 Search notes...] [⚙️]

Results (3):
  📄 Contract Review Process
    ...matching snippet with **highlights**...
  📄 ABC-123 Notes
    ...another matching snippet...
```

**Features:**
- Full-text search across all notes
- Search as you type (debounced 300ms)
- Highlight matching text in results
- Settings (⚙️): Search scope, filters, operators
- Recent searches dropdown

**Bookmarks View:**
```
Toolbar: [+ Bookmark] [+ Group] [Collapse All]

⭐ Pinned Notes
  📄 Contract Review Process
  📄 Security Guidelines

📂 SOPs Group
  📄 Onboarding Checklist
  📄 Deployment Process

👁️ Watching
  📄 ABC-123 Notes (3 updates)
```

**Features:**
- `+ Bookmark`: Bookmark current active tab
- `+ Group`: Create bookmark group
- Watching: Files user is monitoring for changes
- Update badges show unread changes
- Drag to reorder bookmarks

#### Panel 2: Editor Area (Center)

**Tab Bar:**
```
[📄 Daily Note] [📄 SOP ×] [📄 Contract × ] [+] ─────── [Split ⊞] [Zen 🖵]
```

**Features:**
- **Multiple Tabs**: Open multiple notes simultaneously
- **Draggable Tabs**: Reorder by dragging
- **Close Button**: × on each tab
- **+ Button**: New note
- **Split Pane**: ⊞ button toggles side-by-side editing
- **Zen Mode**: 🖵 button hides sidebars (Advanced)

**Editor:**
```
┌────────────────────────────────────────────────────┐
│ [B] [I] [H1] [H2] [H3] [•] [1.] [☑] ["] [</>]     │ ← Toolbar (always visible)
├────────────────────────────────────────────────────┤
│                                                    │
│  # Daily Note - 2025-11-10                        │
│                                                    │
│  ## Tasks                                          │
│  - [x] Review [[contract::ABC-123]]               │ ← Wikilinks
│  - [ ] Update [[SOP/Contract Review]]             │
│                                                    │
│  #daily #review                                    │ ← Tags
│                                                    │
│  > [!info] Remember                               │ ← Callouts
│  > Check clearance levels before sharing          │
│                                                    │
│  {{widget:contract-summary id="ABC-123"}}         │ ← Widgets
│                                                    │
│                                    Saving... ⏳    │ ← Save indicator
└────────────────────────────────────────────────────┘
```

**Features:**
- **ProseMirror Editor**: Custom implementation with Y.js
- **Auto-save**: 500ms debounce after typing stops
- **Save Indicator**: Shows "Saving...", "Saved ✓", or "Error ⚠"
- **Always-visible Toolbar**: Bold, Italic, Headings, Lists, Blockquote, Code
- **Right-click Context Menu**: Formatting, Insert link, Insert image, "Ask Cappy"
- **Slash Commands**: `/` for block insertion (Advanced)
- **Keyboard Shortcuts**: All Captify shortcuts supported

**Split Pane Mode:**
```
┌───────────────────────┬────────────────────────┐
│ 📄 Daily Note         │ 📄 SOP                 │
│                       │                        │
│ Content...            │ Content...             │
│                       │                        │
└───────────────────────┴────────────────────────┘
```

#### Panel 3: Inspector (Right)

**Graph View (Top):**
```
┌──────────────────────────────────┐
│  Graph: "Contract Review SOP"    │
│                                  │
│      [Contract]                  │
│         ↓                        │
│      [SOP] ← You are here        │
│         ↓                        │
│      [CLIN]                      │
│                                  │
│  [Expand 🔍]                     │
└──────────────────────────────────┘
```

**Features:**
- **Local Graph**: Shows current note and immediate connections
- **Interactive**: Click nodes to navigate
- **Expand Button**: Opens full-screen graph modal
- **Always Available**: Present on every page/note/workflow
- **Real-time Updates**: Graph updates as links are added/removed

**Tabs:**
```
[Backlinks] [Outline] [Properties] [Stats]

Backlinks (5):
  📄 ABC-123 Notes
  📄 Daily Note - 2025-11-09
  📄 Contract Checklist

Outline:
  # Contract Review SOP
  ## Purpose
  ## Process
    ### Step 1: Initial Review
    ### Step 2: Clearance Check
  ## Related Documents

Properties (YAML):
  type: sop
  category: contract
  owner: john.doe
  clearance: SECRET
  tags: [contract, review]

Stats:
  📝 1,234 words
  ⏱️ 5 min read
  👤 Last edited by: John Doe
  📅 Last edited: 2 hours ago
  👁️ 3 watchers
```

**Features:**
- **Backlinks**: Notes linking to current note (clickable)
- **Outline**: Document structure from H1-H6 headings
- **Properties**: YAML frontmatter editor
- **Stats**: Word count, reading time, edit history
- **AI Suggestions**: "Related notes you might want to link" (Advanced)
- **Version History**: View previous versions (Advanced)

### Non-Functional Requirements

#### Performance
- Tab switching: <50ms
- Search results: <200ms
- Auto-save: 500ms debounce
- Graph render: <300ms for <100 nodes

#### Responsiveness
- **Desktop**: Three-panel layout (1200px+)
- **Tablet**: Collapsible sidebars (768px - 1199px)
- **Mobile**:
  - Sidebar collapses to hamburger menu
  - Inspector moves to bottom sheet (Advanced)
  - Touch gestures for navigation
  - Single-column layout

#### Accessibility
- Keyboard navigation for all actions
- ARIA labels on all interactive elements
- Focus indicators visible
- Screen reader support

## Architecture

### Directory Structure

```
platform/src/app/fabric/
├── page.tsx                    # Main orchestrator
├── layout.tsx                  # Full-screen layout
├── components/
│   ├── sidebar/
│   │   ├── sidebar.tsx
│   │   ├── folder-view.tsx
│   │   ├── ontology-view.tsx
│   │   ├── search-view.tsx
│   │   ├── bookmarks-view.tsx
│   │   ├── folder-tree.tsx
│   │   ├── note-list.tsx
│   │   └── toolbar.tsx
│   ├── editor/
│   │   ├── editor-area.tsx
│   │   ├── tab-bar.tsx
│   │   ├── note-editor.tsx
│   │   ├── split-pane.tsx
│   │   ├── toolbar.tsx
│   │   └── save-indicator.tsx
│   ├── inspector/
│   │   ├── inspector.tsx
│   │   ├── graph-view.tsx
│   │   ├── backlinks-panel.tsx
│   │   ├── outline-panel.tsx
│   │   ├── properties-panel.tsx
│   │   └── stats-panel.tsx
│   ├── dialogs/
│   │   ├── template-picker.tsx
│   │   ├── export-dialog.tsx
│   │   ├── folder-settings.tsx
│   │   └── bookmark-group.tsx
│   └── shared/
│       ├── context-menu.tsx
│       ├── quick-switcher.tsx (Advanced)
│       └── command-palette.tsx (Advanced)
├── hooks/
│   ├── use-fabric-store.ts
│   ├── use-note-editor.ts
│   ├── use-wikilinks.ts
│   ├── use-backlinks.ts
│   ├── use-realtime-sync.ts
│   ├── use-search.ts
│   ├── use-bookmarks.ts
│   └── use-graph-data.ts
└── lib/
    ├── types.ts
    ├── markdown-parser.ts
    ├── wikilink-resolver.ts
    ├── export.ts
    └── shortcuts.ts
```

### Component Hierarchy

```
FabricPage (page.tsx)
├── FabricLayout (layout.tsx)
│   ├── Sidebar (components/sidebar/sidebar.tsx)
│   │   ├── TabBar [Folder|Ontology|Search|Bookmarks] [◀]
│   │   ├── FolderView
│   │   │   ├── Toolbar [+Note] [+Folder] [Sort]
│   │   │   └── FolderTree
│   │   ├── OntologyView
│   │   │   ├── Toolbar [Objects|Links|...] [+]
│   │   │   └── EntityList
│   │   ├── SearchView
│   │   │   ├── Toolbar [Search] [Settings]
│   │   │   └── SearchResults
│   │   └── BookmarksView
│   │       ├── Toolbar [+Bookmark] [+Group]
│   │       └── BookmarkList
│   ├── EditorArea (components/editor/editor-area.tsx)
│   │   ├── TabBar (draggable tabs)
│   │   ├── NoteEditor (ProseMirror)
│   │   └── SplitPane (conditional)
│   └── Inspector (components/inspector/inspector.tsx)
│       ├── GraphView (always on top)
│       ├── TabBar [Backlinks|Outline|Properties|Stats]
│       ├── BacklinksPanel
│       ├── OutlinePanel
│       ├── PropertiesPanel
│       └── StatsPanel
└── Dialogs (conditional)
    ├── TemplatePicker
    ├── ExportDialog
    └── FolderSettings
```

## Data Model

### Sidebar State

```typescript
interface SidebarState {
  activeTab: 'folder' | 'ontology' | 'search' | 'bookmarks';
  isOpen: boolean;
  width: number; // Resizable

  folderView: {
    expandedFolders: string[];
    pinnedNotes: string[];
    sortOrder: 'name' | 'modified' | 'created';
    filters: {
      tags?: string[];
      type?: string;
      owner?: string;
    };
  };

  ontologyView: {
    activeSubTab: 'objects' | 'links' | 'actions' | 'workflows' | 'tools';
    expandedTypes: string[];
  };

  searchView: {
    query: string;
    results: SearchResult[];
    recentSearches: string[];
    settings: SearchSettings;
  };

  bookmarksView: {
    bookmarks: Bookmark[];
    groups: BookmarkGroup[];
    watchedNotes: string[];
  };
}
```

### Editor State

```typescript
interface EditorState {
  tabs: EditorTab[];
  activeTabId: string;
  splitMode: boolean;
  zenMode: boolean;

  autoSave: {
    isDirty: boolean;
    isSaving: boolean;
    lastSaved: Date;
    error?: string;
  };
}

interface EditorTab {
  id: string;
  noteId: string;
  title: string;
  isDirty: boolean;
  scrollPosition: number;
}
```

### Inspector State

```typescript
interface InspectorState {
  isOpen: boolean;
  width: number;
  activeTab: 'backlinks' | 'outline' | 'properties' | 'stats';

  graphView: {
    focusNode: string;
    expandedDepth: number;
    layout: 'force' | 'tree' | 'radial';
  };
}
```

## API Actions

All actions use the existing `apiClient` pattern:

### Note Operations
- `createNote(spaceId, title, folder?, template?)` → Opens in editor immediately
- `updateNote(noteId, yjsUpdate)` → Auto-save every 500ms
- `deleteNote(noteId)` → Close tab, remove from folder tree
- `listNotes(spaceId, filters)` → Populate folder view

### Folder Operations
- `createFolder(spaceId, path, icon?, color?)`
- `updateFolder(folderId, { icon, color, name })`
- `deleteFolder(folderId)` → Prompt if contains notes
- `moveNote(noteId, newFolder)`

### Bookmark Operations
- `createBookmark(noteId, groupId?)`
- `createBookmarkGroup(name)`
- `deleteBookmark(bookmarkId)`
- `watchNote(noteId)` → Add to watching list

### Search Operations
- `searchNotes(spaceId, query, filters)`
- `getRecentSearches(userId)`
- `saveSearch(query, name)` → Bookmarkable searches

### Graph Operations
- `getGraphData(noteId, depth)` → For graph view
- `getBacklinks(noteId)` → For backlinks panel
- `getOutline(noteId)` → Extract headings

## Implementation Notes

### Integration with Spaces

The Fabric UI integrates with the existing Spaces architecture:

```typescript
// Use existing space context
import { useSpace } from '@captify-io/core/components/spaces';

export function FabricPage() {
  const { space } = useSpace();

  // All fabric notes belong to current space
  const { notes } = useFabricStore(space.id);

  return (
    <FabricLayout spaceId={space.id}>
      {/* ... */}
    </FabricLayout>
  );
}
```

**Workspace Support:**
- Each Space can have its own folder structure
- Notes are scoped to `spaceId`
- Switching spaces switches entire note collection
- Ontology view shows entities linked to notes in current space

### Wikilinks Explained

**Wikilinks** are Captify-style double-bracket syntax for linking:

```markdown
Basic note link: [[Contract Review SOP]]
Link with custom text: [[Contract Review SOP|Review Process]]
Link to heading: [[SOP#Step 1]]
Link to block: [[Note^block-id]]
Ontology link: [[contract::ABC-123]]  ← Creates ontology edge
```

**Behavior:**
- Typing `[[` triggers auto-complete dropdown
- Shows matching note titles as you type
- Enter to insert link
- Click link to open note in new tab
- Ontology links (`type::id`) create bidirectional edges
- Unresolved links shown in different color (note doesn't exist yet)

### Daily Notes

**Auto-creation:**
- Daily note created at midnight (user's timezone)
- Title format: `Daily Note - YYYY-MM-DD`
- Folder: `/Daily Notes/YYYY/MM/`
- Template: `template-daily-note` if exists
- Opens automatically on first visit of the day

**Template Variables:**
```yaml
---
date: {{date:YYYY-MM-DD}}
dayOfWeek: {{date:dddd}}
user: {{user.name}}
---

# Daily Note - {{date:MMMM D, YYYY}}

## Tasks for today
- [ ]

## Notes

## Links
```

### Keyboard Shortcuts (Captify Compatible)

**Navigation:**
- `Cmd/Ctrl + O`: Quick switcher (jump to note)
- `Cmd/Ctrl + P`: Command palette
- `Cmd/Ctrl + \`: Toggle sidebar
- `Cmd/Ctrl + ,`: Settings

**Editing:**
- `Cmd/Ctrl + B`: Bold
- `Cmd/Ctrl + I`: Italic
- `Cmd/Ctrl + K`: Insert link
- `Cmd/Ctrl + E`: Toggle edit/preview
- `Cmd/Ctrl + Enter`: Toggle checkbox

**Notes:**
- `Cmd/Ctrl + N`: New note
- `Cmd/Ctrl + W`: Close current tab
- `Cmd/Ctrl + Tab`: Next tab
- `Cmd/Ctrl + Shift + Tab`: Previous tab

**Advanced:**
- `Cmd/Ctrl + /`: Toggle split pane
- `Cmd/Ctrl + Shift + F`: Search in all notes
- `Cmd/Ctrl + G`: Open graph view

### Theme Integration

Use existing Next.js theme system:

```typescript
import { useTheme } from 'next-themes';

export function FabricLayout() {
  const { theme } = useTheme(); // 'light' | 'dark' | 'system'

  return (
    <div className={cn(
      'fabric-layout',
      theme === 'dark' && 'dark'
    )}>
      {/* Uses existing Tailwind CSS v4 theme variables */}
    </div>
  );
}
```

## MVP Features (Phase 3 - Week 2)

### P0 - Critical (Must Have)
1. **Sidebar with 4 tabs** (Folder, Ontology, Search, Bookmarks)
2. **Folder view** with tree navigation
3. **Editor area** with tab bar and ProseMirror integration
4. **Inspector** with graph view, backlinks, outline
5. **Auto-save** functionality
6. **Wikilink** support (basic)
7. **Create/Open/Close** notes
8. **Toolbar** (always visible)
9. **Context menu** (right-click)

### P1 - High Priority
10. **Ontology view** with entity browsing
11. **Search view** with full-text search
12. **Bookmarks view** with pinning
13. **Folder operations** (create, delete, custom icons/colors)
14. **Properties panel** (YAML frontmatter)
15. **Stats panel** (word count, etc.)

### P2 - Medium Priority
16. **Template picker**
17. **Export dialog**
18. **Daily notes** auto-creation
19. **Pinned notes**
20. **Quick filters**

## Advanced Features (Future Phases)

### Phase 6+
- **Split pane** editing (side-by-side)
- **Zen mode** (fullscreen, hide sidebars)
- **Slash commands** (`/` for block insertion)
- **Command palette** (Cmd+P)
- **Quick switcher** (Cmd+O)
- **AI suggestions** in inspector
- **Version history** viewer
- **Mobile responsive** (collapsible sidebars, touch gestures)
- **Drag & drop** notes between folders
- **Batch operations** (multi-select, bulk actions)
- **Note preview** on hover
- **Cover images** for notes
- **Custom note icons**

## Testing

### Unit Tests
- Component rendering tests
- Hook state management tests
- Wikilink parsing tests
- Search filtering tests
- Graph data transformation tests

### Integration Tests
- Tab management (open, close, switch)
- Auto-save functionality
- Wikilink navigation
- Folder tree operations
- Search and filter

### E2E Tests
- Create and edit note flow
- Wikilink creation and navigation
- Bookmark management
- Search and open note
- Graph view interaction

## Success Metrics

- **Tab switching**: <50ms
- **Search results**: <200ms
- **Auto-save**: 500ms debounce
- **Graph render**: <300ms for <100 nodes
- **Test coverage**: ≥85%
- **Accessibility**: WCAG 2.1 AA compliant

---

**Feature ID**: 03
**Priority**: P0 (Critical)
**Story Points**: 21
**Estimated Hours**: 42
**Status**: Planning
**Owner**: Platform Team
