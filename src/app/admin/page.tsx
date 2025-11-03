"use client";

import React from "react";
import { useCaptify } from "@captify-io/core";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import {
  Users,
  Shield,
  Settings,
  Database,
  Activity,
  FileText,
} from "lucide-react";

// Helper to get user's groups
function getUserGroups(session: Session | null): string[] {
  if (!session) return [];

  // Prefer user-level groups
  const userGroups = (session.user as any)?.groups;
  if (userGroups && userGroups.length > 0) {
    return userGroups;
  }

  // Fall back to session-level groups
  const sessionGroups = (session as any).groups;
  if (sessionGroups && sessionGroups.length > 0) {
    return sessionGroups;
  }

  return [];
}

export default function AdminPage() {
  const { session } = useCaptify();

  // Check if user has admin access
  const userGroups = getUserGroups(session);
  const hasAdminAccess = userGroups.includes("captify-admin");

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (!hasAdminAccess) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have permission to access the admin panel.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Required group: captify-admin
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-background p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your Captify platform settings and users
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Management */}
          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">User Management</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Manage users, roles, and permissions
            </p>
            <p className="text-sm text-muted-foreground">
              View and edit user accounts, assign groups, and manage access levels.
            </p>
          </div>

          {/* Security Settings */}
          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer bg-card">
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Security</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Configure security and authentication
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Manage authentication settings, session timeouts, and security policies.
              </p>
            </div>
          </div>

          {/* System Settings */}
          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer bg-card">
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">System Settings</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Configure platform settings
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Adjust system configurations, integrations, and general settings.
              </p>
            </div>
          </div>

          {/* Database Management */}
          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer bg-card">
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Database</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage database and data
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                View database status, manage tables, and perform maintenance tasks.
              </p>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer bg-card">
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Activity Logs</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                View system activity and audit logs
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Monitor system activity, user actions, and security events.
              </p>
            </div>
          </div>

          {/* Reports */}
          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer bg-card">
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Reports</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Generate and view reports
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Create custom reports and analytics for platform usage and performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
