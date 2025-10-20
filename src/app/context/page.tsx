"use client";

/**
 * Context Fabric Page
 * Main page for Context Fabric Builder with tabs for different views
 */

import React, { useState, useEffect } from 'react';
import { ContextCanvas } from '@captify-io/core/components/context';
import type { ContextNode, ContextEdge } from '@captify-io/core/services/context';
import {
  getGraph,
  createNode,
  updateNode,
  deleteNode,
  createEdge,
  deleteEdge,
} from '@captify-io/core/lib/context';
import { Alert, AlertDescription } from '@captify-io/core/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

export default function ContextPage() {
  const [nodes, setNodes] = useState<ContextNode[]>([]);
  const [edges, setEdges] = useState<ContextEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setEdges(graph.edges);
    } catch (err) {
      console.error('Failed to load graph:', err);
      setError(err instanceof Error ? err.message : 'Failed to load graph');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (updatedNodes: ContextNode[], updatedEdges: ContextEdge[]) => {
    try {
      // Determine which nodes are new, updated, or deleted
      const existingNodeIds = new Set(nodes.map((n) => n.id));
      const updatedNodeIds = new Set(updatedNodes.map((n) => n.id));

      // Delete nodes that are no longer in the graph
      for (const node of nodes) {
        if (!updatedNodeIds.has(node.id)) {
          await deleteNode(node.id);
        }
      }

      // Create or update nodes
      for (const node of updatedNodes) {
        if (existingNodeIds.has(node.id)) {
          // Update existing node
          await updateNode({ id: node.id, updates: node });
        } else {
          // This shouldn't happen in normal flow, but handle it
          // The node should already be created when added to canvas
          console.warn('Node not found in existing nodes, skipping:', node.id);
        }
      }

      // Handle edges similarly
      const existingEdgeIds = new Set(edges.map((e) => e.id));
      const updatedEdgeIds = new Set(updatedEdges.map((e) => e.id));

      // Delete edges that are no longer in the graph
      for (const edge of edges) {
        if (!updatedEdgeIds.has(edge.id)) {
          await deleteEdge(edge.id);
        }
      }

      // Create new edges
      for (const edge of updatedEdges) {
        if (!existingEdgeIds.has(edge.id)) {
          await createEdge({
            source: edge.source,
            target: edge.target,
            verb: edge.verb,
            label: edge.label,
            description: edge.description,
            metadata: edge.metadata,
          });
        }
      }

      // Reload graph to get updated data
      await loadGraph();
    } catch (err) {
      console.error('Failed to save graph:', err);
      throw err;
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading context graph...</p>
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
    <div className="h-screen">
      <ContextCanvas
        initialNodes={nodes}
        initialEdges={edges}
        onSave={handleSave}
      />
    </div>
  );
}
