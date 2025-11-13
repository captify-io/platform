"use client";

/**
 * Ontology Graph Component
 * ReactFlow-based graph visualization with filtering by view type
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  useReactFlow,
  CircleNode,
  RoundedRectNode,
  DiamondNode,
  ParallelogramNode,
  ArrowRectNode,
  OntologyConfigPanel,
} from "@captify-io/core/components/flow";
import type { Connection, Node as ReactFlowNode } from "@captify-io/core/components/flow";
import dagre from "dagre";
import { useOntologyStore } from "@/stores/ontology-store";
import { Plus, Filter } from "lucide-react";
import { Button } from "@captify-io/core/ui";
import type { OntologyViewType } from './ontology-sidebar';

// Custom styles
const customStyles = `
  .react-flow__node {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
  }
  .react-flow__controls {
    background: hsl(var(--background)) !important;
    border: 1px solid hsl(var(--border)) !important;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  }
  .react-flow__controls button {
    background: hsl(var(--background)) !important;
    border-bottom: 1px solid hsl(var(--border)) !important;
    color: hsl(var(--foreground)) !important;
  }
  .react-flow__controls button:hover {
    background: hsl(var(--muted)) !important;
  }
  .react-flow__minimap {
    background: hsl(var(--background)) !important;
    border: 1px solid hsl(var(--border)) !important;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  }

  /* Highlight selected node and its connections */
  .react-flow__node.selected {
    z-index: 1000 !important;
  }
  .react-flow__edge.highlighted {
    stroke-width: 3px !important;
    z-index: 999 !important;
  }
