"use client";

import { ReactNode, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SlidingChatLayout } from "./SlidingChatLayout";
import { TopNavigation } from "./TopNavigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

interface ApplicationWithSidebarLayoutProps {
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
  menuItems: MenuItem[];
}

export function ApplicationWithSidebarLayout({
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
  menuItems,
}: ApplicationWithSidebarLayoutProps) {
  const [showApplicationMenu, setShowApplicationMenu] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [showGlobalSearch, setShowGlobalSearch] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const pathname = usePathname();

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

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Sidebar Menu */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {applicationName}
            </h2>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "w-full justify-start h-10 px-3",
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </div>

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
            <div className="p-6 h-full overflow-auto">{children}</div>
          </SlidingChatLayout>
        </div>
      </div>
    </div>
  );
}
