"use client";

import { useState, useEffect } from "react";
import { AuthenticatedLayout } from "./AuthenticatedLayout";
// import { ApplicationSidebar } from "./ApplicationSidebar";

interface ConsoleLayoutProps {
  children: React.ReactNode;
  currentApplication?: {
    id: string;
    name: string;
    sidebar?: any;
  };
}

export function ConsoleLayout({
  children,
  currentApplication,
}: ConsoleLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Handle global search shortcut (Alt+S) - moved to AuthenticatedLayout/TopNavigation
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "s") {
        e.preventDefault();
        // Focus the search input in the top navigation
        const searchInput = document.querySelector(
          'input[placeholder*="Search for services"]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyboard);
    return () => document.removeEventListener("keydown", handleKeyboard);
  }, []);

  // TODO: Re-enable ApplicationSidebar once import issue is resolved
  const sidebarContent = null; // currentApplication ? (
  //   <ApplicationSidebar
  //     application={currentApplication}
  //     collapsed={sidebarCollapsed}
  //     onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
  //   />
  // ) : null;

  return (
    <AuthenticatedLayout
      currentApplication={currentApplication}
      showSidebar={false} // Temporarily disabled: !!currentApplication
      sidebarContent={sidebarContent}
    >
      {children}
    </AuthenticatedLayout>
  );
}
