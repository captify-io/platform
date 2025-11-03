"use client";

/**
 * Designer Context
 * Centralized state management for the Agent Designer
 * Provides access to model state and operations
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { DesignerModel, DesignerNode, DesignerEdge } from '@captify-io/core/types';

interface DesignerContextValue {
  // Model state
  model: DesignerModel;

  // Selection state
  selectedNodeId: string | null;
  selectedEdgeId: string | null;

  // Chat history
  chatHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;

  // Dirty state
  isDirty: boolean;
  lastSavedAt: number | null;

  // Model operations
  setModel: (model: DesignerModel) => void;
  updateAgentConfig: (config: Partial<DesignerModel['agent']>) => void;
  updateScenario: (scenario: string) => void;
  updateOntology: (ontology: Partial<DesignerModel['ontology']>) => void;

  // Node operations
  addNode: (node: DesignerNode) => void;
  updateNode: (nodeId: string, updates: Partial<DesignerNode>) => void;
  deleteNode: (nodeId: string) => void;
  setSelectedNode: (nodeId: string | null) => void;

  // Edge operations
  addEdge: (edge: DesignerEdge) => void;
  updateEdge: (edgeId: string, updates: Partial<DesignerEdge>) => void;
  deleteEdge: (edgeId: string) => void;
  setSelectedEdge: (edgeId: string | null) => void;

  // Batch operations (for chat-driven updates)
  batchUpdate: (updates: {
    nodes?: DesignerNode[];
    edges?: DesignerEdge[];
    agent?: Partial<DesignerModel['agent']>;
    scenario?: string;
  }) => void;

  // Chat operations
  addChatMessage: (role: 'user' | 'assistant', content: string) => void;
  clearChat: () => void;

  // Persistence
  save: () => Promise<void>;
  load: (modelId: string) => Promise<void>;
  exportJSON: () => string;

  // Undo/Redo (future)
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

const DesignerContext = createContext<DesignerContextValue | null>(null);

export function useDesigner() {
  const context = useContext(DesignerContext);
  if (!context) {
    throw new Error('useDesigner must be used within DesignerProvider');
  }
  return context;
}

interface DesignerProviderProps {
  children: React.ReactNode;
  initialModel?: DesignerModel;
}

export function DesignerProvider({ children, initialModel }: DesignerProviderProps) {
  // Initialize default model
  const defaultModel: DesignerModel = initialModel || {
    agent: {
      name: 'New Agent',
      system_instruction: '',
      provider: '',
      model: '',
      temperature: 0.7,
      maxTokens: 2000,
    },
    decisionModel: {
      scenario: 'New Scenario',
      nodes: [],
      edges: [],
    },
    ontology: {
      domain: '',
      objects: [],
    },
  };

  const [model, setModelState] = useState<DesignerModel>(defaultModel);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  // Mark as dirty when model changes
  useEffect(() => {
    setIsDirty(true);
  }, [model]);

  // Model operations
  const setModel = useCallback((newModel: DesignerModel) => {
    setModelState(newModel);
  }, []);

  const updateAgentConfig = useCallback((config: Partial<DesignerModel['agent']>) => {
    setModelState(prev => ({
      ...prev,
      agent: { ...prev.agent, ...config },
    }));
  }, []);

  const updateScenario = useCallback((scenario: string) => {
    setModelState(prev => ({
      ...prev,
      decisionModel: { ...prev.decisionModel, scenario },
    }));
  }, []);

  const updateOntology = useCallback((ontology: Partial<DesignerModel['ontology']>) => {
    setModelState(prev => ({
      ...prev,
      ontology: { ...prev.ontology, ...ontology },
    }));
  }, []);

  // Node operations
  const addNode = useCallback((node: DesignerNode) => {
    setModelState(prev => ({
      ...prev,
      decisionModel: {
        ...prev.decisionModel,
        nodes: [...prev.decisionModel.nodes, node],
      },
    }));
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<DesignerNode>) => {
    setModelState(prev => ({
      ...prev,
      decisionModel: {
        ...prev.decisionModel,
        nodes: prev.decisionModel.nodes.map(node =>
          node.id === nodeId ? { ...node, ...updates } : node
        ),
      },
    }));
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setModelState(prev => ({
      ...prev,
      decisionModel: {
        ...prev.decisionModel,
        nodes: prev.decisionModel.nodes.filter(node => node.id !== nodeId),
        edges: prev.decisionModel.edges.filter(
          edge => edge.source !== nodeId && edge.target !== nodeId
        ),
      },
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
  const addEdge = useCallback((edge: DesignerEdge) => {
    setModelState(prev => ({
      ...prev,
      decisionModel: {
        ...prev.decisionModel,
        edges: [...prev.decisionModel.edges, edge],
      },
    }));
  }, []);

  const updateEdge = useCallback((edgeId: string, updates: Partial<DesignerEdge>) => {
    setModelState(prev => ({
      ...prev,
      decisionModel: {
        ...prev.decisionModel,
        edges: prev.decisionModel.edges.map(edge =>
          edge.id === edgeId ? { ...edge, ...updates } : edge
        ),
      },
    }));
  }, []);

  const deleteEdge = useCallback((edgeId: string) => {
    setModelState(prev => ({
      ...prev,
      decisionModel: {
        ...prev.decisionModel,
        edges: prev.decisionModel.edges.filter(edge => edge.id !== edgeId),
      },
    }));
    if (selectedEdgeId === edgeId) {
      setSelectedEdgeId(null);
    }
  }, [selectedEdgeId]);

  const setSelectedEdge = useCallback((edgeId: string | null) => {
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
  }, []);

  // Batch operations
  const batchUpdate = useCallback((updates: {
    nodes?: DesignerNode[];
    edges?: DesignerEdge[];
    agent?: Partial<DesignerModel['agent']>;
    scenario?: string;
  }) => {
    setModelState(prev => {
      const newModel = { ...prev };

      if (updates.nodes) {
        newModel.decisionModel = {
          ...newModel.decisionModel,
          nodes: updates.nodes,
        };
      }

      if (updates.edges) {
        newModel.decisionModel = {
          ...newModel.decisionModel,
          edges: updates.edges,
        };
      }

      if (updates.agent) {
        newModel.agent = { ...newModel.agent, ...updates.agent };
      }

      if (updates.scenario) {
        newModel.decisionModel = {
          ...newModel.decisionModel,
          scenario: updates.scenario,
        };
      }

      return newModel;
    });
  }, []);

  // Chat operations
  const addChatMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    setChatHistory(prev => [
      ...prev,
      { role, content, timestamp: Date.now() },
    ]);
  }, []);

  const clearChat = useCallback(() => {
    setChatHistory([]);
  }, []);

  // Persistence operations
  const save = useCallback(async () => {
    try {
      const { apiClient } = await import('@captify-io/core');

      // Save the agent configuration
      const agentData = {
        ...model.agent,
        updatedAt: new Date().toISOString(),
      };

      // If model has an ID, update it; otherwise this is handled by parent
      if ((model as any).id) {
        agentData.id = (model as any).id;
      }

      // Also include decision model and ontology in the agent record
      agentData.scenario = model.decisionModel.scenario;
      agentData.nodes = model.decisionModel.nodes;
      agentData.edges = model.decisionModel.edges;
      agentData.domain = model.ontology.domain;
      agentData.objects = model.ontology.objects;
      agentData.version = model.version;

      await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'put',
        table: 'core-agent',
        data: {
          item: agentData,
        },
      });

      setLastSavedAt(Date.now());
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to save model:', error);
      throw error;
    }
  }, [model]);

  const load = useCallback(async (agentId: string) => {
    try {
      const { apiClient } = await import('@captify-io/core');

      const result = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'get',
        table: 'core-agent',
        data: {
          key: { id: agentId },
        },
      });

      if (result.success && result.data) {
        const agentData = result.data;

        // Build the model from the loaded agent data
        const loadedModel: DesignerModel = {
          agent: {
            name: agentData.name || 'Untitled Agent',
            system_instruction: agentData.system_instruction || '',
            provider: agentData.provider || '',
            model: agentData.model || '',
            temperature: agentData.temperature || 0.7,
            maxTokens: agentData.maxTokens || 2000,
          },
          decisionModel: {
            scenario: agentData.scenario || 'New Scenario',
            nodes: agentData.nodes || [],
            edges: agentData.edges || [],
          },
          ontology: {
            domain: agentData.domain || '',
            objects: agentData.objects || [],
          },
          version: agentData.version,
        };

        // Store the agent ID for future saves
        (loadedModel as any).id = agentId;

        setModelState(loadedModel);
        setIsDirty(false);
        setLastSavedAt(agentData.updatedAt ? new Date(agentData.updatedAt).getTime() : null);
      } else {
        throw new Error('Agent not found');
      }
    } catch (error) {
      console.error('Failed to load model:', error);
      throw error;
    }
  }, []);

  const exportJSON = useCallback(() => {
    return JSON.stringify(model, null, 2);
  }, [model]);

  // Undo/Redo (placeholder)
  const undo = useCallback(() => {
    console.log('Undo not yet implemented');
  }, []);

  const redo = useCallback(() => {
    console.log('Redo not yet implemented');
  }, []);

  const value: DesignerContextValue = {
    model,
    selectedNodeId,
    selectedEdgeId,
    chatHistory,
    isDirty,
    lastSavedAt,
    setModel,
    updateAgentConfig,
    updateScenario,
    updateOntology,
    addNode,
    updateNode,
    deleteNode,
    setSelectedNode,
    addEdge,
    updateEdge,
    deleteEdge,
    setSelectedEdge,
    batchUpdate,
    addChatMessage,
    clearChat,
    save,
    load,
    exportJSON,
    canUndo: false,
    canRedo: false,
    undo,
    redo,
  };

  return (
    <DesignerContext.Provider value={value}>
      {children}
    </DesignerContext.Provider>
  );
}
