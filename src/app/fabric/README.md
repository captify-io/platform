# Fabric - Living Documentation System

**Status:** ✅ Core functionality implemented and working
**Last Updated:** 2025-11-12

## Overview

Fabric is a **native collaborative rich-text editor** built with ProseMirror and inspired by Obsidian. It provides real-time collaboration, internal linking, and ontology integration for creating interconnected knowledge bases.

## What's Been Built

### ✅ Core Architecture

#### 1. **Real-time Collaboration (WebSocket)**
- **Location:** `/opt/captify-apps/platform/server.mjs`
- **Protocol:** Custom WebSocket server on `/ws/fabric`
- **Features:**
  - ProseMirror collaborative editing with operational transformation
  - Document state managed in memory with version tracking
  - Automatic conflict resolution using `prosemirror-collab`
  - **Debounced DynamoDB persistence** (2 seconds of inactivity after each keystroke)
  - Client authentication via NextAuth.js JWT tokens
  - Heartbeat mechanism for connection health monitoring

**Key Implementation Detail:**
Every keystroke sends a step via WebSocket → Server applies step → Server schedules debounced save (2s delay) → After 2s of no typing → Saves to DynamoDB

#### 2. **Database Schema (DynamoDB)**
- **Table:** `captify-fabric-note`
- **Primary Key:** `id` (note ID)
- **GSI:** `spaceId-updatedAt-index` for listing notes by space
- **Data Model:**
  ```typescript
  {
    id: string;                    // note-{timestamp}-{random}
    spaceId: string;               // Parent space for multi-tenancy
    name: string;                  // Note name (migrated from "title" on 2025-11-12)
    doc: ProseMirrorJSON;          // Document as searchable JSON
    version: number;               // Collaboration version number
    folder: string;                // File path: "/" or "/folder/subfolder"
    tags: string[];                // Extracted tags
    wikilinks: string[];           // Internal [[links]]
    ontologyLinks: OntologyLink[]; // Typed links [[type::target]]
    frontmatter: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    lastEditedBy: string;          // User ID
    organizationId: string;        // Multi-tenant isolation
    clearanceLevel: ClearanceLevel;
    markings: string[];
  }
  ```

#### 3. **React Component Architecture**

**Provider Pattern:**
- **File:** `core/src/components/fabric/provider.tsx`
- **Context:** `FabricContext` manages global state
- **State Management:**
  - Notes list with in-memory cache
  - Current note selection
  - Open notes tabs
  - Folder navigation
  - Search state
  - Settings
- **Recent Fix (2025-11-12):** `openNote()` now fetches fresh note data from server to prevent version conflicts

**Layout:**
- **File:** `platform/src/app/fabric/page.tsx`
- **Structure:** Three-panel layout (resizable)
  - Left: Notes list panel
  - Center: ProseMirror editor panel
  - Right: Properties/metadata panel (collapsible)

**Key Components:**
1. **NotesPanel** (`core/src/components/fabric/panels/notes.tsx`)
   - Lists all notes in current space/folder
   - Filter/search functionality
   - Create note button with dropdown menu
   - Recent fix: Changed from `title` to `name` field

2. **EditorPanel** (`core/src/components/fabric/panels/editor.tsx`)
   - Tab bar for multiple open notes
   - Tab management (open, close, rename via double-click)
   - Save status indicator
   - Collaboration indicators (users, comments, AI)
   - Passes `onSave` callback to ProseMirror (currently unused - auto-save via WebSocket)

3. **ProseMirrorEditor** (`core/src/components/fabric/editor/prosemirror-editor.tsx`)
   - Core rich-text editor with ProseMirror
   - WebSocket connection for real-time collaboration
   - Auto-sync with server on every keystroke
   - Connection status indicators (Connecting → Syncing → Connected)
   - Calls `onUpdate` on every document change (updates local cache only)

#### 4. **ProseMirror Plugins**

**Built-in Plugins:**
- **Collaboration** (`prosemirror-collab`): Real-time collaborative editing with version tracking
- **History** (`prosemirror-history`): Undo/redo support
- **Input Rules**: Markdown-style shortcuts (e.g., `**bold**`, `# heading`)
- **Keymaps**: Standard keybindings (Cmd+Z, Cmd+Y, formatting shortcuts)

**Custom Plugins:**