`;

const nodeTypes = {
  circle: CircleNode,
  roundedRect: RoundedRectNode,
  diamond: DiamondNode,
  parallelogram: ParallelogramNode,
  arrowRect: ArrowRectNode,
};

const getAppColor = (app: string): string => {
  const colors: Record<string, string> = {
    core: "#3b82f6",
    pmbook: "#8b5cf6",
    aihub: "#ec4899",
    dataops: "#10b981",
    mi: "#f59e0b",
  };
  return colors[app] || "#6b7280";
};

const getNodeShape = (obj: any): { type: string; width: number; height: number } => {
  const typeLower = (obj.type || "").toLowerCase();
  const categoryLower = (obj.category || "").toLowerCase();

  if (categoryLower === "action" || typeLower.includes("action")) {
    return { type: "roundedRect", width: 100, height: 60 };
  }
  if (categoryLower === "function" || categoryLower === "operation" || typeLower.includes("function")) {
    return { type: "diamond", width: 80, height: 80 };
  }
  if (categoryLower === "datasource" || categoryLower === "data-source" || typeLower.includes("source")) {
    return { type: "parallelogram", width: 100, height: 60 };
  }
  if (categoryLower === "dataproduct" || categoryLower === "data-product" || typeLower.includes("product")) {
    return { type: "arrowRect", width: 120, height: 60 };
  }
  return { type: "circle", width: 80, height: 80 };
};

const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = "TB"
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Calculate edge counts to identify central nodes
  const edgeCounts = new Map<string, number>();
  edges.forEach(edge => {
    edgeCounts.set(edge.source, (edgeCounts.get(edge.source) || 0) + 1);
    edgeCounts.set(edge.target, (edgeCounts.get(edge.target) || 0) + 1);
  });

  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 250,
    nodesep: 200,
    marginx: 100,
    marginy: 100,
    ranker: 'network-simplex',
  });

  nodes.forEach((node) => {
    const width = (node.width as number) || 80;
    const height = (node.height as number) || 80;
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = (node.width as number) || 80;
    const height = (node.height as number) || 80;
    node.position = {
      x: nodeWithPosition.x - width / 2,
      y: nodeWithPosition.y - height / 2,
    };
  });

  return { nodes, edges };
};

interface OntologyGraphProps {
  activeView: OntologyViewType;
}

export function OntologyGraph({ activeView }: OntologyGraphProps) {
  const {
    objects,
    links,
    actions,
    loading,
    createLink,
    createObject,
    updateObject,
    updateLink,
    updateAction,
    deleteObject,
    deleteLink,
    deleteAction
  } = useOntologyStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  // Filters
  const [filterDomain, setFilterDomain] = useState<string>("");
  const [filterApp, setFilterApp] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Selected entity tracking
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<'object' | 'link' | 'action' | null>(null);

  // Context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const lastRenderedRef = useRef({ objectCount: 0, linkCount: 0, filterKey: '', activeView: '' });

  // Get unique values for filters
  const domains = Array.from(new Set(objects.map(o => o.app).filter(Boolean)));
  const apps = Array.from(new Set(objects.map(o => o.app).filter(Boolean)));
  const categories = Array.from(new Set(objects.map(o => (o as any).category).filter(Boolean)));

  // Update graph when store data or activeView changes
  useEffect(() => {
    if (objects.length === 0) return;

    const currentFilterKey = `${filterDomain}-${filterApp}-${filterCategory}`;

    if (
      lastRenderedRef.current.objectCount === objects.length &&
      lastRenderedRef.current.linkCount === links.length &&
      lastRenderedRef.current.filterKey === currentFilterKey &&
      lastRenderedRef.current.activeView === activeView
    ) {
      console.log('[Ontology] Skipping redraw - no changes');
      return;
    }

    console.log('[Ontology] Updating graph:', {
      objectCount: objects.length,
      linkCount: links.length,
      filters: currentFilterKey,
      activeView,
    });

    lastRenderedRef.current = {
      objectCount: objects.length,
      linkCount: links.length,
      filterKey: currentFilterKey,
      activeView,
    };

    // Apply view-based filtering
    let filteredObjects = objects;

    // Filter by active view
    if (activeView === 'objects') {
      filteredObjects = filteredObjects.filter(o => {
        const cat = (o as any).category;
        return !cat || cat === 'entity' || cat === 'concept';
      });
    } else if (activeView === 'properties') {
      filteredObjects = filteredObjects.filter(o => (o as any).category === 'property');
    } else if (activeView === 'functions') {
      filteredObjects = filteredObjects.filter(o => (o as any).category === 'function');
    } else if (activeView === 'widgets') {
      filteredObjects = filteredObjects.filter(o => (o as any).type === 'widget' || (o as any).category === 'widget');
    } else if (activeView === 'data-sources') {
      filteredObjects = filteredObjects.filter(o => (o as any).category === 'datasource');
    } else if (activeView === 'datasets') {
      filteredObjects = filteredObjects.filter(o => (o as any).category === 'dataset');
    } else if (activeView === 'data-products') {
      filteredObjects = filteredObjects.filter(o => (o as any).category === 'dataproduct');
    }
    // For 'discover', 'links', 'actions', 'catalog', 'governance' - show all

    // Apply additional filters
    if (filterDomain) filteredObjects = filteredObjects.filter(o => o.app === filterDomain);
    if (filterApp) filteredObjects = filteredObjects.filter(o => o.app === filterApp);
    if (filterCategory) filteredObjects = filteredObjects.filter(o => (o as any).category === filterCategory);

    const flowNodes: Node[] = filteredObjects.map((obj) => {
      const shape = getNodeShape(obj);
      const nodeColor = obj.color || getAppColor(obj.app);
      return {
        id: obj.slug,
        type: shape.type,
        position: { x: obj.x ?? 0, y: obj.y ?? 0 },
        width: shape.width,
        height: shape.height,
        data: {
          label: obj.name,
          color: nodeColor,
          icon: obj.icon,
        },
        style: {
          background: nodeColor,
          color: "#ffffff",
          border: "none",
          padding: 0,
        },
      };
    });

    const flowEdges: Edge[] = links
      .filter((link) => link.status === "active")
      .filter((link) =>
        filteredObjects.some(o => o.slug === link.sourceObjectType) &&
        filteredObjects.some(o => o.slug === link.targetObjectType)
      )
      .map((link) => {
        const sourceNode = objects.find((obj) => obj.slug === link.sourceObjectType);
        const edgeColor = sourceNode?.color || getAppColor(sourceNode?.app || "core");

        return {
          id: link.slug,
          source: link.sourceObjectType,
          target: link.targetObjectType,
          label: link.name,
          type: "straight",
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: edgeColor,
          },
          style: {
            stroke: edgeColor,
            strokeWidth: 2,
          },
        };
      });

    const nodesWithoutPosition = flowNodes.filter(n => n.position.x === 0 && n.position.y === 0);
    const nodesWithPosition = flowNodes.filter(n => n.position.x !== 0 || n.position.y !== 0);

    let finalNodes: Node[];
    if (nodesWithoutPosition.length > 0) {
      const { nodes: layoutedNodes } = getLayoutedElements(nodesWithoutPosition, flowEdges);
      finalNodes = [...nodesWithPosition, ...layoutedNodes];
    } else {
      finalNodes = flowNodes;
    }

    setNodes(finalNodes);

    setTimeout(() => {
      setEdges(flowEdges);
      setTimeout(() => fitView({ padding: 0.2 }), 50);
    }, 0);
  }, [objects, links, activeView, filterDomain, filterApp, filterCategory, setNodes, setEdges, fitView]);

  // Handle edge connections
  const onConnect = useCallback(async (connection: Connection) => {
    if (!connection.source || !connection.target) return;

    const existingEdge = edges.find(e =>
      (e.source === connection.source && e.target === connection.target) ||
      (e.source === connection.target && e.target === connection.source)
    );

    if (existingEdge) {
      console.log('[Ontology] Edge already exists');
      return;
    }

    try {
      const slug = `${connection.source}-to-${connection.target}`;
      const sourceNode = objects.find((obj) => obj.slug === connection.source);
      const targetNode = objects.find((obj) => obj.slug === connection.target);
      const edgeColor = sourceNode?.color || getAppColor(sourceNode?.app || "core");

      const newEdge: Edge = {
        id: slug,
        source: connection.source,
        target: connection.target,
        type: "straight",
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
        },
        style: {
          stroke: edgeColor,
          strokeWidth: 2,
        },
      };

      setEdges((eds) => [...eds, newEdge]);

      await createLink({
        slug,
        name: `${sourceNode?.name || connection.source} → ${targetNode?.name || connection.target}`,
        sourceObjectType: connection.source,
        targetObjectType: connection.target,
        cardinality: "one-to-many",
        bidirectional: false,
        status: "active",
      });

      console.log(`[Ontology] Successfully created link: ${slug}`);
    } catch (error) {
      console.error('[Ontology] Failed to create link:', error);
      setEdges((eds) => eds.filter(e => e.source !== connection.source || e.target !== connection.target));
    }
  }, [edges, objects, setEdges, createLink]);

  // Handle node drag stop
  const onNodeDragStop = useCallback(async (event: React.MouseEvent, node: ReactFlowNode) => {
    try {
      await updateObject(node.id, {
        x: Math.round(node.position.x),
        y: Math.round(node.position.y),
        updatedAt: new Date().toISOString(),
      });
      console.log(`[Ontology] Saved node position: ${node.id}`);
    } catch (error) {
      console.error('[Ontology] Failed to save node position:', error);
    }
  }, [updateObject]);

  // Handle node click - highlight connections
  const onNodeClick = useCallback((event: React.MouseEvent, node: ReactFlowNode) => {
    console.log('[Ontology] Node clicked:', node.id);
    setSelectedNodeId(node.id);

    const objectData = objects.find(o => o.slug === node.id);
    setSelectedNode(objectData);
    setSelectedEntityType('object');

    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        className: (edge.source === node.id || edge.target === node.id) ? 'highlighted' : '',
        style: {
          ...edge.style,
          strokeWidth: (edge.source === node.id || edge.target === node.id) ? 3 : 2,
        },
      }))
    );
  }, [objects, setEdges]);

  // Handle canvas click - clear selection
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedNode(null);
    setSelectedEntityType(null);
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        className: '',
        style: {
          ...edge.style,
          strokeWidth: 2,
        },
      }))
    );
  }, [setEdges]);

  // Handle context menu
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: ReactFlowNode) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
    setSelectedNodeId(node.id);
  }, []);

  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
    setSelectedNodeId(null);
  }, []);

  // Handle context menu actions
  const handleAddObject = useCallback(async () => {
    try {
      const slug = `new-object-${Date.now()}`;
      await createObject({
        slug,
        name: "New Object",
        app: "core",
        status: "active",
        x: contextMenu ? contextMenu.x : 100,
        y: contextMenu ? contextMenu.y : 100,
      });
      setContextMenu(null);
    } catch (error) {
      console.error('Failed to create object:', error);
    }
  }, [contextMenu, createObject]);

  // Handle saving entity updates from config panel
  const handleSaveEntity = useCallback(async (updates: any) => {
    if (!selectedNode || !selectedEntityType) return;

    try {
      if (selectedEntityType === 'object') {
        await updateObject(selectedNode.slug, updates);
      } else if (selectedEntityType === 'link') {
        await updateLink(selectedNode.slug, updates);
      } else if (selectedEntityType === 'action') {
        await updateAction(selectedNode.slug, updates);
      }

      setSelectedNode((prev: any) => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('Failed to save entity:', error);
      throw error;
    }
  }, [selectedNode, selectedEntityType, updateObject, updateLink, updateAction]);

  // Handle deleting entity from config panel
  const handleDeleteEntity = useCallback(async () => {
    if (!selectedNode || !selectedEntityType) return;

    try {
      if (selectedEntityType === 'object') {
        await deleteObject(selectedNode.slug);
      } else if (selectedEntityType === 'link') {
        await deleteLink(selectedNode.slug);
      } else if (selectedEntityType === 'action') {
        await deleteAction(selectedNode.slug);
      }

      // Clear selection after deletion
      setSelectedNode(null);
      setSelectedNodeId(null);
      setSelectedEntityType(null);
    } catch (error) {
      console.error('Failed to delete entity:', error);
      throw error;
    }
  }, [selectedNode, selectedEntityType, deleteObject, deleteLink, deleteAction]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading ontology...</div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full flex">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      {/* Main Canvas Area */}
      <div className="relative flex-1 h-full">
        {/* Floating Toolbar */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="bg-background shadow-md"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddObject}
            className="bg-background shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Object
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="absolute top-16 right-4 z-10 bg-background border rounded-lg shadow-lg p-4 w-64">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Domain</label>
                <select
                  value={filterDomain}
                  onChange={(e) => setFilterDomain(e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded"
                >
                  <option value="">All Domains</option>
                  {domains.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">App</label>
                <select
                  value={filterApp}
                  onChange={(e) => setFilterApp(e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded"
                >
                  <option value="">All Apps</option>
                  {apps.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterDomain("");
                  setFilterApp("");
                  setFilterCategory("");
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="absolute z-20 bg-background border rounded-lg shadow-lg py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onMouseLeave={() => setContextMenu(null)}
          >
            <button
              onClick={handleAddObject}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
            >
              Add Object
            </button>
            <button
              onClick={() => {
                console.log('Add Action');
                setContextMenu(null);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
            >
              Add Action
            </button>
            <button
              onClick={() => {
                console.log('Add Link');
                setContextMenu(null);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
            >
              Add Link
            </button>
          </div>
        )}

        {/* ReactFlow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={onPaneClick}
          onPaneContextMenu={onPaneContextMenu}
          connectionMode="loose"
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          colorMode="system"
        >
          <Background gap={16} size={1} color="#e2e8f0" />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(node) => node.style?.background as string}
            maskColor="rgba(0, 0, 0, 0.1)"
            pannable
            zoomable
          />
        </ReactFlow>
      </div>

      {/* Right-Side Configuration Panel */}
      {selectedNode && selectedEntityType && (
        <div className="w-[400px] h-full">
          <OntologyConfigPanel
            entityType={selectedEntityType}
            entity={selectedNode}
            onClose={() => {
              setSelectedNode(null);
              setSelectedNodeId(null);
              setSelectedEntityType(null);
            }}
            onSave={handleSaveEntity}
            onDelete={handleDeleteEntity}
            propertyLayout="row"
            availableObjects={objects.map(obj => ({ slug: obj.slug, name: obj.name }))}
          />
        </div>
      )}
    </div>
  );
}
