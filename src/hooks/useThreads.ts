import { useState, useEffect, useCallback } from "react";
import { consoleApiClient } from "@/app/console/services/api-client";
import type { ChatThread, ChatAgentRef } from "@/types/chat";

interface UseThreadsResult {
  threads: ChatThread[];
  agents: ChatAgentRef[];
  defaultAgentId: string | null;
  isLoading: boolean;
  error: string | null;
  refreshThreads: () => Promise<void>;
  createThread: (agentId?: string) => Promise<string | null>;
  renameThread: (threadId: string, title: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  pinThread: (threadId: string, pinned: boolean) => Promise<void>;
}

export function useThreads(): UseThreadsResult {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [agents, setAgents] = useState<ChatAgentRef[]>([]);
  const [defaultAgentId, setDefaultAgentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load agents and threads in parallel
      const [agentsResponse, threadsResponse] = await Promise.all([
        consoleApiClient.getAgents(),
        consoleApiClient.getThreads(),
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
      const response = await consoleApiClient.getThreads();
      setThreads(response.threads);
    } catch (err) {
      console.error("Failed to refresh threads:", err);
      setError(
        err instanceof Error ? err.message : "Failed to refresh threads"
      );
    }
  }, []);

  const createThread = useCallback(
    async (agentId?: string): Promise<string | null> => {
      try {
        const targetAgentId = agentId || defaultAgentId;
        if (!targetAgentId) {
          throw new Error("No agent available for thread creation");
        }

        const newThread = await consoleApiClient.createThread({
          agentId: targetAgentId,
        });

        // Add to local state
        setThreads((prev) => [newThread, ...prev]);

        return newThread.id;
      } catch (err) {
        console.error("Failed to create thread:", err);
        setError(
          err instanceof Error ? err.message : "Failed to create thread"
        );
        return null;
      }
    },
    [defaultAgentId]
  );

  const renameThread = useCallback(async (threadId: string, title: string) => {
    try {
      await consoleApiClient.updateThreadTitle({ threadId, title });

      // Update local state
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === threadId
            ? { ...thread, title, updatedAt: new Date().toISOString() }
            : thread
        )
      );
    } catch (err) {
      console.error("Failed to rename thread:", err);
      setError(err instanceof Error ? err.message : "Failed to rename thread");
    }
  }, []);

  const deleteThread = useCallback(async (threadId: string) => {
    try {
      await consoleApiClient.deleteThread(threadId);

      // Remove from local state
      setThreads((prev) => prev.filter((thread) => thread.id !== threadId));
    } catch (err) {
      console.error("Failed to delete thread:", err);
      setError(err instanceof Error ? err.message : "Failed to delete thread");
    }
  }, []);

  const pinThread = useCallback(async (threadId: string, pinned: boolean) => {
    try {
      await consoleApiClient.pinThread(threadId, pinned);

      // Update local state
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === threadId
            ? { ...thread, pinned, updatedAt: new Date().toISOString() }
            : thread
        )
      );
    } catch (err) {
      console.error("Failed to pin/unpin thread:", err);
      setError(
        err instanceof Error ? err.message : "Failed to pin/unpin thread"
      );
    }
  }, []);

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
