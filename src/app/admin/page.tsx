"use client";

/**
 * Admin Main Page
 * Orchestrates [sidebar][content] layout with role-aware navigation
 *
 * Architecture:
 * - AdminSidebar: Left navigation with role-based sections
 * - AdminContent: Main content area showing selected view
 * - useRolePermissions: Permission checks for admin access
 *
 * Access Control:
 * - Requires user to be in 'captify-admin' or 'captify-operations' group
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AdminSidebar } from './components/admin-sidebar';
import { AdminContent, type ViewType } from './components/admin-content';
import { useRolePermissions } from '@captify-io/core/hooks';
import { SidebarProvider, SidebarInset } from '@captify-io/core';
import { Shield } from 'lucide-react';

export default function AdminPage() {
  const permissions = useRolePermissions('admin');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get view from URL or default to overview
  const viewFromUrl = (searchParams.get('view') as ViewType) || 'overview';
  const [activeView, setActiveView] = useState<ViewType>(viewFromUrl);
  const [loading] = useState(false);

  // Sync activeView with URL
  useEffect(() => {
    const urlView = (searchParams.get('view') as ViewType) || 'overview';
    setActiveView(urlView);
  }, [searchParams]);

  // Handle view change from sidebar - update URL
  const handleViewChange = (view: string) => {
    router.push(`/admin?view=${view}`);
  };

  // Show access denied if user doesn't have admin access
  if (!permissions.hasAccess) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Access Required</h2>
          <p className="text-muted-foreground mb-4">
            You don't have access to the Admin panel. Please contact your administrator to request access.
          </p>
          <div className="text-sm text-muted-foreground">
            Your current role: <strong>{permissions.role || 'Guest'}</strong>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Required: captify-admin or captify-operations group
          </div>
        </div>
      </div>
    );
  }

  // Main layout: [Sidebar][Content]
  return (
    <SidebarProvider>
      <div className="flex h-full w-full">
        {/* Admin Sidebar */}
        <AdminSidebar
          onViewChange={handleViewChange}
          activeView={activeView}
        />

        {/* Content Area */}
        <SidebarInset className="flex-1">
          <AdminContent
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
