"use client";

import { useCaptify } from "@captify-io/core/components";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Bot, Eye, RefreshCw } from "lucide-react";
import { getEntitiesByTenant, listBedrockAgents } from "@/lib/ontology";
import type { Agent } from "@/types/ontology";
import { ONTOLOGY_TABLES } from "@/types/ontology";

export default function AgentsPage() {
  const { session } = useCaptify();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [bedrockAgents, setBedrockAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBedrock, setLoadingBedrock] = useState(false);

  useEffect(() => {
    if (session?.user) {
      loadAgents();
      loadBedrockResources();
    }
  }, [session]);

  async function loadAgents() {
    setLoading(true);
    const tenantId = (session.user as any).tenantId || "default";
    const response = await getEntitiesByTenant<Agent>(ONTOLOGY_TABLES.AGENT, tenantId);
    if (response.success && response.data?.items) {
      setAgents(response.data.items);
    }
    setLoading(false);
  }

  async function loadBedrockResources() {
    setLoadingBedrock(true);
    const response = await listBedrockAgents();
    if (response.success && response.data?.agentSummaries) {
      setBedrockAgents(response.data.agentSummaries);
    }
    setLoadingBedrock(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground">Manage AI agents and AWS Bedrock resources</p>
        </div>
        <button
          onClick={() => router.push("/captify/ontology/agents/new")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Agent
        </button>
      </div>

      {/* AWS Bedrock Agents */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <h2 className="text-xl font-semibold">AWS Bedrock Agents</h2>
          </div>
          <button
            onClick={loadBedrockResources}
            disabled={loadingBedrock}
            className="flex items-center gap-2 px-3 py-1 text-sm border rounded hover:bg-muted"
          >
            <RefreshCw className={`h-4 w-4 ${loadingBedrock ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
        {loadingBedrock ? (
          <div className="text-sm text-muted-foreground">Loading Bedrock agents...</div>
        ) : bedrockAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {bedrockAgents.map((agent) => (
              <div key={agent.agentId} className="border rounded p-3 hover:bg-muted">
                <div className="font-medium">{agent.agentName}</div>
                <div className="text-xs text-muted-foreground mt-1">ID: {agent.agentId}</div>
                <div className="text-xs text-muted-foreground">Status: {agent.agentStatus}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No Bedrock agents found</div>
        )}
      </div>

      {/* Registered Agents */}
      {loading ? (
        <div className="text-center py-12">Loading agents...</div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-lg">
          <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No agents registered yet</p>
          <button
            onClick={() => router.push("/captify/ontology/agents/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Register First Agent
          </button>
        </div>
      ) : (
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Registered Agents ({agents.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="border rounded p-4 hover:bg-muted cursor-pointer"
                onClick={() => router.push(`/captify/ontology/agents/${agent.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium">{agent.name}</div>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
                {agent.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {agent.description}
                  </p>
                )}
                {agent.bedrockAgentId && (
                  <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                    <Bot className="h-3 w-3" />
                    {agent.bedrockAgentId}
                  </div>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  Status: {agent.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
