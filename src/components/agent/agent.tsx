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

// Inner component with responsive layout
function AgentInterface({ className }: { className?: string }) {
  const [showThreads, setShowThreads] = React.useState(true);
  const [showHelper, setShowHelper] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  // Handle responsive behavior
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Auto-hide panels on mobile
      if (mobile) {
        setShowThreads(false);
        setShowHelper(false);
      } else {
        setShowThreads(true);
        // Keep helper closed by default on desktop too
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className={cn("flex h-full w-full", className)}>
      {/* Left Panel - Threads */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out flex-shrink-0",
          showThreads ? "w-80" : "w-0",
          isMobile &&
            showThreads &&
            "absolute left-0 top-0 z-30 w-80 h-full bg-background border-r shadow-lg"
        )}
      >
        <div
          className={cn(
            "h-full overflow-hidden",
            showThreads ? "opacity-100" : "opacity-0"
          )}
        >
          <ThreadsPanel
            onClose={() => isMobile && setShowThreads(false)}
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* Middle Panel - Chat */}
      <div className="flex-1 min-w-0 h-full overflow-hidden">
        <ChatPanel
          onToggleThreads={() => setShowThreads(!showThreads)}
          onToggleHelper={() => setShowHelper(!showHelper)}
          showThreads={showThreads}
          showHelper={showHelper}
          isMobile={isMobile}
        />
      </div>

      {/* Right Panel - Helper */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out flex-shrink-0",
          showHelper ? "w-80" : "w-0",
          isMobile &&
            showHelper &&
            "absolute right-0 top-0 z-30 w-80 h-full bg-background border-l shadow-lg"
        )}
      >
        <div
          className={cn(
            "h-full overflow-hidden",
            showHelper ? "opacity-100" : "opacity-0"
          )}
        >
          <HelperPanel
            onClose={() => setShowHelper(false)}
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobile && (showThreads || showHelper) && (
        <div
          className="absolute inset-0 bg-black/20 z-20"
          onClick={() => {
            setShowThreads(false);
            setShowHelper(false);
          }}
        />
      )}
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
