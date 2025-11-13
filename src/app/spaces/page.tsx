"use client";

/**
 * Spaces Main Page
 * Orchestrates [sidebar][content] layout with role-aware navigation
 *
 * Architecture:
 * - SpacesSidebar: Left navigation with role-based sections
 * - SpacesContent: Main content area showing selected view
 * - useSpacesStore: Centralized data management
 * - useRolePermissions: Permission checks
 */

import { useState } from 'react';
import { SpacesSidebar } from './components/spaces-sidebar';
import { SpacesContent, type ViewType } from './components/spaces-content';
import { useSpacesStore } from './hooks/use-spaces-store';
import { useRolePermissions } from '@captify-io/core/hooks';
import { SidebarProvider, SidebarInset } from '@captify-io/core';

export default function SpacesPage() {
  const permissions = useRolePermissions('spaces');
  const {
    loading,
    error,
  } = useSpacesStore();

  // UI state - default to insights for all users
  const [activeView, setActiveView] = useState<ViewType>('insights');

  // Handle view change from sidebar
  const handleViewChange = (view: string) => {
    setActiveView(view as ViewType);
  };

  // Show error state if data failed to load
  if (error && !loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2 text-destructive">Error Loading Spaces</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Show access denied if user doesn't have permission
  if (!permissions.hasAccess) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Access Required</h2>
          <p className="text-muted-foreground mb-4">
            You don't have access to Spaces. Please contact your administrator to request access.
          </p>
          <div className="text-sm text-muted-foreground">
            Your current role: <strong>{permissions.role || 'Guest'}</strong>
          </div>
        </div>
      </div>
    );
  }

  // Main layout: [Sidebar][Content]
  // Creates a second-level sidebar within the CaptifyLayout content area
  return (
    <SidebarProvider>
      <div className="flex h-full w-full">
        {/* Spaces Sidebar */}
        <SpacesSidebar
          onViewChange={handleViewChange}
          activeView={activeView}
        />

        {/* Content Area */}
        <SidebarInset className="flex-1">
          <SpacesContent
            activeView={activeView}
            onViewChange={handleViewChange}
            loading={loading}
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export const dynamic = "force-dynamic";
