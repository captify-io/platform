"use client";

import React, { useEffect, useState } from "react";
import { useCaptify } from "@captify/core/components";
import { apiClient } from "@captify/core/lib";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@captify/core/components/ui";

export function PerformancePage() {
  const { session } = useCaptify();
  const [businessHealth, setBusinessHealth] = useState<any>(null);
  const [burnAnalysis, setBurnAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      // Load business health metrics
      const healthResponse = await apiClient.run({
        service: "performance",
        operation: "getBusinessHealth",
        data: {},
      });
      setBusinessHealth(healthResponse.data || null);

      // Load burn analysis
      const burnResponse = await apiClient.run({
        service: "performance",
        operation: "calculateBurnAnalysis",
        data: { period: "month" },
      });
      setBurnAnalysis(burnResponse.data || null);
    } catch (error) {
      console.error("Failed to load performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Performance Analytics</h1>

      {/* Business Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Overall Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? "..." : businessHealth?.overallScore || 0}
            </div>
            <p className="text-xs text-muted-foreground">Health Score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {loading
                ? "..."
                : formatCurrency(businessHealth?.financial?.revenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Current Month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {loading
                ? "..."
                : `${Math.round(
                    businessHealth?.financial?.profitMargin || 0
                  )}%`}
            </div>
            <p className="text-xs text-muted-foreground">Current Margin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Team Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {loading
                ? "..."
                : `${businessHealth?.employee?.utilization || 0}%`}
            </div>
            <p className="text-xs text-muted-foreground">Current Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Financial Health</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : businessHealth?.financial ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Revenue:</span>
                  <span className="font-medium">
                    {formatCurrency(businessHealth.financial.revenue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Costs:</span>
                  <span className="font-medium">
                    {formatCurrency(businessHealth.financial.costs)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Profit:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(businessHealth.financial.profit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Runway:</span>
                  <span className="font-medium">
                    {Math.round(businessHealth.financial.runway)} months
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Backlog:</span>
                  <span className="font-medium">
                    {formatCurrency(businessHealth.financial.backlog)}
                  </span>
                </div>
              </div>
            ) : (
              <p>No financial data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : businessHealth?.employee ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Headcount:</span>
                  <span className="font-medium">
                    {businessHealth.employee.headcount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Utilization:</span>
                  <span className="font-medium">
                    {businessHealth.employee.utilization}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Satisfaction:</span>
                  <span className="font-medium">
                    {businessHealth.employee.satisfaction}/5.0
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Retention:</span>
                  <span className="font-medium">
                    {businessHealth.employee.retention}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Value/Employee:</span>
                  <span className="font-medium">
                    {formatCurrency(businessHealth.employee.valuePerEmployee)}
                  </span>
                </div>
              </div>
            ) : (
              <p>No employee data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Burn Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Burn Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : burnAnalysis ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Revenue</h4>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(burnAnalysis.revenue)}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Total Costs</h4>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(burnAnalysis.totalCosts)}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Net Profit</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(burnAnalysis.profit)}
                </p>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Efficiency</h4>
                <p className="text-lg">
                  {burnAnalysis.efficiency}% cost efficiency
                </p>
              </div>
            </div>
          ) : (
            <p>No burn analysis data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// CRITICAL: Must have default export for dynamic imports
export default PerformancePage;
