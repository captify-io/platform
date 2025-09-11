/**
 * Chat Layout Component
 * Complete chat interface with provider for standalone use
 */

"use client";

import React from "react";
import { AgentProvider } from "./index";
import { ChatPanel } from "./chat";
import type { UserState } from "../../types";
// Define AgentSettings type locally if the module does not exist
export type AgentSettings = {
  model: string;
  provider: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
};

export interface ChatLayoutProps {
  className?: string;
  userState?: UserState;
  initialSettings?: Partial<AgentSettings>;
}

export function ChatLayout({
  className,
  userState,
  initialSettings = {},
}: ChatLayoutProps) {
  const defaultSettings = {
    model: "gpt-4o",
    provider: "openai" as const,
    temperature: 0.7,
    maxTokens: 4000,
    systemPrompt:
      "You are a helpful AI assistant for the Captify platform. You can help users with questions about their projects, data analysis, strategic planning, and general business operations.",
    ...initialSettings,
  };

  return (
    <AgentProvider userState={userState} initialSettings={defaultSettings}>
      <div className="h-full w-full">
        <ChatPanel className={className} />
      </div>
    </AgentProvider>
  );
}
