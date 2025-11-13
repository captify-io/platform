"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Badge } from "@captify-io/core";
import { apiClient } from "@captify-io/core";
import type { Agent, Provider, ProviderModel } from "@captify-io/core/types";
import {
  Settings2,
  Plus,
  Bot,
  Sparkles,
  Database,
  Code,
  Wrench,
  Clock,
  User,
  Globe,
  Lock
} from "lucide-react";

export default function AgentStudioPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<ProviderModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load agents
      const agentsResult = await apiClient.run({
        service: "platform.dynamodb",
        operation: "scan",
        table: "core-agent",
        data: {},
      });
      setAgents(agentsResult.data?.Items || []);

      // Load providers
      const providersResult = await apiClient.run({
        service: "platform.dynamodb",
        operation: "scan",
        table: "core-provider",
        data: {},
      });
      setProviders(providersResult.data?.Items || []);

      // Load models
      const modelsResult = await apiClient.run({
        service: "platform.dynamodb",
        operation: "scan",
        table: "core-provider-model",
        data: {},
      });
      setModels(modelsResult.data?.Items || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProviderName = (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    return provider?.name || "Not configured";
  };

  const getModelName = (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    return model?.name || "Not configured";
  };

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case "bedrock":
        return <Sparkles className="h-5 w-5" />;
      case "assistant":
        return <Bot className="h-5 w-5" />;
      case "workflow":
        return <Database className="h-5 w-5" />;
      default:
        return <Bot className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-500/10 text-green-700 border-green-200";
      case "draft":
        return "bg-gray-500/10 text-gray-700 border-gray-200";
      case "archived":
        return "bg-orange-500/10 text-orange-700 border-orange-200";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto py-6 px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Agent Studio</h1>
              <p className="text-muted-foreground mt-2">
                Configure and manage your AI agents with advanced settings and tools
              </p>
            </div>
            <Button onClick={() => router.push("/agent/builder")} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Create New Agent
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Total Agents</span>
              </div>
              <p className="text-2xl font-bold mt-1">{agents.length}</p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Published</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {agents.filter((a) => a.status === "published").length}
              </p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">With Tools</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {agents.filter((a) => a.config?.toolIds?.length > 0).length}
              </p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Code Interpreter</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {agents.filter((a) => a.config?.codeInterpreter).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-6 px-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="text-muted-foreground mt-4">Loading agents...</p>
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No agents found</h3>
              <p className="text-muted-foreground mb-6">
                Get started by creating your first AI agent
              </p>
              <Button onClick={() => router.push("/agent/builder")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Agent
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="group border rounded-lg bg-card hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
                  onClick={() => router.push(`/agent/studio/${agent.id}`)}
                >
                  {/* Card Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          {getAgentTypeIcon(agent.type || "assistant")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {agent.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={getStatusColor(agent.status || "draft")}
                            >
                              {agent.status || "draft"}
                            </Badge>
                            {agent.visibility === "public" ? (
                              <Globe className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/agent/studio/${agent.id}`);
                        }}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {agent.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {agent.description}
                      </p>
                    )}
                  </div>

                  {/* Card Body - Configuration Details */}
                  <div className="px-6 pb-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5" />
                        Provider
                      </span>
                      <span className="font-medium truncate max-w-[180px]">
                        {getProviderName(agent.config?.providerId)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Bot className="h-3.5 w-3.5" />
                        Model
                      </span>
                      <span className="font-medium truncate max-w-[180px]">
                        {getModelName(agent.config?.modelId)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Wrench className="h-3.5 w-3.5" />
                        Tools
                      </span>
                      <span className="font-medium">
                        {agent.config?.toolIds?.length || 0} configured
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        Updated
                      </span>
                      <span className="font-medium">
                        {new Date(agent.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer - Capabilities */}
                  <div className="px-6 py-3 bg-muted/50 border-t">
                    <div className="flex items-center gap-2 flex-wrap">
                      {agent.config?.codeInterpreter && (
                        <Badge variant="secondary" className="text-xs">
                          <Code className="h-3 w-3 mr-1" />
                          Code
                        </Badge>
                      )}
                      {agent.config?.fileSearch && (
                        <Badge variant="secondary" className="text-xs">
                          <Database className="h-3 w-3 mr-1" />
                          Files
                        </Badge>
                      )}
                      {agent.config?.toolIds?.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <Wrench className="h-3 w-3 mr-1" />
                          {agent.config.toolIds.length} Tools
                        </Badge>
                      )}
                      {!agent.config?.codeInterpreter &&
                        !agent.config?.fileSearch &&
                        !agent.config?.toolIds?.length && (
                          <span className="text-xs text-muted-foreground">
                            No capabilities configured
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
