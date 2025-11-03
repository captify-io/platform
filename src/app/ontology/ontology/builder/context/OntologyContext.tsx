"use client";

/**
 * Ontology Builder Context
 * State management for ontology visual designer
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiClient } from '@captify-io/core';

export interface OntologyNode {
  id: string;
  type: string;
  category: string;
  domain: string;
  app: string;
  schema: string;
  tenantId: string;
  table: string;
  label: string;
  description: string;
  usage: string;
  icon: string;
  color: string;
  shape: string;
  allowedSources: string[];
  allowedTargets: string[];
  allowedConnectors: string[];
  properties?: Record<string, any>;
  groups?: string[];
  roles?: string[];
  permissions?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  position?: { x: number; y: number };
}

export interface OntologyEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
  properties?: Record<string, any>;
}

export interface OntologyModel {
  nodes: OntologyNode[];
  edges: OntologyEdge[];
  metadata: {
    domain?: string;
    version?: string;
    lastModified?: string;
  };
}

interface OntologyContextValue {
  // Model state
  model: OntologyModel;
  isDirty: boolean;
  lastSavedAt: number | null;

  // Selection state
  selectedNodeId: string | null;
  selectedEdgeId: string | null;

  // Model operations
  setModel: (model: OntologyModel) => void;

  // Node operations
  addNode: (node: OntologyNode) => void;
  updateNode: (nodeId: string, updates: Partial<OntologyNode>) => void;
  deleteNode: (nodeId: string) => void;
  setSelectedNode: (nodeId: string | null) => void;

  // Edge operations
  addEdge: (edge: OntologyEdge) => void;
  updateEdge: (edgeId: string, updates: Partial<OntologyEdge>) => void;
  deleteEdge: (edgeId: string) => void;
  setSelectedEdge: (edgeId: string | null) => void;

  // Data operations
  attachDataToNode: (nodeId: string, tableName: string) => Promise<void>;
  fetchDataItems: (nodeId: string) => Promise<{ success: boolean; count?: number; error?: string; tableName?: string; needsCreation?: boolean }>;
  loadRelationships: (nodeId: string) => Promise<void>;

  // Persistence
  save: () => Promise<void>;
  load: (nodeId?: string) => Promise<void>;
  exportJSON: () => string;
}

const OntologyContext = createContext<OntologyContextValue | null>(null);

export function useOntology() {
  const context = useContext(OntologyContext);
  if (!context) {
    throw new Error('useOntology must be used within OntologyProvider');
  }
  return context;
}

interface OntologyProviderProps {
  children: React.ReactNode;
}

export function OntologyProvider({ children }: OntologyProviderProps) {
  const [model, setModelState] = useState<OntologyModel>({
    nodes: [],
    edges: [],
    metadata: {},
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  // Mark as dirty when model changes
  useEffect(() => {
    setIsDirty(true);
  }, [model]);

  const setModel = useCallback((newModel: OntologyModel) => {
    setModelState(newModel);
  }, []);

  // Node operations
  const addNode = useCallback((node: OntologyNode) => {
    setModelState(prev => ({
      ...prev,
      nodes: [...prev.nodes, node],
    }));
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<OntologyNode>) => {
    setModelState(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      ),
    }));
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setModelState(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      edges: prev.edges.filter(
        edge => edge.source !== nodeId && edge.target !== nodeId
      ),
    }));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  const setSelectedNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
  }, []);

  // Edge operations
  const addEdge = useCallback((edge: OntologyEdge) => {
    setModelState(prev => ({
      ...prev,
      edges: [...prev.edges, edge],
    }));
  }, []);

  const updateEdge = useCallback((edgeId: string, updates: Partial<OntologyEdge>) => {
    setModelState(prev => ({
      ...prev,
      edges: prev.edges.map(edge =>
        edge.id === edgeId ? { ...edge, ...updates } : edge
      ),
    }));
  }, []);

  const deleteEdge = useCallback((edgeId: string) => {
    setModelState(prev => ({
      ...prev,
      edges: prev.edges.filter(edge => edge.id !== edgeId),
    }));
    if (selectedEdgeId === edgeId) {
      setSelectedEdgeId(null);
    }
  }, [selectedEdgeId]);

  const setSelectedEdge = useCallback((edgeId: string | null) => {
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
  }, []);

  // Data operations
  const attachDataToNode = useCallback(async (nodeId: string, tableName: string) => {
    try {
      // Fetch data from the table
      const result = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: tableName,
      });

      if (result.success && result.data) {
        const items = result.data.Items || result.data;

        // Update node with attached data
        updateNode(nodeId, {
          properties: {
            ...model.nodes.find(n => n.id === nodeId)?.properties,
            attachedData: items,
            dataSource: tableName,
            dataCount: Array.isArray(items) ? items.length : 0,
          },
        });
      }
    } catch (error) {
      console.error('Failed to attach data to node:', error);
      throw error;
    }
  }, [model.nodes, updateNode]);

  // Fetch data items and create circular nodes
  const fetchDataItems = useCallback(async (nodeId: string) => {
    const node = model.nodes.find(n => n.id === nodeId);
    if (!node) return { success: false, error: 'Node not found' };

    // Determine table name: app-Type (capitalize first letter of type)
    const capitalizedType = node.type.charAt(0).toUpperCase() + node.type.slice(1);
    const tableName = `${node.app}-${capitalizedType}`;

    try {
      // Try to fetch data from the table
      const result = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: tableName,
      });

      if (result.success && result.data) {
        const items = Array.isArray(result.data.Items) ? result.data.Items :
                      Array.isArray(result.data) ? result.data : [];

        // Create circular data item nodes around the parent node
        const parentNode = node;
        const radius = 200; // Distance from parent node
        const angleStep = (2 * Math.PI) / Math.max(items.length, 1);

        const newNodes: OntologyNode[] = [];
        const newEdges: OntologyEdge[] = [];

        items.forEach((item: any, index: number) => {
          const angle = index * angleStep;
          // Use relative position from parent
          const relativeX = radius * Math.cos(angle);
          const relativeY = radius * Math.sin(angle);
          const absoluteX = (parentNode.position?.x || 0) + relativeX;
          const absoluteY = (parentNode.position?.y || 0) + relativeY;

          const dataNodeId = `data-${nodeId}-${item.id || index}`;
          const label = item.name || item.title || item.label || item.id || `Item ${index + 1}`;

          const dataNode: OntologyNode = {
            id: dataNodeId,
            type: 'data-item',
            category: 'Data',
            domain: node.domain,
            app: node.app,
            schema: node.schema,
            tenantId: node.tenantId,
            table: tableName,
            label: label,
            description: `Data item from ${tableName}`,
            usage: '',
            icon: 'Circle',
            color: 'bg-blue-500',
            shape: 'circle',
            allowedSources: [],
            allowedTargets: [],
            allowedConnectors: [],
            properties: {
              ...item,
              isDataItem: true,
              parentNodeId: nodeId,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            position: { x: absoluteX, y: absoluteY },
          };

          newNodes.push(dataNode);

          // Create edge from parent to data item
          const edge: OntologyEdge = {
            id: `edge-${nodeId}-${dataNodeId}`,
            source: nodeId,
            target: dataNodeId,
            type: 'data',
            label: 'contains',
          };

          newEdges.push(edge);
        });

        // Add nodes and edges to the model
        setModelState(prev => ({
          ...prev,
          nodes: [...prev.nodes, ...newNodes],
          edges: [...prev.edges, ...newEdges],
        }));

        // Update parent node with data count
        updateNode(nodeId, {
          properties: {
            ...parentNode.properties,
            dataCount: items.length,
            dataSource: tableName,
          },
        });

        return { success: true, count: items.length };
      } else {
        return { success: false, error: 'No data found', tableName };
      }
    } catch (error: any) {
      console.error('Failed to fetch data items:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch data',
        tableName,
        needsCreation: error.message?.includes('ResourceNotFoundException') ||
                      error.message?.includes('not found')
      };
    }
  }, [model.nodes, updateNode]);

  // Load relationships for a node (same logic as load but triggered on-demand)
  const loadRelationships = useCallback(async (nodeId: string) => {
    try {
      const node = model.nodes.find(n => n.id === nodeId);
      if (!node) return;

      // Load all edges
      const edgesResult = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-ontology-edge',
      });

      const allEdges = edgesResult.success && edgesResult.data
        ? (edgesResult.data.Items || edgesResult.data)
        : [];

      const visited = new Set(model.nodes.map(n => n.id));
      const newNodes: OntologyNode[] = [];
      const newEdges: OntologyEdge[] = [];

      // Find edges directly connected to this node
      const connectedEdges = allEdges.filter((edge: any) =>
        edge.source === nodeId || edge.target === nodeId
      );

      for (const edge of connectedEdges) {
        // Check if edge already exists in model
        const edgeExists = model.edges.some(e => e.id === edge.id);
        if (!edgeExists) {
          newEdges.push(edge);
        }

        // Find the other node in the relationship
        const otherNodeId = edge.source === nodeId ? edge.target : edge.source;

        if (!visited.has(otherNodeId)) {
          visited.add(otherNodeId);

          // Load the connected node
          const connectedNodeResult = await apiClient.run({
            service: 'platform.dynamodb',
            operation: 'get',
            table: 'core-ontology-node',
            data: { key: { id: otherNodeId } },
          });

          if (connectedNodeResult.success && connectedNodeResult.data) {
            newNodes.push(connectedNodeResult.data);
          }
        }
      }

      // Load nodes from allowedTargets and allowedConnectors
      const allowedTargets = node.allowedTargets || [];
      const allowedConnectors = node.allowedConnectors || [];
      const typesToLoad = [...allowedTargets, ...allowedConnectors];

      // Scan once for all nodes
      const typeNodesResult = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-ontology-node',
      });

      if (typeNodesResult.success && typeNodesResult.data) {
        const allNodes = typeNodesResult.data.Items || typeNodesResult.data;

        for (const targetType of typesToLoad) {
          const matchingNodes = allNodes.filter((n: any) => n.type === targetType);

          for (const matchingNode of matchingNodes) {
            if (!visited.has(matchingNode.id)) {
              visited.add(matchingNode.id);
              newNodes.push(matchingNode);

              // Create edge if it doesn't exist
              const edgeExists = allEdges.some((e: any) =>
                (e.source === nodeId && e.target === matchingNode.id) ||
                (e.source === matchingNode.id && e.target === nodeId)
              );

              if (!edgeExists && allowedTargets.includes(targetType)) {
                const newEdge = {
                  id: `edge-${nodeId}-${matchingNode.id}`,
                  source: nodeId,
                  target: matchingNode.id,
                  type: 'allowed',
                  label: 'can connect to',
                };
                newEdges.push(newEdge);
              }
            }
          }
        }
      }

      // Add new nodes and edges to the model
      if (newNodes.length > 0 || newEdges.length > 0) {
        setModelState(prev => ({
          ...prev,
          nodes: [...prev.nodes, ...newNodes],
          edges: [...prev.edges, ...newEdges],
        }));
      }
    } catch (error) {
      console.error('Failed to load relationships:', error);
      throw error;
    }
  }, [model.nodes, model.edges]);

  // Persistence operations
  const save = useCallback(async () => {
    try {
      // Save all nodes
      for (const node of model.nodes) {
        await apiClient.run({
          service: 'platform.dynamodb',
          operation: 'put',
          table: 'core-ontology-node',
          data: {
            item: {
              ...node,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }

      // Save edges to a separate table
      for (const edge of model.edges) {
        await apiClient.run({
          service: 'platform.dynamodb',
          operation: 'put',
          table: 'core-ontology-edge',
          data: {
            item: {
              ...edge,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }

      setLastSavedAt(Date.now());
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to save ontology:', error);
      throw error;
    }
  }, [model]);

  const load = useCallback(async (nodeId?: string) => {
    try {
      // Load initial node(s)
      const nodesResult = await apiClient.run({
        service: 'platform.dynamodb',
        operation: nodeId ? 'get' : 'scan',
        table: 'core-ontology-node',
        data: nodeId ? { key: { id: nodeId } } : undefined,
      });

      const initialNodes = nodeId
        ? (nodesResult.success && nodesResult.data ? [nodesResult.data] : [])
        : (nodesResult.success && nodesResult.data ? (nodesResult.data.Items || nodesResult.data) : []);

      // Load all edges
      const edgesResult = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-ontology-edge',
      });

      const allEdges = edgesResult.success && edgesResult.data
        ? (edgesResult.data.Items || edgesResult.data)
        : [];

      let nodesToLoad = Array.isArray(initialNodes) ? [...initialNodes] : [];
      let edgesToInclude: any[] = [];
      const loadedNodeIds = new Set(nodesToLoad.map((n: any) => n.id));

      // If we have a specific node, only load its DIRECT connections (no recursion)
      if (nodeId && nodesToLoad.length > 0) {
        const currentNode = nodesToLoad[0];
        const visited = new Set([nodeId]);

        // Find edges directly connected to this node
        const connectedEdges = allEdges.filter((edge: any) =>
          edge.source === currentNode.id || edge.target === currentNode.id
        );

        for (const edge of connectedEdges) {
          edgesToInclude.push(edge);

          // Find the other node in the relationship
          const otherNodeId = edge.source === currentNode.id ? edge.target : edge.source;

          if (!visited.has(otherNodeId)) {
            visited.add(otherNodeId);

            // Load the directly connected node
            const connectedNodeResult = await apiClient.run({
              service: 'platform.dynamodb',
              operation: 'get',
              table: 'core-ontology-node',
              data: { key: { id: otherNodeId } },
            });

            if (connectedNodeResult.success && connectedNodeResult.data) {
              nodesToLoad.push(connectedNodeResult.data);
              loadedNodeIds.add(otherNodeId);
            }
          }
        }

        // Load nodes from allowedTargets and allowedConnectors (first level only)
        const allowedTargets = currentNode.allowedTargets || [];
        const allowedConnectors = currentNode.allowedConnectors || [];
        const typesToLoad = [...allowedTargets, ...allowedConnectors];

        // Scan once for all nodes
        const typeNodesResult = await apiClient.run({
          service: 'platform.dynamodb',
          operation: 'scan',
          table: 'core-ontology-node',
        });

        if (typeNodesResult.success && typeNodesResult.data) {
          const allNodes = typeNodesResult.data.Items || typeNodesResult.data;

          for (const targetType of typesToLoad) {
            const matchingNodes = allNodes.filter((n: any) => n.type === targetType);

            for (const matchingNode of matchingNodes) {
              if (!visited.has(matchingNode.id)) {
                visited.add(matchingNode.id);
                nodesToLoad.push(matchingNode);
                loadedNodeIds.add(matchingNode.id);

                // Create edge if it doesn't exist
                const edgeExists = allEdges.some((e: any) =>
                  (e.source === currentNode.id && e.target === matchingNode.id) ||
                  (e.source === matchingNode.id && e.target === currentNode.id)
                );

                if (!edgeExists && allowedTargets.includes(targetType)) {
                  const newEdge = {
                    id: `edge-${currentNode.id}-${matchingNode.id}`,
                    source: currentNode.id,
                    target: matchingNode.id,
                    type: 'allowed',
                    label: 'can connect to',
                  };
                  edgesToInclude.push(newEdge);
                }
              }
            }
          }
        }
      } else {
        // Load all edges if loading all nodes
        edgesToInclude = allEdges;
      }

      setModelState({
        nodes: nodesToLoad,
        edges: edgesToInclude,
        metadata: {
          lastModified: new Date().toISOString(),
        },
      });

      setIsDirty(false);
      setLastSavedAt(Date.now());
    } catch (error) {
      console.error('Failed to load ontology:', error);
      throw error;
    }
  }, []);

  const exportJSON = useCallback(() => {
    return JSON.stringify(model, null, 2);
  }, [model]);

  const value: OntologyContextValue = {
    model,
    isDirty,
    lastSavedAt,
    selectedNodeId,
    selectedEdgeId,
    setModel,
    addNode,
    updateNode,
    deleteNode,
    setSelectedNode,
    addEdge,
    updateEdge,
    deleteEdge,
    setSelectedEdge,
    attachDataToNode,
    fetchDataItems,
    loadRelationships,
    save,
    load,
    exportJSON,
  };

  return (
    <OntologyContext.Provider value={value}>
      {children}
    </OntologyContext.Provider>
  );
}