1. **Autocomplete Plugin** (`core/src/components/fabric/editor/autocomplete-plugin.ts`)
   - Triggers on `[[` for internal note links
   - Fetches notes from current space
   - Renders inline suggestion popover
   - Inserts `internal_link` nodes on selection
   - **Status:** ✅ Working

2. **Image Paste Plugin** (`core/src/components/fabric/editor/image-paste-plugin.ts`)
   - Handles paste and drag-drop for images
   - Shows "Uploading image..." placeholder
   - Uploads to S3 via provided handler
   - Replaces placeholder with image node or error message
   - **Status:** ✅ Working

3. **Context Menu** (`core/src/components/fabric/editor/context-menu.tsx`)
   - Right-click menu for formatting and insertion
   - Submenus: Format, Paragraph, Insert
   - Insert links: `[[]]` for notes, `![[Type:ID]]` for ontology
   - Insert: tables, code blocks, callouts, mermaid diagrams
   - **Status:** ✅ Working

#### 5. **Schema Definition**
- **File:** `core/src/components/fabric/editor/schema.ts`
- **Nodes:** paragraph, heading, blockquote, code_block, image, internal_link, ordered_list, bullet_list, list_item, horizontal_rule, table, table_row, table_cell, hard_break
- **Marks:** strong, em, code, link, strikethrough, highlight

#### 6. **Service Layer**
- **File:** `core/src/services/fabric/note.ts`
- **Operations:**
  - `createNote`: Create new note with ProseMirror JSON
  - `getNote`: Retrieve note by ID
  - `updateNote`: Update note metadata and document
  - `deleteNote`: Delete note
  - `listNotes`: Query notes by space/folder/tags
- **Recent Migration:** Changed from `title` to `name` field throughout

#### 7. **WebSocket Sync Flow**

**Client → Server:**
```
1. Client types → Creates ProseMirror step
2. Step sent via WebSocket to server
3. Server applies step to in-memory document
4. Server increments version number
5. Server broadcasts step to ALL clients (including sender)
6. Server schedules debounced DynamoDB save (2s delay)
```

**Server → Client:**
```
1. Client receives step from server
2. ProseMirror collab plugin applies step
3. Version incremented locally
4. Client confirms reception
```

**Initial Sync:**
```
1. Client opens note → calls openNote()
2. openNote() fetches fresh note data from API (includes latest version)
3. ProseMirror initializes with version from fresh data
4. Client connects WebSocket
5. Client sends 'sync' message
6. Server responds with current doc + version
7. If versions match → ready to edit
8. If server ahead → client requests missing steps
```

## Current State

### ✅ Working Features
1. **Create notes** with name and initial content
2. **Open multiple notes** in tabs
3. **Real-time collaborative editing** with WebSocket sync
4. **Rename notes** via double-click on tab
5. **Close notes** from tab bar
6. **Filter notes** in sidebar
7. **Auto-save to DynamoDB** (debounced 2 seconds)
8. **Version tracking** to prevent conflicts
9. **Internal links** with `[[note]]` syntax and autocomplete
10. **Image upload** via paste/drag-drop
11. **Rich text formatting** (bold, italic, headings, lists, etc.)
12. **Context menu** for quick formatting
13. **Folder support** in data model (UI basic)

### ⚠️ Known Issues - Recently Fixed (2025-11-12)

#### 1. ✅ Version Conflict Loop
- **Problem:** Client was initializing with stale version from cached notes list
- **Symptom:** Infinite "Version not current" errors
- **Solution:** `openNote()` now calls `getNote` API to fetch current version before opening
- **Files Changed:** `core/src/components/fabric/provider.tsx`

#### 2. ✅ Title → Name Migration
- **Changes:**
  - Updated API error messages from "Title is required" to "Name is required"
  - Updated provider to send `name` instead of `title` in createNote
  - Updated all component references from `title` to `name`
- **Files Changed:**
  - `core/src/services/fabric/note.ts`
  - `core/src/services/fabric/types.ts`
  - `core/src/components/fabric/provider.tsx`
  - `core/src/components/fabric/panels/notes.tsx`

#### 3. ✅ Filter TypeError
- **Problem:** Notes filter crashed with "Cannot read properties of undefined (reading 'toLowerCase')"
- **Solution:** Deleted 2 notes without `name` field from database, kept strict filter
- **Decision:** `name` is required field, no optional chaining

### 🚧 Limitations / Not Yet Implemented

1. **Folder Management**
   - Folders stored in data model but no UI to create/manage
   - All notes default to root folder (`/`)
   - No folder tree navigation

