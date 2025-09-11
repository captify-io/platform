/**
 * Main Agent Component
 * Combines all three panels into a cohesive interface
 */

"use client";

import React from "react";
import { AgentProvider, useAgent } from "./index";
import { ThreadsPanel } from "./threads";
import { ChatPanel } from "./chat";
import { HelperPanel } from "./helper";
import { cn } from "../../lib/utils";
import type { UserState } from "../../types";

export interface AgentProps {
  className?: string;
  userState?: UserState;
  initialSettings?: any;
}

// Inner component that uses the ThreePanelLayout structure
function AgentInterface({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full w-full", className)}>
      {/* Left Panel - Threads */}
      <div className="w-80 flex-shrink-0">
        <ThreadsPanel />
      </div>

      {/* Middle Panel - Chat */}
      <div className="flex-1">
        <ChatPanel />
      </div>

      {/* Right Panel - Helper */}
      <div className="w-80 flex-shrink-0">
        <HelperPanel />
      </div>
    </div>
  );
}

// Main component with provider
export function Agent({ className, userState, initialSettings }: AgentProps) {
  return (
    <AgentProvider userState={userState} initialSettings={initialSettings}>
      <AgentInterface className={className} />
    </AgentProvider>
  );
}

export default Agent;
