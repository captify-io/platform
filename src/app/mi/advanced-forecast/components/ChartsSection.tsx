"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  TrendingUp,
  BarChart3,
  PieChart,
  LineChart,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Area,
  AreaChart,
} from "recharts";

interface ChartsSectionProps {
  charts: {
    riskTrend: any;
    dosDistribution: any;
    assistanceRequestTrend: any;
    supplierPerformanceTrend: any;
  };
  filters: any;
  onRefresh: () => void;
}

export function ChartsSection({
  charts,
  filters,
  onRefresh,
}: ChartsSectionProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  // Color schemes for charts
  const riskColors = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
  const requestColors = ["#3b82f6", "#8b5cf6", "#06b6d4"];
  const performanceColors = ["#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-6">
      {/* Charts Header */}
      <div className="flex items-center justify-end">
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="rounded-none"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh Charts
        </Button>
      </div>

      {/* Chart Tabs */}
      <Tabs defaultValue="risk-trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-none">
          <TabsTrigger
            value="risk-trends"
            className="flex items-center gap-2 rounded-none"
          >
            <TrendingUp className="h-4 w-4" />
            Risk Trends
          </TabsTrigger>
          <TabsTrigger
            value="dos-distribution"
            className="flex items-center gap-2 rounded-none"
          >
            <BarChart3 className="h-4 w-4" />
            Days of Supply
          </TabsTrigger>
          <TabsTrigger
            value="assistance-requests"
            className="flex items-center gap-2 rounded-none"
          >
            <LineChart className="h-4 w-4" />
            Assistance Requests
          </TabsTrigger>
          <TabsTrigger
            value="supplier-performance"
            className="flex items-center gap-2 rounded-none"
          >
            <AlertTriangle className="h-4 w-4" />
            Supplier Risk
          </TabsTrigger>
        </TabsList>

        {/* Risk Trend Chart */}
        <TabsContent value="risk-trends" className="space-y-4">
          <div className="bg-background p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-red-500" />
                    Risk Score Trend - {filters.horizon} Day Horizon
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Average risk scores and parts at risk over the last 12
                    months
                  </p>
                </div>
                <Badge variant="outline" className="rounded-none">
                  {charts.riskTrend?.data_points?.length || 0} data points
                </Badge>
              </div>
            </div>
            <div>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsLineChart
                  data={charts.riskTrend?.data_points || []}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    }
                    formatter={(value, name) => [
                      typeof value === "number" ? value : value,
                      name === "high_risk"
                        ? "High Risk Parts"
                        : name === "medium_risk"
                        ? "Medium Risk Parts"
                        : name === "low_risk"
                        ? "Low Risk Parts"
                        : name === "total_parts"
                        ? "Total Parts"
                        : name,
                    ]}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="high_risk"
                    stroke="#ef4444"
                    strokeWidth={3}
                    name="High Risk Parts"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="medium_risk"
                    stroke="#f97316"
                    strokeWidth={2}
                    name="Medium Risk Parts"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="low_risk"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Low Risk Parts"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="total_parts"
                    stroke="#6b7280"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    name="Total Parts"
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* Days of Supply Distribution */}
        <TabsContent value="dos-distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Days of Supply Distribution
                  </CardTitle>
                  <CardDescription>
                    Distribution of current inventory levels across all parts
                  </CardDescription>
                </div>
                <Badge variant="outline">Fleet-wide analysis</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={charts.dosDistribution?.data_points || []}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      `${value} parts`,
                      name === "count" ? "Part Count" : name,
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name="Part Count">
                    {charts.dosDistribution?.data_points?.map(
                      (entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.risk_level === "critical"
                              ? "#ef4444"
                              : entry.risk_level === "high"
                              ? "#f97316"
                              : entry.risk_level === "medium"
                              ? "#eab308"
                              : entry.risk_level === "moderate"
                              ? "#3b82f6"
                              : "#22c55e"
                          }
                        />
                      )
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assistance Request Trends */}
        <TabsContent value="assistance-requests" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-purple-500" />
                    Assistance Request Trends
                  </CardTitle>
                  <CardDescription>
                    Monthly breakdown of Depot (202), Field (107), and DLA (339)
                    requests
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-blue-600">
                    202 Depot
                  </Badge>
                  <Badge variant="outline" className="text-purple-600">
                    107 Field
                  </Badge>
                  <Badge variant="outline" className="text-cyan-600">
                    339 DLA
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart
                  data={charts.assistanceRequestTrend?.data_points || []}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        year: "2-digit",
                      })
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })
                    }
                    formatter={(value, name) => [
                      `${value} requests`,
                      name === "depot_202"
                        ? "Depot (202)"
                        : name === "field_107"
                        ? "Field (107)"
                        : name === "dla_339"
                        ? "DLA (339)"
                        : name === "total_requests"
                        ? "Total Requests"
                        : name,
                    ]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="depot_202"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                    name="Depot (202)"
                  />
                  <Area
                    type="monotone"
                    dataKey="field_107"
                    stackId="1"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                    name="Field (107)"
                  />
                  <Area
                    type="monotone"
                    dataKey="dla_339"
                    stackId="1"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.6}
                    name="DLA (339)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supplier Risk */}
        <TabsContent value="supplier-performance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Supplier Risk Assessment
                  </CardTitle>
                  <CardDescription>
                    Suppliers experiencing delivery issues, quality problems, or
                    supply chain disruptions
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {charts.supplierPerformanceTrend?.data_points?.length || 0}{" "}
                  suppliers tracked
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={charts.supplierPerformanceTrend?.data_points || []}
                  margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="supplier_name"
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis yAxisId="left" domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 10]} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "risk_score"
                        ? `${Number(value).toFixed(1)}/10`
                        : name === "otd_percent"
                        ? `${Number(value).toFixed(1)}%`
                        : name === "quality_rating"
                        ? `${Number(value).toFixed(1)}/5`
                        : name === "lead_time_avg"
                        ? `${value} days`
                        : value,
                      name === "risk_score"
                        ? "Risk Score"
                        : name === "otd_percent"
                        ? "On-Time Delivery"
                        : name === "quality_rating"
                        ? "Quality Rating"
                        : name === "lead_time_avg"
                        ? "Avg Lead Time"
                        : name,
                    ]}
                  />
                  <Legend />
                  <Bar
                    yAxisId="right"
                    dataKey="risk_score"
                    fill="#ef4444"
                    name="Risk Score (0-10)"
                    radius={[4, 4, 0, 0]}
                  >
                    {(charts.supplierPerformanceTrend?.data_points || []).map(
                      (entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.risk_score >= 7
                              ? "#dc2626"
                              : entry.risk_score >= 4
                              ? "#f97316"
                              : "#22c55e"
                          }
                        />
                      )
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
