"use client";

import React from "react";
import { useChat, type Message as AiMessage } from "ai/react";
import { Button } from "@/components/ui/button";
import { MessageSquare, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  providers as defaultProviders,
  type Provider,
} from "@/config/providers";
import { estimateTokens } from "@/lib/tokens";
import { useApplication } from "@/context/ApplicationContext";

// Component imports
import { ChatHeader } from "./ChatHeader";
import { ChatContent } from "./ChatContent";
import { ChatFooter } from "./ChatFooter";
import { ChatSettings } from "./ChatSettings";
import { ChatHistory, type ConversationSummary } from "./ChatHistory";

export interface ChatInterfaceProps {
  className?: string;
  applicationId?: string;
  applicationName?: string;
  welcomeMessage?: string;
  placeholder?: string;
  isCollapsible?: boolean;
  isSliding?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  onChatReady?: (submitMessage: (message: string) => void) => void;
  providers?: Provider[];
  showSessionControls?: boolean; // Control whether to show "New Session" and "Conversations" buttons
  agentId?: string; // Override agent ID
  agentAliasId?: string; // Override agent alias ID
  threadId?: string; // Thread ID for the current conversation
}

export type ChatMessage = AiMessage & { createdAt?: string };

export function ChatInterface({
  className,
  applicationName = "AI Assistant",
  welcomeMessage,
  placeholder = "Type your message...",
  isCollapsible = true,
  isSliding = false,
  isOpen = true,
  onToggle,
  onChatReady,
  providers = defaultProviders,
  showSessionControls = true,
  agentId,
  agentAliasId,
  threadId,
}: ChatInterfaceProps) {
  const { applicationInfo } = useApplication();

  // Get agent config from props first, then application context, then environment fallback
  const agentConfig = {
    agentId:
      agentId ||
      applicationInfo?.agentId ||
      process.env.NEXT_PUBLIC_BEDROCK_AGENT_ID,
    agentAliasId:
      agentAliasId ||
      applicationInfo?.agentAliasId ||
      process.env.NEXT_PUBLIC_AWS_BEDROCK_AGENT_ALIAS_ID,
  };

  const [isMinimized, setIsMinimized] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = window.localStorage.getItem("chat_isMinimized");
    return saved ? saved === "true" : false;
  });

  const [traceEvents, setTraceEvents] = React.useState<
    Record<string, unknown>[]
  >([]);
  const seenTraceIdsRef = React.useRef<Set<string>>(new Set());
  const [selectedProvider, setSelectedProvider] = React.useState<string>(() => {
    if (typeof window === "undefined")
      return providers[0]?.value ?? "bedrock-agent";
    return (
      window.localStorage.getItem("chat_selectedProvider") ||
      providers[0]?.value ||
      "bedrock-agent"
    );
  });

  const [showSettings, setShowSettings] = React.useState(false);
  const [sessionId, setSessionId] = React.useState(() => {
    // Use threadId as sessionId if available, otherwise generate a new one
    return (
      threadId ||
      `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    );
  });

  // Update sessionId when threadId changes
  React.useEffect(() => {
    if (threadId) {
      setSessionId(threadId);
    } else {
      setSessionId(
        `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      );
    }
  }, [threadId]);

  const [showHistory, setShowHistory] = React.useState(false);
  const [history, setHistory] = React.useState<ConversationSummary[]>([]);

  // live rationale text per assistant turn
  const [reasoning, setReasoning] = React.useState<string>("");

  React.useEffect(() => {
    try {
      window.localStorage.setItem("chat_isMinimized", String(isMinimized));
    } catch {}
  }, [isMinimized]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem("chat_selectedProvider", selectedProvider);
    } catch {}
  }, [selectedProvider]);

  const currentProvider = React.useMemo(
    () => providers.find((p) => p.value === selectedProvider),
    [providers, selectedProvider]
  );

  const apiEndpoint =
    currentProvider?.type === "bedrock-agent"
      ? "/api/chat/bedrock-agent"
      : "/api/chat/llm";

  const {
    messages,
    input,
    setInput,
    isLoading,
    error,
    stop,
    append,
    setMessages,
  } = useChat({
    api: apiEndpoint,
    body: {
      sessionId: threadId || sessionId, // Use threadId if available, fallback to sessionId
      ...(currentProvider?.type === "bedrock-agent"
        ? {
            agentId:
              agentConfig.agentId || process.env.NEXT_PUBLIC_BEDROCK_AGENT_ID,
            agentAliasId:
              agentConfig.agentAliasId ||
              process.env.NEXT_PUBLIC_AWS_BEDROCK_AGENT_ALIAS_ID,
          }
        : { provider: selectedProvider }),
    },
    onError: (error) => {
      console.error("💥 Chat error occurred:", error);
      console.error("Error details:", {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        cause: error?.cause,
      });
    },
    onFinish: async () => {
      // Handle message finish
      try {
        const firstUser = messages.find((m) => m.role === "user");
        if (firstUser && threadId) {
          await fetch("/api/chat/title", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              threadId,
              firstMessage: firstUser.content,
              applicationId: "console",
            }),
          });
        }
      } catch (e) {
        console.warn("Failed to create/save title", e);
      }
    },
    onResponse: async (res) => {
      const clone = res.clone();
      const reader = clone.body?.getReader();
      if (!reader) return;

      // reset per assistant turn
      setReasoning("");
      setTraceEvents([]);
      seenTraceIdsRef.current = new Set();

      const decoder = new TextDecoder();
      let buf = "";

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          // Parse trace markers
          {
            const re = /<!--TRACE:([A-Za-z0-9+/=]+)-->/g;
            for (let m; (m = re.exec(buf)); ) {
              try {
                const b64 = m[1];
                if (b64.length > 400000) continue;
                const text =
                  typeof window === "undefined"
                    ? Buffer.from(b64, "base64").toString("utf-8")
                    : atob(b64);
                setReasoning(text);
              } catch {
                /* ignore */
              }
            }
          }

          // Parse trace JSON
          {
            const re = /<!--TRACEJSON:([A-Za-z0-9+/=]+)-->/g;
            for (let m; (m = re.exec(buf)); ) {
              try {
                const b64 = m[1];
                if (b64.length > 1200000) continue;
                const jsonText =
                  typeof window === "undefined"
                    ? Buffer.from(b64, "base64").toString("utf-8")
                    : atob(b64);
                const obj = JSON.parse(jsonText);

                const id =
                  obj?.traceId ??
                  obj?.trace?.traceId ??
                  obj?.orchestrationTrace?.traceId ??
                  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

                if (!seenTraceIdsRef.current.has(id)) {
                  seenTraceIdsRef.current.add(id);
                  setTraceEvents((prev) => [...prev, obj.trace ?? obj]);
                }
              } catch {
                /* ignore partials */
              }
            }
          }

          if (buf.length > 20000) buf = buf.slice(-12000);
        }
      } catch {
        // never break the UI due to streaming parse errors
      }
    },
  });

  const totalTokens = React.useMemo(() => estimateTokens(messages), [messages]);

  // Handlers
  const handleNewSession = async () => {
    const newSessionId = `session-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 11)}`;
    setSessionId(newSessionId);
    setMessages([]);
    setReasoning("");
    setTraceEvents([]);
    seenTraceIdsRef.current = new Set();
    try {
      await fetch("/api/chat/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: newSessionId }),
      });
    } catch (err) {
      console.error("Failed to reset chat session:", err);
    }
  };

  const handleCustomSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    await append({
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    } as ChatMessage);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleCustomSubmit();
    }
  };

  // History handlers
  const loadHistory = async () => {
    try {
      const res = await fetch("/api/chat/history", { method: "GET" });
      const data = (await res.json()) as { items: ConversationSummary[] };
      setHistory(data.items || []);
    } catch (e) {
      console.error("Failed to load history", e);
    }
  };

  const openHistory = async () => {
    await loadHistory();
    setShowHistory(true);
  };

  const handleResumeConversation = async (item: ConversationSummary) => {
    try {
      const res = await fetch(
        `/api/chat/history/${encodeURIComponent(item.id)}`
      );
      const data = (await res.json()) as {
        sessionId: string;
        messages: ChatMessage[];
      };
      setSessionId(data.sessionId);
      setMessages(data.messages);
      setShowHistory(false);
      setReasoning("");
      setTraceEvents([]);
      seenTraceIdsRef.current = new Set();
    } catch (e) {
      console.error("Failed to resume conversation", e);
    }
  };

  // Allow parent to send message programmatically
  const appendRef = React.useRef(append);
  React.useEffect(() => {
    appendRef.current = append;
  }, [append]);
  React.useEffect(() => {
    if (!onChatReady) return;
    const submitMessage = (message: string) => {
      const appender = appendRef.current;
      if (!message || !message.trim() || !appender) return;
      appender({
        role: "user",
        content: message.trim(),
        createdAt: new Date().toISOString(),
      } as ChatMessage);
    };
    onChatReady(submitMessage);
  }, [onChatReady]);

  // Load messages when threadId changes
  React.useEffect(() => {
    if (!threadId) {
      setMessages([]);
      return;
    }

    const loadThreadMessages = async () => {
      try {
        const response = await fetch(`/api/chat/thread/${threadId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.messages) {
            setMessages(data.messages);
          }
        } else {
          console.warn("Failed to load thread messages:", response.statusText);
          setMessages([]);
        }
      } catch (error) {
        console.error("Error loading thread messages:", error);
        setMessages([]);
      }
    };

    loadThreadMessages();
  }, [threadId, setMessages]);

  if (isMinimized && !isSliding) {
    return (
      <div
        className={cn("fixed right-4 top-1/2 -translate-y-1/2 z-50", className)}
      >
        <Button
          onClick={() => setIsMinimized(false)}
          className="w-12 h-12 shadow-lg bg-background border border-border hover:bg-muted"
          size="sm"
        >
          <MessageSquare className="h-5 w-5 text-foreground" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "flex flex-col h-full bg-background border-l border-border transition-all duration-300 ease-in-out",
          isSliding && !isOpen && "translate-x-full",
          className
        )}
      >
        <ChatHeader
          applicationName={applicationName}
          currentProvider={currentProvider}
          isSliding={isSliding}
          isOpen={isOpen}
          isCollapsible={isCollapsible}
          onToggle={onToggle}
          onNewSession={handleNewSession}
          onToggleSettings={() => setShowSettings(!showSettings)}
          onOpenHistory={openHistory}
          onMinimize={() => setIsMinimized(!isMinimized)}
          showSessionControls={showSessionControls}
        />

        {showSettings && (
          <ChatSettings
            selectedProvider={selectedProvider}
            providers={providers}
            currentProvider={currentProvider}
            onProviderChange={setSelectedProvider}
          />
        )}

        <ChatContent
          messages={messages as ChatMessage[]}
          isLoading={isLoading}
          error={error ?? null}
          welcomeMessage={welcomeMessage}
          reasoning={reasoning}
          traceEvents={traceEvents}
        />

        <ChatFooter
          input={input}
          isLoading={isLoading}
          placeholder={placeholder}
          totalTokens={totalTokens}
          onInputChange={setInput}
          onSubmit={handleCustomSubmit}
          onStop={stop}
          onKeyDown={handleKeyDown}
        />
      </div>

      <ChatHistory
        showHistory={showHistory}
        history={history}
        onHistoryChange={setShowHistory}
        onResumeConversation={handleResumeConversation}
      />

      {/* Slide-out handle - appears when chat is hidden */}
      {isSliding && !isOpen && onToggle && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
          <Button
            onClick={onToggle}
            variant="outline"
            size="sm"
            className="h-16 w-6 rounded-r-none rounded-l-md border-r-0 bg-background/95 backdrop-blur-sm shadow-lg hover:bg-muted flex items-center justify-center p-0"
            title="Show Chat"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground rotate-180" />
          </Button>
        </div>
      )}
    </>
  );
}
