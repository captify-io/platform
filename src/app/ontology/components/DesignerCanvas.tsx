"use client";

/**
 * Designer Canvas
 * Visual canvas for building agent decision models
 * Wraps React Flow with designer-specific nodes
 */

import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  EdgeChange,
  NodeChange,
  Panel,
  OnNodeDrag,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useDesigner } from '../context/DesignerContext';
import type { DesignerNode, DesignerEdge, DesignerNodeType } from '@captify-io/core/types';
import { Plus } from 'lucide-react';
import {
  PainPointNode,
  OpportunityNode,
  HypothesisNode,
  InsightNode,
  DecisionNode,
  BkmNode,
  KnowledgeSourceNode,
  InputDataNode,
  DecisionServiceNode,
  GroupNode,
  TextAnnotationNode,
  PersonNode,
  ProcessNode,
  SystemNode,
  PolicyNode,
  DefaultNode,
} from './nodes';

// Node type definitions with custom components
const nodeTypes = {
  // Discovery nodes
  painpoint: PainPointNode,
  opportunity: OpportunityNode,
  hypothesis: HypothesisNode,
  insight: InsightNode,

  // Decision nodes (DMN elements)
  decision: DecisionNode,
  bkm: BkmNode,
  knowledgesource: KnowledgeSourceNode,
  inputdata: InputDataNode,
  decisionservice: DecisionServiceNode,
  group: GroupNode,
  textannotation: TextAnnotationNode,

  // Context nodes
  person: PersonNode,
  process: ProcessNode,
  system: SystemNode,
  policy: PolicyNode,

  // Core nodes
  assistant: DefaultNode,
  guardrails: DefaultNode,
  file_search: DefaultNode,

  // Process nodes
  model: DefaultNode,
  procedure: DefaultNode,
  gate: DefaultNode,

  // Logic nodes
  if_else: DefaultNode,
  while: DefaultNode,
  userapproval: DefaultNode,

  // Data nodes
  catalog: DefaultNode,
  dataset: DefaultNode,
  dataproduct: DefaultNode,
  schema: DefaultNode,
  source: DefaultNode,
  transform: DefaultNode,

  // Technology nodes
  application: DefaultNode,
  platform: DefaultNode,
  service: DefaultNode,
  tool: DefaultNode,

  // People nodes
  team: DefaultNode,
  role: DefaultNode,
  sop: DefaultNode,
};

interface DesignerCanvasProps {
  showPalette?: boolean;
  onAddNode?: (nodeType: DesignerNodeType) => void;
}

