"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@captify-io/core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@captify-io/core/ui";
import {
  Activity,
  MessageSquare,
  Workflow,
  Database,
  TrendingUp,
  Users,
  Zap,
  Clock,
} from "lucide-react";

interface AgentStats {
  totalAgents: number;
  totalWorkflows: number;
  totalSpaces: number;
  recentActivity: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<AgentStats>({
    totalAgents: 0,
    totalWorkflows: 0,
    totalSpaces: 0,
    recentActivity: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch agent count
        const agentsResponse = await apiClient.run({
          service: "platform.dynamodb",
          operation: "scan",
          table: "core-agent",
          data: { Select: "COUNT" },
        });

        // Fetch workflow count
        const workflowsResponse = await apiClient.run({
          service: "platform.dynamodb",
          operation: "scan",
          table: "core-agent-workflow",
          data: { Select: "COUNT" },
        });

        // Fetch spaces count
        const spacesResponse = await apiClient.run({
          service: "platform.dynamodb",
          operation: "scan",
          table: "core-space",
          data: { Select: "COUNT" },
        });

        setStats({
          totalAgents: agentsResponse.data?.Count || 0,
          totalWorkflows: workflowsResponse.data?.Count || 0,
          totalSpaces: spacesResponse.data?.Count || 0,
          recentActivity: 0, // Placeholder for future implementation
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Agents",
      value: stats.totalAgents,
      icon: MessageSquare,
      description: "Active AI agents",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Workflows",
      value: stats.totalWorkflows,
      icon: Workflow,
      description: "Agent workflows",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Data Spaces",
      value: stats.totalSpaces,
      icon: Database,
      description: "Knowledge bases",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Recent Activity",
      value: stats.recentActivity,
      icon: Activity,
      description: "Last 24 hours",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  const quickLinks = [
    {
      title: "Providers",
      description: "Manage LLM providers and API keys",
      icon: Zap,
      href: "/providers",
      color: "text-yellow-500",
    },
    {
      title: "Applications",
      description: "Manage platform applications",
      icon: Users,
      href: "/applications",
      color: "text-indigo-500",
    },
    {
      title: "Spaces",
      description: "Organize data and knowledge",
      icon: Database,
      href: "/spaces",
      color: "text-teal-500",
    },
  ];

  return (
    <div className="h-full w-full p-8 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Home</h1>
          <p className="text-muted-foreground">
            Overview of agent activities and platform analytics
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {loading ? (
                      <div className="h-9 w-16 bg-muted animate-pulse rounded" />
                    ) : (
                      stat.value
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest agent and workflow events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                        <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Trending */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending
              </CardTitle>
              <CardDescription>Most active agents and workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                        <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No trending data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.title}
                  href={link.href}
                  className="flex items-start gap-4 p-6 border rounded-lg hover:bg-accent transition-colors group"
                >
                  <div className="p-3 bg-accent rounded-lg group-hover:bg-accent/80">
                    <Icon className={`h-6 w-6 ${link.color}`} />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">{link.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {link.description}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
