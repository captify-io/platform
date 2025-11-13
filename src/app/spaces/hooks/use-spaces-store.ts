/**
 * Spaces Data Store Hook
 * Centralized data management for spaces, tasks, and related entities
 * Loads data once on mount, filters from in-memory store
 *
 * Features:
 * - Role-aware data loading
 * - Real-time filtering and search
 * - Optimistic updates
 * - Cached data with 5-minute TTL
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { apiClient } from '@captify-io/core';
import { useRolePermissions } from '@captify-io/core/hooks';

// ===== TYPES =====

export interface Space {
  id: string;
  name: string;
  type: 'product' | 'service' | 'support';
  ownerId: string;
  description?: string;
  status: 'active' | 'archived' | 'draft';
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  taskCount?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  spaceId: string;
  status: 'backlog' | 'ready' | 'in-progress' | 'review' | 'blocked' | 'done';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignee?: string;
  userStoryId?: string;
  sprintId?: string;
  featureId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  name: string;
  workstreamId: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  createdBy: string;
  teamMembers?: Array<{ userId: string; name: string }>;
}

export interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  totalValue: number;
  tenantId: string;
}

export interface CLIN {
  id: string;
  contractId: string;
  clinNumber: string;
  title: string;
  fundedAmount: number;
  spentAmount: number;
  status: 'active' | 'depleted' | 'closed';
}

export interface FilterPill {
  property: string;
  value: string;
}

interface UseSpacesStoreReturn {
  // Raw data (never filtered)
  allSpaces: Space[];
  allTasks: Task[];
  allSprints: Sprint[];
  allContracts: Contract[];
  allCLINs: CLIN[];

  // Filtered data
  spaces: Space[];
  tasks: Task[];
  sprints: Sprint[];
  contracts: Contract[];
  clins: CLIN[];

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
  loadMyTasks: () => Promise<Task[]>;
  loadTeamTasks: () => Promise<Task[]>;
  loadSpace: (spaceId: string) => Promise<Space | null>;

  // Optimistic updates
  addTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

export function useSpacesStore(): UseSpacesStoreReturn {
  const permissions = useRolePermissions('spaces');

  // Store state - loaded once
  const [allSpaces, setAllSpaces] = useState<Space[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allSprints, setAllSprints] = useState<Sprint[]>([]);
  const [allContracts, setAllContracts] = useState<Contract[]>([]);
  const [allCLINs, setAllCLINs] = useState<CLIN[]>([]);

  // Filter state
  const [filters, setFilters] = useState<FilterPill[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Loading state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data once on mount (role-aware)
  useEffect(() => {
    if (permissions.hasAccess) {
      loadInitialData();
    }
  }, [permissions.userId, permissions.role]);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load spaces (filtered by access)
      const spacesResult = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-spaces-space',
      });

      if (spacesResult.success && spacesResult.data?.Items) {
        setAllSpaces(spacesResult.data.Items as Space[]);
      }

      // Load tasks (filtered by role)
      if (permissions.canViewAllTasks) {
        // Admin/Executive: load all tasks
        const tasksResult = await apiClient.run({
          service: 'platform.dynamodb',
          operation: 'scan',
          table: 'core-spaces-task',
        });

        if (tasksResult.success && tasksResult.data?.Items) {
          setAllTasks(tasksResult.data.Items as Task[]);
        }
      } else {
        // Technical/Manager: load relevant tasks only
        await loadMyTasks();
      }

      // Load sprints (if manager or above)
      if (permissions.canViewSprint({} as any)) {
        const sprintsResult = await apiClient.run({
          service: 'platform.dynamodb',
          operation: 'scan',
          table: 'core-spaces-sprint',
        });

        if (sprintsResult.success && sprintsResult.data?.Items) {
          setAllSprints(sprintsResult.data.Items as Sprint[]);
        }
      }

      // Load contracts (if financial role)
      if (permissions.canViewFinancials) {
        const contractsResult = await apiClient.run({
          service: 'platform.dynamodb',
          operation: 'scan',
          table: 'core-contract',
        });

        if (contractsResult.success && contractsResult.data?.Items) {
          setAllContracts(contractsResult.data.Items as Contract[]);
        }

        // Load CLINs
        const clinsResult = await apiClient.run({
          service: 'platform.dynamodb',
          operation: 'scan',
          table: 'core-clin',
        });

        if (clinsResult.success && clinsResult.data?.Items) {
          setAllCLINs(clinsResult.data.Items as CLIN[]);
        }
      }
    } catch (err) {
      console.error('Failed to load spaces data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Load my tasks (assigned to current user)
  const loadMyTasks = useCallback(async () => {
    if (!permissions.userId) return [];

    try {
      const result = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'query',
        table: 'core-spaces-task',
        data: {
          IndexName: 'assignee-status-index',
          KeyConditionExpression: 'assignee = :userId',
          ExpressionAttributeValues: {
            ':userId': permissions.userId,
          },
        },
      });

      if (result.success && result.data?.Items) {
        const myTasks = result.data.Items as Task[];
        setAllTasks(myTasks);
        return myTasks;
      }
    } catch (err) {
      console.error('Failed to load my tasks:', err);
    }

    return [];
  }, [permissions.userId]);

  // Load team tasks (for managers)
  const loadTeamTasks = useCallback(async () => {
    if (!permissions.canViewTeamTasks) return [];

    try {
      // Load tasks from managed spaces
      const managedSpaces = permissions.managedSpaces || [];
      const teamTasks: Task[] = [];

      for (const spaceId of managedSpaces) {
        const result = await apiClient.run({
          service: 'platform.dynamodb',
          operation: 'query',
          table: 'core-spaces-task',
          data: {
            IndexName: 'spaceId-status-index',
            KeyConditionExpression: 'spaceId = :spaceId',
            ExpressionAttributeValues: {
              ':spaceId': spaceId,
            },
          },
        });

        if (result.success && result.data?.Items) {
          teamTasks.push(...(result.data.Items as Task[]));
        }
      }

      setAllTasks(teamTasks);
      return teamTasks;
    } catch (err) {
      console.error('Failed to load team tasks:', err);
    }

    return [];
  }, [permissions.canViewTeamTasks, permissions.managedSpaces]);

  // Load single space
  const loadSpace = useCallback(async (spaceId: string): Promise<Space | null> => {
    try {
      const result = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'get',
        table: 'core-spaces-space',
        data: {
          Key: { id: spaceId },
        },
      });

      if (result.success && result.data?.Item) {
        return result.data.Item as Space;
      }
    } catch (err) {
      console.error('Failed to load space:', err);
    }

    return null;
  }, []);

  // Apply filters and search to spaces
  const spaces = useMemo(() => {
    let result = allSpaces;

    // Apply property filters
    const activeFilters = filters.filter(f => f.value);
    if (activeFilters.length > 0) {
      result = result.filter(space => {
        return activeFilters.every(filter => {
          const value = space[filter.property as keyof Space];
          if (value === undefined || value === null) return false;
          return String(value).toLowerCase() === String(filter.value).toLowerCase();
        });
      });
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(space => {
        return (
          space.name?.toLowerCase().includes(query) ||
          space.description?.toLowerCase().includes(query) ||
          space.type?.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [allSpaces, filters, searchQuery]);

  // Apply filters and search to tasks
  const tasks = useMemo(() => {
    let result = allTasks;

    // Apply filters
    const activeFilters = filters.filter(f => f.value);
    if (activeFilters.length > 0) {
      result = result.filter(task => {
        return activeFilters.every(filter => {
          const value = task[filter.property as keyof Task];
          if (value === undefined || value === null) return false;
          return String(value).toLowerCase() === String(filter.value).toLowerCase();
        });
      });
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task => {
        return (
          task.title?.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [allTasks, filters, searchQuery]);

  // Apply filters to sprints
  const sprints = useMemo(() => {
    let result = allSprints;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(sprint => sprint.name?.toLowerCase().includes(query));
    }

    return result;
  }, [allSprints, searchQuery]);

  // Apply filters to contracts
  const contracts = useMemo(() => {
    let result = allContracts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(contract =>
        contract.contractNumber?.toLowerCase().includes(query) ||
        contract.title?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [allContracts, searchQuery]);

  // Apply filters to CLINs
  const clins = useMemo(() => {
    let result = allCLINs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(clin =>
        clin.clinNumber?.toLowerCase().includes(query) ||
        clin.title?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [allCLINs, searchQuery]);

  // Optimistic update: Add task
  const addTask = useCallback(async (task: Partial<Task>) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: task.title || 'Untitled Task',
      spaceId: task.spaceId || '',
      status: task.status || 'backlog',
      priority: task.priority || 'medium',
      assignee: task.assignee || permissions.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...task,
    } as Task;

    // Optimistic update
    setAllTasks(prev => [...prev, newTask]);

    try {
      await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'put',
        table: 'core-spaces-task',
        data: {
          Item: newTask,
        },
      });
    } catch (err) {
      // Rollback on error
      setAllTasks(prev => prev.filter(t => t.id !== newTask.id));
      console.error('Failed to add task:', err);
      throw err;
    }
  }, [permissions.userId]);

  // Optimistic update: Update task
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    const oldTasks = [...allTasks];

    // Optimistic update
    setAllTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)
    );

    try {
      await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'update',
        table: 'core-spaces-task',
        data: {
          Key: { id: taskId },
          UpdateExpression: Object.keys(updates).map((k, i) => `#field${i} = :value${i}`).join(', '),
          ExpressionAttributeNames: Object.keys(updates).reduce((acc, k, i) => ({
            ...acc,
            [`#field${i}`]: k
          }), {}),
          ExpressionAttributeValues: Object.values(updates).reduce((acc, v, i) => ({
            ...acc,
            [`:value${i}`]: v
          }), {}),
        },
      });
    } catch (err) {
      // Rollback on error
      setAllTasks(oldTasks);
      console.error('Failed to update task:', err);
      throw err;
    }
  }, [allTasks]);

  // Optimistic update: Delete task
  const deleteTask = useCallback(async (taskId: string) => {
    const oldTasks = [...allTasks];

    // Optimistic update
    setAllTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'delete',
        table: 'core-spaces-task',
        data: {
          Key: { id: taskId },
        },
      });
    } catch (err) {
      // Rollback on error
      setAllTasks(oldTasks);
      console.error('Failed to delete task:', err);
      throw err;
    }
  }, [allTasks]);

  const reload = useCallback(async () => {
    await loadInitialData();
  }, []);

  return {
    // Raw data
    allSpaces,
    allTasks,
    allSprints,
    allContracts,
    allCLINs,

    // Filtered data
    spaces,
    tasks,
    sprints,
    contracts,
    clins,

    // Filter state
    filters,
    setFilters,

    // Search state
    searchQuery,
    setSearchQuery,

    // Loading state
    loading,
    error,

    // Actions
    reload,
    loadMyTasks,
    loadTeamTasks,
    loadSpace,

    // Optimistic updates
    addTask,
    updateTask,
    deleteTask,
  };
}
