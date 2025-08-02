"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Bot,
  Search,
  MoreVertical,
  Play,
  Settings,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApplicationLayout } from "@/components/layout/ApplicationLayout";
import {
  agentService,
  getAgentStatusColor,
  getAgentStatusIcon,
} from "@/lib/agents";
import { BedrockAgent } from "@/types/agents";
import { FOUNDATION_MODEL_DISPLAY_NAMES } from "@/lib/aws-bedrock";

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<BedrockAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const fetchedAgents = await agentService.listAgents();
      setAgents(fetchedAgents);
      setError(null);
    } catch (err) {
      console.error("Error loading agents:", err);
      setError("Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = () => {
    router.push("/agents/new");
  };

  const handleViewAgent = (agentId: string) => {
    router.push(`/agents/${agentId}`);
  };

  const handleEditAgent = (agentId: string) => {
    router.push(`/agents/${agentId}/edit`);
  };

  const handleTestAgent = (agentId: string) => {
    router.push(`/agents/${agentId}/test`);
  };

  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    if (
      confirm(
        `Are you sure you want to delete "${agentName}"? This action cannot be undone.`
      )
    ) {
      try {
        await agentService.deleteAgent(agentId);
        await loadAgents(); // Refresh the list
      } catch (err) {
        console.error("Error deleting agent:", err);
        alert("Failed to delete agent");
      }
    }
  };

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || agent.agentStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusCounts = () => {
    const counts = {
      total: agents.length,
      prepared: agents.filter((a) => a.agentStatus === "PREPARED").length,
      creating: agents.filter((a) =>
        ["CREATING", "PREPARING", "UPDATING"].includes(a.agentStatus)
      ).length,
      failed: agents.filter((a) => a.agentStatus === "FAILED").length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <ApplicationLayout applicationName="Agent Management" showChat={false}>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
              <p className="text-gray-600 dark:text-gray-400">
                Loading agents...
              </p>
            </div>
          </div>
        </div>
      </ApplicationLayout>
    );
  }

  if (error) {
    return (
      <ApplicationLayout applicationName="Agent Management" showChat={false}>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Bot className="h-12 w-12 mx-auto mb-4 text-red-400" />
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button onClick={loadAgents} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </ApplicationLayout>
    );
  }

  return (
    <ApplicationLayout applicationName="Agent Management" showChat={false}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Agent Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and deploy AI agents for your applications
            </p>
          </div>
          <Button
            onClick={handleCreateAgent}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Agent</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Agents
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statusCounts.total}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 rounded-full bg-green-500"></div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Ready
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {statusCounts.prepared}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 rounded-full bg-yellow-500"></div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    In Progress
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {statusCounts.creating}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 rounded-full bg-red-500"></div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Failed
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {statusCounts.failed}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search agents by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="PREPARED">Ready</option>
            <option value="CREATING">Creating</option>
            <option value="PREPARING">Preparing</option>
            <option value="UPDATING">Updating</option>
            <option value="FAILED">Failed</option>
            <option value="NOT_PREPARED">Not Prepared</option>
          </select>
        </div>

        {/* Agents Grid */}
        {filteredAgents.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery || filterStatus !== "all"
                ? "No agents found"
                : "No agents yet"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery || filterStatus !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Get started by creating your first AI agent"}
            </p>
            {!searchQuery && filterStatus === "all" && (
              <Button onClick={handleCreateAgent}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Agent
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <Card
                key={agent.agentId}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {agent.agentName}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAgentStatusColor(
                              agent.agentStatus
                            )}`}
                          >
                            {getAgentStatusIcon(agent.agentStatus)}{" "}
                            {agent.agentStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <CardDescription className="line-clamp-2">
                      {agent.description || "No description provided"}
                    </CardDescription>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Model:
                      </span>
                      <span className="text-gray-900 dark:text-white truncate ml-2">
                        {FOUNDATION_MODEL_DISPLAY_NAMES[
                          agent.foundationModel as keyof typeof FOUNDATION_MODEL_DISPLAY_NAMES
                        ] || agent.foundationModel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Version:
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {agent.agentVersion || "Draft"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Updated:
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(agent.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewAgent(agent.agentId)}
                      className="flex-1"
                    >
                      View
                    </Button>
                    {agent.agentStatus === "PREPARED" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleTestAgent(agent.agentId)}
                        className="flex-1"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Test
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditAgent(agent.agentId)}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleDeleteAgent(agent.agentId, agent.agentName)
                      }
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ApplicationLayout>
  );
}
