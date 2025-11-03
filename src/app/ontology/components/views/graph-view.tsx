/**
 * Graph View Component
 * Displays ontology nodes and edges in graph/flow visualization
 */

import { useMemo } from 'react';
import { Flow } from '@captify-io/core/components/flow';
import type { FlowNode, FlowEdge } from '@captify-io/core/components/flow';
import type { OntologyNode, OntologyEdge } from '../../hooks/use-ontology-store';

interface GraphViewProps {
  nodes: OntologyNode[];
  edges: OntologyEdge[];
  onNodeClick?: (node: FlowNode) => void;
  onEdgeClick?: (edge: FlowEdge) => void;
}

export function GraphView({ nodes, edges, onNodeClick, onEdgeClick }: GraphViewProps) {
  // Convert ontology nodes to flow nodes
  const flowNodes: FlowNode[] = useMemo(() => {
    return nodes.map((node, index) => {
      // Calculate position in a grid layout
      const cols = Math.ceil(Math.sqrt(nodes.length));
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
  }, [nodes]);

  // Convert ontology edges to flow edges
  const flowEdges: FlowEdge[] = useMemo(() => {
    return edges
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
  }, [edges]);

  return (
    <div className="flex-1 relative">
      <Flow
        mode="ontology"
        initialNodes={flowNodes}
        initialEdges={flowEdges}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        config={{
          canvas: {
            fitView: true,
            showGrid: true,
            showMinimap: true,
            showControls: true,
          }
        }}
      />
    </div>
  );
}
