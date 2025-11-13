"use client";

/**
 * Admin Content Area
 * Central content area that displays different views based on sidebar selection
 * Role-aware content rendering with configurable page headers
 */

import { PageHeader, Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@captify-io/core';
import { EmptyState } from '@captify-io/core/components/spaces';
import {
  Users,
  AppWindow,
  Settings,
  Database,
  Activity,
  FileText,
  Shield,
  BarChart3,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { GroupsView } from './views/groups';
import { ApplicationsView } from './views/applications';
import { AccessRequestsView } from './views/access-requests';

export type ViewType =
  | 'overview'
  | 'users' | 'groups' | 'access-requests'
  | 'applications' | 'app-access'
  | 'monitoring' | 'database' | 'audit-logs' | 'reports' | 'settings'
  | null;

interface AdminContentProps {
  activeView: ViewType;
  onViewChange?: (view: string) => void;
  loading?: boolean;
}

export function AdminContent({
  activeView,
  onViewChange,
  loading = false,
}: AdminContentProps) {

  // No view selected
  if (!activeView) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <EmptyState
          icon={BarChart3}
          title="Welcome to Admin"
          description="Select an item from the sidebar to get started."
          action={{
            label: "View Overview",
            onClick: () => onViewChange?.('overview'),
            icon: BarChart3,
          }}
        />
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Render view-specific content
  return renderViewContent(activeView, onViewChange);
}

/**
 * Render content for specific view with PageHeader
 */
function renderViewContent(view: ViewType, onViewChange?: (view: string) => void) {
  switch (view) {
    // ===== OVERVIEW =====
    case 'overview':
      return (
        <div className="flex flex-col h-full overflow-hidden">
          <PageHeader
            title="Admin Overview"
            description="Platform administration dashboard"
            icon={BarChart3}
            actions={[
              {
                label: "Settings",
                icon: Settings,
                onClick: () => onViewChange?.('settings'),
                variant: "outline",
              },
            ]}
          />
          <div className="flex-1 p-6 overflow-auto">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Users Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Users</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewChange?.('users')}
                    >
                      Manage
                    </Button>
                  </div>
                  <CardDescription>
                    User accounts and access control
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">24</div>
                  <p className="text-sm text-muted-foreground mt-1">Active users</p>
                </CardContent>
              </Card>

              {/* Applications Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AppWindow className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Applications</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewChange?.('applications')}
                    >
                      Manage
                    </Button>
                  </div>
                  <CardDescription>
                    Platform applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">8</div>
                  <p className="text-sm text-muted-foreground mt-1">Registered apps</p>
                </CardContent>
              </Card>

              {/* System Health Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-500" />
                      <CardTitle>System Status</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewChange?.('monitoring')}
                    >
                      View
                    </Button>
                  </div>
                  <CardDescription>
                    Platform health
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">Healthy</div>
                  <p className="text-sm text-muted-foreground mt-1">All systems operational</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );

    // ===== USER MANAGEMENT =====
    case 'users':
      return (
        <div className="flex flex-col h-full overflow-hidden">
          <PageHeader
            title="Users"
            description="Manage user accounts and permissions"
            icon={Users}
            actions={[
              {
                label: "New User",
                icon: Plus,
                onClick: () => console.log('Create user'),
                variant: "default",
              },
              {
                label: "Settings",
                icon: Settings,
                onClick: () => console.log('User settings'),
                variant: "outline",
              },
            ]}
          />
          <div className="flex-1 p-6 overflow-auto">
            <EmptyState
              icon={Users}
              title="User management coming soon"
              description="User list and management features will be available here."
            />
          </div>
        </div>
      );

    case 'groups':
      return (
        <div className="flex flex-col h-full overflow-hidden">
          <PageHeader
            title="Groups"
            description="Manage user groups and roles"
            icon={Shield}
          />
          <div className="flex-1 p-6 overflow-auto">
            <GroupsView />
          </div>
        </div>
      );

    case 'access-requests':
      return (
        <div className="flex flex-col h-full overflow-hidden">
          <PageHeader
            title="Access Requests"
            description="Review and approve access requests"
            icon={FileText}
          />
          <div className="flex-1 p-6 overflow-auto">
            <AccessRequestsView />
          </div>
        </div>
      );

    // ===== APPLICATION MANAGEMENT =====
    case 'applications':
      return (
        <div className="flex flex-col h-full overflow-hidden">
          <PageHeader
            title="Applications"
            description="Manage platform applications"
            icon={AppWindow}
          />
          <div className="flex-1 overflow-auto">
            <ApplicationsView />
          </div>
        </div>
      );

    case 'app-access':
      return (
        <div className="flex flex-col h-full overflow-hidden">
          <PageHeader
            title="App Access Control"
            description="Manage application access permissions"
            icon={Shield}
          />
          <div className="flex-1 p-6 overflow-auto">
            <EmptyState
              icon={Shield}
              title="Access control coming soon"
              description="Application access management features will be available here."
            />
          </div>
        </div>
      );

    // ===== SYSTEM =====
    case 'monitoring':
      return (
        <div className="flex flex-col h-full overflow-hidden">
          <PageHeader
            title="System Monitoring"
            description="Platform health and metrics"
            icon={Activity}
          />
          <div className="flex-1 p-6 overflow-auto">
            <EmptyState
              icon={Activity}
              title="Monitoring coming soon"
              description="System monitoring dashboard will be available here."
            />
          </div>
        </div>
      );

    case 'database':
      return (
        <div className="flex flex-col h-full overflow-hidden">
          <PageHeader
            title="Database"
            description="Database management and maintenance"
            icon={Database}
          />
          <div className="flex-1 p-6 overflow-auto">
            <EmptyState
              icon={Database}
              title="Database tools coming soon"
              description="Database management features will be available here."
            />
          </div>
        </div>
      );

    case 'audit-logs':
      return (
        <div className="flex flex-col h-full overflow-hidden">
          <PageHeader
            title="Audit Logs"
            description="View system activity and audit trail"
            icon={FileText}
          />
          <div className="flex-1 p-6 overflow-auto">
            <EmptyState
              icon={FileText}
              title="Audit logs coming soon"
              description="System audit logs will be available here."
            />
          </div>
        </div>
      );

    case 'reports':
      return (
        <div className="flex flex-col h-full overflow-hidden">
          <PageHeader
            title="Reports"
            description="Generate and view platform reports"
            icon={BarChart3}
            actions={[
              {
                label: "New Report",
                icon: Plus,
                onClick: () => console.log('Create report'),
                variant: "default",
              },
            ]}
          />
          <div className="flex-1 p-6 overflow-auto">
            <EmptyState
              icon={BarChart3}
              title="Reports coming soon"
              description="Reporting features will be available here."
            />
          </div>
        </div>
      );

    case 'settings':
      return (
        <div className="flex flex-col h-full overflow-hidden">
          <PageHeader
            title="Settings"
            description="Platform configuration and settings"
            icon={Settings}
          />
          <div className="flex-1 p-6 overflow-auto">
            <EmptyState
              icon={Settings}
              title="Settings coming soon"
              description="Platform settings will be available here."
            />
          </div>
        </div>
      );

    // ===== DEFAULT =====
    default:
      return (
        <div className="flex flex-col h-full overflow-hidden">
          <PageHeader
            title="View Not Found"
            description={`The view "${view}" is not yet implemented`}
          />
          <div className="flex-1 p-6 overflow-auto">
            <EmptyState
              icon={BarChart3}
              title="Coming Soon"
              description="This feature is under development."
              action={{
                label: "Go to Overview",
                onClick: () => onViewChange?.('overview'),
                icon: BarChart3,
              }}
            />
          </div>
        </div>
      );
  }
}
