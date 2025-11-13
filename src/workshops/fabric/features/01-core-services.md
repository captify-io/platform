# Feature: Core Fabric Services

## Overview

The core fabric services provide the foundational backend infrastructure for the Fabric living documentation system. This includes CRUD operations for notes, Y.js state management for real-time collaboration, sync coordination, S3 snapshots, and search capabilities. All services follow the established Captify architecture pattern using `apiClient` from `@captify-io/core/lib/api`.

## Requirements

### Functional Requirements

1. **Note CRUD Operations**
   - Create new notes with optional template
   - Retrieve note by ID with Y.js state
   - Update note with Y.js delta
   - Delete note (cascade to Y.js state and S3 snapshots)
   - List notes by space with filtering (folder, tags, type)

2. **Y.js State Management**
   - Load Y.js state from DynamoDB
   - Save Y.js state to DynamoDB (compressed binary)
   - Apply Y.js update (CRDT merge)
   - Handle state versioning
   - Support chunking for large documents (>400KB)

3. **Real-Time Sync Coordination**
   - Broadcast Y.js updates to active connections
   - Track active editors per note
   - Register/unregister connections
   - Handle stale connections (timeout after 5 minutes)

4. **S3 Snapshot Operations**
   - Export Y.js → markdown to S3
   - List snapshots (version history)
   - Restore from snapshot (S3 → Y.js)
   - Export to multiple formats (markdown, PDF, JSON)

5. **Search Operations**
   - Full-text search across note content
   - Search by tags
   - Search by folder
   - Fuzzy matching for typos

### Non-Functional Requirements

1. **Performance**
   - Note retrieval: <100ms
   - Y.js state save: <50ms
   - Search response: <200ms
   - S3 snapshot: <2 seconds for 10KB markdown

2. **Security**
   - Enforce IL5 NIST 800-53 Rev 5 security model
   - Validate user access on all operations
   - Organization boundary enforcement
   - Clearance level checks
   - Marking-based access control

3. **Scalability**
   - Support 10,000 notes per space
   - Handle 100 concurrent editors per note (eventually)
   - DynamoDB auto-scaling enabled

4. **Reliability**
   - 99.9% uptime
   - Zero data loss (S3 backup safety net)
   - Graceful error handling
   - Automatic retry with exponential backoff

## Architecture

### Service Layer Structure

```
core/src/services/fabric/
├── index.ts              # Main orchestrator, exports execute()
├── types.ts              # TypeScript interfaces
├── note.ts               # Note CRUD operations
├── yjs.ts                # Y.js state management
├── sync.ts               # Real-time coordination
├── snapshot.ts           # S3 export/import
└── search.ts             # Search operations
```

### Data Model

#### DynamoDB: fabric-note

```typescript
interface FabricNote {
  // Primary key
  id: string;                      // noteId (UUID)

  // Metadata
  spaceId: string;                 // GSI partition key
  title: string;
  folder: string;                  // e.g., "/sops/contracts"
  type: 'note' | 'canvas' | 'template';
  tags: string[];

  // Y.js state
  yjsState: Binary;                // Compressed Y.js document
  yjsVersion: number;              // Increments on each update

  // Collaboration
  activeEditors: string[];         // UserIds currently editing
  lastModified: string;            // ISO timestamp
  modifiedBy: string;              // UserId

  // S3 integration
  s3SnapshotKey: string;           // Latest S3 snapshot path
  s3SnapshotVersion: number;

  // Content metadata
  frontmatter: {                   // Parsed YAML frontmatter
    [key: string]: any;
  };
  wikilinks: Array<{               // Extracted [[links]]
    target: string;
    type: 'note' | 'entity' | 'unresolved';
    displayText?: string;
  }>;
  backlinks: string[];             // NoteIds linking to this note

  // Security
  securityMetadata: {
    classification: string;        // UNCLASSIFIED, CUI, SECRET, TOP_SECRET
    markings: string[];            // PII, PHI, FIN, LEO, etc.
    ownerOrg: string;
    accessControl: {
      owner: string;
      editors: string[];
      viewers: string[];
    };
  };

  // Housekeeping
  ttl: number;                     // Auto-expire after 7 days inactivity
  createdAt: string;
  createdBy: string;
}
```

**Global Secondary Indexes:**
- `spaceId-lastModified-index` - List notes by space, sorted by modification time
- `folder-title-index` - List notes in folder, sorted alphabetically
- `tags-index` - Query notes by tags

#### DynamoDB: fabric-folder

```typescript
interface FabricFolder {
  id: string;                      // folderId (UUID)
  spaceId: string;
  path: string;                    // e.g., "/sops/contracts"
  name: string;                    // e.g., "contracts"
  parentId?: string;               // Parent folder ID
  noteCount: number;               // Number of notes in folder
  icon?: string;                   // Lucide icon name
  color?: string;                  // Hex color
  securityMetadata: SecurityContext;
  createdAt: string;
  createdBy: string;
}
```

