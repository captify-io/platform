"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { DynamicIcon } from "lucide-react/dynamic";
import { MIApiClient } from "@/app/mi/services/api-client";
import type { WorkbenchData } from "@/app/mi/types";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function WorkbenchPage() {
  const [workbenchData, setWorkbenchData] = useState<WorkbenchData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchWorkbenchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
      };

      const response = await MIApiClient.getWorkbench(params);

      if (!response.ok) {
        throw new Error(
          response.error || `HTTP error! status: ${response.status}`
        );
      }

      setWorkbenchData(response.data || null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch workbench data"
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    fetchWorkbenchData();
  }, [fetchWorkbenchData]);

  const filteredIssues =
    workbenchData?.issues.filter((issue) => {
      return (
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.priority.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Analyze":
        return "search";
      case "Validate Solution":
        return "check-circle";
      case "Qualify":
        return "clipboard-check";
      case "Field":
        return "wrench";
      case "Monitor":
        return "eye";
      default:
        return "circle";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "alert-triangle";
      case "High":
        return "alert-circle";
      case "Medium":
        return "info";
      case "Low":
        return "minus-circle";
      default:
        return "circle";
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workbench data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <DynamicIcon name="alert-circle" size={20} className="mr-2" />
              Error Loading Workbench Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchWorkbenchData}>
              <DynamicIcon name="refresh-cw" size={16} className="mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!workbenchData) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with integrated filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Workbench</h1>
        </div>

        {/* Compact filters in header */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <DynamicIcon
              name="search"
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search issues..."
              className="w-48 pl-10"
            />
          </div>

          <div className="relative">
            <DynamicIcon
              name="layers"
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none z-10"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 pl-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Analyze">Analyze</SelectItem>
                <SelectItem value="Validate Solution">
                  Validate Solution
                </SelectItem>
                <SelectItem value="Qualify">Qualify</SelectItem>
                <SelectItem value="Field">Field</SelectItem>
                <SelectItem value="Monitor">Monitor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <DynamicIcon
              name="flag"
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none z-10"
            />
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-36 pl-10">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={fetchWorkbenchData}
            size="sm"
            variant="outline"
            className="flex items-center"
            title="Refresh data"
          >
            <DynamicIcon name="refresh-cw" size={14} />
          </Button>
        </div>
      </div>

      {/* Compact Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Issues
                </p>
                <p className="text-2xl font-bold">
                  {workbenchData.metadata.totalIssues}
                </p>
                <p className="text-sm text-muted-foreground">
                  {filteredIssues.length} showing
                </p>
              </div>
              <DynamicIcon name="list" size={20} className="text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Critical
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {workbenchData.summary.byPriority.Critical || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  Immediate attention
                </p>
              </div>
              <DynamicIcon
                name="alert-triangle"
                size={20}
                className="text-red-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  In Progress
                </p>
                <p className="text-2xl font-bold text-amber-600">
                  {(workbenchData.summary.byStatus["Analyze"] || 0) +
                    (workbenchData.summary.byStatus["Validate Solution"] || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Active work</p>
              </div>
              <DynamicIcon name="clock" size={20} className="text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completion
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(
                    ((workbenchData.summary.byStatus.Monitor || 0) /
                      Math.max(workbenchData.metadata.totalIssues, 1)) *
                      100
                  )}
                  %
                </p>
                <p className="text-sm text-muted-foreground">Issues resolved</p>
              </div>
              <DynamicIcon
                name="check-circle"
                size={20}
                className="text-green-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="issues" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="actions">Priority Actions</TabsTrigger>
          <TabsTrigger value="ai">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredIssues.map((issue) => (
              <Card
                key={issue.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{issue.title}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className="flex items-center space-x-1"
                        >
                          <DynamicIcon
                            name={getStatusIcon(issue.status)}
                            size={12}
                          />
                          <span>{issue.status}</span>
                        </Badge>
                        <Badge
                          variant={
                            issue.priority === "Critical"
                              ? "destructive"
                              : issue.priority === "High"
                              ? "default"
                              : "secondary"
                          }
                          className="flex items-center space-x-1"
                        >
                          <DynamicIcon
                            name={getPriorityIcon(issue.priority)}
                            size={12}
                          />
                          <span>{issue.priority}</span>
                        </Badge>
                        <Badge variant="outline">
                          Risk: {(issue.riskScore * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        Mission Impact
                      </div>
                      <div className="font-bold">
                        ${issue.missionImpact.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Task Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Task Progress
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {issue.completedTasks}/{issue.taskCount} completed
                        </span>
                      </div>
                      <Progress
                        value={
                          (issue.completedTasks /
                            Math.max(issue.taskCount, 1)) *
                          100
                        }
                        className="h-2"
                      />
                    </div>

                    {/* AI Recommendation */}
                    {issue.aiRecommendation && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center mb-2">
                          <DynamicIcon
                            name="brain"
                            size={16}
                            className="mr-2 text-blue-500"
                          />
                          <span className="text-sm font-medium">
                            AI Recommendation
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {issue.aiRecommendation}
                        </p>
                      </div>
                    )}

                    {/* Links */}
                    {issue.links && issue.links.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {issue.links.map((link, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <DynamicIcon
                                name="external-link"
                                size={14}
                                className="mr-1"
                              />
                              {link.title}
                            </a>
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm text-muted-foreground">
                        Issue ID: {issue.id}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <DynamicIcon name="eye" size={14} className="mr-1" />
                          View Details
                        </Button>
                        <Button size="sm">
                          <DynamicIcon name="edit" size={14} className="mr-1" />
                          Update
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={workbenchData.charts?.statusDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(workbenchData.charts?.statusDistribution || []).map(
                        (entry: { color: string }, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Priority Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={workbenchData.charts?.priorityDistribution || []}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="var(--chart-1)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workbenchData.priorityActions?.map((action) => (
              <Card key={action.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        action.priority === "Critical"
                          ? "destructive"
                          : action.priority === "High"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {action.priority}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {action.dueDate}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-medium mb-2">{action.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {action.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {action.assignee}
                    </span>
                    <Button size="sm" variant="outline">
                      <DynamicIcon
                        name="arrow-right"
                        size={14}
                        className="mr-1"
                      />
                      Start
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DynamicIcon
                  name="brain"
                  size={20}
                  className="mr-2 text-blue-500"
                />
                AI-Powered Insights
              </CardTitle>
              <CardDescription>
                Intelligent recommendations and pattern analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Risk Pattern Detection</h4>
                    <p className="text-sm text-muted-foreground">
                      Critical issues show 40% correlation with supply chain
                      delays. Recommend proactive supplier engagement for
                      high-risk components.
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">
                      Resolution Optimization
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Issues resolved in Field stage average 65% faster
                      completion. Consider early field testing for complex
                      problems.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center">
                    <DynamicIcon name="lightbulb" size={16} className="mr-2" />
                    Smart Recommendations
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li>
                      • Prioritize B-52H engine components with &gt;80% risk
                      scores
                    </li>
                    <li>
                      • Engage Alternative Manufacturing Inc for critical path
                      items
                    </li>
                    <li>
                      • Schedule proactive maintenance for components
                      approaching failure thresholds
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
