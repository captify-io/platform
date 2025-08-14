"use client";

import { ReactNode, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { AppMenu } from "./AppMenu";
import { ResizableChatPanel } from "./ResizableChatPanel";
import { useLayout } from "@/context/LayoutContext";
import { useApplication } from "@/context/ApplicationContext";
import {
  ChatIntegrationProvider,
  useChatIntegrationInternal,
} from "@/hooks/useChatIntegration";

interface AppLayoutProps {
  children: ReactNode;
  menuContent?: ReactNode;
  chatContent?: ReactNode;
  showMenu?: boolean;
  showChat?: boolean;
  applicationId?: string;
  applicationName?: string;
}

export function AppLayout({
  children,
  menuContent,
  showMenu = true,
  showChat = true,
  applicationId,
}: AppLayoutProps) {
  return (
    <ChatIntegrationProvider>
      <AppLayoutInner
        menuContent={menuContent}
        showMenu={showMenu}
        showChat={showChat}
        applicationId={applicationId}
      >
        {children}
      </AppLayoutInner>
    </ChatIntegrationProvider>
  );
}

function AppLayoutInner({
  children,
  menuContent,
  showMenu = true,
  showChat = true,
  applicationId,
}: AppLayoutProps) {
  const { isMenuVisible, isChatVisible, toggleChat, setHasMenu, setHasChat } =
    useLayout();

  const { applicationInfo, applicationData } = useApplication();
  const { setChatReady } = useChatIntegrationInternal();

  // Use applicationData from context if available, fallback to legacy applicationInfo
  const currentApp = applicationData || applicationInfo;

  const handleMenuLoad = useCallback(
    (menuExists: boolean) => {
      setHasMenu(menuExists);
    },
    [setHasMenu]
  );

  const handleApplicationLoad = useCallback(() => {
    // Legacy compatibility - not needed since context handles this automatically
    // Using context data instead of this legacy callback
  }, []);

  // Set initial chat availability
  useEffect(() => {
    setHasChat(showChat);
  }, [showChat, setHasChat]);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Menu Panel - Use AppMenu if applicationId is provided, otherwise use custom menuContent */}
      {showMenu && applicationId && (
        <AppMenu
          applicationId={applicationId}
          isVisible={isMenuVisible}
          onMenuLoad={handleMenuLoad}
          onApplicationLoad={handleApplicationLoad}
        />
      )}

      {/* Legacy Menu Panel - for backward compatibility - only show if menuContent is provided */}
      {showMenu && !applicationId && menuContent && isMenuVisible && (
        <div className="w-64 bg-gray-50 border-r flex-shrink-0 h-full overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  /* Legacy menu toggle - not implemented */
                }}
              >
                ←
              </Button>
            </div>
            {menuContent || (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  Navigation items will appear here
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 h-full overflow-y-auto relative">
        {children}

        {/* Floating Chat Toggle Button - Show when chat is available but hidden */}
        {showChat && !isChatVisible && (
          <Button
            onClick={toggleChat}
            className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
            title="Open Chat"
          >
            <Bot className="h-5 w-5 text-primary-foreground" />
          </Button>
        )}
      </div>

      {/* Chat Panel */}
      {showChat && isChatVisible && (
        <ResizableChatPanel
          applicationId={currentApp?.id}
          applicationName={currentApp?.name || currentApp?.title || "Chat"}
          isCollapsible={true}
          isSliding={true}
          isOpen={isChatVisible}
          onToggle={toggleChat}
          onChatReady={setChatReady}
        />
      )}
    </div>
  );
}
