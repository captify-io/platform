"use client";

import React, { ReactNode, useState } from "react";
import { useApps } from "@/context/AppsContext";
import { ApplicationSidebar } from "@/components/layout/ApplicationSidebar";

// Placeholder for AgentChat pane
function AgentChatPane() {
  return (
    <div className="w-1/4 border-l border-gray-200 p-4">
      <h3 className="font-semibold mb-2">Agent Chat</h3>
      <div className="h-full bg-gray-50 rounded">Chat UI</div>
    </div>
  );
}

interface ShellLayoutProps {
  children: ReactNode;
  params: { alias: string };
}

export default function ShellLayout({ children, params }: ShellLayoutProps) {
  const { availableApps } = useApps();
  const currentApp = availableApps.find((a) => a.alias === params.alias);
  const [collapsed, setCollapsed] = useState(false);

  if (!currentApp) {
    return <div>Application &quot;{params.alias}&quot; not found.</div>;
  }

  return (
    <div className="flex h-screen">
      <ApplicationSidebar
        application={{ id: currentApp.agentId, name: currentApp.name }}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />

      <main className="flex-1 overflow-auto p-6 bg-white">{children}</main>

      <AgentChatPane />
    </div>
  );
}
