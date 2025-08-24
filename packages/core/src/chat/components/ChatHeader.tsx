"use client";

import React from "react";
import { Button, Badge } from "../../components";
import { cn } from "../../lib/utils";
import {
  Settings,
  Minimize2,
  ChevronRight,
  RefreshCw,
  History,
  X,
} from "lucide-react";

// Define Provider type locally since it was from main app
export interface Provider {
  value: string;
  label: string;
  type: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface ChatHeaderProps {
  applicationName: string;
  currentProvider?: Provider;
  isSliding?: boolean;
  isOpen?: boolean;
  isCollapsible?: boolean;
  onToggle?: () => void;
  onNewSession: () => void;
  onToggleSettings: () => void;
  onOpenHistory: () => void;
  onMinimize: () => void;
  onClose?: () => void; // New close callback
  showSessionControls?: boolean; // Control whether to show session-related buttons
  showCloseButton?: boolean; // Control whether to show close button
}

export function ChatHeader({
  currentProvider,
  isSliding = false,
  isOpen = true,
  isCollapsible = true,
  onToggle,
  onNewSession,
  onToggleSettings,
  onOpenHistory,
  onMinimize,
  onClose,
  showSessionControls = true,
  showCloseButton = false,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-background">
      <div className="flex items-center space-x-3">
        <h3 className="font-semibold text-foreground text-sm">
          {/* Placeholder for title - currently empty */}
        </h3>
      </div>

      <div className="flex items-center space-x-2">
        {currentProvider && (
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-medium border",
              currentProvider.type === "bedrock-agent"
                ? "border-purple-200 text-purple-700 bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:bg-purple-950"
                : "border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-950"
            )}
          >
            {currentProvider.type === "bedrock-agent" ? "AI Agent" : "LLM"}
          </Badge>
        )}

        <div className="flex items-center space-x-1">
          {showSessionControls && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNewSession}
                className="h-8 w-8 p-0 hover:bg-muted border border-transparent hover:border-border"
                title="Start New Session"
              >
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenHistory}
                className="h-8 w-8 p-0 hover:bg-muted border border-transparent hover:border-border"
                title="Conversations"
              >
                <History className="h-4 w-4 text-muted-foreground" />
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSettings}
            className="h-8 w-8 p-0 hover:bg-muted border border-transparent hover:border-border"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Button>

          {isSliding && onToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0 hover:bg-muted border border-transparent hover:border-border"
              title={isOpen ? "Hide Chat" : "Show Chat"}
            >
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                  !isOpen && "rotate-180"
                )}
              />
            </Button>
          )}

          {isCollapsible && !isSliding && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMinimize}
              className="h-8 w-8 p-0 hover:bg-muted border border-transparent hover:border-border"
            >
              <Minimize2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}

          {showCloseButton && onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-muted border border-transparent hover:border-border"
              title="Close Chat"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
