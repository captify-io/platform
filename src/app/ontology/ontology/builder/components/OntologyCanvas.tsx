"use client";

/**
 * Ontology Canvas
 * Visual canvas for building ontology relationships
 * Supports right-click to add nodes and connect nodes
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
  Node,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ELK from 'elkjs/lib/elk.bundled.js';
import { useOntology, OntologyNode as OntologyNodeType, OntologyEdge } from '../context/OntologyContext';
import { OntologyNodeComponent } from './OntologyNodeComponent';
import { DataItemNode } from './DataItemNode';
import { Plus, Network, Search } from 'lucide-react';
import { Button, Input } from '@captify-io/core/components/ui';
import { toast } from 'sonner';
import { apiClient } from '@captify-io/core';

const elk = new ELK();

const nodeTypes = {
  ontology: OntologyNodeComponent,
  'data-item': DataItemNode,
};

interface ContextMenuPosition {
  x: number;
  y: number;
}

// ELK layout algorithm for left-to-right hierarchical layout
const getLayoutedElements = async (nodes: any[], edges: any[]) => {
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '80',
      'elk.layered.spacing.nodeNodeBetweenLayers': '120',
      'elk.padding': '[top=100,left=100,bottom=100,right=100]',
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: 180,
      height: 60,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layoutedGraph = await elk.layout(graph);

  const layoutedNodes = nodes.map((node) => {
    const layoutedNode = layoutedGraph.children?.find((n) => n.id === node.id);
    return {
      ...node,
      position: {
        x: layoutedNode?.x ?? node.position.x,
        y: layoutedNode?.y ?? node.position.y,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export function OntologyCanvas() {
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
    fetchDataItems,
    loadRelationships,
  } = useOntology();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableNodes, setAvailableNodes] = useState<Array<{ id: string; label: string; type: string }>>([]);
  const [showNewNodeTypes, setShowNewNodeTypes] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingDataFor, setLoadingDataFor] = useState<string | null>(null);
  const [showCreateTableDialog, setShowCreateTableDialog] = useState(false);
  const [tableToCreate, setTableToCreate] = useState<{ name: string; nodeId: string } | null>(null);
  const [isLayouting, setIsLayouting] = useState(false);
  const { screenToFlowPosition, fitView } = useReactFlow();

  // Load available nodes for search
  useEffect(() => {
    const loadAvailableNodes = async () => {
      try {
        const result = await apiClient.run({
          service: "platform.dynamodb",
          operation: "scan",
          table: "core-ontology-node",
        });

        if (result.success && result.data) {
          const items = result.data.Items || result.data;
          const nodeList = Array.isArray(items) ? items : [];
          setAvailableNodes(nodeList.map((n: any) => ({
            id: n.id,
            label: n.label || n.type,
            type: n.type
          })));
        }
      } catch (error) {
        console.error('Failed to load nodes:', error);
      }
    };
    loadAvailableNodes();
  }, []);

  // Handle load data from button
  const handleLoadDataFromButton = useCallback(async (nodeId: string): Promise<void> => {
    try {
      const result = await fetchDataItems(nodeId);

      if (result.success) {
        toast.success(`Loaded ${result.count} data items successfully`);
      } else if (result.needsCreation) {
        setTableToCreate({ name: result.tableName!, nodeId });
        setShowCreateTableDialog(true);
        throw new Error(`Table ${result.tableName} does not exist. Please create it first.`);
      } else {
        throw new Error(result.error || 'Failed to load data');
      }
    } catch (error: any) {
      console.error('Error fetching data items:', error);
      toast.error(error.message || 'Failed to fetch data items');
      throw error; // Re-throw so the node component can catch it
    }
  }, [fetchDataItems]);

  // Handle load relationships from button
  const handleLoadRelationshipsFromButton = useCallback(async (nodeId: string): Promise<void> => {
    try {
      await loadRelationships(nodeId);
      toast.success('Loaded relationships successfully');
    } catch (error: any) {
      console.error('Error loading relationships:', error);
      toast.error(error.message || 'Failed to load relationships');
      throw error; // Re-throw so the node component can catch it
    }
  }, [loadRelationships]);

  // Sync model changes to React Flow nodes and apply layout
  useEffect(() => {
    const applyLayout = async () => {
      if (isLayouting) return;
      setIsLayouting(true);

      const flowNodes = model.nodes.map(node => ({
        id: node.id,
        type: node.type === 'data-item' ? 'data-item' : 'ontology',
        position: node.position || { x: 0, y: 0 },
        data: {
          ...node,
          onLoadData: handleLoadDataFromButton,
          onLoadRelationships: handleLoadRelationshipsFromButton,
        },
      }));

      const flowEdges = model.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'default',
        label: edge.label,
        animated: true,
      }));

      // Apply ELK layout if we have nodes with edges
      if (flowNodes.length > 0 && flowEdges.length > 0) {
        const { nodes: layoutedNodes } = await getLayoutedElements(flowNodes, flowEdges);
        setNodes(layoutedNodes);

        // Fit view after layout - center on page
        setTimeout(() => {
          fitView({
            padding: 0.3,
            duration: 300,
            minZoom: 0.5,
            maxZoom: 1.5
          });
        }, 50);
      } else {
        setNodes(flowNodes);
      }

      setIsLayouting(false);
    };

    applyLayout();
  }, [model.nodes.length, model.edges.length, handleLoadDataFromButton, handleLoadRelationshipsFromButton, fitView]);

  // Sync edges separately
  useEffect(() => {
    const flowEdges = model.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'default',
      label: edge.label,
      animated: true,
    }));
    setEdges(flowEdges);
  }, [model.edges, setEdges]);

  // Sync selection state
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      }))
    );
  }, [selectedNodeId, setNodes]);

  // Handle new connections
  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;

    const sourceNode = model.nodes.find(n => n.id === connection.source);
    const targetNode = model.nodes.find(n => n.id === connection.target);

    const newEdge: OntologyEdge = {
      id: `edge-${Date.now()}`,
      source: connection.source,
      target: connection.target,
      type: 'default',
      label: sourceNode && targetNode ? `${sourceNode.type} → ${targetNode.type}` : undefined,
    };

    setEdges((eds) => addEdge(connection, eds));
    addEdgeToModel(newEdge);
  }, [addEdgeToModel, setEdges, model.nodes]);

  // Handle node changes - only save position, don't trigger updates
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);

    // Only save position to model when drag ends, don't trigger re-layout
    changes.forEach((change) => {
      if (change.type === 'position' && change.position && !change.dragging) {
        const node = model.nodes.find(n => n.id === change.id);
        if (node) {
          node.position = change.position;
        }
      } else if (change.type === 'remove') {
        deleteNode(change.id);
      }
    });
  }, [onNodesChange, model.nodes, deleteNode]);

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

  // Handle node drag
  const onNodeDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const onNodeDragStop = useCallback(() => {
    setTimeout(() => setIsDragging(false), 50);
  }, []);

  // Right-click context menu
  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
    });
    setSearchQuery('');
    setShowNewNodeTypes(false);
  }, []);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
    });
    setSearchQuery('');
    setShowNewNodeTypes(false);
  }, []);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
    setSearchQuery('');
    setShowNewNodeTypes(false);
  }, []);

  // Create new node from context menu
  const handleCreateNewNode = useCallback(async (nodeType: string) => {
    if (!contextMenu || !reactFlowWrapper.current) return;

    const position = screenToFlowPosition({
      x: contextMenu.x - reactFlowWrapper.current.getBoundingClientRect().left,
      y: contextMenu.y - reactFlowWrapper.current.getBoundingClientRect().top,
    });

    const newNode: OntologyNodeType = {
      id: `node-${Date.now()}`,
      type: nodeType,
      category: 'Custom',
      domain: 'Default',
      app: 'core',
      schema: 'captify',
      tenantId: 'default',
      table: `captify-core-${nodeType}`,
      label: nodeType,
      description: `New ${nodeType} node`,
      usage: '',
      icon: 'Box',
      color: 'bg-slate-600',
      shape: 'rectangle',
      allowedSources: [],
      allowedTargets: [],
      allowedConnectors: [],
      properties: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      position,
    };

    // Save to DynamoDB
    try {
      await apiClient.run({
        service: "platform.dynamodb",
        operation: "put",
        table: "core-ontology-node",
        data: { item: newNode }
      });

      // Add to canvas
      addNode(newNode);

      // Select the node to open config panel
      setSelectedNode(newNode.id);

      toast.success('Node created successfully');
      closeContextMenu();
    } catch (error) {
      console.error('Failed to create node:', error);
      toast.error('Failed to create node');
    }
  }, [contextMenu, addNode, setSelectedNode, closeContextMenu, screenToFlowPosition]);

  // Add existing node from search
  const handleAddExistingNode = useCallback(async (nodeId: string) => {
    if (!contextMenu || !reactFlowWrapper.current) return;

    const position = screenToFlowPosition({
      x: contextMenu.x - reactFlowWrapper.current.getBoundingClientRect().left,
      y: contextMenu.y - reactFlowWrapper.current.getBoundingClientRect().top,
    });

    try {
      // Fetch the full node data
      const result = await apiClient.run({
        service: "platform.dynamodb",
        operation: "get",
        table: "core-ontology-node",
        data: { Key: { id: nodeId } }
      });

      if (result.success && result.data) {
        const existingNode = result.data.Item || result.data;

        // Add to canvas with new position
        const nodeToAdd = { ...existingNode, position };
        addNode(nodeToAdd);

        toast.success('Node added to canvas');
        closeContextMenu();
      }
    } catch (error) {
      console.error('Failed to add node:', error);
      toast.error('Failed to add node');
    }
  }, [contextMenu, addNode, closeContextMenu, screenToFlowPosition]);

  // Handle node double-click to fetch data
  const onNodeDoubleClick = useCallback(async (event: React.MouseEvent, node: Node) => {
    event.preventDefault();

    // Don't fetch data for data-item nodes
    if (node.type === 'data-item') return;

    setLoadingDataFor(node.id);
    try {
      const result = await fetchDataItems(node.id);

      if (result.success) {
        toast.success(`Loaded ${result.count} data items successfully`);
      } else if (result.needsCreation) {
        // Show dialog to create table
        setTableToCreate({ name: result.tableName!, nodeId: node.id });
        setShowCreateTableDialog(true);
      } else {
        toast.error(`Failed to load data: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error fetching data items:', error);
      toast.error(error.message || 'Failed to fetch data items');
    } finally {
      setLoadingDataFor(null);
    }
  }, [fetchDataItems]);

  // Handle create table confirmation
  const handleCreateTable = () => {
    if (!tableToCreate) return;

    toast.info(`Please create the table "${tableToCreate.name}" in DynamoDB, then double-click the node again to load data.`);
    setShowCreateTableDialog(false);
    setTableToCreate(null);
  };

  // Click outside to close context menu
  useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu, closeContextMenu]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full react-flow-ontology">
      <style jsx global>{`
        .react-flow-ontology .react-flow__controls,
        .react-flow-ontology .react-flow__minimap {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
        }
        .react-flow-ontology .react-flow__controls button {
          background: hsl(var(--background));
          border-bottom: 1px solid hsl(var(--border));
          color: hsl(var(--foreground));
        }
        .react-flow-ontology .react-flow__controls button:hover {
          background: hsl(var(--accent));
        }
        .react-flow-ontology .react-flow__minimap-mask {
          fill: hsl(var(--primary) / 0.1);
        }
        .react-flow-ontology .react-flow__minimap-node {
          fill: hsl(var(--card));
          stroke: hsl(var(--primary));
          stroke-width: 2;
        }
        .react-flow-ontology .react-flow__minimap svg {
          background: hsl(var(--background));
        }
        .react-flow-ontology .react-flow__node {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
        }
        .react-flow-ontology .react-flow__node-input,
        .react-flow-ontology .react-flow__node-output,
        .react-flow-ontology .react-flow__node-default {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          border-radius: 0 !important;
        }
      `}</style>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        nodeTypes={nodeTypes}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap />

        <Panel position="top-left" className="bg-card border rounded-lg p-2 shadow-lg">
          <div className="text-xs text-muted-foreground">
            {nodes.length} nodes • {edges.length} relationships
          </div>
        </Panel>

        {nodes.length === 0 && (
          <Panel position="top-center" className="pointer-events-none">
            <div className="bg-card/90 backdrop-blur border rounded-lg p-6 text-center">
              <Network className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <div className="font-medium mb-1">Start Building Ontology</div>
              <div className="text-sm text-muted-foreground">
                Right-click anywhere to add a node
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-card border rounded-lg shadow-lg p-3 z-50 min-w-[320px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            {/* Search Box + Add Button */}
            <div className="flex items-center gap-2">
              <div className="relative w-48">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search nodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-8 text-sm"
                  autoFocus
                />
              </div>
              <Button
                size="sm"
                className="h-9 px-3 bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  if (searchQuery.trim()) {
                    handleCreateNewNode(searchQuery.trim());
                  } else {
                    setShowNewNodeTypes(!showNewNodeTypes);
                  }
                }}
                title="Add New Node"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Search Results or New Node Types */}
            {(searchQuery || showNewNodeTypes) && (
              <div className="max-h-72 overflow-y-auto">
                {!showNewNodeTypes ? (
                  // Show search results only if user has typed
                  searchQuery && (
                    <div className="space-y-1">
                      {availableNodes
                        .filter((node) =>
                          node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          node.type.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .slice(0, 10)
                        .map((node) => (
                          <Button
                            key={node.id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-sm h-auto py-2"
                            onClick={() => handleAddExistingNode(node.id)}
                          >
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="font-medium">{node.label}</span>
                              <span className="text-xs text-muted-foreground">{node.type}</span>
                            </div>
                          </Button>
                        ))}
                      {availableNodes.filter((node) =>
                        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        node.type.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No nodes found. Click + to create "{searchQuery}".
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  // Show new node types
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground px-2 py-1 border-b">
                      Create New Node Type
                    </div>
                    {['Contract', 'Feature', 'Task', 'User', 'Capability', 'System', 'Dataset', 'Model'].map((type) => (
                      <Button
                        key={type}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm"
                        onClick={() => handleCreateNewNode(type)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {type}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loadingDataFor && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 shadow-xl">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-sm">Loading data items...</p>
          </div>
        </div>
      )}

      {/* Create Table Dialog */}
      {showCreateTableDialog && tableToCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 shadow-xl max-w-md">
            <h3 className="text-lg font-semibold mb-3">Table Not Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The table <code className="text-purple-600 font-mono">{tableToCreate.name}</code> does not exist in DynamoDB.
            </p>
            <div className="bg-muted rounded p-3 mb-4 text-xs">
              <div className="font-medium mb-2">To create this table:</div>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to AWS DynamoDB Console</li>
                <li>Create table: <code className="font-mono">{tableToCreate.name}</code></li>
                <li>Set Primary Key: <code className="font-mono">id (String)</code></li>
                <li>Add any additional attributes</li>
                <li>Double-click the node again to load data</li>
              </ol>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateTableDialog(false);
                  setTableToCreate(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateTable} className="bg-purple-600">
                Got It
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
