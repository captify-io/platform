"use client";

import { ReactNode, useState } from "react";
import { ChatInterface } from "./ChatInterface";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlidingChatLayoutProps {
  children: ReactNode;
  applicationId?: string;
  applicationName?: string;
  showChat?: boolean;
  chatWelcomeMessage?: string;
  chatPlaceholder?: string;
  className?: string;
  chatWidth?: number;
  onChatReady?: (submitMessage: (message: string) => void) => void;
}

export function SlidingChatLayout({
  children,
  applicationId,
  applicationName = "AI Assistant",
  showChat = true,
  chatWelcomeMessage,
  chatPlaceholder = "Type your message...",
  className = "",
  chatWidth = 400,
  onChatReady,
}: SlidingChatLayoutProps) {
  const [isChatOpen, setIsChatOpen] = useState(true);

  if (!showChat) {
    return (
      <div className={cn("h-full overflow-auto", className)}>
        <div className="p-5">{children}</div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full bg-background", className)}>
      {/* Main Application Content */}
      <div
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out bg-card h-full min-h-0 rounded-none overflow-auto",
          isChatOpen ? `mr-[${chatWidth}px]` : "mr-0"
        )}
        style={{
          marginRight: isChatOpen ? `${chatWidth}px` : "0px",
        }}
      >
        <div className="p-5">{children}</div>
      </div>

      {/* Chat Toggle Button (when closed) */}
      {!isChatOpen && (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50">
          <Button
            onClick={() => setIsChatOpen(true)}
            className="h-12 w-12 shadow-lg bg-card border border-border hover:bg-accent text-foreground"
            size="sm"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Chat Panel */}
      <div
        className={cn(
          "fixed right-0 bg-card border-l border-border shadow-xl transition-all duration-300 ease-in-out z-40",
          isChatOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{
          width: `${chatWidth}px`,
          top: "88px", // Account for navigation (48px) + favorites (40px)
          height: "calc(100vh - 88px)",
        }}
      >
        <ChatInterface
          applicationId={applicationId}
          applicationName={applicationName}
          welcomeMessage={chatWelcomeMessage}
          placeholder={chatPlaceholder}
          isCollapsible={false}
          isSliding={true}
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(false)}
          onChatReady={onChatReady}
          className="h-full"
        />
      </div>

      {/* Overlay (when chat is open on mobile) */}
      {isChatOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-30 lg:hidden"
          onClick={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
}
