// Auto-generated from src/workshops/fabric/user-stories/03-frontend-ui.yaml
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests
//
// Feature: Fabric Frontend UI Components (03)
// Priority: P0
// Story Points: 21
// Estimated Hours: 42

import { render, screen, fireEvent, waitFor } from '@testing-library/react';


describe('Feature: Fabric Frontend UI Components', () => {
  describe('US-03-01: Tabbed sidebar with four views', () => {
    // User Story:
    // As Fabric user
    // I want a sidebar with Folder, Ontology, Search, and Bookmarks tabs
    // So that I can access different views of my content

    it('should render sidebar with four tabs', async () => {
      // Arrange
      const props = {
        spaceId: "space-123",
        activeTab: "folder",
        isOpen: true
      };

      // Act
      render(<Sidebar {...props} />)

      // Assert
      expect(screen.getByText('Folder')).toBeInTheDocument()
      expect(screen.getByText('Ontology')).toBeInTheDocument()
      expect(screen.getByText('Search')).toBeInTheDocument()
      expect(screen.getByText('Bookmarks')).toBeInTheDocument()
    });

    it('should switch tabs when clicked', async () => {
      // Arrange
      const props = {
        spaceId: "space-123",
        activeTab: "folder"
      };

      // Act
      render(<Sidebar {...props} />)
      fireEvent.click(screen.getByText('Search'))

      // Assert
      expect(props.onTabChange).toHaveBeenCalledWith('search')
    });

    it('should toggle sidebar open/close', async () => {
      // Arrange
      const props = {
        spaceId: "space-123",
        isOpen: true
      };

      // Act
      render(<Sidebar {...props} />)
      fireEvent.click(screen.getByLabelText('Toggle sidebar'))

      // Assert
      expect(props.onToggle).toHaveBeenCalled()
    });

    // Edge Cases to Consider:
    // - Sidebar closed, user clicks tab: Sidebar opens to that tab
    // - User clicks same tab twice: No action, tab stays active
  });
  describe('US-03-02: Folder view with tree navigation', () => {
    // User Story:
    // As Fabric user
    // I want to see my notes organized in a folder tree
    // So that I can browse and organize my documentation

    it('should render folder tree', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          notes: [
            {
              id: "note-1",
              title: "SOP",
              folder: "/sops"
            },
            {
              id: "note-2",
              title: "Contract",
              folder: "/contracts"
            }
          ]
        }
      });
      const props = {
        spaceId: "space-123"
      };

      // Act
      render(<FolderView {...props} />)

      // Assert
      await waitFor(() => expect(screen.getByText('sops')).toBeInTheDocument())
      expect(screen.getByText('contracts')).toBeInTheDocument()
    });

    it('should expand/collapse folders', async () => {
      // Arrange
      const props = {
        folders: [
          {
            id: "folder-1",
            path: "/sops",
            children: [
              "note-1",
              "note-2"
            ]
          }
        ]
      };

      // Act
      render(<FolderTree {...props} />)
      fireEvent.click(screen.getByText('/sops'))

      // Assert
      expect(screen.getByText('note-1')).toBeVisible()
    });

    it('should create new note with + button', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          noteId: "note-new",
          title: "Untitled"
        }
      });

      // Act
      render(<FolderView spaceId="space-123" />)
      fireEvent.click(screen.getByText('+ Note'))

      // Assert
      expect(apiClient.run).toHaveBeenCalledWith(expect.objectContaining({ operation: 'createNote' }))
    });
  });
  describe('US-03-03: Multi-tab editor with auto-save', () => {
    // User Story:
    // As Fabric user
    // I want to have multiple notes open in tabs with automatic saving
    // So that I can work on multiple documents without losing changes

    it('should open note in new tab', async () => {
      // Arrange
      const props = {
        tabs: []
      };

      // Act
      render(<EditorArea {...props} />)
      props.onOpenNote("note-123", "Test Note")

      // Assert
      expect(props.tabs).toContain(expect.objectContaining({ noteId: 'note-123' }))
    });

    it('should auto-save after 500ms', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        success: true
      });
      const props = {
        noteId: "note-123",
        content: "Initial"
      };

      // Act
      render(<NoteEditor {...props} />)
      fireEvent.change(editor, { target: { value: 'Updated content' }})
      await waitFor(() => {}, { timeout: 600 })

      // Assert
      expect(apiClient.run).toHaveBeenCalledWith(expect.objectContaining({ operation: 'updateNote' }))
    });

    it('should close tab with × button', async () => {
      // Arrange
      const props = {
        tabs: [
          {
            id: "tab-1",
            noteId: "note-1",
            title: "Test"
          }
        ]
      };

      // Act
      render(<TabBar {...props} />)
      fireEvent.click(screen.getByLabelText('Close tab'))

      // Assert
      expect(props.onCloseTab).toHaveBeenCalledWith('tab-1')
    });
  });
  describe('US-03-04: Inspector with graph view and backlinks', () => {
    // User Story:
    // As Fabric user
    // I want to see connections and metadata for the current note
    // So that I can understand relationships and navigate related content

    it('should render graph view with connections', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          nodes: [
            {
              id: "note-123",
              label: "Current Note"
            },
            {
              id: "note-456",
              label: "Linked Note"
            }
          ],
          edges: [
            {
              source: "note-123",
              target: "note-456"
            }
          ]
        }
      });
      const props = {
        noteId: "note-123"
      };

      // Act
      render(<GraphView {...props} />)

      // Assert
      await waitFor(() => expect(screen.getByText('Current Note')).toBeInTheDocument())
    });

    it('should show backlinks panel', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          backlinks: [
            {
              noteId: "note-1",
              title: "SOP"
            },
            {
              noteId: "note-2",
              title: "Contract"
            }
          ]
        }
      });
      const props = {
        noteId: "note-123"
      };

      // Act
      render(<BacklinksPanel {...props} />)

      // Assert
      await waitFor(() => expect(screen.getByText('SOP')).toBeInTheDocument())
      expect(screen.getByText('Contract')).toBeInTheDocument()
    });
  });
  describe('US-03-05: Ontology view with entity browser', () => {
    // User Story:
    // As Fabric user
    // I want to browse ontology entities linked to notes
    // So that I can explore connections between documentation and entities

    it('should render ontology view with sub-tabs', async () => {
      // Arrange
      const props = {
        spaceId: "space-123",
        activeSubTab: "objects"
      };

      // Act
      render(<OntologyView {...props} />)

      // Assert
      expect(screen.getByText('Objects')).toBeInTheDocument()
      expect(screen.getByText('Links')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    });

    it('should list linked entities', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          entities: [
            {
              type: "contract",
              id: "ABC-123",
              linkedNotes: [
                "note-1",
                "note-2"
              ]
            }
          ]
        }
      });
      const props = {
        spaceId: "space-123"
      };

      // Act
      render(<OntologyView {...props} />)

      // Assert
      await waitFor(() => expect(screen.getByText('ABC-123')).toBeInTheDocument())
    });
  });
  describe('US-03-06: Search view with full-text search', () => {
    // User Story:
    // As Fabric user
    // I want to search across all notes by content and metadata
    // So that I can quickly find relevant information

    it('should search and return results', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          results: [
            {
              noteId: "note-1",
              title: "Contract SOP",
              excerpt: "...review **contract** process...",
              score: 0.95
            }
          ]
        }
      });
      const props = {
        spaceId: "space-123"
      };

      // Act
      render(<SearchView {...props} />)
      fireEvent.change(screen.getByPlaceholderText('Search notes...'), {
      target: { value: 'contract' }
      })
      await waitFor(() => {}, { timeout: 400 })

      // Assert
      expect(apiClient.run).toHaveBeenCalledWith(expect.objectContaining({ operation: 'searchNotes' }))
      expect(screen.getByText('Contract SOP')).toBeInTheDocument()
    });
  });
  describe('US-03-07: Bookmarks view with pinning', () => {
    // User Story:
    // As Fabric user
    // I want to bookmark important notes and group them
    // So that I can quickly access frequently used documentation

    it('should add bookmark when clicked', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          bookmarkId: "bookmark-1"
        }
      });
      const props = {
        activeNoteId: "note-123"
      };

      // Act
      render(<BookmarksView {...props} />)
      fireEvent.click(screen.getByText('+ Bookmark'))

      // Assert
      expect(apiClient.run).toHaveBeenCalledWith(expect.objectContaining({ operation: 'createBookmark' }))
    });

    it('should show update badges on watched notes', async () => {
      // Arrange
      const props = {
        watchedNotes: [
          {
            noteId: "note-1",
            title: "SOP",
            unreadUpdates: 3
          }
        ]
      };

      // Act
      render(<BookmarksView {...props} />)

      // Assert
      expect(screen.getByText('3')).toHaveClass('badge')
    });
  });
  describe('US-03-08: Daily notes auto-creation', () => {
    // User Story:
    // As Fabric user
    // I want daily notes to be automatically created each day
    // So that I have a structured place for daily documentation

    it('should create daily note if not exists', async () => {
      // Arrange

      // Act
      await checkAndCreateDailyNote(spaceId)

      // Assert
      expect(apiClient.run).toHaveBeenCalledWith(expect.objectContaining({ operation: 'createNote', data: expect.objectContaining({ title: expect.stringContaining('Daily Note') }) }))
    });
  });
});
