"use client";

import React, { useEffect, useState } from "react";
import { useCaptify } from "@captify/core/components";
import { apiClient } from "@captify/core/lib";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Progress,
  Alert,
  AlertDescription,
} from "@captify/core/components/ui";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  DollarSign,
  Users,
  Target,
  Activity,
  Clock,
} from "lucide-react";

export function CommandCenterPage() {
  const { session } = useCaptify();
  const [health, setHealth] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Check if user has Operations role
      const hasAccess = session?.user?.groups?.includes("Operations");

      if (!hasAccess) {
        setLoading(false);
        return;
      }

      const [healthResponse, dashboardResponse, recsResponse] =
        await Promise.all([
          apiClient.run({
            service: "performance",
            operation: "getCompanyHealth",
          }),
          apiClient.run({
            service: "performance",
            operation: "getExecutiveDashboard",
          }),
          apiClient.run({
            service: "intelligence",
            operation: "getRecommendations",
            data: { role: "executive" },
          }),
        ]);

      setHealth(healthResponse.data);
      setDashboard(dashboardResponse.data);
      setRecommendations(recsResponse.data || []);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">Loading...</div>
    );
  }

  if (!session?.user?.groups?.includes("Operations")) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need Operations role to view this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Command Center</h1>
          <p className="text-muted-foreground">
            Strategic business intelligence
          </p>
        </div>
        <Badge
          variant={health?.trend === "improving" ? "default" : "destructive"}
        >
          Health Score: {health?.score || 0}/100
        </Badge>
      </div>

      {/* Critical Alerts */}
      {dashboard?.health?.alerts?.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {dashboard.health.alerts[0].description}
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Runway</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.health?.runway?.toFixed(1) || 0} months
            </div>
            <p className="text-xs text-muted-foreground">Cash available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Burn</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(dashboard?.financial?.monthlyBurn / 1000 || 0).toFixed(0)}k
            </div>
            <div className="flex items-center text-xs">
              {dashboard?.health?.trend === "improving" ? (
                <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span>vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.operations?.utilizationRate?.toFixed(0) || 0}%
            </div>
            <Progress
              value={dashboard?.operations?.utilizationRate || 0}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.health?.profitMargin?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">Target: 15%</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Financial Forecast</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Best Case</span>
                <span className="text-sm font-medium">
                  ${(dashboard?.forecast?.bestCase / 1000000 || 0).toFixed(1)}M
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Likely</span>
                <span className="text-sm font-medium">
                  $
                  {(
                    dashboard?.forecast?.nextQuarter?.revenue / 1000000 || 0
                  ).toFixed(1)}
                  M
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Worst Case</span>
                <span className="text-sm font-medium">
                  ${(dashboard?.forecast?.worstCase / 1000000 || 0).toFixed(1)}M
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operational Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Delivery Velocity</span>
                <span className="text-sm font-medium">
                  {dashboard?.operations?.deliveryVelocity || 0} pts/sprint
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Customer Satisfaction</span>
                <span className="text-sm font-medium">
                  {dashboard?.operations?.customerSatisfaction?.toFixed(1) || 0}
                  /5
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">SLA Compliance</span>
                <span className="text-sm font-medium">
                  {dashboard?.operations?.slaCompliance || 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.slice(0, 3).map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <Badge
                    variant={
                      rec.priority === "high" ? "destructive" : "default"
                    }
                  >
                    {rec.priority}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{rec.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {rec.action}
                    </p>
                    {rec.impact && (
                      <p className="text-xs text-green-600 mt-1">
                        Impact: {rec.impact}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CommandCenterPage;
