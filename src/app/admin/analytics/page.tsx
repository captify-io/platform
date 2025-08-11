"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Download,
  RefreshCw,
  PieChart,
  LineChart,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d");

  // Mock data - replace with real analytics data
  const metrics = {
    totalUsers: 170,
    userGrowth: 12.5,
    activeApplications: 24,
    appGrowth: 8.3,
    totalSessions: 1247,
    sessionGrowth: -2.1,
    avgSessionDuration: "4m 32s",
    durationGrowth: 15.2,
  };

  const topApplications = [
    { name: "Marketing Advisor", users: 45, sessions: 324 },
    { name: "DataOps Platform", users: 38, sessions: 287 },
    { name: "Security Monitor", users: 32, sessions: 256 },
    { name: "AI Chat Assistant", users: 28, sessions: 198 },
    { name: "Material Insights", users: 27, sessions: 182 },
  ];

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return <ArrowUp className="h-4 w-4 text-green-600" />;
    } else if (growth < 0) {
      return <ArrowDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return "text-green-600";
    if (growth < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
              <p className="mt-2 text-muted-foreground">
                Monitor usage, performance, and user engagement
              </p>
            </div>
            <div className="flex space-x-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalUsers}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getGrowthIcon(metrics.userGrowth)}
                <span className={`ml-1 ${getGrowthColor(metrics.userGrowth)}`}>
                  {metrics.userGrowth > 0 ? "+" : ""}
                  {metrics.userGrowth}% from last period
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Applications
              </CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.activeApplications}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getGrowthIcon(metrics.appGrowth)}
                <span className={`ml-1 ${getGrowthColor(metrics.appGrowth)}`}>
                  {metrics.appGrowth > 0 ? "+" : ""}
                  {metrics.appGrowth}% from last period
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Sessions
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {metrics.totalSessions.toLocaleString()}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getGrowthIcon(metrics.sessionGrowth)}
                <span
                  className={`ml-1 ${getGrowthColor(metrics.sessionGrowth)}`}
                >
                  {metrics.sessionGrowth > 0 ? "+" : ""}
                  {metrics.sessionGrowth}% from last period
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Session Duration
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {metrics.avgSessionDuration}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getGrowthIcon(metrics.durationGrowth)}
                <span
                  className={`ml-1 ${getGrowthColor(metrics.durationGrowth)}`}
                >
                  {metrics.durationGrowth > 0 ? "+" : ""}
                  {metrics.durationGrowth}% from last period
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="h-5 w-5 mr-2" />
                User Activity Over Time
              </CardTitle>
              <CardDescription>
                Daily active users and session counts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/10 rounded-lg border-2 border-dashed border-muted">
                <div className="text-center">
                  <LineChart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Chart will be rendered here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Integration with chart library needed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Application Usage Distribution
              </CardTitle>
              <CardDescription>
                Most popular applications by user count
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/10 rounded-lg border-2 border-dashed border-muted">
                <div className="text-center">
                  <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Chart will be rendered here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Integration with chart library needed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Top Applications</CardTitle>
            <CardDescription>
              Most popular applications ranked by user engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topApplications.map((app, index) => (
                <div
                  key={app.name}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full text-primary-foreground text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {app.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {app.users} users • {app.sessions} sessions
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">
                        {app.users} users
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {app.sessions} sessions
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
