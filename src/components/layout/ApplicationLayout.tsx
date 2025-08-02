"use client";

import { ReactNode, useState } from "react";
import { SlidingChatLayout } from "./SlidingChatLayout";
import { TopNavigation } from "./TopNavigation";

interface ApplicationLayoutProps {
  children: ReactNode;
  applicationId?: string;
  applicationName?: string;
  agentId?: string;
  showChat?: boolean;
  chatWelcomeMessage?: string;
  chatPlaceholder?: string;
  className?: string;
  chatWidth?: number;
  onChatReady?: (submitMessage: (message: string) => void) => void;
}

export function ApplicationLayout({
  children,
  applicationId,
  applicationName = "AI Assistant",
  agentId,
  showChat = true,
  chatWelcomeMessage,
  chatPlaceholder = "Type your message...",
  className = "",
  chatWidth = 400,
  onChatReady,
}: ApplicationLayoutProps) {
  const [showApplicationMenu, setShowApplicationMenu] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [showGlobalSearch, setShowGlobalSearch] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation */}
      <TopNavigation
        currentApplication={{
          id: applicationId || "console",
          name: applicationName,
        }}
        onSearchFocus={() => setShowGlobalSearch(true)}
        onApplicationMenuClick={() => setShowApplicationMenu(true)}
      />

      {/* Main Content with Sliding Chat */}
      <div className="flex-1 overflow-hidden">
        <SlidingChatLayout
          applicationId={applicationId}
          applicationName={applicationName}
          agentId={agentId}
          showChat={showChat}
          chatWelcomeMessage={chatWelcomeMessage}
          chatPlaceholder={chatPlaceholder}
          className={className}
          chatWidth={chatWidth}
          onChatReady={onChatReady}
        >
          {children}
        </SlidingChatLayout>
      </div>
    </div>
  );
}
