"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Play,
  Settings,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/apps/AppLayout";
import {
  agentService,
  getAgentStatusColor,
  getAgentStatusIcon,
} from "@/lib/agents";
import { BedrockAgent } from "@/types/agents";
import { FOUNDATION_MODEL_DISPLAY_NAMES } from "@/lib/aws-bedrock";

export default function AgentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<BedrockAgent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);

  const loadAgent = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedAgent = await agentService.getAgent(agentId);
      setAgent(fetchedAgent);
      setError(null);
    } catch (err) {
      console.error("Error loading agent:", err);
      setError("Failed to load agent details");
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    if (agentId) {
      loadAgent();
    }
  }, [agentId, loadAgent]);

  const handlePrepareAgent = async () => {
    if (!agent) return;

    setPreparing(true);
    try {
      await agentService.prepareAgent(agentId);
      await loadAgent(); // Refresh agent data
    } catch (err) {
      console.error("Error preparing agent:", err);
      alert("Failed to prepare agent");
    } finally {
      setPreparing(false);
    }
  };

  const handleEditAgent = () => {
    router.push(`/agents/${agentId}/edit`);
  };

  const handleTestAgent = () => {
    router.push(`/agents/${agentId}/test`);
  };

  const handleDeleteAgent = async () => {
    if (!agent) return;

    if (
      confirm(
        `Are you sure you want to delete "${agent.agentName}"? This action cannot be undone.`
      )
    ) {
      try {
        await agentService.deleteAgent(agentId);
        router.push("/agents");
      } catch (err) {
        console.error("Error deleting agent:", err);
        alert("Failed to delete agent");
      }
    }
  };

  const handleBack = () => {
    router.push("/agents");
  };

  if (loading) {
    return (
      <AppLayout applicationName="Agent Details" showChat={false}>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <p className="text-muted-foreground">Loading agent details...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !agent) {
    return (
      <AppLayout applicationName="Agent Details" showChat={false}>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Bot className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <p className="text-destructive mb-4">
                {error || "Agent not found"}
              </p>
              <Button onClick={handleBack} variant="outline">
                Back to Agents
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout applicationName={`Agent: ${agent.agentName}`} showChat={false}>
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Agents</span>
          </Button>
        </div>

        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {agent.agentName}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getAgentStatusColor(
                    agent.agentStatus
                  )}`}
                >
                  {getAgentStatusIcon(agent.agentStatus)} {agent.agentStatus}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  Version {agent.agentVersion || "Draft"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={loadAgent}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            {agent.agentStatus === "NOT_PREPARED" && (
              <Button onClick={handlePrepareAgent} disabled={preparing}>
                {preparing ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {preparing ? "Preparing..." : "Prepare Agent"}
              </Button>
            )}
            {agent.agentStatus === "PREPARED" && (
              <Button onClick={handleTestAgent}>
                <Play className="h-4 w-4 mr-2" />
                Test Agent
              </Button>
            )}
            <Button variant="outline" onClick={handleEditAgent}>
              <Settings className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={handleDeleteAgent}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status Messages */}
        {agent.failureReasons && agent.failureReasons.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-destructive">
                  Agent Preparation Failed
                </h3>
                <ul className="mt-2 text-sm text-destructive/80 list-disc list-inside">
                  {agent.failureReasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
                {agent.recommendedActions &&
                  agent.recommendedActions.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-destructive">
                        Recommended Actions:
                      </h4>
                      <ul className="mt-1 text-sm text-destructive/80 list-disc list-inside">
                        {agent.recommendedActions.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Agent ID
                </label>
                <p className="text-sm text-gray-900 dark:text-white font-mono">
                  {agent.agentId}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Description
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {agent.description || "No description provided"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Foundation Model
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {FOUNDATION_MODEL_DISPLAY_NAMES[
                    agent.foundationModel as keyof typeof FOUNDATION_MODEL_DISPLAY_NAMES
                  ] || agent.foundationModel}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Created
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(agent.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Last Updated
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(agent.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {agent.agentResourceRoleArn && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Resource Role ARN
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white font-mono break-all">
                    {agent.agentResourceRoleArn}
                  </p>
                </div>
              )}

              {agent.customerEncryptionKeyArn && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Encryption Key ARN
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white font-mono break-all">
                    {agent.customerEncryptionKeyArn}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Idle Session TTL
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {agent.idleSessionTTLInSeconds
                    ? `${agent.idleSessionTTLInSeconds} seconds`
                    : "Default (3600 seconds)"}
                </p>
              </div>

              {agent.memoryConfiguration && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Memory Configuration
                  </label>
                  <div className="text-sm text-gray-900 dark:text-white">
                    <p>
                      Types:{" "}
                      {agent.memoryConfiguration.enabledMemoryTypes.join(", ")}
                    </p>
                    {agent.memoryConfiguration.storageDays && (
                      <p>
                        Storage: {agent.memoryConfiguration.storageDays} days
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Agent Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                  {agent.instruction || "No instructions provided"}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
