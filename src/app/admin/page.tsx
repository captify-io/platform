"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApps } from "@/context/AppsContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Users,
  Bot,
  BarChart3,
  Shield,
  Database,
  Globe,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  ArrowRight,
  Eye,
  Edit,
} from "lucide-react";

interface AdminStats {
  totalApplications: number;
  activeApplications: number;
  totalUsers: number;
  aiAgents: number;
  lastWeekActivity: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { applications, loading } = useApps();
  const [stats, setStats] = useState<AdminStats>({
    totalApplications: 0,
    activeApplications: 0,
    totalUsers: 0,
    aiAgents: 0,
    lastWeekActivity: 0,
  });

  // Calculate stats
  useEffect(() => {
    if (applications.length > 0) {
      const activeApps = applications.filter((app) => app.status === "active");
      const appsWithAgents = applications.filter(
        (app) => app.ai_agent?.agentId
      );

      setStats({
        totalApplications: applications.length,
        activeApplications: activeApps.length,
        totalUsers: 24, // This would come from user management system
        aiAgents: appsWithAgents.length,
        lastWeekActivity: 89, // This would come from analytics
      });
    }
  }, [applications]);

  const quickActions = [
    {
      title: "Manage Applications",
      description: "View, edit, and configure applications",
      icon: Settings,
      href: "/admin/applications",
      color: "bg-blue-500",
    },
    {
      title: "User Management",
      description: "Manage user access and permissions",
      icon: Users,
      href: "/admin/users",
      color: "bg-green-500",
    },
    {
      title: "AI Agents",
      description: "Configure and monitor AI agents",
      icon: Bot,
      href: "/admin/agents",
      color: "bg-purple-500",
    },
    {
      title: "Analytics",
      description: "View system analytics and reports",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "bg-orange-500",
    },
    {
      title: "Security",
      description: "Security settings and monitoring",
      icon: Shield,
      href: "/admin/security",
      color: "bg-red-500",
    },
    {
      title: "System Settings",
      description: "Configure system-wide settings",
      icon: Database,
      href: "/admin/settings",
      color: "bg-gray-500",
    },
  ];

  const recentApplications = applications.slice(0, 5);

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Admin Dashboard
              </h1>
              <p className="mt-2 text-muted-foreground">
                Manage applications, users, and system configuration
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/settings")}
              >
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Button>
              <Button onClick={() => router.push("/admin/applications")}>
                <Plus className="h-4 w-4 mr-2" />
                New Application
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Applications
              </CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalApplications}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.activeApplications} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Agents</CardTitle>
              <Bot className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.aiAgents}
              </div>
              <p className="text-xs text-muted-foreground">
                AI-powered applications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalUsers}
              </div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Weekly Activity
              </CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.lastWeekActivity}%
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +12% from last week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Card
                key={action.title}
                className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
                onClick={() => router.push(action.href)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${action.color}`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Applications</CardTitle>
                  <CardDescription>
                    Latest applications in the system
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/admin/applications")}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">
                    Loading applications...
                  </div>
                </div>
              ) : recentApplications.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No applications found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentApplications.map((app) => (
                    <div
                      key={app.app_id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {app.status === "active" ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : app.status === "draft" ? (
                            <Clock className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {app.metadata?.name || app.app_id}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {app.metadata?.description || "No description"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            app.ai_agent?.agentId ? "default" : "secondary"
                          }
                        >
                          {app.ai_agent?.agentId ? "AI-Powered" : "Standard"}
                        </Badge>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/apps/${app.id}`, "_blank");
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/admin/applications/${app.app_id}/edit`
                              );
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Current system health and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Application Services</span>
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    Operational
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">AI Agent Services</span>
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    Operational
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Database</span>
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    Operational
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Backup Services</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-yellow-500 text-white"
                  >
                    Scheduled
                  </Badge>
                </div>

                <div className="pt-4 mt-4 border-t">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Last backup: 2 hours ago</div>
                    <div>System uptime: 99.9%</div>
                    <div>Response time: ~150ms</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
