'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FileExplorer, RichTextEditor } from '@captify-io/core/components/context';
import { Button, Badge, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@captify-io/core/components/ui';
import { X, Save, Tag, Shield, MoreVertical, Loader2 } from 'lucide-react';
import { Document, DocumentLabel, ProtectionLevel, PROTECTION_LEVELS, ContextTemplateDoc } from '@captify-io/core/types';
import {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentContent,
  saveDocumentContent,
  listTemplatesForUser,
} from '@captify-io/core/services/context';

const LABEL_PRESETS: DocumentLabel[] = [
  { id: 'process', name: 'process', color: '#3b82f6' },
  { id: 'operations', name: 'operations', color: '#8b5cf6' },
  { id: 'governance', name: 'governance', color: '#ec4899' },
  { id: 'compliance', name: 'compliance', color: '#ef4444' },
  { id: 'api', name: 'api', color: '#10b981' },
  { id: 'technical', name: 'technical', color: '#06b6d4' },
  { id: 'integration', name: 'integration', color: '#6366f1' },
  { id: 'architecture', name: 'architecture', color: '#8b5cf6' },
  { id: 'design', name: 'design', color: '#ec4899' },
  { id: 'support', name: 'support', color: '#f59e0b' },
  { id: 'data', name: 'data', color: '#10b981' },
  { id: 'schema', name: 'schema', color: '#06b6d4' },
  { id: 'documentation', name: 'documentation', color: '#6b7280' },
  { id: 'guide', name: 'guide', color: '#3b82f6' },
  { id: 'specification', name: 'specification', color: '#8b5cf6' },
  { id: 'requirements', name: 'requirements', color: '#ec4899' },
  { id: 'decision', name: 'decision', color: '#f59e0b' },
];

interface OpenTab {
  document: Document;
  content: string;
  isDirty: boolean;
}

export default function EditorPage() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [templates, setTemplates] = useState<ContextTemplateDoc[]>([]);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load documents and templates
  useEffect(() => {
    loadDocuments();
    loadTemplates();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await listDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      // TODO: Get user's domain and role from UserState preferences
      // For now, load all templates
      const allTemplates = await listTemplatesForUser();
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleSelectDocument = async (doc: Document) => {
    if (doc.type === 'folder') {
      return; // Don't open folders
    }

    // Check if already open
    const existingTabIndex = openTabs.findIndex((tab) => tab.document.id === doc.id);
    if (existingTabIndex !== -1) {
      setActiveTabIndex(existingTabIndex);
      return;
    }

    // Load document content from S3
    try {
      const fullDoc = await getDocument(doc.id);
      if (!fullDoc || !fullDoc.s3Key) {
        console.error('Document has no content key');
        return;
      }

      const content = await getDocumentContent(fullDoc.s3Key);

      // Add new tab
      setOpenTabs((prev) => [
        ...prev,
        {
          document: fullDoc,
          content,
          isDirty: false,
        },
      ]);
      setActiveTabIndex(openTabs.length);
    } catch (error) {
      console.error('Failed to load document:', error);
      alert('Failed to load document');
    }
  };

  const handleCloseTab = (index: number) => {
    const tab = openTabs[index];
    if (tab.isDirty) {
      if (!confirm('You have unsaved changes. Close anyway?')) {
        return;
      }
    }

    setOpenTabs((prev) => prev.filter((_, i) => i !== index));

    // Update active tab
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

    setOpenTabs((prev) =>
      prev.map((tab, i) =>
        i === activeTabIndex
          ? { ...tab, content, isDirty: true }
          : tab
      )
    );
  };

  const handleSave = async () => {
    if (activeTabIndex === null || !session?.user?.id) return;

    const tab = openTabs[activeTabIndex];
    if (!tab.document.s3Key) return;

    try {
      setIsSaving(true);

      // Save content to S3
      await saveDocumentContent(tab.document.s3Key, tab.content);

      // Update document metadata (updatedAt, updatedBy)
      await updateDocument(
        {
          id: tab.document.id,
        },
        session.user.id
      );

      // Mark as clean
      setOpenTabs((prev) =>
        prev.map((t, i) =>
          i === activeTabIndex ? { ...t, isDirty: false } : t
        )
      );
    } catch (error) {
      console.error('Failed to save document:', error);
      alert('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFolder = async (parentId: string | null, name: string) => {
    if (!session?.user?.id) return;

    try {
      const newFolder = await createDocument(
        {
          type: 'folder',
          name,
          parentId,
        },
        session.user.id
      );

      setDocuments((prev) => [...prev, newFolder]);
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder');
    }
  };

  const handleCreateDocument = async (parentId: string | null, templateId: string, name: string) => {
    if (!session?.user?.id) return;

    try {
      // Find the template to get domain and category
      const template = templates.find((t) => t.id === templateId);
      if (!template) {
        alert('Template not found');
        return;
      }

      const newDoc = await createDocument(
        {
          type: templateId as any,
          name,
          parentId,
          templateId,
          domain: template.domain,
          category: template.category,
        },
        session.user.id
      );

      setDocuments((prev) => [...prev, newDoc]);
      // Auto-open the new document
      handleSelectDocument(newDoc);
    } catch (error) {
      console.error('Failed to create document:', error);
      alert('Failed to create document');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this?')) return;

    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));

      // Close tab if open
      const tabIndex = openTabs.findIndex((tab) => tab.document.id === id);
      if (tabIndex !== -1) {
        handleCloseTab(tabIndex);
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete: ' + (error as Error).message);
    }
  };

  const handleRename = async (id: string, oldName: string) => {
    const newName = prompt('Enter new name:', oldName);
    if (!newName || newName === oldName || !session?.user?.id) return;

    try {
      await updateDocument(
        {
          id,
          name: newName,
        },
        session.user.id
      );

      setDocuments((prev) => prev.map((doc) => (doc.id === id ? { ...doc, name: newName } : doc)));

      // Update tab if open
      setOpenTabs((prev) =>
        prev.map((tab) =>
          tab.document.id === id ? { ...tab, document: { ...tab.document, name: newName } } : tab
        )
      );
    } catch (error) {
      console.error('Failed to rename document:', error);
      alert('Failed to rename');
    }
  };

  const handleToggleLabel = async (label: DocumentLabel) => {
    if (activeTabIndex === null || !session?.user?.id) return;

    const tab = openTabs[activeTabIndex];
    const hasLabel = tab.document.labels.some((l) => l.id === label.id);
    const newLabels = hasLabel
      ? tab.document.labels.filter((l) => l.id !== label.id)
      : [...tab.document.labels, label];

    try {
      await updateDocument(
        {
          id: tab.document.id,
          labels: newLabels,
        },
        session.user.id
      );

      setOpenTabs((prev) =>
        prev.map((t, i) =>
          i === activeTabIndex ? { ...t, document: { ...t.document, labels: newLabels } } : t
        )
      );
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === tab.document.id ? { ...doc, labels: newLabels } : doc))
      );
    } catch (error) {
      console.error('Failed to update labels:', error);
    }
  };

  const handleSetProtection = async (protection: ProtectionLevel) => {
    if (activeTabIndex === null || !session?.user?.id) return;

    const tab = openTabs[activeTabIndex];

    try {
      await updateDocument(
        {
          id: tab.document.id,
          protection,
        },
        session.user.id
      );

      setOpenTabs((prev) =>
        prev.map((t, i) =>
          i === activeTabIndex ? { ...t, document: { ...t.document, protection } } : t
        )
      );
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === tab.document.id ? { ...doc, protection } : doc))
      );
    } catch (error) {
      console.error('Failed to update protection:', error);
    }
  };

  const activeTab = activeTabIndex !== null ? openTabs[activeTabIndex] : null;

  return (
    <div className="h-screen flex">
      {/* File Explorer Sidebar */}
      <div className="w-64 border-r bg-card">
        <FileExplorer
          documents={documents}
          templates={templates}
          onSelect={handleSelectDocument}
          onCreateFolder={handleCreateFolder}
          onCreateDocument={handleCreateDocument}
          onDelete={handleDelete}
          onRename={handleRename}
          selectedId={activeTab?.document.id}
        />
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col">
        {openTabs.length > 0 ? (
          <>
            {/* Tab Bar */}
            <div className="border-b bg-card flex items-center overflow-x-auto">
              {openTabs.map((tab, index) => (
                <div
                  key={tab.document.id}
                  onClick={() => setActiveTabIndex(index)}
                  className={`flex items-center gap-2 px-4 py-2 border-r cursor-pointer hover:bg-accent ${
                    activeTabIndex === index ? 'bg-accent' : ''
                  }`}
                >
                  <span className="text-sm">{tab.document.name}</span>
                  {tab.isDirty && <span className="text-xs text-muted-foreground">●</span>}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseTab(index);
                    }}
                    className="ml-2 hover:bg-muted rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Active Tab Toolbar */}
            {activeTab && (
              <div className="border-b p-3 flex items-center justify-between bg-card">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex gap-1 flex-wrap">
                    {activeTab.document.labels.map((label) => (
                      <Badge
                        key={label.id}
                        variant="outline"
                        style={{ borderColor: label.color, color: label.color }}
                      >
                        {label.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Labels menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Tag className="h-4 w-4 mr-2" />
                        Labels
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {LABEL_PRESETS.map((label) => {
                        const isActive = activeTab.document.labels.some((l) => l.id === label.id);
                        return (
                          <DropdownMenuItem key={label.id} onClick={() => handleToggleLabel(label)}>
                            <div className="flex items-center gap-2 w-full">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: label.color }}
                              />
                              <span className="flex-1">{label.name}</span>
                              {isActive && <span className="text-xs">✓</span>}
                            </div>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Protection menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Shield className="h-4 w-4 mr-2" />
                        {
                          PROTECTION_LEVELS.find((p) => p.value === activeTab.document.protection)
                            ?.label
                        }
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {PROTECTION_LEVELS.map((level) => (
                        <DropdownMenuItem
                          key={level.value}
                          onClick={() => handleSetProtection(level.value)}
                        >
                          <div className="flex flex-col gap-1">
                            <div className="font-medium">{level.label}</div>
                            <div className="text-xs text-muted-foreground">{level.description}</div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Save button */}
                  <Button onClick={handleSave} size="sm" disabled={isSaving || !activeTab.isDirty}>
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
              </div>
            )}

            {/* Active Tab Content */}
            {activeTab && (
              <div className="flex-1 overflow-hidden">
                <RichTextEditor content={activeTab.content} onChange={handleContentChange} />
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            {isLoading ? 'Loading...' : 'Select a file from the explorer to start editing'}
          </div>
        )}
      </div>
    </div>
  );
}
