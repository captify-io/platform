/**
 * Agent Provider Component
 * Main provider that controls the three panels: threads, chat, helper
 */

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { UIMessage } from "ai";
import type { AgentThread, AgentSettings, AgentMessage } from "../types";
import type { UserState } from "../../types";
import { useApi } from "../../hooks";

// Agent Context Types
export interface AgentContextType {
  // Thread management
  currentThread: AgentThread | null;
  threads: AgentThread[];
  isLoadingThreads: boolean;
  threadsError: string | null;

  // Chat management
  messages: AgentMessage[];
  isStreaming: boolean;
  streamingMessage: string;

  // Settings and configuration
  settings: AgentSettings;
  userState: UserState | null;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
    limit: number;
  };

  // Actions
  createThread: (title?: string, initialMessage?: string) => Promise<void>;
  selectThread: (threadId: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  updateThreadTitle: (threadId: string, title: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  streamMessage: (content: string) => Promise<void>;
  updateSettings: (newSettings: Partial<AgentSettings>) => Promise<void>;
  refreshThreads: () => Promise<void>;
  clearCurrentThread: () => void;
}

const AgentContext = createContext<AgentContextType | null>(null);

export interface AgentProviderProps {
  children: React.ReactNode;
  userState?: UserState;
  initialSettings?: Partial<AgentSettings>;
}

export function AgentProvider({
  children,
  userState,
  initialSettings = {},
}: AgentProviderProps) {
  // State management
  const [currentThread, setCurrentThread] = useState<AgentThread | null>(null);
  const [threads, setThreads] = useState<AgentThread[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [threadsError, setThreadsError] = useState<string | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");

  // Default settings
  const [settings, setSettings] = useState<AgentSettings>({
    model: "gpt-4o",
    provider: "openai",
    temperature: 0.7,
    maxTokens: 4000,
    systemPrompt: "You are a helpful AI assistant.",
    tools: [],
    ...initialSettings,
  });

  // Token usage tracking
  const [tokenUsage, setTokenUsage] = useState({
    input: 0,
    output: 0,
    total: 0,
    limit: 100000, // Default limit
  });

  // API hooks
  const { execute: executeAgent } = useApi(
    async (client, operation: string, data?: any) => {
      return client.run({
        service: "agent",
        operation,
        app: "core",
        data,
      });
    }
  );

  // Load threads on mount
  useEffect(() => {
    refreshThreads();
    loadTokenUsage();
  }, []);

  // Actions
  const createThread = useCallback(
    async (title?: string, initialMessage?: string) => {
      try {
        setIsLoadingThreads(true);
        const result = await executeAgent("createThread", {
          title: title || "New Chat",
          model: settings.model,
          provider: settings.provider,
          settings,
        });

        if (result && result.success && result.data) {
          const newThread = result.data as AgentThread;
          setThreads((prev) => [newThread, ...prev]);
          setCurrentThread(newThread);
          setMessages([]);

          // Send initial message if provided
          if (initialMessage) {
            await sendMessage(initialMessage);
          }
        } else {
          console.error("Failed to create thread:", result);
          setThreadsError("Failed to create new chat");
        }
      } catch (error) {
        console.error("Failed to create thread:", error);
        setThreadsError("Failed to create new chat");
      } finally {
        setIsLoadingThreads(false);
      }
    },
    [settings, executeAgent]
  );

  const selectThread = useCallback(
    async (threadId: string) => {
      try {
        const result = await executeAgent("getThread", { threadId });

        if (result && result.success && result.data) {
          const thread = result.data as AgentThread;
          setCurrentThread(thread);
          setMessages(thread.messages as AgentMessage[]);
          setStreamingMessage("");
        } else {
          console.error("Failed to select thread:", result);
          setThreadsError("Failed to load chat history");
        }
      } catch (error) {
        console.error("Failed to select thread:", error);
        setThreadsError("Failed to load chat history");
      }
    },
    [executeAgent]
  );

  const deleteThread = useCallback(
    async (threadId: string) => {
      try {
        const result = await executeAgent("deleteThread", { threadId });

        if (result && result.success) {
          setThreads((prev) => prev.filter((t) => t.id !== threadId));

          // Clear current thread if it was deleted
          if (currentThread?.id === threadId) {
            setCurrentThread(null);
            setMessages([]);
          }
        }
      } catch (error) {
        console.error("Failed to delete thread:", error);
        setThreadsError("Failed to delete chat");
      }
    },
    [currentThread, executeAgent]
  );

  const updateThreadTitle = useCallback(
    async (threadId: string, title: string) => {
      try {
        const result = await executeAgent("updateThread", {
          threadId,
          updates: { title },
        });

        if (result && result.success) {
          setThreads((prev) =>
            prev.map((t) => (t.id === threadId ? { ...t, title } : t))
          );

          if (currentThread?.id === threadId) {
            setCurrentThread((prev: AgentThread | null) => (prev ? { ...prev, title } : null));
          }
        } else {
          console.error("Failed to update thread title:", result);
        }
      } catch (error) {
        console.error("Failed to update thread title:", error);
      }
    },
    [currentThread, executeAgent]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentThread) {
        await createThread("New Chat", content);
        return;
      }

      try {
        setIsStreaming(true);
        const result = await executeAgent("sendMessage", {
          threadId: currentThread.id,
          message: content,
          settings,
        });

        if (result && result.success && result.data) {
          const { thread, tokenUsage: newTokenUsage } = result.data;
          setMessages(thread.messages);
          setTokenUsage((prev) => ({
            ...prev,
            input: prev.input + newTokenUsage.input,
            output: prev.output + newTokenUsage.output,
            total: prev.total + newTokenUsage.total,
          }));

          // Update thread in list
          setThreads((prev) =>
            prev.map((t) => (t.id === currentThread.id ? thread : t))
          );
          setCurrentThread(thread);
        }
      } catch (error) {
        console.error("Failed to send message:", error);
      } finally {
        setIsStreaming(false);
      }
    },
    [currentThread, settings, executeAgent, createThread]
  );

  const streamMessage = useCallback(
    async (content: string) => {
      if (!currentThread) {
        await createThread("New Chat", content);
        return;
      }

      try {
        setIsStreaming(true);
        setStreamingMessage("");

        // Add user message immediately
        const userMessage: AgentMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          threadId: currentThread.id,
          role: "user",
          content,
        };

        setMessages((prev) => [...prev, userMessage]);

        // Use fetch with streaming for real-time response
        const response = await fetch("/api/captify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-app": "core",
          },
          body: JSON.stringify({
            service: "agent",
            operation: "streamMessage",
            data: {
              threadId: currentThread.id,
              message: content,
              settings,
            },
          }),
        });

        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let accumulatedText = "";

          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.content) {
                    accumulatedText += data.content;
                    setStreamingMessage(accumulatedText);
                  }
                } catch (e) {
                  // Ignore parsing errors
                }
              }
            }
          }

          // Add final assistant message
          const assistantMessage: AgentMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            threadId: currentThread.id,
            role: "assistant",
            content: accumulatedText,
          };

          setMessages((prev) => [...prev, assistantMessage]);
          setStreamingMessage("");

          // Update thread in backend
          await executeAgent("updateThread", {
            threadId: currentThread.id,
            updates: {
              messages: [...messages, userMessage, assistantMessage],
            },
          });
        }
      } catch (error) {
        console.error("Failed to stream message:", error);
      } finally {
        setIsStreaming(false);
        setStreamingMessage("");
      }
    },
    [currentThread, settings, messages, executeAgent, createThread]
  );

  const updateSettings = useCallback(
    async (newSettings: Partial<AgentSettings>) => {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      // Save to user preferences if userState is available
      if (userState) {
        try {
          // Update user preferences in backend
          await executeAgent("updateSettings", {
            userId: userState.userId,
            settings: updatedSettings,
          });
        } catch (error) {
          console.error("Failed to save settings:", error);
        }
      }
    },
    [settings, userState, executeAgent]
  );

  const refreshThreads = useCallback(async () => {
    try {
      setIsLoadingThreads(true);
      setThreadsError(null);

      console.log("[AgentProvider] Calling executeAgent with getThreads...");
      const result = await executeAgent("getThreads", { limit: 50 });
      console.log("[AgentProvider] executeAgent result:", result);

      if (Array.isArray(result)) {
        // useApi returns response.data directly, which is an array for getThreads
        console.log("[AgentProvider] Successfully loaded threads:", result);
        setThreads(result as AgentThread[]);
      } else if (result === null) {
        // API call failed, useApi returned null
        console.error(
          "[AgentProvider] API call failed - executeAgent returned null"
        );
        setThreadsError("Failed to load chat history");
      } else {
        console.error(
          "[AgentProvider] Unexpected result type:",
          typeof result,
          result
        );
        setThreadsError("Failed to load chat history");
      }
    } catch (error) {
      console.error("[AgentProvider] Exception during refresh threads:", error);
      setThreadsError("Failed to load chat history");
    } finally {
      setIsLoadingThreads(false);
    }
  }, [executeAgent]);

  const loadTokenUsage = useCallback(async () => {
    try {
      const result = await executeAgent("getTokenUsage", { period: "month" });

      if (result && result.usage) {
        // useApi returns response.data directly, which contains { period, usage, threadCount, startDate }
        const usage = result.usage;
        setTokenUsage((prev) => ({
          ...prev,
          input: usage.input || 0,
          output: usage.output || 0,
          total: usage.total || 0,
        }));
      } else {
        console.warn("Token usage data not available:", result);
      }
    } catch (error) {
      console.error("Failed to load token usage:", error);
    }
  }, [executeAgent]);

  const clearCurrentThread = useCallback(() => {
    setCurrentThread(null);
    setMessages([]);
    setStreamingMessage("");
  }, []);

  const contextValue: AgentContextType = {
    // State
    currentThread,
    threads,
    isLoadingThreads,
    threadsError,
    messages,
    isStreaming,
    streamingMessage,
    settings,
    userState: userState || null,
    tokenUsage,

    // Actions
    createThread,
    selectThread,
    deleteThread,
    updateThreadTitle,
    sendMessage,
    streamMessage,
    updateSettings,
    refreshThreads,
    clearCurrentThread,
  };

  return (
    <AgentContext.Provider value={contextValue}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error("useAgent must be used within an AgentProvider");
  }
  return context;
}

export { AgentContext };