export function DesignerCanvas({ showPalette = true, onAddNode: externalOnAddNode }: DesignerCanvasProps) {
  const {
    model,
    addNode,
    updateNode,
    deleteNode,
    addEdge: addEdgeToModel,
    deleteEdge,
    setSelectedNode,
    setSelectedEdge,
    selectedNodeId,
  } = useDesigner();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(model.decisionModel.nodes as any[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(model.decisionModel.edges as any[]);
  const [hoveredContainer, setHoveredContainer] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Sync model changes to React Flow nodes
  useEffect(() => {
    setNodes(model.decisionModel.nodes as any[]);
  }, [model.decisionModel.nodes, setNodes]);

  // Sync selection state from context to React Flow
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      }))
    );
  }, [selectedNodeId, setNodes]);

  // Helper function to check if a node is over a group
  const findContainerUnderNode = useCallback((draggedNode: Node, allNodes: Node[]) => {
    if (draggedNode.type === 'group') return null;

    for (const potentialContainer of allNodes) {
      if (potentialContainer.type !== 'group' || potentialContainer.id === draggedNode.id) {
        continue;
      }

      const containerPos = potentialContainer.position;
      const containerWidth = (potentialContainer as any).measured?.width || (potentialContainer as any).style?.width || 300;
      const containerHeight = (potentialContainer as any).measured?.height || (potentialContainer as any).style?.height || 200;

      const nodePos = draggedNode.position;
      const nodeWidth = (draggedNode as any).measured?.width || 160;
      const nodeHeight = (draggedNode as any).measured?.height || 40;

      // Check if the center of the dragged node is within container bounds
      const nodeCenterX = nodePos.x + nodeWidth / 2;
      const nodeCenterY = nodePos.y + nodeHeight / 2;

      if (
        nodeCenterX >= containerPos.x &&
        nodeCenterX <= containerPos.x + containerWidth &&
        nodeCenterY >= containerPos.y &&
        nodeCenterY <= containerPos.y + containerHeight
      ) {
        return potentialContainer.id;
      }
    }
    return null;
  }, []);

  // Handle node drag start
  const onNodeDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Handle node drag for real-time parent detection
  const onNodeDrag: OnNodeDrag = useCallback((event, node) => {
    setDraggedNodeId(node.id);

    // Find if node is over a container
    const containerId = findContainerUnderNode(node, nodes);
    setHoveredContainer(containerId);
  }, [nodes, findContainerUnderNode]);

  // Handle drag end to clear hover state
  const onNodeDragStop = useCallback(() => {
    setDraggedNodeId(null);
    setHoveredContainer(null);
    // Delay clearing drag state to prevent selection
    setTimeout(() => setIsDragging(false), 50);
  }, []);

  // Handle new connections
  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;

    const newEdge: DesignerEdge = {
      id: `edge-${Date.now()}`,
      source: connection.source,
      target: connection.target,
      type: 'flow',
    };

    setEdges((eds) => addEdge(connection, eds));
    addEdgeToModel(newEdge);
  }, [addEdgeToModel, setEdges]);

  // Handle node changes and parent-child relationships
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);

    // Sync position changes to model and handle parent detection
    changes.forEach((change) => {
      if (change.type === 'position' && change.position && !change.dragging) {
        // Node finished dragging - check if it should be parented
        const node = nodes.find(n => n.id === change.id);
        if (node && node.type !== 'group' && node.type !== 'textannotation') {
          // Find if node should be in a group
          const newParentId = findContainerUnderNode(node, nodes);
          const currentParentId = (node as any).parentId;

          // Update parent relationship if changed
          if (newParentId !== currentParentId) {
            const parentNode = newParentId ? nodes.find(n => n.id === newParentId) : null;
            const relativePosition = parentNode
              ? {
                  x: change.position.x - parentNode.position.x,
                  y: change.position.y - parentNode.position.y,
                }
              : change.position;

            setNodes(nds =>
              nds.map(n =>
                n.id === change.id
                  ? {
                      ...n,
                      parentId: newParentId,
                      position: relativePosition,
                      extent: newParentId ? ('parent' as const) : undefined,
                      expandParent: true,
                    }
                  : n
              )
            );

            updateNode(change.id, {
              position: relativePosition,
              parentId: newParentId,
              extent: newParentId ? 'parent' : undefined,
              expandParent: true,
            } as any);
          } else {
            // Just update position
            updateNode(change.id, { position: change.position } as any);
          }
        } else {
          // Group or Text annotation node - just update position
          updateNode(change.id, { position: change.position } as any);
        }
      } else if (change.type === 'remove') {
        deleteNode(change.id);
      }
    });
  }, [onNodesChange, updateNode, deleteNode, nodes, setNodes, findContainerUnderNode]);

  // Handle edge changes
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes);
    changes.forEach((change) => {
      if (change.type === 'remove') {
        deleteEdge(change.id);
      }
    });
  }, [onEdgesChange, deleteEdge]);

  // Handle selection changes
  const onSelectionChange = useCallback(({ nodes, edges }: { nodes: any[], edges: any[] }) => {
    // Don't update selection if currently dragging
    if (isDragging) return;

    if (nodes.length > 0) {
      setSelectedNode(nodes[0].id);
    } else if (edges.length > 0) {
      setSelectedEdge(edges[0].id);
    } else {
      setSelectedNode(null);
      setSelectedEdge(null);
    }
  }, [setSelectedNode, setSelectedEdge, isDragging]);

  // Handle node addition from palette click
  const handleAddNode = useCallback((nodeType: DesignerNodeType) => {
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
    };

    // Determine category based on node type
    const getCategoryForNodeType = (type: DesignerNodeType): string => {
      if (['painpoint', 'opportunity', 'hypothesis', 'insight'].includes(type)) return 'discovery';
      if (['person', 'process', 'system', 'policy'].includes(type)) return 'people_process_tech';
      return 'decision';
    };

    const newNode: DesignerNode = {
      id: `node-${Date.now()}`,
      type: nodeType,
      position,
      data: {
        label: nodeType.charAt(0).toUpperCase() + nodeType.slice(1),
        category: getCategoryForNodeType(nodeType),
      },
    };

    // Group and Text annotation nodes need special properties for resizing
    if (nodeType === 'group') {
      (newNode as any).style = {
        width: 300,
        height: 200,
        zIndex: -1,
      };
    }
    if (nodeType === 'textannotation') {
      (newNode as any).style = {
        width: 200,
        height: 150,
      };
    }

    setNodes((nds) => [...nds, newNode as any]);
    addNode(newNode);
  }, [addNode, setNodes]);

  // Expose handleAddNode to parent
  useEffect(() => {
    if (externalOnAddNode) {
      externalOnAddNode(handleAddNode as any);
    }
  }, [externalOnAddNode, handleAddNode]);

  // Update nodes with hover state for visual feedback
  const nodesWithHoverState = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      isHovered: hoveredContainer === node.id,
    }
  }));

  return (
    <div ref={reactFlowWrapper} className="w-full h-full react-flow-designer">
      <style jsx global>{`
        .react-flow-designer .react-flow__controls,
        .react-flow-designer .react-flow__minimap {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
        }
        .react-flow-designer .react-flow__controls button {
          background: hsl(var(--background));
          border-bottom: 1px solid hsl(var(--border));
          color: hsl(var(--foreground));
        }
        .react-flow-designer .react-flow__controls button:hover {
          background: hsl(var(--accent));
        }
        .react-flow-designer .react-flow__minimap-mask {
          fill: hsl(var(--primary) / 0.1);
        }
        .react-flow-designer .react-flow__minimap-node {
          fill: hsl(var(--muted));
          stroke: hsl(var(--border));
        }
        /* Override React Flow default node wrapper styles */
        .react-flow-designer .react-flow__node {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
        }
        .react-flow-designer .react-flow__node-input,
        .react-flow-designer .react-flow__node-output,
        .react-flow-designer .react-flow__node-default {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          border-radius: 0 !important;
        }
      `}</style>
      <ReactFlow
        nodes={nodesWithHoverState}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap />

        <Panel position="top-left" className="bg-card border rounded-lg p-2 shadow-lg">
          <div className="text-xs text-muted-foreground">
            {nodes.length} nodes • {edges.length} edges
          </div>
        </Panel>

        {nodes.length === 0 && (
          <Panel position="top-center" className="pointer-events-none">
            <div className="bg-card/90 backdrop-blur border rounded-lg p-6 text-center">
              <Plus className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <div className="font-medium mb-1">Start Building</div>
              <div className="text-sm text-muted-foreground">
                Drag nodes from the palette or use chat to create your flow
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
