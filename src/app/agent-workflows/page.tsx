"use client";

import {
  PageToolbar,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from "@captify-io/core/components";
import { Plus, Workflow, Bot, Play, Edit, Trash2, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@captify-io/core/lib/api";
import type { Agent } from "@captify-io/core/types";
import { useRouter } from "next/navigation";

export default function AgentWorkflowsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const result = await apiClient.run({
        service: "platform.dynamodb",
        operation: "scan",
        table: "core-Agent",
        data: {},
      });

      if (result.success && result.data?.Items) {
        // Filter to only show workflow type agents
        const workflowAgents = result.data.Items.filter(
          (agent: Agent) => agent.type === "workflow"
        );
        setAgents(workflowAgents);
      }
    } catch (error) {
      console.error("Failed to load agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const createNewAgent = async () => {
    console.log("Creating new agent...");
    setCreating(true);
    try {
      const newAgent: Partial<Agent> = {
        id: `agent-${Date.now()}`,
        slug: `agent-${Date.now()}`,
        name: "New Workflow Agent",
        description: "A new workflow-based agent",
        type: "workflow",
        status: "inactive",
        tenantId: "default",
        app: "platform",
        order: "0",
        fields: {},
        ownerId: "user",
        createdAt: new Date().toISOString(),
        createdBy: "user",
        updatedAt: new Date().toISOString(),
        updatedBy: "user",
        config: {
          workflowId: `workflow-${Date.now()}`,
        },
      };

      console.log("Creating agent record:", newAgent);
      const result = await apiClient.run({
        service: "platform.dynamodb",
        operation: "put",
        table: "core-Agent",
        data: {
          Item: newAgent,
        },
      });

      console.log("Agent creation result:", result);

      if (result.success) {
        // Create corresponding workflow
        const workflowId = newAgent.config?.workflowId;
        await apiClient.run({
          service: "platform.dynamodb",
          operation: "put",
          table: "core-AgentWorkflow",
          data: {
            Item: {
              id: workflowId,
              slug: workflowId,
              agentId: newAgent.id,
              name: "New Workflow",
              description: "Visual workflow definition",
              tenantId: "default",
              app: "platform",
              order: "0",
              fields: {},
              ownerId: "user",
              nodes: [],
              edges: [],
              settings: {},
              version: 1,
              status: "draft",
              createdAt: new Date().toISOString(),
              createdBy: "user",
              updatedAt: new Date().toISOString(),
              updatedBy: "user",
            },
          },
        });

        // Navigate to workflow editor
        console.log("Navigating to workflow:", workflowId);
        router.push(`/agent-workflows/${workflowId}`);
      } else {
        console.error("Agent creation failed:", result);
        alert("Failed to create agent. Check console for details.");
      }
    } catch (error) {
      console.error("Failed to create agent:", error);
      alert(`Error creating agent: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setCreating(false);
    }
  };

  const deleteAgent = async (agentId: string, workflowId?: string) => {
    if (!confirm("Are you sure you want to delete this agent and its workflow?")) {
      return;
    }

    try {
      // Delete agent
      await apiClient.run({
        service: "platform.dynamodb",
        operation: "delete",
        table: "core-Agent",
        data: {
          Key: { id: agentId },
        },
      });

      // Delete workflow if exists
      if (workflowId) {
        await apiClient.run({
          service: "platform.dynamodb",
          operation: "delete",
          table: "core-AgentWorkflow",
          data: {
            Key: { id: workflowId },
          },
        });
      }

      loadAgents();
    } catch (error) {
      console.error("Failed to delete agent:", error);
    }
  };

  const duplicateAgent = async (agent: Agent) => {
    try {
      const newWorkflowId = `workflow-${Date.now()}`;
      const duplicatedAgent: Partial<Agent> = {
        ...agent,
        id: `agent-${Date.now()}`,
        slug: `agent-${Date.now()}`,
        name: `${agent.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        config: {
          ...agent.config,
          workflowId: newWorkflowId,
        },
      };

      await apiClient.run({
        service: "platform.dynamodb",
        operation: "put",
        table: "core-Agent",
        data: {
          Item: duplicatedAgent,
        },
      });

      // Duplicate workflow if it exists
      if (agent.config?.workflowId) {
        const workflowResult = await apiClient.run({
          service: "platform.dynamodb",
          operation: "get",
          table: "core-AgentWorkflow",
          data: {
            Key: { id: agent.config.workflowId },
          },
        });

        if (workflowResult.success && workflowResult.data) {
          await apiClient.run({
            service: "platform.dynamodb",
            operation: "put",
            table: "core-AgentWorkflow",
            data: {
              Item: {
                ...workflowResult.data,
                id: newWorkflowId,
                slug: newWorkflowId,
                agentId: duplicatedAgent.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
          });
        }
      }

      loadAgents();
    } catch (error) {
      console.error("Failed to duplicate agent:", error);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "inactive":
        return "bg-gray-500";
      case "testing":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case "workflow":
        return <Workflow className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <PageToolbar
          title="Agent Workflows"
          description="Build and manage agent workflows"
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageToolbar
        title="Agent Workflows"
        description="Build and manage agent workflows"
      />

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Your Agents</h2>
              <p className="text-muted-foreground">
                {agents.length} {agents.length === 1 ? "agent" : "agents"} configured
              </p>
            </div>
            <Button onClick={createNewAgent} disabled={creating}>
              <Plus className="h-4 w-4 mr-2" />
              {creating ? "Creating..." : "Create Agent"}
            </Button>
          </div>

          {/* Agent Cards */}
          {agents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Workflow className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No agents yet</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  Create your first workflow agent to get started. Build visual workflows with
                  drag-and-drop nodes.
                </p>
                <Button onClick={createNewAgent} disabled={creating}>
                  <Plus className="h-4 w-4 mr-2" />
                  {creating ? "Creating..." : "Create Your First Agent"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(agent.type)}
                        <div>
                          <CardTitle className="text-lg">{agent.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={`${getStatusColor(agent.status)} text-white border-0`}
                            >
                              {agent.status}
                            </Badge>
                            <Badge variant="outline">{agent.type}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-2 line-clamp-2">
                      {agent.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => router.push(`/agent-workflows/${agent.config?.workflowId}`)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit Workflow
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/agent?agentId=${agent.id}`)}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Test
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => duplicateAgent(agent)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Duplicate
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteAgent(agent.id, agent.config?.workflowId)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>

                    <div className="mt-4 pt-4 border-t text-xs text-muted-foreground space-y-1">
                      {agent.providerId && (
                        <div>Provider: {agent.providerId}</div>
                      )}
                      {agent.modelId && (
                        <div>Model: {agent.modelId}</div>
                      )}
                      <div>Updated: {new Date(agent.updatedAt).toLocaleDateString()}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