2. **Search**
   - Basic filter in sidebar works
   - Full-text search across note content not implemented
   - No search by tags or ontology links

3. **Templates**
   - Schema supports templates but creation/application not implemented
   - Template variables system not built

4. **Canvas**
   - Schema defined but no UI implementation
   - Cannot create visual note maps

5. **Backlinks**
   - Wikilinks extracted and stored
   - No backlinks panel to show reverse references

6. **Ontology Integration**
   - Can insert `![[Type:ID]]` links
   - Not yet connected to core ontology system
   - No ontology node resolution

7. **Settings**
   - Settings context exists but no settings panel
   - No user preferences (theme, font size, auto-save interval)

8. **Collaboration UX**
   - No presence indicators (who's editing)
   - No cursor positions of other users
   - No conflict resolution UI

9. **Manual Save Button**
   - `handleEditorSave` callback exists but never called
   - No Cmd+S handler
   - No explicit "Save" button in UI
   - Only auto-save via WebSocket debouncing (2s)

10. **Export/Import**
    - No markdown export
    - No import from other formats

## File Structure

```
/opt/captify-apps/
├── platform/
│   ├── server.mjs                           # Custom Next.js + WebSocket server
│   ├── src/
│   │   ├── app/fabric/
│   │   │   ├── page.tsx                     # Main Fabric page layout
│   │   │   └── README.md                    # This file
│   │   └── collab/
│   │       └── instance.js                  # In-memory document instances
│   └── package.json                         # Dependencies
│
└── core/
    └── src/
        ├── components/fabric/
        │   ├── provider.tsx                 # React context provider
        │   ├── index.tsx                    # Main Fabric component exports
        │   ├── panels/
        │   │   ├── notes.tsx                # Notes list sidebar
        │   │   ├── editor.tsx               # Editor tab bar + wrapper
        │   │   └── properties.tsx           # Properties/metadata sidebar
        │   └── editor/
        │       ├── prosemirror-editor.tsx   # Core ProseMirror editor
        │       ├── schema.ts                # ProseMirror schema definition
        │       ├── autocomplete-plugin.ts   # Internal link autocomplete
        │       ├── autocomplete-view.tsx    # Autocomplete UI component
        │       ├── image-paste-plugin.ts    # Image upload handling
        │       └── context-menu.tsx         # Right-click formatting menu
        │
        ├── services/fabric/
        │   ├── note.ts                      # Note CRUD operations
        │   └── types.ts                     # TypeScript type definitions
        │
        └── types/
            └── fabric.ts                    # Exported types
```

## Key Technical Decisions

### 1. **ProseMirror over TipTap/Lexical**
- **Reason:** Direct control over collaboration protocol
- **Tradeoff:** More complex API but better performance and flexibility

### 2. **Custom WebSocket Server**
- **Reason:** Next.js doesn't support WebSocket natively
- **Implementation:** Custom `server.mjs` wraps Next.js
- **Benefit:** Single port (3000) for HTTP + WebSocket

### 3. **In-Memory Document State**
- **Reason:** Fast collaboration without database round-trips
- **Persistence:** Debounced saves to DynamoDB (2s delay)
- **Tradeoff:** Document state lost on server restart (reloaded from DB on reconnect)

### 4. **ProseMirror JSON Storage**
- **Reason:** Searchable, indexable, portable
- **Migration:** Moved from Y.js CRDT binary (legacy `yjsState`) to ProseMirror JSON (`doc`)
- **Benefit:** Can query content, extract wikilinks, build search index

### 5. **Version-Based Collaboration**
- **Protocol:** Operational Transformation (OT) via `prosemirror-collab`
- **Conflict Resolution:** Server is source of truth, clients sync to server version
- **Version Mismatch:** Client requests full sync if behind

### 6. **Name Field Migration**
- **Change:** Renamed `title` → `name` for consistency
- **Reason:** Match ontology naming conventions
- **Migration Date:** 2025-11-12

## API Integration

### Client → Server Communication

**1. HTTP API (via `apiClient`):**
```typescript
import { apiClient } from '@captify-io/core/lib/api';

// Create note
await apiClient.run({
  service: 'platform.fabric',
  operation: 'createNote',
  data: {
    spaceId: 'space-default',
    name: 'My Note',
    folder: '/',
    initialContent: 'Hello world'
  }
});

// Get note (used by openNote to fetch fresh version)
await apiClient.run({
  service: 'platform.fabric',
  operation: 'getNote',
  data: { noteId: 'note-123' }
});

// Update note
await apiClient.run({
  service: 'platform.fabric',
  operation: 'updateNote',
  data: {
    noteId: 'note-123',
    doc: prosemirrorDoc.toJSON(),
    version: 42
  }
});

// List notes
await apiClient.run({
  service: 'platform.fabric',
  operation: 'listNotes',
  data: {
    spaceId: 'space-default',
    folder: '/',
    limit: 100
  }
});
```

**2. WebSocket API:**
```typescript
// Connect
const ws = new WebSocket('ws://localhost:3000/ws/fabric?documentId=note-123&spaceId=space-default');

// Request sync
ws.send(JSON.stringify({
  type: 'sync',
  documentId: 'note-123',
  version: 0
}));

// Send steps
ws.send(JSON.stringify({
  type: 'steps',
  version: 5,
  steps: [stepJSON],
  clientID: userId
}));

// Pull updates
ws.send(JSON.stringify({
  type: 'pullUpdates',
  version: 5
}));
```

## Environment Variables

```bash
# Required for Fabric
NEXTAUTH_SECRET=<secret>              # For session tokens
COGNITO_IDENTITY_POOL_ID=<pool-id>    # For AWS credentials
AWS_REGION=us-east-1                  # DynamoDB region
SCHEMA=captify                        # Table name prefix

# Optional
PORT=3000                             # Server port (default: 3000)
NODE_ENV=development                  # Environment
```

## Testing

### Manual Testing Checklist

- [x] Create new note
- [x] Open note in editor
- [x] Type text and see real-time sync
- [x] Open multiple tabs
- [x] Switch between tabs
- [x] Rename note via double-click
- [x] Close note tab
- [x] Filter notes in sidebar
- [x] Insert internal link with `[[`
- [x] Paste image
- [x] Right-click context menu
- [x] Verify auto-save to DynamoDB (check after 2s of inactivity)
- [x] Reload page and see saved content
- [x] Multi-user collaboration (open same note in two browsers)

### Known Test Scenarios

**Scenario: Version Conflict**
- ✅ Fixed: Opening a note that was edited elsewhere now fetches fresh version
- Client initializes with correct version from server
- No infinite "Version not current" loop

**Scenario: Concurrent Edits**
- ✅ Working: Two users typing in same document
- Steps broadcast to all clients
- Operational transformation resolves conflicts

**Scenario: Network Disconnection**
- ⚠️ Not fully tested
- Client should queue local changes
- Reconnect and sync on network restore

## Performance Considerations

### Current Performance
- **WebSocket Latency:** ~10-50ms for local step sync
- **Database Writes:** Debounced to 1 write per 2 seconds per document
- **Initial Load:** ~200-500ms to load note and establish WebSocket

### Optimization Opportunities
1. **Lazy Load Notes List:** Currently loads all notes in space (limit 100)
2. **Virtualized List:** For spaces with 1000+ notes
3. **Document Snapshots:** Store periodic snapshots to avoid replaying all steps
4. **IndexedDB Cache:** Client-side persistence for offline support

## Security Model

### Authentication
- NextAuth.js JWT tokens for session management
- Token stored in HTTP-only cookie
- WebSocket authenticated via cookie extraction

### Authorization
- Organization-based multi-tenancy (`organizationId`)
- Clearance levels: UNCLASSIFIED, CUI, SECRET, TOP_SECRET
- Markings: PII, PHI, FIN, LEO, etc.
- Note access checks in `getNote()` service

### Data Isolation
- AWS Cognito Identity Pool for temporary credentials
- DynamoDB queries scoped to `spaceId`
- User can only access notes in their organization

## Migration Path (Y.js → ProseMirror JSON)

### Legacy Support
- Old notes may have `yjsState` (Uint8Array) instead of `doc`
- Service layer handles both formats:
  - If `doc` exists → use ProseMirror JSON
  - If only `yjsState` → convert to JSON (not yet implemented)
  - If neither → create empty document

### Migration Strategy
1. **Phase 1:** Dual storage (both `yjsState` and `doc`) ✅ Done
2. **Phase 2:** Prefer `doc` over `yjsState` ✅ Done
3. **Phase 3:** Backfill old notes (convert `yjsState` → `doc`) ⚠️ Not implemented
4. **Phase 4:** Remove `yjsState` field from schema ⏳ Future

## Next Steps for Another Agent

### Immediate Priorities

1. **Folder Management UI**
   - Add folder tree to left sidebar
   - Create folder dialog
   - Move notes between folders
   - Folder icons and colors

2. **Search Implementation**
   - Full-text search using DynamoDB `doc` field
   - Search across note content, not just names
   - Search by tags
   - Search results panel

3. **Backlinks Panel**
   - Extract wikilinks from `doc` JSON
   - Store in `wikilinks` array on save
   - Build reverse index
   - Show backlinks in properties panel

4. **Settings Panel**
   - Editor theme (light/dark)
   - Font size/family
   - Auto-save interval
   - Show line numbers
   - Word wrap

5. **Manual Save**
   - Add Cmd+S keybinding
   - Call `handleEditorSave()` callback
   - Show "Saved" indicator in tab bar
   - Handle save errors gracefully

### Medium-Term Features

6. **Templates**
   - Template creation UI
   - Variable substitution
   - Template picker on note creation
   - Default templates by folder

7. **Ontology Integration**
   - Resolve `![[Type:ID]]` to actual ontology nodes
   - Show ontology link previews
   - Bidirectional ontology-note relationships
   - Ontology node autocomplete

8. **Collaboration UX**
   - User presence indicators (avatars in editor)
   - Cursor positions with colors
   - User typing indicators
   - Comment threads on selections

9. **Export/Import**
   - Export to Markdown
   - Export to PDF
   - Import from Obsidian vault
   - Import from Notion

10. **Canvas**
    - Visual note mapping
    - Drag-drop notes onto canvas
    - Draw connections between notes
    - Canvas zoom and pan

### Code Quality Improvements

11. **Error Handling**
    - Better error messages in UI
    - Retry logic for failed saves
    - Offline queue for edits
    - Error boundary components

12. **Testing**
    - Unit tests for services
    - Integration tests for WebSocket
    - E2E tests for critical flows
    - Performance benchmarks

13. **TypeScript Improvements**
    - Stricter types for WebSocket messages
    - Type-safe schema definitions
    - Proper error types

14. **Documentation**
    - API documentation (JSDoc)
    - Architecture diagrams
    - WebSocket protocol specification
    - Troubleshooting guide

## Common Issues & Solutions

### Issue: "Version not current" infinite loop
**Status:** ✅ Fixed (2025-11-12)
**Solution:** `openNote()` now fetches fresh note data from server before opening

### Issue: Notes filter crashes with "Cannot read properties of undefined"
**Status:** ✅ Fixed (2025-11-12)
**Solution:** Deleted notes without `name` field, kept strict filter

### Issue: "Title is required" when creating note
**Status:** ✅ Fixed (2025-11-12)
**Solution:** Migrated from `title` to `name` throughout codebase

### Issue: WebSocket connection fails
**Check:**
1. Is `server.mjs` running? (not `next dev`, use `node server.mjs`)
2. Is session valid? Check browser cookies
3. Are AWS credentials valid? Check Cognito Identity Pool

### Issue: Changes not saving to DynamoDB
**Check:**
1. Wait 2 seconds after last keystroke (debounced save)
2. Check server logs for "Saving {noteId}" message
3. Check AWS credentials have DynamoDB write permissions
4. Verify table name: `captify-fabric-note`

### Issue: Note content lost on server restart
**Expected:** Documents are in-memory only until saved
**Solution:** Server reloads from DynamoDB on next connection

## Deployment

### Development
```bash
cd /opt/captify-apps/platform
node server.mjs
```

### Production
```bash
# Build Next.js
npm run build

# Start with PM2
pm2 start server.mjs --name platform

# Or with environment variables
NODE_ENV=production PORT=3000 pm2 start server.mjs --name platform
```

### Health Check
```bash
# HTTP
curl http://localhost:3000/health

# WebSocket (requires wscat)
wscat -c "ws://localhost:3000/ws/fabric?documentId=test&spaceId=test"
```

## Additional Resources

- **ProseMirror Docs:** https://prosemirror.net/docs/
- **ProseMirror Collab:** https://github.com/ProseMirror/prosemirror-collab
- **Obsidian Inspiration:** https://obsidian.md/
- **WebSocket Protocol:** RFC 6455

## Contributors

- Initial implementation: November 2025
- Title → Name migration: 2025-11-12
- Version conflict fix: 2025-11-12

---

**For questions or issues, check:**
1. This README
2. Server logs: `pm2 logs platform`
3. Browser console for WebSocket messages
4. DynamoDB table data for persistence verification
