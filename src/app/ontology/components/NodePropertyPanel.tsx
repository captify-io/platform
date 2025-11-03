"use client";

/**
 * Node Property Panel
 * Edit properties of the selected node
 */

import React, { useState, useEffect } from 'react';
import { useDesigner } from '../context/DesignerContext';
import type { DesignerNode, DesignerNodeType, DesignerEdge } from '@captify-io/core/types';
import { X, Trash2, Unlink, Link2 } from 'lucide-react';
import { Button } from '@captify-io/core/components/ui';
import { DesignerPropertiesSection } from './DesignerPropertiesSection';
import type { NodeProperty } from '@captify-io/core/workflow';

interface NodePropertyPanelProps {
  nodeId: string;
}

export function NodePropertyPanel({ nodeId }: NodePropertyPanelProps) {
  const { model, updateNode, deleteNode, setSelectedNode } = useDesigner();

  // Find the node
  const node = model.decisionModel.nodes.find(n => n.id === nodeId);

  // Local state for editing
  const [label, setLabel] = useState(node?.data.label || '');
  const [description, setDescription] = useState(node?.data.description || '');
  const [properties, setProperties] = useState<NodeProperty[]>(node?.data.config?.properties || []);

  // Get edges connected to this node
  const incomingEdges = model.decisionModel.edges.filter(e => e.target === nodeId);
  const outgoingEdges = model.decisionModel.edges.filter(e => e.source === nodeId);

  // Reset form when node changes
  useEffect(() => {
    if (node) {
      setLabel(node.data.label);
      setDescription(node.data.description || '');
      setProperties(node.data.config?.properties || []);
    }
  }, [node?.id]);

  // Auto-save helper
  const autoSave = (updates: Partial<typeof node.data>) => {
    updateNode(nodeId, {
      data: {
        ...node.data,
        ...updates,
      },
    });
  };

  if (!node) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-muted-foreground">
          <p>Node not found</p>
        </div>
      </div>
    );
  }

  const handlePropertiesUpdate = (updatedProperties: NodeProperty[]) => {
    setProperties(updatedProperties);
    autoSave({
      config: {
        ...node.data.config,
        properties: updatedProperties,
      },
    });
  };

  const handleDelete = () => {
    if (confirm(`Delete "${node.data.label}"?`)) {
      deleteNode(nodeId);
      setSelectedNode(null);
    }
  };

  const handleClose = () => {
    setSelectedNode(null);
  };

  const handleDetachFromContainer = () => {
    // Get current absolute position before detaching
    const currentNode = model.decisionModel.nodes.find(n => n.id === nodeId);
    if (!currentNode || !(currentNode as any).parentId) return;

    // Find parent to calculate absolute position
    const parentNode = model.decisionModel.nodes.find(n => n.id === (currentNode as any).parentId);
    if (!parentNode) return;

    // Calculate absolute position (relative position + parent position)
    const absolutePosition = {
      x: currentNode.position.x + parentNode.position.x + 20, // Offset by 20px to make it visible
      y: currentNode.position.y + parentNode.position.y + 20,
    };

    // Update node to remove parent and set absolute position
    updateNode(nodeId, {
      parentId: undefined,
      extent: undefined,
      position: absolutePosition,
    } as any);
  };


  // Node type display names
  const nodeTypeLabels: Record<DesignerNodeType, string> = {
    painpoint: 'Pain Point',
    opportunity: 'Opportunity',
    hypothesis: 'Hypothesis',
    insight: 'Insight',
    decision: 'Decision',
    bkm: 'Business Knowledge Model',
    inputdata: 'Input Data',
    decisionservice: 'Decision Service',
    knowledgesource: 'Knowledge Source',
    group: 'Group',
    textannotation: 'Text Annotation',
    person: 'Person',
    process: 'Process',
    system: 'System',
    policy: 'Policy',
  };

  // Category colors
  const categoryColors: Record<string, string> = {
    discovery: 'text-orange-500',
    decision: 'text-blue-500',
    people_process_tech: 'text-green-500',
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium truncate ${categoryColors[node.data.category] || 'text-foreground'}`}>
            {label || nodeTypeLabels[node.type]}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-8 w-8 p-0"
          title="Close panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Label */}
        <div>
          <label htmlFor="node-label" className="block text-sm font-medium mb-1.5">
            Label
          </label>
          <input
            id="node-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => autoSave({ label })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Enter node label..."
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="node-description" className="block text-sm font-medium mb-1.5">
            Description
          </label>
          <textarea
            id="node-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => autoSave({ description })}
            rows={4}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            placeholder="Enter node description..."
          />
        </div>

        {/* Properties */}
        <div className="pt-4 border-t">
          <DesignerPropertiesSection
            properties={properties}
            onUpdate={handlePropertiesUpdate}
            upstreamVariables={[]}
          />
        </div>

        {/* Connections */}
        {(incomingEdges.length > 0 || outgoingEdges.length > 0) && (
          <div className="pt-4 border-t">
            <div className="text-sm font-medium mb-3 flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Connections
            </div>

            {/* Incoming Edges */}
            {incomingEdges.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Incoming ({incomingEdges.length})
                </div>
                <div className="space-y-1.5">
                  {incomingEdges.map(edge => {
                    const sourceNode = model.decisionModel.nodes.find(n => n.id === edge.source);
                    return (
                      <div key={edge.id} className="flex items-center gap-2 p-2 rounded bg-muted/30 text-xs">
                        <span className="font-medium">{sourceNode?.data.label || 'Unknown'}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">
                          {edge.type || 'connection'}
                        </span>
                        {edge.label && (
                          <span className="text-muted-foreground">"{edge.label}"</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Outgoing Edges */}
            {outgoingEdges.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Outgoing ({outgoingEdges.length})
                </div>
                <div className="space-y-1.5">
                  {outgoingEdges.map(edge => {
                    const targetNode = model.decisionModel.nodes.find(n => n.id === edge.target);
                    return (
                      <div key={edge.id} className="flex items-center gap-2 p-2 rounded bg-muted/30 text-xs">
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">
                          {edge.type || 'connection'}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">{targetNode?.data.label || 'Unknown'}</span>
                        {edge.label && (
                          <span className="text-muted-foreground">"{edge.label}"</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Container relationship */}
        {(node as any).parentId && (
          <div className="pt-4 border-t">
            <div className="text-xs font-medium mb-2">Container Relationship</div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <span className="text-xs text-muted-foreground">
                This node is inside a container
              </span>
              <Button
                onClick={handleDetachFromContainer}
                variant="outline"
                size="sm"
                className="h-7 gap-1.5"
              >
                <Unlink className="h-3 w-3" />
                Remove
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Button - Bottom Right */}
      <div className="p-3 border-t flex justify-end">
        <Button
          onClick={handleDelete}
          variant="destructive"
          size="sm"
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete Node
        </Button>
      </div>
    </div>
  );
}
