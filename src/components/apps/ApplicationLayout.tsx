"use client";

import { ReactNode, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useApplication } from "@/context/ApplicationContext";
import { DynamicIcon } from "@/components/ui/dynamic-icon";

interface ApplicationLayoutProps {
  children: ReactNode;
  menuContent?: ReactNode;
  chatContent?: ReactNode;
  showMenu?: boolean;
  showChat?: boolean;
  applicationId?: string;
  applicationName?: string;
}

export function ApplicationLayout({
  children,
  menuContent,
  chatContent,
  showMenu = true,
  showChat = true,
}: ApplicationLayoutProps) {
  const [isMenuVisible, setIsMenuVisible] = useState(showMenu);
  const [isChatVisible, setIsChatVisible] = useState(showChat);

  // Get application data from context
  const { applicationData, loading, error } = useApplication();

  // Create menu content from application data
  const dynamicMenuContent = useMemo(() => {
    if (!applicationData?.menu) return null;

    const sortedMenu = [...applicationData.menu].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );

    return (
      <div className="space-y-2">
        {sortedMenu.map((item) => (
          <a
            key={item.id}
            href={item.href || "#"}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <DynamicIcon name={item.icon || "box"} className="h-4 w-4" />
            <span className="text-sm font-medium">{item.label}</span>
          </a>
        ))}
      </div>
    );
  }, [applicationData?.menu]);

  // Create chat content with agent configuration
  const dynamicChatContent = useMemo(() => {
    if (!applicationData?.agentId) return null;

    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          <div className="font-medium mb-2">
            {applicationData.title || applicationData.name} Assistant
          </div>
          <div className="text-xs">
            Agent ID: {applicationData.agentId}
            {applicationData.agentAliasId && (
              <>
                <br />
                Alias: {applicationData.agentAliasId}
              </>
            )}
          </div>
        </div>
        {/* TODO: Integrate actual chat interface here */}
        <div className="p-3 bg-white rounded border text-sm">
          Chat interface will be integrated here with agent configuration
        </div>
      </div>
    );
  }, [applicationData]);

  // Show loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <div className="text-sm text-gray-600">Loading application...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-2">⚠️</div>
          <div className="text-sm text-gray-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Menu Panel */}
      {showMenu && (
        <div
          className={`${
            isMenuVisible ? "w-64" : "w-0"
          } transition-all duration-300 bg-gray-50 border-r overflow-hidden`}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {applicationData?.title || applicationData?.name || "Menu"}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuVisible(!isMenuVisible)}
              >
                ←
              </Button>
            </div>
            {menuContent || dynamicMenuContent || (
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
      <div className="flex-1 flex flex-col">{children}</div>

      {/* Chat Panel */}
      {showChat && (
        <div
          className={`${
            isChatVisible ? "w-80" : "w-0"
          } transition-all duration-300 bg-gray-50 border-l overflow-hidden`}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {applicationData?.name
                  ? `${applicationData.name} Chat`
                  : "Chat"}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChatVisible(!isChatVisible)}
              >
                →
              </Button>
            </div>
            {chatContent || dynamicChatContent || (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  Chat interface will appear here
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
