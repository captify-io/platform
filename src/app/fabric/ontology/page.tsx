"use client";

/**
 * Ontology Page
 * [Sidebar][Canvas+Panel] layout with graph visualization and entity configuration
 */

import { useState, useEffect, useMemo } from 'react';
import { ReactFlowProvider } from "@captify-io/core/components/flow";
import { SidebarProvider, SidebarInset } from '@captify-io/core';
import { OntologySidebar, type OntologyViewType } from './components/ontology-sidebar';
import { OntologyGraph } from './components/ontology-graph';
import { useOntologyStore } from "@/stores/ontology-store";

export default function OntologyPage() {
  const { objects, links, actions, loadAll } = useOntologyStore();
  const [activeView, setActiveView] = useState<OntologyViewType>('discover');

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Calculate counts for sidebar
  const counts = useMemo(() => {
    // Filter by category for different entity types
    const objectsCount = objects.filter(o => {
      const cat = (o as any).category;
      return !cat || cat === 'entity' || cat === 'concept';
    }).length;

    const propertiesCount = objects.filter(o => (o as any).category === 'property').length;
    const functionsCount = objects.filter(o => (o as any).category === 'function').length;
    const widgetsCount = objects.filter(o => (o as any).type === 'widget' || (o as any).category === 'widget').length;

    // Pipeline counts (placeholder - these would come from different sources)
    const dataSourcesCount = objects.filter(o => (o as any).category === 'datasource').length;
    const datasetsCount = objects.filter(o => (o as any).category === 'dataset').length;
    const dataProductsCount = objects.filter(o => (o as any).category === 'dataproduct').length;

    return {
      objects: objectsCount,
      links: links.length,
      actions: actions.length,
      properties: propertiesCount,
      functions: functionsCount,
      widgets: widgetsCount,
      dataSources: dataSourcesCount,
      datasets: datasetsCount,
      dataProducts: 0, // TODO: Implement
      catalog: 0, // TODO: Implement
      governance: 0, // TODO: Implement
    };
  }, [objects, links, actions]);

  const handleViewChange = (view: OntologyViewType) => {
    setActiveView(view);
  };

  return (
    <SidebarProvider>
      <div className="flex h-full w-full">
        {/* Ontology Sidebar */}
        <OntologySidebar
          onViewChange={handleViewChange}
          activeView={activeView}
          counts={counts}
        />

        {/* Content Area */}
        <SidebarInset className="flex-1">
          <ReactFlowProvider>
            <OntologyGraph activeView={activeView} />
          </ReactFlowProvider>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export const dynamic = "force-dynamic";