#### DynamoDB: fabric-template

```typescript
interface FabricTemplate {
  id: string;                      // templateId (UUID)
  name: string;
  category: 'sop' | 'contract' | 'meeting-notes' | 'general';
  content: string;                 // Markdown with {{variables}}
  frontmatterTemplate: {           // Default frontmatter
    type?: string;
    [key: string]: any;
  };
  lockedProperties: string[];      // Properties users can't change
  variables: Array<{               // Substitutable variables
    name: string;
    type: 'date' | 'user' | 'space' | 'custom';
    defaultValue?: string;
    required: boolean;
  }>;
  securityMetadata: SecurityContext;
  createdAt: string;
  createdBy: string;
}
```

#### S3 Structure

```
s3://captify-spaces/
  spaces/{spaceId}/
    fabric/
      notes/{noteId}/
        latest.md                    # Latest snapshot
        versions/
          v1-20250110120000.md       # Timestamped versions
          v2-20250110130000.md
      attachments/{noteId}/
        image.png                    # Embedded images
        document.pdf
```

### Integration with Existing Services

```typescript
// All fabric operations use apiClient
import { apiClient } from '@captify-io/core/lib/api';

// Example: Create note
const response = await apiClient.run({
  service: 'platform.fabric',
  operation: 'createNote',
  data: {
    spaceId: 'space-123',
    title: 'My SOP',
    folder: '/sops',
    template: 'template-sop-standard'
  }
});
```

## API Actions

### createNote(params)

**Purpose**: Create a new note with initial Y.js state

**Input**:
```typescript
{
  spaceId: string;
  title: string;
  folder?: string;          // Default: "/"
  template?: string;        // Template ID to apply
  frontmatter?: object;     // Initial frontmatter
}
```

**Output**:
```typescript
{
  success: boolean;
  data: {
    noteId: string;
    title: string;
    yjsState: Binary;       // Initial Y.js state
    createdAt: string;
  };
  error?: string;
}
```

**Example**:
```typescript
const note = await apiClient.run({
  service: 'platform.fabric',
  operation: 'createNote',
  data: {
    spaceId: 'space-123',
    title: 'Contract Review SOP',
    folder: '/sops/contracts',
    template: 'template-sop-standard'
  }
});
```

---

### getNote(noteId)

**Purpose**: Retrieve note with Y.js state

**Input**:
```typescript
{
  noteId: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  data: FabricNote;
  error?: string;
}
```

**Example**:
```typescript
const note = await apiClient.run({
  service: 'platform.fabric',
  operation: 'getNote',
  data: { noteId: 'note-456' }
});
```

---

### updateNote(noteId, yjsUpdate)

**Purpose**: Apply Y.js update to note

**Input**:
```typescript
{
  noteId: string;
  yjsUpdate: Binary;        // Y.js CRDT update
  userId: string;           // Current user
}
```

**Output**:
```typescript
{
  success: boolean;
  data: {
    yjsVersion: number;     // New version number
    lastModified: string;
  };
  error?: string;
}
```

**Example**:
```typescript
// User types in editor, Y.js generates update
const update = Y.encodeStateAsUpdate(ydoc);

await apiClient.run({
  service: 'platform.fabric',
  operation: 'updateNote',
  data: {
    noteId: 'note-456',
    yjsUpdate: update,
    userId: 'user-789'
  }
});
```

---

### deleteNote(noteId)

**Purpose**: Delete note and cascade to Y.js state and S3

**Input**:
```typescript
{
  noteId: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  data: {
    deletedAt: string;
  };
  error?: string;
}
```

---

### listNotes(spaceId, filters)

**Purpose**: List notes in space with optional filtering

**Input**:
```typescript
{
  spaceId: string;
  folder?: string;          // Filter by folder
  tags?: string[];          // Filter by tags (AND logic)
  type?: 'note' | 'canvas' | 'template';
  limit?: number;           // Default: 50
  lastEvaluatedKey?: string; // For pagination
}
```

**Output**:
```typescript
{
  success: boolean;
  data: {
    notes: FabricNote[];
    lastEvaluatedKey?: string;
  };
  error?: string;
}
```

---

### createSnapshot(noteId)

**Purpose**: Export Y.js → markdown to S3

**Input**:
```typescript
{
  noteId: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  data: {
    s3Key: string;
    version: number;
    size: number;           // Bytes
  };
  error?: string;
}
```

---

### searchNotes(spaceId, query)

**Purpose**: Full-text search across notes

**Input**:
```typescript
{
  spaceId: string;
  query: string;
  filters?: {
    folder?: string;
    tags?: string[];
    type?: string;
  };
}
```

**Output**:
```typescript
{
  success: boolean;
  data: {
    results: Array<{
      noteId: string;
      title: string;
      excerpt: string;      // Matching snippet
      score: number;        // Relevance score
    }>;
  };
  error?: string;
}
```

## Implementation Notes

### Y.js State Compression

