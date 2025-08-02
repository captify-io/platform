"use client";

import { ApplicationWithSidebarLayout } from "@/components/layout/ApplicationWithSidebarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
  DollarSign,
  BarChart3,
  Users,
  Settings,
} from "lucide-react";

const menuItems = [
  {
    id: "overview",
    label: "Overview",
    icon: BarChart3,
    href: "/apps/materiel-insights",
  },
  {
    id: "inventory",
    label: "Inventory Analysis",
    icon: Package,
    href: "/apps/materiel-insights/inventory",
  },
  {
    id: "forecasting",
    label: "Demand Forecasting",
    icon: TrendingUp,
    href: "/apps/materiel-insights/forecasting",
  },
  {
    id: "alerts",
    label: "Critical Alerts",
    icon: AlertTriangle,
    href: "/apps/materiel-insights/alerts",
  },
  {
    id: "lead-times",
    label: "Lead Time Analysis",
    icon: Clock,
    href: "/apps/materiel-insights/lead-times",
  },
  {
    id: "cost-analysis",
    label: "Cost Analysis",
    icon: DollarSign,
    href: "/apps/materiel-insights/cost-analysis",
  },
  {
    id: "suppliers",
    label: "Supplier Management",
    icon: Users,
    href: "/apps/materiel-insights/suppliers",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/apps/materiel-insights/settings",
  },
];

// Sample data for the overview
const summaryStats = [
  {
    title: "Total Items",
    value: "12,847",
    change: "+5.2%",
    trend: "up",
    icon: Package,
  },
  {
    title: "Critical Stock",
    value: "234",
    change: "-12.1%",
    trend: "down",
    icon: AlertTriangle,
  },
  {
    title: "Avg Lead Time",
    value: "45 days",
    change: "+3.2%",
    trend: "up",
    icon: Clock,
  },
  {
    title: "Monthly Spend",
    value: "$2.4M",
    change: "-8.7%",
    trend: "down",
    icon: DollarSign,
  },
];

export default function MaterielInsightsPage() {
  return (
    <ApplicationWithSidebarLayout
      applicationId="materiel-insights"
      applicationName="Materiel Insights"
      menuItems={menuItems}
      showChat={true}
      chatWelcomeMessage="Welcome to Materiel Insights! I can help you analyze inventory data, forecast demand, and optimize your supply chain operations."
      chatPlaceholder="Ask about inventory levels, demand forecasting, or supply chain optimization..."
      agentId={process.env.NEXT_PUBLIC_AWS_BEDROCK_AGENT_ID}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Materiel Insights
            </h1>
            <p className="text-gray-600 mt-1">
              Advanced analytics and intelligence for materiel management
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge
              variant="outline"
              className="text-green-700 border-green-200 bg-green-50"
            >
              System Healthy
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
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stat.value}
                    </p>
                    <div className="flex items-center mt-2">
                      <span
                        className={`text-xs font-medium ${
                          stat.trend === "up"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {stat.change}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">
                        vs last month
                      </span>
                    </div>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      stat.trend === "up" ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    <stat.icon
                      className={`h-6 w-6 ${
                        stat.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}
                    />
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
              <BarChart3 className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col space-y-2"
              >
                <Package className="h-6 w-6" />
                <span className="text-sm">Inventory Report</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col space-y-2"
              >
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm">Demand Forecast</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col space-y-2"
              >
                <AlertTriangle className="h-6 w-6" />
                <span className="text-sm">Critical Items</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col space-y-2"
              >
                <DollarSign className="h-6 w-6" />
                <span className="text-sm">Cost Analysis</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Critical stock alert: Engine Component ABC-123
                  </p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Inventory update completed for B-52 components
                  </p>
                  <p className="text-xs text-gray-500">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    New demand forecast generated
                  </p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ApplicationWithSidebarLayout>
  );
}
