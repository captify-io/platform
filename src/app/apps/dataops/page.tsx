"use client";

import { ApplicationWithSidebarLayout } from "@/components/layout/ApplicationWithSidebarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Database, 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Zap,
  GitBranch,
  Users,
  Settings,
  Server,
  LineChart
} from "lucide-react";

const menuItems = [
  {
    id: "overview",
    label: "Overview",
    icon: BarChart3,
    href: "/apps/dataops",
  },
  {
    id: "pipelines",
    label: "Data Pipelines",
    icon: GitBranch,
    href: "/apps/dataops/pipelines",
  },
  {
    id: "monitoring",
    label: "Monitoring",
    icon: Activity,
    href: "/apps/dataops/monitoring",
  },
  {
    id: "quality",
    label: "Data Quality",
    icon: Zap,
    href: "/apps/dataops/quality",
  },
  {
    id: "sources",
    label: "Data Sources",
    icon: Database,
    href: "/apps/dataops/sources",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: LineChart,
    href: "/apps/dataops/analytics",
  },
  {
    id: "team",
    label: "Team",
    icon: Users,
    href: "/apps/dataops/team",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/apps/dataops/settings",
  },
];

// Sample data for the overview
const summaryStats = [
  {
    title: "Active Pipelines",
    value: "42",
    change: "+12.5%",
    trend: "up",
    icon: GitBranch,
  },
  {
    title: "Data Quality Score",
    value: "94.2%",
    change: "+2.1%",
    trend: "up",
    icon: Zap,
  },
  {
    title: "Daily Processing",
    value: "2.8TB",
    change: "+15.3%",
    trend: "up",
    icon: Server,
  },
  {
    title: "Pipeline Uptime",
    value: "99.9%",
    change: "0%",
    trend: "stable",
    icon: Activity,
  },
];

export default function DataOpsPage() {
  return (
    <ApplicationWithSidebarLayout
      applicationId="dataops"
      applicationName="DataOps"
      menuItems={menuItems}
      showChat={true}
      chatWelcomeMessage="Welcome to DataOps! I can help you manage data pipelines, monitor data quality, and optimize your data operations."
      chatPlaceholder="Ask about data pipelines, quality metrics, or operational insights..."
      agentId={process.env.NEXT_PUBLIC_AWS_BEDROCK_AGENT_ID}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">DataOps Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Data operations and analytics platform for Air Force systems
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
              All Systems Operational
            </Badge>
            <Button size="sm" variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryStats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <span
                        className={`text-xs font-medium ${
                          stat.trend === "up"
                            ? "text-green-600"
                            : stat.trend === "down"
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {stat.change}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">vs last week</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    stat.trend === "up" 
                      ? "bg-green-100" 
                      : stat.trend === "down" 
                      ? "bg-red-100" 
                      : "bg-gray-100"
                  }`}>
                    <stat.icon className={`h-6 w-6 ${
                      stat.trend === "up" 
                        ? "text-green-600" 
                        : stat.trend === "down" 
                        ? "text-red-600" 
                        : "text-gray-600"
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col space-y-2">
                <GitBranch className="h-6 w-6" />
                <span className="text-sm">New Pipeline</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col space-y-2">
                <Activity className="h-6 w-6" />
                <span className="text-sm">Monitor Health</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col space-y-2">
                <Database className="h-6 w-6" />
                <span className="text-sm">Data Sources</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col space-y-2">
                <LineChart className="h-6 w-6" />
                <span className="text-sm">Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Pipeline Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Pipeline Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">B-52 Maintenance Data Pipeline - Completed</p>
                  <p className="text-xs text-gray-500">Processed 45,230 records • 5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Supply Chain ETL - Running</p>
                  <p className="text-xs text-gray-500">75% complete • ETA 12 minutes</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Flight Operations Analytics - Completed</p>
                  <p className="text-xs text-gray-500">Generated daily reports • 1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ApplicationWithSidebarLayout>
  );
}
