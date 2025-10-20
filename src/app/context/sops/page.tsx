"use client";

/**
 * SOPs Page
 * Standard Operating Procedures list and editor
 */

import React, { useState, useEffect } from 'react';
import { SopList, SopEditor } from '@captify-io/core/components/context';
import type { ContextNode, SOPNode } from '@captify-io/core/services/context';
import {
  getGraph,
  createNode,
  updateNode,
} from '@captify-io/core/lib/context';
import { Alert, AlertDescription } from '@captify-io/core/components/ui/alert';
import { Dialog, DialogContent } from '@captify-io/core/components/ui/dialog';
import { Loader2, AlertCircle } from 'lucide-react';

export default function SopsPage() {
  const [nodes, setNodes] = useState<ContextNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // SOP editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSop, setEditingSop] = useState<SOPNode | undefined>(undefined);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Load graph data on mount
  useEffect(() => {
    loadGraph();
  }, []);

  const loadGraph = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const graph = await getGraph();
      setNodes(graph.nodes);
    } catch (err) {
      console.error('Failed to load graph:', err);
      setError(err instanceof Error ? err.message : 'Failed to load graph');
    } finally {
      setIsLoading(false);
    }
  };

  // SOP handlers
  const handleCreateSop = () => {
    setEditingSop(undefined);
    setIsReadOnly(false);
    setIsEditorOpen(true);
  };

  const handleEditSop = (sop: SOPNode) => {
    setEditingSop(sop);
    setIsReadOnly(false);
    setIsEditorOpen(true);
  };

  const handleViewSop = (sop: SOPNode) => {
    setEditingSop(sop);
    setIsReadOnly(true);
    setIsEditorOpen(true);
  };

  const handleSaveSop = async (sopData: Partial<SOPNode>) => {
    try {
      if (editingSop) {
        // Update existing SOP
        await updateNode({ id: editingSop.id, updates: { ...editingSop, ...sopData } });
      } else {
        // Create new SOP
        await createNode({
          type: 'SOP',
          name: sopData.title || 'Untitled SOP',
          ...sopData,
        });
      }
      await loadGraph();
      setIsEditorOpen(false);
    } catch (err) {
      console.error('Failed to save SOP:', err);
      throw err;
    }
  };

  const handleCloseSopEditor = () => {
    setIsEditorOpen(false);
    setEditingSop(undefined);
    setIsReadOnly(false);
  };

  // Filter SOPs from nodes
  const sopNodes = nodes.filter((node): node is SOPNode => node.type === 'SOP');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading SOPs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-auto p-6">
      <SopList
        sops={sopNodes}
        onCreateNew={handleCreateSop}
        onEdit={handleEditSop}
        onView={handleViewSop}
      />

      {/* SOP Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-6xl h-[90vh]">
          <SopEditor
            sop={editingSop}
            onSave={handleSaveSop}
            onClose={handleCloseSopEditor}
            readOnly={isReadOnly}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
