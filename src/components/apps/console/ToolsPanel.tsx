"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Calculator,
  BarChart3,
  FileCheck,
  Cog,
  TrendingUp,
  LineChart,
  Grid3x3,
  Wrench,
  Puzzle,
  Settings,
  Star,
  Clock,
  LucideIcon,
} from "lucide-react";

interface Tool {
  id: string;
  name: string;
  category:
    | "analysis"
    | "visualization"
    | "automation"
    | "integration"
    | "reporting";
  status: "available" | "running" | "disabled";
  description: string;
  icon: LucideIcon;
  favorite?: boolean;
  lastUsed?: Date;
}

export function ToolsPanel() {
  const [tools] = useState<Tool[]>([
    {
      id: "data-analyzer",
      name: "Data Analyzer",
      category: "analysis",
      status: "available",
      description: "Statistical analysis and patterns",
      icon: Calculator,
      favorite: true,
      lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: "chart-builder",
      name: "Chart Builder",
      category: "visualization",
      status: "available",
      description: "Create interactive charts",
      icon: BarChart3,
      favorite: true,
      lastUsed: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      id: "report-generator",
      name: "Report Generator",
      category: "reporting",
      status: "available",
      description: "Generate comprehensive reports",
      icon: FileCheck,
      lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: "trend-analyzer",
      name: "Trend Analyzer",
      category: "analysis",
      status: "available",
      description: "Identify trends and forecasts",
      icon: TrendingUp,
    },
    {
      id: "time-series",
      name: "Time Series Analysis",
      category: "analysis",
      status: "available",
      description: "Time series modeling",
      icon: LineChart,
    },
    {
      id: "data-grid",
      name: "Data Explorer",
      category: "visualization",
      status: "available",
      description: "Interactive data exploration",
      icon: Grid3x3,
    },
    {
      id: "workflow-automation",
      name: "Workflow Automation",
      category: "automation",
      status: "disabled",
      description: "Automate data processing",
      icon: Cog,
    },
    {
      id: "api-connector",
      name: "API Connector",
      category: "integration",
      status: "available",
      description: "Connect external APIs",
      icon: Puzzle,
    },
    {
      id: "data-quality",
      name: "Data Quality",
      category: "analysis",
      status: "running",
      description: "Validate data quality",
      icon: Wrench,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", name: "All", count: tools.length },
    {
      id: "analysis",
      name: "Analysis",
      count: tools.filter((t) => t.category === "analysis").length,
    },
    {
      id: "visualization",
      name: "Viz",
      count: tools.filter((t) => t.category === "visualization").length,
    },
    {
      id: "reporting",
      name: "Reports",
      count: tools.filter((t) => t.category === "reporting").length,
    },
    {
      id: "automation",
      name: "Auto",
      count: tools.filter((t) => t.category === "automation").length,
    },
    {
      id: "integration",
      name: "API",
      count: tools.filter((t) => t.category === "integration").length,
    },
  ];

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const favoriteTools = tools.filter((tool) => tool.favorite);
  const recentlyUsedTools = tools
    .filter((tool) => tool.lastUsed)
    .sort((a, b) => (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0))
    .slice(0, 3);

  const getStatusBadge = (status: Tool["status"]) => {
    if (status === "running") {
      return <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />;
    }
    if (status === "disabled") {
      return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
    return <div className="w-2 h-2 bg-green-500 rounded-full" />;
  };

  const formatLastUsed = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "now";
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const handleToolAction = (tool: Tool) => {
    if (tool.status === "disabled") return;
    console.log(`Executing tool: ${tool.name}`);
  };

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Available Tools</h3>
        <Badge variant="outline" className="text-xs">
          {filteredTools.length}
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 w-3 h-3 text-muted-foreground" />
        <Input
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-7 h-8 text-xs"
        />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-1">
        {categories.map((category) => (
          <Button
            key={category.id}
            size="sm"
            variant={selectedCategory === category.id ? "default" : "outline"}
            onClick={() => setSelectedCategory(category.id)}
            className="h-6 px-2 text-xs"
          >
            {category.name} ({category.count})
          </Button>
        ))}
      </div>

      {/* Quick Access - Favorites */}
      {favoriteTools.length > 0 &&
        selectedCategory === "all" &&
        !searchQuery && (
          <div className="space-y-2">
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-yellow-500" />
              <p className="text-xs font-medium">Favorites</p>
            </div>
            <div className="space-y-1">
              {favoriteTools.map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleToolAction(tool)}
                >
                  <tool.icon className="w-3 h-3" />
                  <span className="text-xs font-medium flex-1">
                    {tool.name}
                  </span>
                  {tool.status === "running" && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      {/* All Tools */}
      <div className="flex-1 flex flex-col min-h-0">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          {selectedCategory === "all"
            ? "All Tools"
            : `${
                categories.find((c) => c.id === selectedCategory)?.name
              } Tools`}
        </p>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-3">
              {filteredTools.map((tool) => (
                <Card key={tool.id} className="p-0">
                  <CardContent className="p-3">
                    <div
                      className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 -m-3 p-3 rounded transition-colors"
                      onClick={() => handleToolAction(tool)}
                    >
                      <tool.icon className="w-4 h-4" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-xs font-medium truncate">
                            {tool.name}
                          </p>
                          {tool.favorite && (
                            <Star className="w-3 h-3 text-yellow-500" />
                          )}
                          {getStatusBadge(tool.status)}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {tool.description}
                        </p>
                        {tool.lastUsed && (
                          <p className="text-xs text-muted-foreground">
                            {formatLastUsed(tool.lastUsed)} ago
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredTools.length === 0 && (
                <div className="text-center py-6">
                  <Wrench className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    No tools found
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
