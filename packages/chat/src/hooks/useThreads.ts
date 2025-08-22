import { useState, useEffect, useCallback } from "react";

// Generic interfaces that can be implemented by different platforms
export interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  agentId?: string;
  messageCount?: number;
}

export interface ChatAgent {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface ChatApiClient {
  getThreads(): Promise<{ threads: ChatThread[] }>;
  getAgents(): Promise<{ agents: ChatAgent[]; defaultAgentId: string | null }>;
  createThread(agentId?: string): Promise<{ threadId: string }>;
  renameThread(threadId: string, title: string): Promise<void>;
  deleteThread(threadId: string): Promise<void>;
  pinThread(threadId: string, pinned: boolean): Promise<void>;
}

interface UseThreadsConfig {
  apiClient: ChatApiClient;
  autoLoad?: boolean;
}

interface UseThreadsResult {
  threads: ChatThread[];
  agents: ChatAgent[];
  defaultAgentId: string | null;
  isLoading: boolean;
  error: string | null;
  refreshThreads: () => Promise<void>;
  createThread: (agentId?: string) => Promise<string | null>;
  renameThread: (threadId: string, title: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  pinThread: (threadId: string, pinned: boolean) => Promise<void>;
}

export function useThreads({
  apiClient,
  autoLoad = true,
}: UseThreadsConfig): UseThreadsResult {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [agents, setAgents] = useState<ChatAgent[]>([]);
  const [defaultAgentId, setDefaultAgentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    if (autoLoad) {
      loadInitialData();
    }
  }, [autoLoad]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load agents and threads in parallel
      const [agentsResponse, threadsResponse] = await Promise.all([
        apiClient.getAgents(),
        apiClient.getThreads(),
      ]);

      setAgents(agentsResponse.agents);
      setDefaultAgentId(agentsResponse.defaultAgentId);
      setThreads(threadsResponse.threads);
    } catch (err) {
      console.error("Failed to load initial data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshThreads = useCallback(async () => {
    try {
      setError(null);
      const response = await apiClient.getThreads();
      setThreads(response.threads);
    } catch (err) {
      console.error("Failed to refresh threads:", err);
      setError(
        err instanceof Error ? err.message : "Failed to refresh threads"
      );
    }
  }, [apiClient]);

  const createThread = useCallback(
    async (agentId?: string): Promise<string | null> => {
      try {
        setError(null);
        const response = await apiClient.createThread(agentId);
        await refreshThreads(); // Refresh the list
        return response.threadId;
      } catch (err) {
        console.error("Failed to create thread:", err);
        setError(
          err instanceof Error ? err.message : "Failed to create thread"
        );
        return null;
      }
    },
    [apiClient, refreshThreads]
  );

  const renameThread = useCallback(
    async (threadId: string, title: string): Promise<void> => {
      try {
        setError(null);
        await apiClient.renameThread(threadId, title);

        // Update the thread in local state
        setThreads((prevThreads) =>
          prevThreads.map((thread) =>
            thread.id === threadId ? { ...thread, title } : thread
          )
        );
      } catch (err) {
        console.error("Failed to rename thread:", err);
        setError(
          err instanceof Error ? err.message : "Failed to rename thread"
        );
      }
    },
    [apiClient]
  );

  const deleteThread = useCallback(
    async (threadId: string): Promise<void> => {
      try {
        setError(null);
        await apiClient.deleteThread(threadId);

        // Remove the thread from local state
        setThreads((prevThreads) =>
          prevThreads.filter((thread) => thread.id !== threadId)
        );
      } catch (err) {
        console.error("Failed to delete thread:", err);
        setError(
          err instanceof Error ? err.message : "Failed to delete thread"
        );
      }
    },
    [apiClient]
  );

  const pinThread = useCallback(
    async (threadId: string, pinned: boolean): Promise<void> => {
      try {
        setError(null);
        await apiClient.pinThread(threadId, pinned);

        // Update the thread in local state
        setThreads((prevThreads) =>
          prevThreads.map((thread) =>
            thread.id === threadId ? { ...thread, isPinned: pinned } : thread
          )
        );
      } catch (err) {
        console.error("Failed to pin/unpin thread:", err);
        setError(
          err instanceof Error ? err.message : "Failed to update thread"
        );
      }
    },
    [apiClient]
  );

  return {
    threads,
    agents,
    defaultAgentId,
    isLoading,
    error,
    refreshThreads,
    createThread,
    renameThread,
    deleteThread,
    pinThread,
  };
}
