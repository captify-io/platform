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
import { DynamicIcon } from "lucide-react/dynamic";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { miApi } from "../services/api-client";
import type { BOMData } from "../types";

export default function BOMExplorerPage() {
  const [bomData, setBomData] = useState<BOMData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState("nsn:2840-00-123-4567");
  const [depth, setDepth] = useState("3");
  const [view, setView] = useState("Engineering");

  const fetchBOMData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the MI API client with proper authentication
      const response = await miApi.getBOM({
        nodeId: selectedNode,
        depth,
        view,
      });

      if (!response.ok) {
        throw new Error(
          response.error || `HTTP error! status: ${response.status}`
        );
      }

      if (response.data) {
        setBomData(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch BOM data");
    } finally {
      setLoading(false);
    }
  }, [selectedNode, depth, view]);

  useEffect(() => {
    fetchBOMData();
  }, [fetchBOMData]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading BOM data...</p>
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
              Error Loading BOM Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchBOMData}>
              <DynamicIcon name="refresh-cw" size={16} className="mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!bomData) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">BOM Explorer</h1>
        <p className="text-muted-foreground">
          150% Bill of Materials with configurations & variants
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DynamicIcon name="settings" size={20} className="mr-2" />
            Explorer Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Root Node
              </label>
              <Input
                value={selectedNode}
                onChange={(e) => setSelectedNode(e.target.value)}
                placeholder="Enter NSN or Part Number"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Depth</label>
              <Select value={depth} onValueChange={setDepth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Level</SelectItem>
                  <SelectItem value="2">2 Levels</SelectItem>
                  <SelectItem value="3">3 Levels</SelectItem>
                  <SelectItem value="4">4 Levels</SelectItem>
                  <SelectItem value="5">5 Levels</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">View</label>
              <Select value={view} onValueChange={setView}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Supply Chain">Supply Chain</SelectItem>
                  <SelectItem value="Sustainment">Sustainment</SelectItem>
                  <SelectItem value="SPO">SPO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchBOMData} className="w-full">
                <DynamicIcon name="search" size={16} className="mr-2" />
                Explore
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(1 + bomData.children.length).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {(
                (bomData.rootNode.costImpact +
                  bomData.children.reduce(
                    (sum, child) => sum + child.costImpact,
                    0
                  )) /
                1000
              ).toLocaleString()}
              K
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Lead Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bomData.suppliers.length > 0
                ? Math.round(
                    bomData.suppliers.reduce((sum, s) => sum + s.leadDays, 0) /
                      bomData.suppliers.length
                  )
                : 0}
              d
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              High Risk Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {bomData.children.filter((child) => child.riskScore > 0.7).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="hierarchy" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hierarchy">BOM Hierarchy</TabsTrigger>
          <TabsTrigger value="analytics">Cost Analytics</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="actions">Priority Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="hierarchy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DynamicIcon name="network" size={20} className="mr-2" />
                BOM Structure
              </CardTitle>
              <CardDescription>
                Interactive hierarchy for {bomData.metadata.nodeId} •{" "}
                {bomData.metadata.view} View
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                {/* Root Node */}
                <div className="border-l-2 border-blue-500 pl-4 mb-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold">{bomData.rootNode.name}</h3>
                      <p className="text-sm text-gray-600">
                        Level {bomData.rootNode.level} •{" "}
                        {bomData.rootNode.entity}
                      </p>
                      <p className="text-xs text-gray-500">
                        Cost Impact: $
                        {(bomData.rootNode.costImpact / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <Badge
                      className={
                        bomData.rootNode.riskScore > 0.7
                          ? "bg-red-100 text-red-800"
                          : bomData.rootNode.riskScore > 0.5
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }
                    >
                      Risk: {(bomData.rootNode.riskScore * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>

                {/* Children */}
                {bomData.children.map((child) => (
                  <div
                    key={child.id}
                    className="border-l-2 border-gray-300 pl-4 mb-2 ml-4"
                  >
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{child.name}</h4>
                        <p className="text-sm text-gray-600">
                          Level {child.level} • {child.entity}
                        </p>
                        <p className="text-xs text-gray-500">
                          Cost Impact: ${(child.costImpact / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <Badge
                        className={
                          child.riskScore > 0.7
                            ? "bg-red-100 text-red-800"
                            : child.riskScore > 0.5
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }
                      >
                        Risk: {(child.riskScore * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bomData.chartData.riskDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="risk" fill="var(--chart-1)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Impact Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bomData.chartData.riskDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cost" fill="var(--chart-2)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={bomData.chartData.supplierMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="leadTime"
                    fill="var(--chart-1)"
                    name="Lead Time (days)"
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="risk"
                    fill="var(--chart-2)"
                    name="Risk Score"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bomData.priorityActions.map((action) => (
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
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-medium mb-2">{action.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {action.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Action ID: {action.id}
                    </span>
                    <Button size="sm" variant="outline">
                      <DynamicIcon
                        name="external-link"
                        size={14}
                        className="mr-1"
                      />
                      {action.action === "navigate" ? "View" : "Alert"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
