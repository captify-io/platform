"use client";

import { AppLayout } from "@captify/core";
import {
  Users,
  Building,
  Settings,
  Activity,
  Shield,
  Database,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CoreServices } from "./services";

interface PlatformStats {
  organizationCount: number;
  userCount: number;
  activeUserCount: number;
  pendingUserCount: number;
  suspendedUserCount: number;
  roleCount: number;
  systemHealth: "healthy" | "warning" | "error";
}

interface RecentActivity {
  id: string;
  message: string;
  timestamp: string;
  type: "organization" | "user" | "system";
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        // TODO: Implement services when needed
        // const coreServices = new CoreServices(session);

        // Mock data for now
        const organizations = [];
        const allUsers = [];
        const activeUsers = [];
        const pendingUsers = [];
        const suspendedUsers = [];
        const roles = [];

        const statsData: PlatformStats = {
          organizationCount: organizations.length,
          userCount: allUsers.length,
          activeUserCount: activeUsers.length,
          pendingUserCount: pendingUsers.length,
          suspendedUserCount: suspendedUsers.length,
          roleCount: roles.length,
          systemHealth: "healthy" as const,
        };

        setStats(statsData);

        // Create mock recent activities based on actual data
        const recentActivities: RecentActivity[] = [
          {
            id: "1",
            message: `${organizations.length} organizations registered`,
            timestamp: new Date().toISOString(),
            type: "organization",
          },
          {
            id: "2",
            message: `${allUsers.length} total users in system`,
            timestamp: new Date(Date.now() - 300000).toISOString(),
            type: "user",
          },
          {
            id: "3",
            message: `${activeUsers.length} users currently active`,
            timestamp: new Date(Date.now() - 600000).toISOString(),
            type: "system",
          },
        ];
        setActivities(recentActivities);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchDashboardData();
    }
  }, [session]);

  if (loading) {
    return (
      <AppLayout applicationId="core" showMenu={true} showChat={true}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading dashboard...</span>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout applicationId="core" showMenu={true} showChat={true}>
        <div className="p-8">
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <p className="text-red-800">Error loading dashboard: {error}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const statCards = [
    {
      title: "Organizations",
      value: stats?.organizationCount.toString() || "0",
      icon: Building,
      description: "Active organizations",
    },
    {
      title: "Total Users",
      value: stats?.userCount.toString() || "0",
      icon: Users,
      description: "Across all organizations",
    },
    {
      title: "Active Users",
      value: stats?.activeUserCount.toString() || "0",
      icon: Activity,
      description: "Currently active users",
    },
    {
      title: "System Health",
      value: stats?.systemHealth || "Unknown",
      icon: Shield,
      description: "Platform status",
    },
  ];

  return (
    <AppLayout applicationId="core" showMenu={true} showChat={true}>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Platform Administration
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div
              key={stat.title}
              className="rounded-lg border bg-card text-card-foreground shadow-sm"
            >
              <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                <h3 className="text-sm font-medium">{stat.title}</h3>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="p-6 pt-0">
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6 pb-2">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
            </div>
            <div className="p-6 pt-0">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {activity.message}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-3 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6 pb-2">
              <h3 className="text-lg font-semibold">Quick Actions</h3>
            </div>
            <div className="p-6 pt-0">
              <div className="space-y-2">
                <button
                  className="flex w-full items-center justify-start rounded-md p-2 text-left hover:bg-muted"
                  onClick={() => (window.location.href = "/admin/users/create")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Add New User
                </button>
                <button
                  className="flex w-full items-center justify-start rounded-md p-2 text-left hover:bg-muted"
                  onClick={() =>
                    (window.location.href = "/admin/organizations/create")
                  }
                >
                  <Building className="mr-2 h-4 w-4" />
                  Create Organization
                </button>
                <button
                  className="flex w-full items-center justify-start rounded-md p-2 text-left hover:bg-muted"
                  onClick={() => (window.location.href = "/admin/settings")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Platform Settings
                </button>
                <button
                  className="flex w-full items-center justify-start rounded-md p-2 text-left hover:bg-muted"
                  onClick={() => console.log("System backup triggered")}
                >
                  <Database className="mr-2 h-4 w-4" />
                  System Backup
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