Use `lz4` or `gzip` to compress Y.js state before storing in DynamoDB:

```typescript
import { compress, decompress } from 'lz4';
import * as Y from 'yjs';

// Save
const state = Y.encodeStateAsUpdate(ydoc);
const compressed = compress(state);
await dynamodb.put({
  table: 'core-fabric-note',
  item: { id: noteId, yjsState: compressed }
});

// Load
const item = await dynamodb.get({
  table: 'core-fabric-note',
  key: { id: noteId }
});
const state = decompress(item.yjsState);
Y.applyUpdate(ydoc, state);
```

### Handling Large Documents (>400KB)

If compressed Y.js state exceeds DynamoDB item limit:

```typescript
// Chunk into multiple items
const chunks = chunkArray(state, 350_000); // 350KB chunks
for (let i = 0; i < chunks.length; i++) {
  await dynamodb.put({
    table: 'core-fabric-note',
    item: {
      id: `${noteId}#chunk-${i}`,
      yjsState: chunks[i],
      totalChunks: chunks.length
    }
  });
}

// Retrieve and reassemble
const items = await dynamodb.query({
  table: 'core-fabric-note',
  keyCondition: 'id BEGINS_WITH :noteId',
  expressionAttributeValues: { ':noteId': noteId }
});
const state = Buffer.concat(items.map(i => i.yjsState));
```

### Wikilink Parsing

Extract wikilinks from Y.js document:

```typescript
// Convert Y.js → markdown
const markdown = yjsDocToMarkdown(ydoc);

// Parse wikilinks
const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
const matches = [...markdown.matchAll(wikilinkRegex)];

const wikilinks = matches.map(m => {
  const link = m[1];

  // Parse typed links: [[contract::ABC-123]]
  if (link.includes('::')) {
    const [type, target] = link.split('::');
    return { type, target, linkType: 'entity' };
  }

  // Parse heading links: [[Note#Heading]]
  if (link.includes('#')) {
    const [title, heading] = link.split('#');
    return { title, heading, linkType: 'section' };
  }

  // Simple note link: [[Note Title]]
  return { title: link, linkType: 'note' };
});
```

### Security Validation

Check user access before any operation:

```typescript
import { checkPermission } from '@captify-io/core/services/ontology';

async function validateAccess(noteId: string, userId: string, requiredRole: string) {
  const note = await getNote(noteId);
  const userContext = await getUserSecurityContext(userId);

  const result = checkPermission(
    userContext,
    note.securityMetadata,
    requiredRole,
    note.createdBy
  );

  if (!result.allowed) {
    throw new Error(`Access denied: ${result.reason}`);
  }
}
```

## Testing

### Unit Tests

```typescript
// core/src/services/fabric/__tests__/note.test.ts
describe('Note Service', () => {
  it('should create note with Y.js state', async () => {
    const note = await createNote({
      spaceId: 'space-123',
      title: 'Test Note'
    });

    expect(note.id).toBeDefined();
    expect(note.yjsState).toBeDefined();
    expect(note.title).toBe('Test Note');
  });

  it('should apply template on creation', async () => {
    const note = await createNote({
      spaceId: 'space-123',
      title: 'SOP',
      template: 'template-sop-standard'
    });

    expect(note.content).toContain('## Purpose');
    expect(note.frontmatter.type).toBe('sop');
  });

  it('should throw error if user lacks access', async () => {
    await expect(
      createNote({
        spaceId: 'restricted-space',
        title: 'Secret Note'
      })
    ).rejects.toThrow('Access denied');
  });
});
```

### Integration Tests

```typescript
// Test Y.js state persistence
it('should persist Y.js state to DynamoDB', async () => {
  const ydoc = new Y.Doc();
  const text = ydoc.getText('content');
  text.insert(0, 'Hello World');

  const update = Y.encodeStateAsUpdate(ydoc);
  await updateNote({ noteId: 'note-123', yjsUpdate: update });

  const note = await getNote('note-123');
  const loadedDoc = new Y.Doc();
  Y.applyUpdate(loadedDoc, note.yjsState);

  expect(loadedDoc.getText('content').toString()).toBe('Hello World');
});
```

## Dependencies

- `@captify-io/core/lib/api` - API client
- `@captify-io/core/services/ontology` - Security and schema validation
- `@captify-io/core/services/aws/dynamodb` - Database operations
- `@captify-io/core/services/aws/s3` - File storage
- `yjs` - CRDT library
- `lz4` or `zlib` - Compression

## Success Metrics

- **Create note**: <100ms response time
- **Get note**: <100ms response time
- **Update note**: <50ms response time
- **Search**: <200ms response time
- **Snapshot**: <2 seconds for 10KB document
- **Test coverage**: ≥85%
- **Zero data loss incidents**

---

**Feature ID**: 01
**Priority**: P0 (Critical)
**Story Points**: 21
**Estimated Hours**: 40
**Status**: Planning
**Owner**: Platform Team
