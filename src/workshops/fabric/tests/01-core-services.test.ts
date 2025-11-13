// Auto-generated from src/workshops/fabric/user-stories/01-core-services.yaml
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests
//
// Feature: Core Fabric Services (01)
// Priority: P0
// Story Points: 21
// Estimated Hours: 40

import { apiClient } from '@captify-io/core/lib/api';

jest.mock('@captify-io/core/lib/api');

describe('Feature: Core Fabric Services', () => {
  describe('US-01-01: Create new note with Y.js state', () => {
    // User Story:
    // As Fabric user
    // I want to create a new note in my space
    // So that I can start documenting knowledge

    it('should create note with valid parameters', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          noteId: "note-123",
          title: "Test Note",
          yjsState: "Binary()",
          createdAt: "2025-11-10T00:00:00Z"
        }
      });
      const input = {
        spaceId: "space-123",
        title: "Test Note"
      };

      // Act
      const result = await createNote(input)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data.noteId).toBe('note-123')
      expect(result.data.title).toBe('Test Note')
      expect(result.data.yjsState).toBeDefined()
    });

    it('should apply template when provided', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          noteId: "note-456",
          content: "## Purpose\n\nTemplate content here",
          frontmatter: {
            type: "sop"
          }
        }
      });
      const input = {
        spaceId: "space-123",
        title: "My SOP",
        template: "template-sop-standard"
      };

      // Act
      const result = await createNote(input)

      // Assert
      expect(result.data.content).toContain('## Purpose')
      expect(result.data.frontmatter.type).toBe('sop')
    });

    it('should throw error for unauthorized access', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockRejectedValue(new Error({"error":"Access denied: Insufficient permissions"}));
      const input = {
        spaceId: "restricted-space",
        title: "Secret Note"
      };

      // Act
      await createNote(input)

      // Assert
      expect(promise).rejects.toThrow('Access denied')
    });

    // Edge Cases to Consider:
    // - Empty title provided: Validation error returned
    // - Invalid spaceId: Space not found error
    // - Template not found: Continue without template, log warning
  });
  describe('US-01-02: Retrieve note with Y.js state', () => {
    // User Story:
    // As Fabric user
    // I want to open an existing note
    // So that I can view and edit its content

    it('should retrieve note successfully', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: "note-123",
          title: "Test Note",
          yjsState: "Binary()",
          spaceId: "space-123",
          folder: "/",
          tags: [
            "test"
          ],
          lastModified: "2025-11-10T00:00:00Z"
        }
      });
      const input = {
        noteId: "note-123"
      };

      // Act
      const result = await getNote(input.noteId)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data.id).toBe('note-123')
      expect(result.data.yjsState).toBeDefined()
      expect(result.data.title).toBe('Test Note')
    });

    it('should throw error when note not found', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockRejectedValue(new Error({"error":"Note not found: nonexistent"}));
      const input = {
        noteId: "nonexistent"
      };

      // Act
      await getNote(input.noteId)

      // Assert
      expect(promise).rejects.toThrow('Note not found')
    });
  });
  describe('US-01-03: Update note with Y.js delta', () => {
    // User Story:
    // As Fabric user
    // I want to save my edits to a note
    // So that my changes persist and sync with collaborators

    it('should apply Y.js update and increment version', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          yjsVersion: 5,
          lastModified: "2025-11-10T01:00:00Z"
        }
      });
      const input = {
        noteId: "note-123",
        yjsUpdate: "Binary(update)",
        userId: "user-789"
      };

      // Act
      const result = await updateNote(input)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data.yjsVersion).toBe(5)
      expect(apiClient.run).toHaveBeenCalledWith(expect.objectContaining({ service: 'platform.fabric', operation: 'updateNote' }))
    });
  });
  describe('US-01-04: Delete note with cascade', () => {
    // User Story:
    // As Fabric user
    // I want to delete a note I no longer need
    // So that it's removed from my space and storage

    it('should delete note successfully', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          deletedAt: "2025-11-10T02:00:00Z"
        }
      });
      const input = {
        noteId: "note-123"
      };

      // Act
      const result = await deleteNote(input.noteId)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data.deletedAt).toBeDefined()
    });
  });
  describe('US-01-05: List notes with filtering', () => {
    // User Story:
    // As Fabric user
    // I want to browse notes in my space
    // So that I can find and organize my documentation

    it('should list all notes in space', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          notes: [
            {
              id: "note-1",
              title: "Note 1"
            },
            {
              id: "note-2",
              title: "Note 2"
            }
          ]
        }
      });
      const input = {
        spaceId: "space-123"
      };

      // Act
      const result = await listNotes(input.spaceId)

      // Assert
      expect(result.data.notes).toHaveLength(2)
      expect(result.data.notes[0].id).toBe('note-1')
    });

    it('should filter notes by folder', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          notes: [
            {
              id: "note-1",
              folder: "/sops"
            }
          ]
        }
      });
      const input = {
        spaceId: "space-123",
        folder: "/sops"
      };

      // Act
      const result = await listNotes(input.spaceId, { folder: input.folder })

      // Assert
      expect(result.data.notes).toHaveLength(1)
      expect(result.data.notes[0].folder).toBe('/sops')
    });
  });
  describe('US-01-06: Create S3 snapshot of note', () => {
    // User Story:
    // As Fabric user
    // I want my notes automatically backed up to S3
    // So that I have version history and disaster recovery

    it('should create S3 snapshot successfully', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          s3Key: "spaces/space-123/fabric/notes/note-123/v1-20251110.md",
          version: 1,
          size: 1024
        }
      });
      const input = {
        noteId: "note-123"
      };

      // Act
      const result = await createSnapshot(input.noteId)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data.s3Key).toContain('fabric/notes')
      expect(result.data.version).toBe(1)
    });
  });
  describe('US-01-07: Search notes by content and metadata', () => {
    // User Story:
    // As Fabric user
    // I want to search for notes by keywords
    // So that I can quickly find relevant documentation

    it('should return matching notes', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          results: [
            {
              noteId: "note-123",
              title: "Contract SOP",
              excerpt: "...contract review process...",
              score: 0.95
            }
          ]
        }
      });
      const input = {
        spaceId: "space-123",
        query: "contract review"
      };

      // Act
      const result = await searchNotes(input.spaceId, input.query)

      // Assert
      expect(result.data.results).toHaveLength(1)
      expect(result.data.results[0].title).toContain('Contract')
      expect(result.data.results[0].score).toBeGreaterThan(0)
    });

    it('should return empty array when no matches', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          results: []
        }
      });
      const input = {
        spaceId: "space-123",
        query: "nonexistent keyword"
      };

      // Act
      const result = await searchNotes(input.spaceId, input.query)

      // Assert
      expect(result.data.results).toHaveLength(0)
    });
  });
});
