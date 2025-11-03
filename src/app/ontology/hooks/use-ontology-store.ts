/**
 * Ontology Data Store Hook
 * Centralized data management for ontology nodes and edges
 * Loads data once on mount, filters from in-memory store
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { apiClient } from '@captify-io/core';

export interface OntologyNode {
  id: string;
  name: string;
  type: string;
  category?: string;
  description?: string;
  domain?: string;
  namespace?: string;
  properties?: {
    icon?: string;
    color?: string;
    dataSource?: string;
    [key: string]: any;
  };
}

export interface OntologyEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  sourceType?: string;
  targetType?: string;
  properties?: {
    [key: string]: any;
  };
}

export interface FilterPill {
  property: string;
  value: string;
}

interface UseOntologyStoreReturn {
  // Raw data (never filtered)
  allNodes: OntologyNode[];
  allEdges: OntologyEdge[];

  // Filtered data
  nodes: OntologyNode[];
  edges: OntologyEdge[];

  // Filter state
  filters: FilterPill[];
  setFilters: (filters: FilterPill[]) => void;

  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Loading state
  loading: boolean;
  error: string | null;

  // Actions
  reload: () => Promise<void>;
  loadTableData: (tableType: string) => Promise<OntologyNode[]>;
}

export function useOntologyStore(): UseOntologyStoreReturn {
  // Store state - loaded once
  const [allNodes, setAllNodes] = useState<OntologyNode[]>([]);
  const [allEdges, setAllEdges] = useState<OntologyEdge[]>([]);

  // Filter state
  const [filters, setFilters] = useState<FilterPill[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Loading state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data once on mount
  useEffect(() => {
    loadOntologyData();
  }, []);

  const loadOntologyData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load ontology nodes
      const nodesResult = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-ontology-node',
      });

      // Load ontology edges
      const edgesResult = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-ontology-edge',
      });

      if (nodesResult.success && nodesResult.data?.Items) {
        setAllNodes(nodesResult.data.Items as OntologyNode[]);
      } else {
        setError('Failed to load ontology nodes');
      }

      if (edgesResult.success && edgesResult.data?.Items) {
        setAllEdges(edgesResult.data.Items as OntologyEdge[]);
      } else {
        setError('Failed to load ontology edges');
      }
    } catch (err) {
      console.error('Failed to load ontology:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and search to nodes (memoized)
  const nodes = useMemo(() => {
    let result = allNodes;

    // Apply property filters (only those with values)
    const activeFilters = filters.filter(f => f.value);
    if (activeFilters.length > 0) {
      result = result.filter(node => {
        return activeFilters.every(filter => {
          const value = node[filter.property as keyof OntologyNode];
          if (value === undefined || value === null) return false;
          return String(value).toLowerCase() === String(filter.value).toLowerCase();
        });
      });
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(node => {
        return (
          node.name?.toLowerCase().includes(query) ||
          node.type?.toLowerCase().includes(query) ||
          node.description?.toLowerCase().includes(query) ||
          node.domain?.toLowerCase().includes(query) ||
          node.category?.toLowerCase().includes(query) ||
          node.id?.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [allNodes, filters, searchQuery]);

  // Apply filters to edges (memoized)
  const edges = useMemo(() => {
    let result = allEdges;

    // Filter edges to only show those connecting visible nodes
    const nodeIds = new Set(nodes.map(n => n.id));
    result = result.filter(edge =>
      nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );

    return result;
  }, [allEdges, nodes]);

  const loadTableData = useCallback(async (tableType: string): Promise<OntologyNode[]> => {
    try {
      // Map view type to table name
      let tableName = '';

      switch (tableType) {
        case 'objects':
          tableName = 'core-ontology-node';
          break;
        case 'links':
          // Links use edges, not nodes - return empty for now
          return [];
        case 'data-products':
          // Data products are stored in nodes table, filter by type
          const nodesResult = await apiClient.run({
            service: 'platform.dynamodb',
            operation: 'scan',
            table: 'core-ontology-node',
          });
          if (nodesResult.success && nodesResult.data?.Items) {
            const products = (nodesResult.data.Items as OntologyNode[]).filter(n =>
              n.type?.toLowerCase().includes('product') ||
              n.category?.toLowerCase().includes('product')
            );
            return products;
          }
          return [];
        case 'actions':
        case 'events':
        case 'functions':
        case 'sources':
        case 'datasets':
        case 'transforms':
        case 'views':
        case 'schedules':
        case 'workflows':
          tableName = `core-ontology-${tableType.slice(0, -1)}`; // Remove 's' from plural
          break;
        default:
          return [];
      }

      const result = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: tableName,
      });

      if (result.success && result.data?.Items) {
        return result.data.Items as OntologyNode[];
      }

      return [];
    } catch (err) {
      console.error(`Failed to load ${tableType} data:`, err);
      return [];
    }
  }, []);

  return {
    allNodes,
    allEdges,
    nodes,
    edges,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    reload: loadOntologyData,
    loadTableData,
  };
}
