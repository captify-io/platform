"use client";

import { ReactNode, lazy, Suspense } from "react";
import { useCaptify } from "../context/CaptifyContext";
import { cn } from "../lib/utils";

// Lazy load AppMenu to avoid circular imports
const AppMenu = lazy(() =>
  import("./AppMenu").then((module) => ({ default: module.AppMenu }))
);

interface AppLayoutProps {
  children: ReactNode;
  applicationId?: string;
  showMenu?: boolean;
  showChat?: boolean;
  className?: string;
}

/**
 * Simplified AppLayout using CaptifyContext
 * Automatically detects app from URL and manages sidebar state
 */
export function AppLayout({
  children,
  applicationId,
  showMenu = true,
  showChat = false,
  className = "",
}: AppLayoutProps) {
  const { currentApp, hasMenu, isSidebarOpen } = useCaptify();

  // Use currentApp from context or fallback to applicationId prop
  const appToUse =
    currentApp ||
    (applicationId
      ? { id: applicationId, name: applicationId, menu: [], config: {} }
      : null);

  if (!appToUse) {
    // No app detected, render children without layout
    return <div className={className}>{children}</div>;
  }

  const shouldShowMenu = showMenu && hasMenu;

  return (
    <div className={cn("flex h-screen", className)}>
      {/* App Menu Sidebar */}
      {shouldShowMenu && (
        <Suspense
          fallback={
            <div className="w-64 border-r bg-background animate-pulse" />
          }
        >
          <AppMenu
            appId={appToUse.id}
            className={cn(
              "transition-all duration-200",
              isSidebarOpen ? "w-64" : "w-0 overflow-hidden"
            )}
          />
        </Suspense>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>

      {/* Chat Panel - Future Implementation */}
      {showChat && (
        <div className="w-80 border-l bg-background">
          {/* Chat will be implemented later */}
          <div className="p-4 text-muted-foreground text-sm">
            Chat panel coming soon...
          </div>
        </div>
      )}
    </div>
  );
}
