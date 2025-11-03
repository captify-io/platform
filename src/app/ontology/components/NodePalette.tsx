"use client";

/**
 * Node Palette
 * Categorized library of draggable designer nodes
 * Loads node definitions from core-OntologyNode table
 */

import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import type { DesignerNodeType, DesignerNodeCategory } from '@captify-io/core/types';
import { apiClient } from '@captify-io/core';

interface OntologyNode {
  id: string;
  type: DesignerNodeType;
  category: DesignerNodeCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
  domain: string;
  usage: string;
  dmnDefinition?: string;
}

interface NodePaletteItem {
  type: DesignerNodeType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  example: string;
  domain: string;
}

interface NodePaletteProps {
  onNodeClick?: (nodeType: DesignerNodeType) => void;
}

export function NodePalette({ onNodeClick }: NodePaletteProps) {
  const [coreNodes, setCoreNodes] = useState<NodePaletteItem[]>([]);
  const [processNodes, setProcessNodes] = useState<NodePaletteItem[]>([]);
  const [dataNodes, setDataNodes] = useState<NodePaletteItem[]>([]);
  const [technologyNodes, setTechnologyNodes] = useState<NodePaletteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<DesignerNodeCategory>>(
    new Set(['core', 'process', 'data', 'technology'])
  );

  // Load nodes from ontology
  useEffect(() => {
    async function loadOntology() {
      try {
        setLoading(true);

        // Load all ontology nodes
        const result = await apiClient.run({
          service: 'platform.dynamodb',
          operation: 'scan',
          table: 'core-ontology-node',
          data: {}
        });

        if (result.success && result.data?.Items) {
          const nodes = result.data.Items as OntologyNode[];

          // Map icon names to actual icon components
          const mapToNodePaletteItem = (node: OntologyNode): NodePaletteItem => {
            // @ts-ignore - dynamic icon lookup
            const IconComponent = Icons[node.icon] || Icons.Circle;

            return {
              type: node.type,
              label: node.label,
              description: node.description,
              icon: IconComponent,
              example: node.usage,
              domain: node.domain
            };
          };

          // Categorize nodes - only show nodes relevant for decision mapping

          // Core: Agent, Note, Guardrail, Search, Group
          const coreTypes = new Set(['assistant', 'textannotation', 'guardrails', 'file_search', 'group']);
          const core = nodes
            .filter(n => coreTypes.has(n.type))
            .map(mapToNodePaletteItem);

          // Process: mapping decision logic (exclude agentworkflow)
          const process = nodes
            .filter(n =>
              (n.category === 'decision' ||
              n.category === 'process' ||
              n.category === 'logic') &&
              n.type !== 'agentworkflow' &&
              n.type !== 'textannotation' &&
              n.type !== 'group' &&
              n.type !== 'playbook' &&
              n.type !== 'spaceaction' &&
              n.type !== 'workflow'
            )
            .map(mapToNodePaletteItem);

          // Data: data sources (exclude setstate)
          const data = nodes
            .filter(n =>
              n.category === 'data' &&
              n.type !== 'setstate' &&
              n.type !== 'tablemetadata'
            )
            .map(mapToNodePaletteItem);

          // Technology: technical systems (exclude API and Provider)
          const technology = nodes
            .filter(n =>
              n.category === 'technology' &&
              n.type !== 'api' &&
              n.type !== 'provider' &&
              n.type !== 'assistant' &&
              n.type !== 'infrastructure' &&
              n.type !== 'providermodel' &&
              n.type !== 'serviceintegration' &&
              n.type !== 'pipeline'
            )
            .map(mapToNodePaletteItem);

          setCoreNodes(core);
          setProcessNodes(process);
          setDataNodes(data);
          setTechnologyNodes(technology);
        }
      } catch (error) {
        console.error('Failed to load ontology:', error);
      } finally {
        setLoading(false);
      }
    }

    loadOntology();
  }, []);

  const toggleCategory = (category: DesignerNodeCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleNodeClick = (nodeType: DesignerNodeType) => {
    onNodeClick?.(nodeType);
  };

  const renderCategory = (
    category: DesignerNodeCategory,
    title: string,
    nodes: NodePaletteItem[],
    color: string
  ) => {
    const isExpanded = expandedCategories.has(category);

    return (
      <div key={category} className="border-b last:border-b-0">
        <button
          onClick={() => toggleCategory(category)}
          className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <Icons.ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Icons.ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-medium text-sm">{title}</span>
            <div className={`h-2 w-2 rounded-full ${color}`} />
          </div>
          <span className="text-xs text-muted-foreground">{nodes.length}</span>
        </button>

        {isExpanded && (
          <div className="p-2 grid grid-cols-2 gap-1">
            {nodes.map(node => {
              const Icon = node.icon;
              return (
                <button
                  key={node.type}
                  onClick={() => handleNodeClick(node.type)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-full border bg-card hover:bg-accent cursor-pointer transition-colors"
                  title={`${node.description}\n${node.example}`}
                >
                  <div className={`p-1 rounded-full ${color} bg-opacity-20 flex-shrink-0`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <span className="text-xs font-medium truncate">{node.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full w-64 border-r bg-card flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading ontology...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-64 border-r bg-card flex flex-col">
      <div className="flex-1 pt-3">
        {renderCategory('core', 'Core', coreNodes, 'bg-slate-500')}
        {renderCategory('process', 'Process', processNodes, 'bg-blue-500')}
        {renderCategory('data', 'Data', dataNodes, 'bg-green-500')}
        {renderCategory('technology', 'Technology', technologyNodes, 'bg-orange-500')}
      </div>

      <div className="p-3 border-t text-xs text-muted-foreground">
        <div className="flex items-center justify-between mb-1">
          <span>Total Nodes:</span>
          <span className="font-medium">
            {coreNodes.length + processNodes.length + dataNodes.length + technologyNodes.length}
          </span>
        </div>
        <div className="text-xs text-muted-foreground/70 mt-1">
          Loaded from ontology
        </div>
      </div>
    </div>
  );
}
