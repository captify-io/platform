"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { TopNavigation } from "./TopNavigation";
import { ApplicationMenu } from "./ApplicationMenu";
import { useState } from "react";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  currentApplication?: {
    id: string;
    name: string;
    sidebar?: unknown;
  };
  showSidebar?: boolean;
  sidebarContent?: React.ReactNode;
}

export function AuthenticatedLayout({
  children,
  currentApplication,
  showSidebar = false,
  sidebarContent,
}: AuthenticatedLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applicationMenuOpen, setApplicationMenuOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to auth
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation - Always visible on authenticated pages */}
      <TopNavigation
        onSearchFocus={() => {}} // Search is handled inline
        onApplicationMenuClick={() => setApplicationMenuOpen(true)}
        currentApplication={currentApplication}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Optional Sidebar */}
        {showSidebar && sidebarContent && (
          <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
            {sidebarContent}
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Application Menu Modal */}
      {applicationMenuOpen && (
        <ApplicationMenu
          onClose={() => setApplicationMenuOpen(false)}
          onSelect={(app: { id: string; name: string }) => {
            setApplicationMenuOpen(false);
            // Handle navigation to selected application
            console.log("Navigate to app:", app);
          }}
        />
      )}
    </div>
  );
}
