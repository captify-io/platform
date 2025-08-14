"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DynamicIcon } from "lucide-react/dynamic";
import type { WorkbenchSummary } from "@/app/mi/services/workbench-api-client";

interface WorkbenchSummaryCardsProps {
  summary: WorkbenchSummary | null;
  loading?: boolean;
}

export default function WorkbenchSummaryCards({
  summary,
  loading = false,
}: WorkbenchSummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const cards = [
    {
      title: "Total Issues",
      value: summary.totalIssues,
      description: "All workbench items",
      icon: "clipboard-list",
      color: "blue",
    },
    {
      title: "Open Issues",
      value: summary.openIssues,
      description: "Requiring attention",
      icon: "circle-dot",
      color: "orange",
    },
    {
      title: "Critical Issues",
      value: summary.criticalIssues,
      description: "High priority",
      icon: "alert-triangle",
      color: "red",
    },
    {
      title: "Pending Decisions",
      value: summary.pendingDecisions,
      description: "Awaiting approval",
      icon: "clock",
      color: "yellow",
    },
    {
      title: "Implemented",
      value: summary.implementedSolutions,
      description: "Solutions deployed",
      icon: "check-circle",
      color: "green",
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "orange":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "red":
        return "text-red-600 bg-red-50 border-red-200";
      case "yellow":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "green":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card, index) => (
        <Card key={index} className={`border ${getColorClasses(card.color)}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <DynamicIcon name={card.icon as any} className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
