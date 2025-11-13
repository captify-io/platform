/**
 * Ontology Store
 *
 * Zustand store for managing ontology objects, links, and actions
 * with automatic CRUD operations and optimistic updates
 */

import { create } from 'zustand';
import { apiClient } from '@captify-io/core/lib/api';

export interface OntologyObject {
  slug: string;
  app: string;
  name: string;
  description?: string;
  status: string;
  icon?: string;
  color?: string;
  x?: number;
  y?: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface OntologyLink {
  slug: string;
  name: string;
  description?: string;
  sourceObjectType: string;
  targetObjectType: string;
  cardinality: string;
  bidirectional: boolean;
  inverseName?: string;
  foreignKey?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface OntologyAction {
  slug: string;
  name: string;
  description?: string;
  objectType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

interface OntologyState {
  // Data
  objects: OntologyObject[];
  links: OntologyLink[];
  actions: OntologyAction[];

  // Loading states
  loading: boolean;
  objectsLoading: boolean;
  linksLoading: boolean;
  actionsLoading: boolean;

  // Error state
  error: string | null;

  // Actions - Load data
  loadAll: () => Promise<void>;
  loadObjects: () => Promise<void>;
  loadLinks: () => Promise<void>;
  loadActions: () => Promise<void>;

  // Actions - Objects CRUD
  createObject: (data: Partial<OntologyObject>) => Promise<void>;
  updateObject: (slug: string, updates: Partial<OntologyObject>) => Promise<void>;
  deleteObject: (slug: string) => Promise<void>;

  // Actions - Links CRUD
  createLink: (data: Partial<OntologyLink>) => Promise<void>;
  updateLink: (slug: string, updates: Partial<OntologyLink>) => Promise<void>;
  deleteLink: (slug: string) => Promise<void>;

  // Actions - Actions CRUD
  createAction: (data: Partial<OntologyAction>) => Promise<void>;
  updateAction: (slug: string, updates: Partial<OntologyAction>) => Promise<void>;
  deleteAction: (slug: string) => Promise<void>;

  // Utility
  reset: () => void;
}

export const useOntologyStore = create<OntologyState>((set, get) => ({
  // Initial state
  objects: [],
  links: [],
  actions: [],
  loading: false,
  objectsLoading: false,
  linksLoading: false,
  actionsLoading: false,
  error: null,

  // Load all data
  loadAll: async () => {
    set({ loading: true, error: null });
    try {
      // Load all in parallel
      const [objectsResponse, linksResponse, actionsResponse] = await Promise.all([
        apiClient.run({
          service: 'platform.ontology',
          operation: 'listObjectTypes',
          data: {},
        }),
        apiClient.run({
          service: 'platform.ontology',
          operation: 'listLinkTypes',
          data: {},
        }),
        apiClient.run({
          service: 'platform.ontology',
          operation: 'listActionTypes',
          data: {},
        }),
      ]);

      // Update all state at once
      set({
        objects: (objectsResponse.success && objectsResponse.data) ? objectsResponse.data as OntologyObject[] : [],
        links: (linksResponse.success && linksResponse.data) ? linksResponse.data as OntologyLink[] : [],
        actions: (actionsResponse.success && actionsResponse.data) ? actionsResponse.data as OntologyAction[] : [],
      });
    } catch (error) {
      console.error('Failed to load ontology data:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to load ontology data' });
    } finally {
      set({ loading: false });
    }
  },

  // Load objects
  loadObjects: async () => {
    set({ objectsLoading: true, error: null });
    try {
      const response = await apiClient.run({
        service: 'platform.ontology',
        operation: 'listObjectTypes',
        data: {},
      });

      if (response.success && response.data) {
        set({ objects: response.data as OntologyObject[] });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load objects' });
    } finally {
      set({ objectsLoading: false });
    }
  },

  // Load links
  loadLinks: async () => {
    set({ linksLoading: true, error: null });
    try {
      const response = await apiClient.run({
        service: 'platform.ontology',
        operation: 'listLinkTypes',
        data: {},
      });

      if (response.success && response.data) {
        set({ links: response.data as OntologyLink[] });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load links' });
    } finally {
      set({ linksLoading: false });
    }
  },

  // Load actions
  loadActions: async () => {
    set({ actionsLoading: true, error: null });
    try {
      const response = await apiClient.run({
        service: 'platform.ontology',
        operation: 'listActionTypes',
        data: {},
      });

      if (response.success && response.data) {
        set({ actions: response.data as OntologyAction[] });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load actions' });
    } finally {
      set({ actionsLoading: false });
    }
  },

  // Create object
  createObject: async (data) => {
    try {
      const response = await apiClient.run({
        service: 'platform.ontology',
        operation: 'createObjectType',
        data,
      });

      if (response.success && response.data) {
        // Optimistic update - add to state immediately
        set(state => ({
          objects: [...state.objects, response.data as OntologyObject]
        }));
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create object' });
      throw error;
    }
  },

  // Update object
  updateObject: async (slug, updates) => {
    // Optimistic update - update state immediately
    const previousObjects = get().objects;
    set(state => ({
      objects: state.objects.map(obj =>
        obj.slug === slug ? { ...obj, ...updates } : obj
      )
    }));

    try {
      const response = await apiClient.run({
        service: 'platform.ontology',
        operation: 'updateObjectType',
        data: { slug, updates },
      });

      if (!response.success) {
        // Rollback on failure
        set({ objects: previousObjects });
        throw new Error(response.error || 'Failed to update object');
      }
    } catch (error) {
      // Rollback on error
      set({
        objects: previousObjects,
        error: error instanceof Error ? error.message : 'Failed to update object'
      });
      throw error;
    }
  },

  // Delete object
  deleteObject: async (slug) => {
    // Optimistic update - remove from state immediately
    const previousObjects = get().objects;
    set(state => ({
      objects: state.objects.filter(obj => obj.slug !== slug)
    }));

    try {
      const response = await apiClient.run({
        service: 'platform.ontology',
        operation: 'deleteObjectType',
        data: { slug },
      });

      if (!response.success) {
        // Rollback on failure
        set({ objects: previousObjects });
        throw new Error(response.error || 'Failed to delete object');
      }
    } catch (error) {
      // Rollback on error
      set({
        objects: previousObjects,
        error: error instanceof Error ? error.message : 'Failed to delete object'
      });
      throw error;
    }
  },

  // Create link
  createLink: async (data) => {
    try {
      const response = await apiClient.run({
        service: 'platform.ontology',
        operation: 'createLinkType',
        data,
      });

      if (response.success && response.data) {
        set(state => ({
          links: [...state.links, response.data as OntologyLink]
        }));
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create link' });
      throw error;
    }
  },

  // Update link
  updateLink: async (slug, updates) => {
    const previousLinks = get().links;
    set(state => ({
      links: state.links.map(link =>
        link.slug === slug ? { ...link, ...updates } : link
      )
    }));

    try {
      const response = await apiClient.run({
        service: 'platform.ontology',
        operation: 'updateLinkType',
        data: { slug, updates },
      });

      if (!response.success) {
        set({ links: previousLinks });
        throw new Error(response.error || 'Failed to update link');
      }
    } catch (error) {
      set({
        links: previousLinks,
        error: error instanceof Error ? error.message : 'Failed to update link'
      });
      throw error;
    }
  },

  // Delete link
  deleteLink: async (slug) => {
    const previousLinks = get().links;
    set(state => ({
      links: state.links.filter(link => link.slug !== slug)
    }));

    try {
      const response = await apiClient.run({
        service: 'platform.ontology',
        operation: 'deleteLinkType',
        data: { slug },
      });

      if (!response.success) {
        set({ links: previousLinks });
        throw new Error(response.error || 'Failed to delete link');
      }
    } catch (error) {
      set({
        links: previousLinks,
        error: error instanceof Error ? error.message : 'Failed to delete link'
      });
      throw error;
    }
  },

  // Create action
  createAction: async (data) => {
    try {
      const response = await apiClient.run({
        service: 'platform.ontology',
        operation: 'createActionType',
        data,
      });

      if (response.success && response.data) {
        set(state => ({
          actions: [...state.actions, response.data as OntologyAction]
        }));
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create action' });
      throw error;
    }
  },

  // Update action
  updateAction: async (slug, updates) => {
    const previousActions = get().actions;
    set(state => ({
      actions: state.actions.map(action =>
        action.slug === slug ? { ...action, ...updates } : action
      )
    }));

    try {
      const response = await apiClient.run({
        service: 'platform.ontology',
        operation: 'updateActionType',
        data: { slug, updates },
      });

      if (!response.success) {
        set({ actions: previousActions });
        throw new Error(response.error || 'Failed to update action');
      }
    } catch (error) {
      set({
        actions: previousActions,
        error: error instanceof Error ? error.message : 'Failed to update action'
      });
      throw error;
    }
  },

  // Delete action
  deleteAction: async (slug) => {
    const previousActions = get().actions;
    set(state => ({
      actions: state.actions.filter(action => action.slug !== slug)
    }));

    try {
      const response = await apiClient.run({
        service: 'platform.ontology',
        operation: 'deleteActionType',
        data: { slug },
      });

      if (!response.success) {
        set({ actions: previousActions });
        throw new Error(response.error || 'Failed to delete action');
      }
    } catch (error) {
      set({
        actions: previousActions,
        error: error instanceof Error ? error.message : 'Failed to delete action'
      });
      throw error;
    }
  },

  // Reset store
  reset: () => {
    set({
      objects: [],
      links: [],
      actions: [],
      loading: false,
      objectsLoading: false,
      linksLoading: false,
      actionsLoading: false,
      error: null,
    });
  },
}));
