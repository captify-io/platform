# Feature 35: Documents Integration

**Persona:** Cross-Persona (All Users)
**Priority:** Medium
**Effort:** Large
**Status:** Sprint 3

## Overview
Integrated document management with S3 storage, versioning, search, and linking to spaces, workstreams, features, and tasks.

## Requirements
### Functional
1. Upload documents (drag-drop, file picker)
2. Organize in folders and tags
3. Link documents to entities (space, workstream, task, etc.)
4. Version control and history
5. Preview common formats (PDF, images, Office docs)
6. Full-text search across documents
7. Share documents with permissions
8. Download and export

### Non-Functional
1. Support files up to 500MB, Fast upload with progress, Preview generation <5s, Search results <1s, Secure access with presigned URLs, Mobile file upload

## Ontology
### New Ontology Nodes
```typescript
// OntologyNode for Document
{
  id: "core-document",
  name: "Document",
  type: "document",
  category: "entity",
  domain: "Content",
  description: "File or document linked to workspace entities",
  icon: "File",
  color: "#06b6d4",
  active: "true",
  properties: {
    dataSource: "core-document",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        spaceId: { type: "string", required: true },
        name: { type: "string", required: true },
        description: { type: "string" },
        fileType: { type: "string", required: true },
        fileSize: { type: "number", required: true },
        s3Key: { type: "string", required: true },
        s3Bucket: { type: "string", required: true },
        version: { type: "number", default: 1 },
        linkedEntities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              entityType: { type: "string" },
              entityId: { type: "string" }
            }
          }
        },
        tags: { type: "array", items: { type: "string" } },
        folderId: { type: "string" },
        uploadedBy: { type: "string", required: true },
        uploadedAt: { type: "string", required: true },
        lastModified: { type: "string" },
        permissions: {
          type: "object",
          properties: {
            public: { type: "boolean" },
            userIds: { type: "array", items: { type: "string" } }
          }
        }
      },
      required: ["spaceId", "name", "fileType", "fileSize", "s3Key", "s3Bucket", "uploadedBy", "uploadedAt"]
    },
    indexes: {
      "spaceId-uploadedAt-index": { hashKey: "spaceId", rangeKey: "uploadedAt", type: "GSI" },
      "uploadedBy-index": { hashKey: "uploadedBy", type: "GSI" },
      "folderId-index": { hashKey: "folderId", type: "GSI" }
    }
  }
}

// OntologyNode for DocumentFolder
{
  id: "core-document-folder",
  name: "DocumentFolder",
  type: "documentFolder",
  category: "entity",
  domain: "Content",
  icon: "Folder",
  color: "#f59e0b",
  active: "true",
  properties: {
    dataSource: "core-document-folder",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        spaceId: { type: "string", required: true },
        name: { type: "string", required: true },
        parentFolderId: { type: "string" },
        createdBy: { type: "string" },
        createdAt: { type: "string" }
      },
      required: ["spaceId", "name"]
    },
    indexes: {
      "spaceId-index": { hashKey: "spaceId", type: "GSI" },
      "parentFolderId-index": { hashKey: "parentFolderId", type: "GSI" }
    }
  }
}
```

## Components
```typescript
// /opt/captify-apps/core/src/components/spaces/features/documents/document-browser.tsx (REUSABLE)
export function DocumentBrowser({ spaceId }: { spaceId: string })

// /opt/captify-apps/core/src/components/spaces/features/documents/document-upload.tsx (REUSABLE)
export function DocumentUpload({ spaceId, onUpload }: DocumentUploadProps)

// /opt/captify-apps/core/src/components/spaces/features/documents/document-preview.tsx (REUSABLE)
export function DocumentPreview({ documentId }: { documentId: string })

// /opt/captify-apps/core/src/components/spaces/features/documents/document-search.tsx (REUSABLE)
export function DocumentSearch({ spaceId }: { spaceId: string })

// /opt/captify-apps/core/src/components/spaces/features/documents/folder-tree.tsx (REUSABLE)
export function FolderTree({ spaceId }: { spaceId: string })
```

## Actions
### 1. Upload Document
```typescript
interface UploadDocumentRequest {
  spaceId: string;
  file: File;
  folderId?: string;
  linkedEntities?: Array<{ entityType: string; entityId: string }>;
  tags?: string[];
}

interface UploadDocumentResponse {
  document: Document;
  presignedUrl: string;
}
```

**Implementation:**
```typescript
async function uploadDocument(request: UploadDocumentRequest): Promise<UploadDocumentResponse> {
  const s3Key = `spaces/${request.spaceId}/documents/${uuidv4()}-${request.file.name}`;

  // Upload to S3
  await s3.upload({
    bucket: 'captify-documents',
    key: s3Key,
    body: request.file,
    contentType: request.file.type
  });

  // Create document record
  const document: Document = {
    id: uuidv4(),
    spaceId: request.spaceId,
    name: request.file.name,
    fileType: request.file.type,
    fileSize: request.file.size,
    s3Key,
    s3Bucket: 'captify-documents',
    folderId: request.folderId,
    linkedEntities: request.linkedEntities || [],
    tags: request.tags || [],
    uploadedBy: currentUserId,
    uploadedAt: new Date().toISOString(),
    version: 1
  };

  await dynamodb.put({ table: 'core-document', item: document });

  const presignedUrl = await s3.getPresignedUrl({
    bucket: 'captify-documents',
    key: s3Key,
    expiresIn: 3600
  });

  return { document, presignedUrl };
}
```

### 2. Search Documents
```typescript
interface SearchDocumentsRequest {
  spaceId: string;
  query: string;
  fileTypes?: string[];
  tags?: string[];
}

interface SearchDocumentsResponse {
  documents: Document[];
  total: number;
}
```

### 3. Get Document Download URL
```typescript
interface GetDocumentURLRequest {
  documentId: string;
  expiresIn?: number; // seconds, default 3600
}

interface GetDocumentURLResponse {
  url: string;
  expiresAt: string;
}
```

## User Stories
### Story 1: User Uploads Document
**Tasks:** Select files, drag-drop to upload, choose folder, add tags, link to task
**Acceptance:** Upload completes with progress, document accessible

### Story 2: User Previews Document
**Tasks:** Click document, generate preview, display in modal, allow download
**Acceptance:** Preview loads in <5s for common formats

### Story 3: User Searches Documents
**Tasks:** Enter search query, filter by type/tags, view results, open document
**Acceptance:** Search returns results in <1s, ranking relevant

## Testing
```typescript
describe('DocumentsIntegration', () => {
  it('uploads document to S3', async () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const result = await uploadDocument({ spaceId: 'space-1', file });

    expect(result.document.id).toBeDefined();
    expect(result.presignedUrl).toContain('s3');
  });

  it('searches documents by name', async () => {
    const results = await searchDocuments({
      spaceId: 'space-1',
      query: 'test'
    });

    expect(results.documents.length).toBeGreaterThan(0);
  });
});
```

## Dependencies: Feature 03 (Space Management), S3 storage, Kendra for search
## Status: Sprint 3, Not Started
