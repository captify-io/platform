"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@captify-io/core";
import { apiClient } from "@captify-io/core";
import type { Agent, App } from "@captify-io/core/types";
import { Plus, Globe, Lock, Bot, Zap } from "lucide-react";

export default function AgentBuilderPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [applications, setApplications] = useState<App[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const agentsResult = await apiClient.run({
        service: "platform.dynamodb",
        operation: "scan",
        table: "core-agent",
        data: {},
      });
      // Filter out workflow type agents - they are managed in a different page
      const loadedAgents = (agentsResult.data?.Items || []).filter(
        (agent: Agent) => agent.type !== "workflow"
      );
      setAgents(loadedAgents);

      const appsResult = await apiClient.run({
        service: "platform.dynamodb",
        operation: "scan",
        table: "core-app",
        data: {},
      });
      setApplications(appsResult.data?.Items || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const now = new Date().toISOString();
      const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await apiClient.run({
        service: "platform.dynamodb",
        operation: "put",
        table: "core-agent",
        data: {
          Item: {
            id: agentId,
            slug: `new-agent-${Date.now()}`,
            tenantId: "default",
            name: "New Agent",
            description: "",
            app: "platform",
            order: 0,
            fields: {},
            ownerId: "current-user",
            createdAt: now,
            createdBy: "current-user",
            updatedAt: now,
            updatedBy: "current-user",
            type: "assistant",
            status: "draft",
            visibility: "private",
            config: {
              systemPrompt: "",
              temperature: 0.7,
              maxTokens: 4096,
            },
          },
        },
      });

      router.push(`/agent/builder/${agentId}`);
    } catch (error) {
      console.error("Failed to create agent:", error);
      alert("Failed to create agent");
      setCreating(false);
    }
  };

  const getApplicationName = (appId: string) => {
    const app = applications.find((a) => a.id === appId);
    return app?.name || "Unknown Application";
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Builder</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage assistants and agents
          </p>
        </div>
        <Button onClick={handleCreate} disabled={creating}>
          <Plus className="mr-2 h-4 w-4" />
          {creating ? "Creating..." : "Create Agent"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No agents found
          </div>
        ) : (
          agents.map((agent) => (
            <div
              key={agent.id}
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/agent/builder/${agent.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {agent.type === "bedrock" ? (
                      <Zap className="h-5 w-5 text-primary" />
                    ) : (
                      <Bot className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{agent.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {agent.visibility === "public" ? (
                        <Globe className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="text-xs text-muted-foreground capitalize">
                        {agent.type === "bedrock" ? "Agent" : "Assistant"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {agent.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {agent.description}
                </p>
              )}

              <div className="space-y-2 text-sm">
                {agent.config?.applicationId && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Application:</span>
                    <span className="font-medium">
                      {getApplicationName(agent.config.applicationId)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium capitalize">{agent.status}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
