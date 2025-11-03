'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RichTextEditor } from '@captify-io/core/components/editor';
import {
  Button,
  Badge,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@captify-io/core/components/ui';
import {
  X,
  Save,
  Loader2,
  FolderOpen,
  Folders,
  ChevronDown,
  FileText,
  Plus,
  ArrowLeft
} from 'lucide-react';
import { apiClient } from '@captify-io/core';

interface Space {
  id: string;
  name: string;
  description: string;
  status: string;
}

interface SpaceDocument {
  id: string;
  name: string;
  spaceId: string;
  s3Key: string;
  createdAt: string;
  updatedAt?: string;
}

interface OpenTab {
  document: SpaceDocument;
  content: string;
  isDirty: boolean;
  isLoading?: boolean;
}

export default function SpaceEditorPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const spaceIdParam = searchParams?.get('spaceId');

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [documents, setDocuments] = useState<SpaceDocument[]>([]);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSpaceSelector, setShowSpaceSelector] = useState(false);

  // Load spaces on mount
  useEffect(() => {
    loadSpaces();
  }, []);

  // Load selected space from URL parameter
  useEffect(() => {
    if (spaceIdParam && spaces.length > 0) {
      const space = spaces.find(s => s.id === spaceIdParam);
      if (space) {
        setSelectedSpace(space);
        loadDocuments(space.id);
      }
    }
  }, [spaceIdParam, spaces]);

  const loadSpaces = async () => {
    try {
      setIsLoading(true);
      const result = await apiClient.run({
        service: 'space',
        operation: 'listSpaces',
      });

      if (result.success && result.data) {
        setSpaces(result.data);
      }
    } catch (error) {
      console.error('Failed to load spaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocuments = async (spaceId: string) => {
    try {
      const result = await apiClient.run({
        service: 'space',
        operation: 'listDocuments',
        data: { spaceId },
      });

      if (result.success && result.data) {
        setDocuments(result.data);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleSelectSpace = (space: Space) => {
    setSelectedSpace(space);
    loadDocuments(space.id);
    setShowSpaceSelector(false);

    // Update URL
    router.push(`/editor?spaceId=${space.id}`);
  };

  const handleCreateDocument = async () => {
    if (!selectedSpace) return;

    const name = prompt('Document name:');
    if (!name) return;

    try {
      const result = await apiClient.run({
        service: 'space',
        operation: 'addDocument',
        data: {
          spaceId: selectedSpace.id,
          document: {
            name,
            documentType: 'document',
            contentType: 'html',
          },
          content: '<h1>' + name + '</h1><p>Start writing...</p>',
        },
      });

      if (result.success && result.data) {
        const newDoc = result.data;
        setDocuments(prev => [...prev, newDoc]);
        handleOpenDocument(newDoc);
      }
    } catch (error) {
      console.error('Failed to create document:', error);
      alert('Failed to create document');
    }
  };

  const handleOpenDocument = async (doc: SpaceDocument) => {
    // Check if already open
    const existingTabIndex = openTabs.findIndex(tab => tab.document.id === doc.id);
    if (existingTabIndex !== -1) {
      setActiveTabIndex(existingTabIndex);
      return;
    }

    // Create tab with loading state
    const newTabIndex = openTabs.length;
    setOpenTabs(prev => [
      ...prev,
      {
        document: doc,
        content: '',
        isDirty: false,
        isLoading: true,
      },
    ]);
    setActiveTabIndex(newTabIndex);

    // Load content
    try {
      const result = await apiClient.run({
        service: 'space',
        operation: 'getDocument',
        data: {
          spaceId: doc.spaceId,
          documentId: doc.id,
        },
      });

      if (result.success && result.data) {
        setOpenTabs(prev =>
          prev.map((tab, i) =>
            i === newTabIndex
              ? { ...tab, content: result.data.content || '', isLoading: false }
              : tab
          )
        );
      }
    } catch (error) {
      console.error('Failed to load document:', error);
      setOpenTabs(prev =>
        prev.map((tab, i) =>
          i === newTabIndex
            ? { ...tab, content: '<p style="color:red;">Error loading document</p>', isLoading: false }
            : tab
        )
      );
    }
  };

  const handleCloseTab = (index: number) => {
    const tab = openTabs[index];
    if (tab.isDirty) {
      if (!confirm('You have unsaved changes. Close anyway?')) {
        return;
      }
    }

    setOpenTabs(prev => prev.filter((_, i) => i !== index));

    if (activeTabIndex === index) {
      if (openTabs.length === 1) {
        setActiveTabIndex(null);
      } else if (index === openTabs.length - 1) {
        setActiveTabIndex(index - 1);
      } else {
        setActiveTabIndex(index);
      }
    } else if (activeTabIndex !== null && activeTabIndex > index) {
      setActiveTabIndex(activeTabIndex - 1);
    }
  };

  const handleContentChange = (content: string) => {
    if (activeTabIndex === null) return;

    setOpenTabs(prev =>
      prev.map((tab, i) =>
        i === activeTabIndex ? { ...tab, content, isDirty: true } : tab
      )
    );
  };

  const handleSave = async () => {
    if (activeTabIndex === null) return;

    const tab = openTabs[activeTabIndex];

    try {
      setIsSaving(true);

      await apiClient.run({
        service: 'space',
        operation: 'updateDocument',
        data: {
          spaceId: tab.document.spaceId,
          documentId: tab.document.id,
          updates: {
            content: tab.content,
          },
        },
      });

      setOpenTabs(prev =>
        prev.map((t, i) =>
          i === activeTabIndex ? { ...t, isDirty: false } : t
        )
      );

      alert('Document saved successfully!');
    } catch (error) {
      console.error('Failed to save document:', error);
      alert('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const activeTab = activeTabIndex !== null ? openTabs[activeTabIndex] : null;

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="border-b bg-white dark:bg-slate-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/spaces')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Spaces
            </Button>

            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />

            {/* Space Selector */}
            {selectedSpace ? (
              <DropdownMenu open={showSpaceSelector} onOpenChange={setShowSpaceSelector}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <FolderOpen className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{selectedSpace.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {spaces.map(space => (
                    <DropdownMenuItem
                      key={space.id}
                      onClick={() => handleSelectSpace(space)}
                      className="flex items-center gap-2"
                    >
                      <Folders className="w-4 h-4" />
                      <div className="flex-1">
                        <div className="font-medium">{space.name}</div>
                        <div className="text-xs text-slate-500">{space.description}</div>
                      </div>
                      {space.id === selectedSpace.id && (
                        <span className="text-blue-600">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" onClick={() => setShowSpaceSelector(true)}>
                <Folders className="w-4 h-4 mr-2" />
                Select a Space
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleCreateDocument}
              disabled={!selectedSpace}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Document
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document Sidebar */}
        {selectedSpace && (
          <div className="w-64 border-r bg-white dark:bg-slate-900 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">
                Documents
              </h3>
              {documents.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No documents yet. Create one to get started!
                </p>
              ) : (
                <div className="space-y-1">
                  {documents.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => handleOpenDocument(doc)}
                      className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-sm"
                    >
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span className="flex-1 truncate">{doc.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
          {openTabs.length > 0 ? (
            <>
              {/* Tabs */}
              <div className="border-b flex items-center overflow-x-auto">
                {openTabs.map((tab, index) => (
                  <div
                    key={tab.document.id}
                    onClick={() => setActiveTabIndex(index)}
                    className={`flex items-center gap-2 px-4 py-2 border-r cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      activeTabIndex === index ? 'bg-slate-50 dark:bg-slate-800' : ''
                    }`}
                  >
                    <span className="text-sm">{tab.document.name}</span>
                    {tab.isDirty && <span className="text-xs text-orange-600">●</span>}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseTab(index);
                      }}
                      className="ml-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Toolbar */}
              {activeTab && (
                <div className="border-b p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {selectedSpace?.name}
                    </Badge>
                  </div>

                  <Button
                    onClick={handleSave}
                    size="sm"
                    disabled={isSaving || !activeTab.isDirty}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Editor */}
              {activeTab && !activeTab.isLoading && (
                <div className="flex-1 overflow-hidden">
                  <RichTextEditor
                    content={activeTab.content}
                    onChange={handleContentChange}
                  />
                </div>
              )}

              {activeTab && activeTab.isLoading && (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
              {selectedSpace ? (
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p>Select a document or create a new one to start editing</p>
                </div>
              ) : (
                <div className="text-center">
                  <Folders className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p>Select a space to view and edit documents</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
