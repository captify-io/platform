"use client";

import { useState, useCallback, useEffect } from "react";
import { ChatLayout } from "@/components/layout/ChatLayout";
import { ChatInterface } from "@/components/apps/ChatInterface";
import { ThreadList } from "./ThreadList";
import { ThreadPanelHeader } from "./ThreadPanelHeader";
import { useThreads } from "@/hooks/useThreads";
import { useLayout } from "@/context/LayoutContext";
import { useApplication } from "@/context/ApplicationContext";
import { ContextPanel } from "./ContextPanel";
import { ToolsPanel } from "./ToolsPanel";
import { ReasoningPanel } from "./ReasoningPanel";
import { Settings } from "lucide-react";

interface ConsoleLayoutProps {
  threadId?: string;
  onThreadChange?: (threadId: string) => void;
}

export function ConsoleLayout({
  threadId,
  onThreadChange,
}: ConsoleLayoutProps) {
  const [activeRightTab, setActiveRightTab] = useState<
    "context" | "tools" | "reasoning" | "agent"
  >("context");
  const [searchQuery, setSearchQuery] = useState("");
  const { isMenuVisible, setHasMenu } = useLayout();
  const { applicationData, loading: appLoading } = useApplication();

  const {
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
  } = useThreads();

  // Set hasMenu to true so the MenuToggle shows up in breadcrumbs
  useEffect(() => {
    setHasMenu(true);
    return () => setHasMenu(false); // Cleanup when unmounting
  }, [setHasMenu]);

  const handleThreadSelect = useCallback(
    (newThreadId: string) => {
      onThreadChange?.(newThreadId);
    },
    [onThreadChange]
  );

  const handleThreadCreate = useCallback(async () => {
    const newThreadId = await createThread();
    if (newThreadId) {
      onThreadChange?.(newThreadId);
    }
  }, [createThread, onThreadChange]);

  const handleThreadRename = useCallback(
    async (threadId: string, title: string) => {
      await renameThread(threadId, title);
    },
    [renameThread]
  );

  const handleThreadDelete = useCallback(
    async (threadId: string) => {
      await deleteThread(threadId);
      // If we deleted the active thread, clear the selection
      if (threadId === threadId) {
        onThreadChange?.("");
      }
    },
    [deleteThread, threadId, onThreadChange]
  );

  const handleThreadPin = useCallback(
    async (threadId: string, pinned: boolean) => {
      await pinThread(threadId, pinned);
    },
    [pinThread]
  );

  // Enhanced right panel with real data
  const RightPaneComponent = () => (
    <div className="h-full flex flex-col">
      {/* Tab Navigation - positioned at the very top */}
      <div className="flex space-x-1 bg-muted p-1 rounded m-4 mb-0">
        {(["context", "tools", "reasoning", "agent"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveRightTab(tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeRightTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4 pt-4 overflow-hidden">
        {activeRightTab === "context" && <ContextPanel />}

        {activeRightTab === "tools" && <ToolsPanel />}

        {activeRightTab === "reasoning" && (
          <ReasoningPanel threadId={threadId} />
        )}

        {activeRightTab === "agent" && (
          <div className="h-full flex flex-col space-y-3">
            <h3 className="text-sm font-medium">Agent Settings</h3>
            {defaultAgentId && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  Default Agent:{" "}
                  <span className="font-medium">{defaultAgentId}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Available Agents:{" "}
                  <span className="font-medium">{agents.length}</span>
                </div>
              </div>
            )}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <Settings className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Agent configuration coming soon
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Show error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-destructive">Error loading console</div>
          <div className="text-sm text-muted-foreground">{error}</div>
          <button
            onClick={refreshThreads}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ChatLayout
      leftPanel={
        <ThreadList
          threads={threads}
          activeThreadId={threadId}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onThreadSelect={handleThreadSelect}
          onThreadCreate={handleThreadCreate}
          onThreadRename={handleThreadRename}
          onThreadDelete={handleThreadDelete}
          onThreadPin={handleThreadPin}
        />
      }
      leftPanelHeaderContent={
        <ThreadPanelHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateThread={handleThreadCreate}
        />
      }
      rightPanel={<RightPaneComponent />}
      leftPanelTitle="Conversations"
      showLeftPanel={isMenuVisible}
      showRightPanel={true}
      showLeftPanelToggle={false}
      showRightPanelToggle={false}
    >
      {/* Center Panel - Chat Interface */}
      <ChatInterface
        applicationId="console"
        applicationName="Captify Console"
        welcomeMessage="Hello! I'm Captify, your AI assistant. How can I help you today?"
        placeholder="Type your message..."
        isCollapsible={false}
        isSliding={false}
        isOpen={true}
        showSessionControls={false}
        agentId={applicationData?.agentId}
        agentAliasId={applicationData?.agentAliasId}
        threadId={threadId}
      />
    </ChatLayout>
  );
}
