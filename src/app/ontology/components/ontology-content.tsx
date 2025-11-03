"use client";

/**
 * Ontology Content Area
 * Central content area that displays different views based on sidebar selection
 */

import { useMemo } from 'react';
import { HealthDashboard } from './health-dashboard';
import { TableView } from './views/table-view';
import { GraphView } from './views/graph-view';
import type { OntologyNode, OntologyEdge } from '../hooks/use-ontology-store';
import type { FlowNode, FlowEdge } from '@captify-io/core/components/flow';

interface FilterPill {
  property: string;
  value: string;
}

interface OntologyContentProps {
  activeView: 'health' | 'objects' | 'links' | 'widgets' | 'actions' | 'events' | 'functions' | 'sources' | 'datasets' | 'transforms' | 'spaces' | 'views' | 'schedules' | 'data-products' | 'workflows' | null;
  nodes: OntologyNode[];
  edges: OntologyEdge[];
  allNodes: OntologyNode[]; // Unfiltered nodes for filter dropdown options
  viewMode: 'table' | 'graph';
  onViewModeChange: (mode: 'table' | 'graph') => void;
  filters: FilterPill[];
  onFiltersChange: (filters: FilterPill[]) => void;
  onRefresh: () => void;
  loading: boolean;
  onNodeClick?: (nodeId: string) => void;
  onFlowNodeClick?: (node: FlowNode) => void;
}

export function OntologyContent({
  activeView,
  nodes,
  edges,
  allNodes,
  viewMode,
  onViewModeChange,
  filters,
  onFiltersChange,
  onRefresh,
  loading,
  onNodeClick,
  onFlowNodeClick
}: OntologyContentProps) {

  if (!activeView) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Ontology Explorer</h2>
          <p className="text-muted-foreground">
            Select an item from the sidebar to view details, or explore the ontology graph on the right.
          </p>
        </div>
      </div>
    );
  }

  // Health view (special case - no view switching)
  if (activeView === 'health') {
    return <HealthDashboard onNodeClick={onNodeClick} />;
  }

  // All other views support table/graph switching
  const renderViewContent = () => {
    if (viewMode === 'table') {
      return (
        <TableView
          type={activeView}
          nodes={nodes}
          edges={edges}
          onRowClick={(item) => {
            if ('name' in item) {
              onNodeClick?.(item.id);
            }
          }}
        />
      );
    } else {
      return (
        <GraphView
          nodes={nodes}
          edges={edges}
          onNodeClick={onFlowNodeClick}
        />
      );
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Content */}
      {renderViewContent()}
    </div>
  );
}
