"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Bot, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApplicationLayout } from "@/components/layout/ApplicationLayout";
import { agentService } from "@/lib/agents";
import { BedrockAgent, UpdateAgentRequest } from "@/types/agents";
import {
  FOUNDATION_MODELS,
  FOUNDATION_MODEL_DISPLAY_NAMES,
} from "@/lib/aws-bedrock";

export default function EditAgentPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<BedrockAgent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateAgentRequest>({
    agentId: "",
    agentName: "",
    description: "",
    instruction: "",
    foundationModel: FOUNDATION_MODELS.CLAUDE_3_5_SONNET,
    agentResourceRoleArn: "",
    idleSessionTTLInSeconds: 3600,
    memoryConfiguration: {
      enabledMemoryTypes: ["SESSION_SUMMARY"],
      storageDays: 30,
    },
  });

  const loadAgent = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedAgent = await agentService.getAgent(agentId);
      setAgent(fetchedAgent);

      // Populate form with agent data
      setFormData({
        agentId: fetchedAgent.agentId,
        agentName: fetchedAgent.agentName,
        description: fetchedAgent.description || "",
        instruction: fetchedAgent.instruction || "",
        foundationModel: fetchedAgent.foundationModel,
        agentResourceRoleArn: fetchedAgent.agentResourceRoleArn || "",
        idleSessionTTLInSeconds: fetchedAgent.idleSessionTTLInSeconds || 3600,
        memoryConfiguration: fetchedAgent.memoryConfiguration || {
          enabledMemoryTypes: ["SESSION_SUMMARY"],
          storageDays: 30,
        },
      });

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

  const handleInputChange = (
    field: keyof UpdateAgentRequest,
    value: string | number | boolean | object
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMemoryConfigChange = (
    field: keyof NonNullable<UpdateAgentRequest["memoryConfiguration"]>,
    value: string[] | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      memoryConfiguration: {
        ...prev.memoryConfiguration!,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agentName.trim()) {
      setError("Agent name is required");
      return;
    }

    if (!formData.instruction?.trim()) {
      setError("Instruction is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await agentService.updateAgent(formData);
      router.push(`/agents/${agentId}`);
    } catch (err) {
      console.error("Error updating agent:", err);
      setError("Failed to update agent. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/agents/${agentId}`);
  };

  if (loading) {
    return (
      <ApplicationLayout applicationName="Edit Agent" showChat={false}>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
              <p className="text-gray-600 dark:text-gray-400">
                Loading agent details...
              </p>
            </div>
          </div>
        </div>
      </ApplicationLayout>
    );
  }

  if (error && !agent) {
    return (
      <ApplicationLayout applicationName="Edit Agent" showChat={false}>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Bot className="h-12 w-12 mx-auto mb-4 text-red-400" />
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button onClick={handleBack} variant="outline">
                Back to Agent
              </Button>
            </div>
          </div>
        </div>
      </ApplicationLayout>
    );
  }

  return (
    <ApplicationLayout
      applicationName={`Edit: ${agent?.agentName || "Agent"}`}
      showChat={false}
    >
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
            <span>Back to Agent</span>
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <Bot className="h-8 w-8 text-blue-600" />
            <span>Edit Agent</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Update agent configuration and settings
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update the core properties of your agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agentName">Agent Name *</Label>
                  <Input
                    id="agentName"
                    value={formData.agentName}
                    onChange={(e) =>
                      handleInputChange("agentName", e.target.value)
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="foundationModel">Foundation Model</Label>
                  <select
                    id="foundationModel"
                    value={formData.foundationModel}
                    onChange={(e) =>
                      handleInputChange("foundationModel", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {Object.entries(FOUNDATION_MODEL_DISPLAY_NAMES).map(
                      ([key, display]) => (
                        <option key={key} value={key}>
                          {display}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Brief description of the agent's purpose"
                />
              </div>

              <div>
                <Label htmlFor="instruction">Agent Instructions *</Label>
                <Textarea
                  id="instruction"
                  value={formData.instruction}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    handleInputChange("instruction", e.target.value)
                  }
                  rows={6}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Update security and session settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="roleArn">IAM Role ARN</Label>
                <Input
                  id="roleArn"
                  value={formData.agentResourceRoleArn}
                  onChange={(e) =>
                    handleInputChange("agentResourceRoleArn", e.target.value)
                  }
                  placeholder="arn:aws:iam::123456789012:role/agent-execution-role"
                />
              </div>

              <div>
                <Label htmlFor="idleSessionTTL">
                  Idle Session TTL (seconds)
                </Label>
                <Input
                  id="idleSessionTTL"
                  type="number"
                  value={formData.idleSessionTTLInSeconds}
                  onChange={(e) =>
                    handleInputChange(
                      "idleSessionTTLInSeconds",
                      parseInt(e.target.value)
                    )
                  }
                  min={300}
                  max={3600}
                />
              </div>
            </CardContent>
          </Card>

          {/* Memory Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Memory Configuration</CardTitle>
              <CardDescription>
                Configure conversation memory settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Memory Types</Label>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.memoryConfiguration?.enabledMemoryTypes.includes(
                        "SESSION_SUMMARY"
                      )}
                      onChange={(e) => {
                        const types =
                          formData.memoryConfiguration?.enabledMemoryTypes ||
                          [];
                        if (e.target.checked) {
                          handleMemoryConfigChange("enabledMemoryTypes", [
                            ...types,
                            "SESSION_SUMMARY",
                          ]);
                        } else {
                          handleMemoryConfigChange(
                            "enabledMemoryTypes",
                            types.filter((t) => t !== "SESSION_SUMMARY")
                          );
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">Session Summary</span>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="storageDays">Memory Storage Days</Label>
                <Input
                  id="storageDays"
                  type="number"
                  value={formData.memoryConfiguration?.storageDays}
                  onChange={(e) =>
                    handleMemoryConfigChange(
                      "storageDays",
                      parseInt(e.target.value)
                    )
                  }
                  min={1}
                  max={365}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={handleBack}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </Button>
          </div>
        </form>
      </div>
    </ApplicationLayout>
  );
}
