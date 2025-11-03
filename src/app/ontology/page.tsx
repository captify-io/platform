"use client";

/**
 * Ontology Page
 * Visual ontology explorer with flow visualization and centralized data store
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize, Download, RefreshCw, Settings, Search, Plus, Database, Link2, Zap, FileText, FolderTree, Eye, Code, X } from 'lucide-react';
import { Button, Input, Tabs, TabsList, TabsTrigger, Popover, PopoverContent, PopoverTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@captify-io/core';
import { Flow } from '@captify-io/core/components/flow';
import { OntologySidebar } from './components/ontology-sidebar';
import { OntologyContent } from './components/ontology-content';
import { ExplorerView } from './components/explorer-view';
import { CreateNodeDialog } from './components/dialogs/create-node-dialog';
import { CreateLinkDialog } from './components/dialogs/create-link-dialog';
import { NodeDetailsPanel } from './components/node-details-panel';
import { useOntologyStore } from './hooks/use-ontology-store';
import type { FlowNode, FlowEdge } from '@captify-io/core/components/flow';
import type { OntologyNode } from './hooks/use-ontology-store';

export default function OntologyPage() {
  // Use centralized data store
  const {
    allNodes,
    allEdges,
    nodes: storeNodes,
    edges: storeEdges,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    loading,
    reload,
    loadTableData,
  } = useOntologyStore();

  // UI state
  const [createNodeOpen, setCreateNodeOpen] = useState(false);
  const [createLinkOpen, setCreateLinkOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [activeView, setActiveView] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'graph'>('table');
  const [mainView, setMainView] = useState<'explorer' | 'table' | 'graph'>('explorer');
  const [createPopoverOpen, setCreatePopoverOpen] = useState(false);
  const [createType, setCreateType] = useState<string | null>(null);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');

  // View-specific data
  const [viewData, setViewData] = useState<OntologyNode[]>([]);
  const [viewLoading, setViewLoading] = useState(false);

  // Load data when active view changes
  useEffect(() => {
    if (activeView && activeView !== 'health' && activeView !== 'links' && activeView !== 'widgets' && activeView !== 'objects') {
      setViewLoading(true);
      loadTableData(activeView)
        .then(data => setViewData(data))
        .finally(() => setViewLoading(false));
    } else if (activeView === 'links') {
      // Links view uses edges from store
      setViewData([]);
    } else if (activeView === 'widgets') {
      // Widgets view filters nodes with type='widget'
      const widgetNodes = allNodes.filter(n => n.type === 'widget');
      setViewData(widgetNodes);
    } else if (activeView === 'objects') {
      // Objects view uses all nodes from store
      setViewData([]);
    } else {
      setViewData([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, allNodes]);

  // Convert store nodes to flow nodes for graph visualization
  const flowNodes: FlowNode[] = useMemo(() => {
    return storeNodes.map((node, index) => {
      // Calculate position in a grid layout
      const cols = Math.ceil(Math.sqrt(storeNodes.length));
      const row = Math.floor(index / cols);
      const col = index % cols;

      return {
        id: node.id,
        type: 'ontology',
        position: {
          x: col * 250 + 50,
          y: row * 150 + 50,
        },
        data: {
          label: node.name,
          description: node.description,
          type: node.type,
          category: node.category,
          domain: node.domain,
          icon: node.properties?.icon,
          color: node.properties?.color,
          properties: {
            ...node.properties,
            category: node.category,
            domain: node.domain,
          },
        },
      };
    });
  }, [storeNodes]);

  // Convert store edges to flow edges
  const flowEdges: FlowEdge[] = useMemo(() => {
    return storeEdges
      .filter(edge => edge.source && edge.target)
      .map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.relation,
        type: 'smoothstep',
        animated: edge.relation === 'hasMany' || edge.relation === 'belongsTo',
        data: {
          relation: edge.relation,
          sourceType: edge.sourceType,
          targetType: edge.targetType,
        },
      }));
  }, [storeEdges]);

  // Get unique namespaces from all nodes
  const uniqueNamespaces = useMemo(() => {
    const namespaces = allNodes
      .map(node => node.namespace || node.domain)
      .filter((ns): ns is string => ns !== undefined && ns !== null && ns !== '');
    return Array.from(new Set(namespaces)).sort();
  }, [allNodes]);

  // Get unique values for filter dropdowns
  const getUniqueValues = (property: string): string[] => {
    const values = allNodes
      .map(node => node[property as keyof OntologyNode])
      .filter((value): value is string => value !== undefined && value !== null && value !== '');
    return Array.from(new Set(values)).sort();
  };

  const handlePropertySelect = (property: string) => {
    if (property && property !== '__placeholder__') {
      const newFilter = {
        property,
        value: '',
      };
      setFilters([...filters, newFilter]);
    }
  };

  const handleValueChange = (index: number, value: string) => {
    const updatedFilters = [...filters];
    updatedFilters[index] = { ...updatedFilters[index], value };
    setFilters(updatedFilters);
  };

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleNodesChange = useCallback((newNodes: FlowNode[]) => {
    // Flow node positions updated - currently not persisted
  }, []);

  const handleEdgesChange = useCallback((newEdges: FlowEdge[]) => {
    // Flow edges updated - currently not persisted
  }, []);

  const handleFlowNodeClick = useCallback((node: FlowNode) => {
    console.log('Node clicked:', node);
    setSelectedNode(node);
    // Keep activeView open - don't close content view
  }, []);

  const handleViewChange = (view: string) => {
    setActiveView(view);
    // Keep selectedNode open - don't close it when changing views
  };

  const handleHealthNodeClick = (nodeId: string) => {
    // Find and select the node from flow nodes
    const node = flowNodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
      // Keep activeView open
    }
  };

  const handleEdgeClick = useCallback((edge: FlowEdge) => {
    console.log('Edge clicked:', edge);
    // TODO: Show edge details panel
  }, []);

  const handleNodeCreated = (node: any) => {
    console.log('Node created:', node);
    // Reload ontology data from store
    reload();
  };

  const handleLinkCreated = (link: any) => {
    console.log('Link created:', link);
    // Reload ontology data from store
    reload();
  };

  return (
    <>
      {/* Sidebar */}
      <OntologySidebar
        onCreateNode={() => setCreateNodeOpen(true)}
        onCreateLink={() => setCreateLinkOpen(true)}
        onCreate={() => setCreatePopoverOpen(true)}
        onViewChange={handleViewChange}
        activeView={activeView}
        filters={filters}
        onFiltersChange={setFilters}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Create Node Dialog */}
      <CreateNodeDialog
        open={createNodeOpen}
        onClose={() => setCreateNodeOpen(false)}
        onSuccess={handleNodeCreated}
      />

      {/* Create Link Dialog */}
      <CreateLinkDialog
        open={createLinkOpen}
        onClose={() => setCreateLinkOpen(false)}
        onSuccess={handleLinkCreated}
      />

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden bg-background">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{minWidth: selectedNode ? '400px' : undefined}}>
          {/* Unified Header with Tabs */}
          <div className="border-b px-4 py-2 flex items-center justify-between gap-3">
            {/* Left: Tabs, Search, and Filters */}
            <div className="flex items-center gap-4">
              <Tabs value={mainView} onValueChange={(v) => setMainView(v as any)}>
                <TabsList>
                  <TabsTrigger value="explorer">Explorer</TabsTrigger>
                  <TabsTrigger value="table">Table</TabsTrigger>
                  <TabsTrigger value="graph">Graph</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Search - filters the node store */}
              {mainView !== 'explorer' && (
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 w-64"
                  />
                </div>
              )}

              {/* Add Filter Dropdown */}
              <Select value="__placeholder__" onValueChange={handlePropertySelect}>
                <SelectTrigger className="h-8 text-sm w-32">
                  <SelectValue placeholder="Add filter..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__placeholder__">Add filter...</SelectItem>
                  <SelectItem value="domain">Domain</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                  <SelectItem value="namespace">Namespace</SelectItem>
                </SelectContent>
              </Select>

              {/* Active Filters */}
              {filters.map((filter, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 px-2 py-1 border rounded-md bg-background"
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    {filter.property}:
                  </span>
                  <Select
                    value={filter.value}
                    onValueChange={(value) => handleValueChange(index, value)}
                  >
                    <SelectTrigger className="h-6 text-xs border-0 px-1 min-w-[80px]">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getUniqueValues(filter.property).map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    onClick={() => handleRemoveFilter(index)}
                    className="hover:bg-destructive/20 rounded-sm p-0.5"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>

            {/* Right: Create Button Popover (positioned, triggered from sidebar) */}
            <div className="flex items-center gap-2">
              {/* Create Button with Popover */}
              <Popover open={createPopoverOpen} onOpenChange={setCreatePopoverOpen}>
                <PopoverTrigger asChild>
                  <div style={{visibility: 'hidden', width: 0, height: 0}} />
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        setCreateType('object');
                        setCreateNodeOpen(true);
                        setCreatePopoverOpen(false);
                      }}
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Object Type
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        setCreateType('link');
                        setCreateLinkOpen(true);
                        setCreatePopoverOpen(false);
                      }}
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Link Type
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        setCreateType('action');
                        setCreateNodeOpen(true);
                        setCreatePopoverOpen(false);
                      }}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Action Type
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        setCreateType('property');
                        setCreateNodeOpen(true);
                        setCreatePopoverOpen(false);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Base Properties
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        setCreateType('namespace');
                        setCreateNodeOpen(true);
                        setCreatePopoverOpen(false);
                      }}
                    >
                      <FolderTree className="h-4 w-4 mr-2" />
                      Namespace
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        setCreateType('view');
                        setCreateNodeOpen(true);
                        setCreatePopoverOpen(false);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Views
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        setCreateType('function');
                        setCreateNodeOpen(true);
                        setCreatePopoverOpen(false);
                      }}
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Function
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* View Content */}
          {mainView === 'explorer' ? (
            <ExplorerView
              nodes={allNodes}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onNodeClick={(nodeId) => {
                const node = flowNodes.find(n => n.id === nodeId);
                if (node) setSelectedNode(node);
              }}
            />
          ) : mainView === 'table' ? (
            activeView ? (
              <OntologyContent
                activeView={activeView as any}
                nodes={activeView === 'objects' ? storeNodes : activeView === 'widgets' ? viewData : viewData}
                edges={activeView === 'links' ? storeEdges : []}
                allNodes={allNodes}
                viewMode="table"
                onViewModeChange={setViewMode}
                filters={filters}
                onFiltersChange={setFilters}
                onRefresh={reload}
                loading={activeView === 'objects' || activeView === 'links' || activeView === 'widgets' ? loading : viewLoading}
                onNodeClick={handleHealthNodeClick}
                onFlowNodeClick={handleFlowNodeClick}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="text-center max-w-md">
                  <h2 className="text-2xl font-bold mb-2">Table View</h2>
                  <p className="text-muted-foreground">
                    Select an item from the sidebar to view in table format.
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="flex-1 relative">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-muted-foreground">Loading ontology graph...</p>
                  </div>
                </div>
              ) : (
                <>
                  <Flow
                    mode="ontology"
                    initialNodes={flowNodes}
                    initialEdges={flowEdges}
                    onNodeClick={handleFlowNodeClick}
                    onEdgeClick={handleEdgeClick}
                    config={{
                      canvas: {
                        fitView: true,
                        showGrid: true,
                        showMinimap: true,
                        showControls: true,
                      }
                    }}
                  />
                  {/* Graph Toolbar Overlay */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm border rounded-md p-1 shadow-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={reload}
                      disabled={loading}
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Maximize className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Node Details Panel */}
        {selectedNode && (
          <NodeDetailsPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onUpdate={reload}
            totalNodes={allNodes.length}
            filteredNodes={flowNodes.length}
          />
        )}
      </div>
    </>
  );
}

export const dynamic = "force-dynamic";
