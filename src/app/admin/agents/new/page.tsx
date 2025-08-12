"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { AppLayout } from "@/components/apps/AppLayout";
import { agentService } from "@/lib/agents";
import { CreateAgentRequest } from "@/types/agents";
import { FOUNDATION_MODEL_DISPLAY_NAMES } from "@/lib/aws-bedrock";

export default function NewAgentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateAgentRequest>({
    agentName: "",
    description: "",
    instruction: "",
    foundationModel: "anthropic.claude-3-sonnet-20240229-v1:0",
    agentResourceRoleArn: "",
    customerEncryptionKeyArn: "",
    idleSessionTTLInSeconds: 3600,
    memoryConfiguration: {
      enabledMemoryTypes: ["SESSION_SUMMARY"],
      storageDays: 30,
    },
  });

  // Additional form state for unsupported advanced configurations
  const [advancedConfig, setAdvancedConfig] = useState({
    basePromptTemplate:
      "You are a helpful AI assistant. Process the user's request carefully and provide accurate, helpful responses.",
    temperature: 0.7,
    topP: 0.9,
    topK: 250,
    maximumLength: 4096,
  });

  const handleInputChange = (
    field: keyof CreateAgentRequest,
    value: string | number | boolean | object
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAdvancedConfigChange = (
    field: keyof typeof advancedConfig,
    value: string | number
  ) => {
    setAdvancedConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMemoryConfigChange = (
    field: keyof NonNullable<CreateAgentRequest["memoryConfiguration"]>,
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
      const agent = await agentService.createAgent(formData);
      router.push(`/agents/${agent.agentId}`);
    } catch (err) {
      console.error("Error creating agent:", err);
      setError("Failed to create agent. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push("/agents");
  };

  return (
    <AppLayout applicationName="Create Agent" showChat={false}>
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

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <Bot className="h-8 w-8 text-blue-600" />
            <span>Create New Agent</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Set up a new AI agent with custom instructions and configuration
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
                Define the core properties of your agent
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
                    placeholder="Enter agent name"
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
                  placeholder="Provide detailed instructions for how the agent should behave and respond"
                  rows={6}
                  required
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  These instructions define the agent&apos;s personality,
                  behavior, and capabilities.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
              <CardDescription>
                Configure IAM roles and encryption settings
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
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Leave empty to use the default agent execution role
                </p>
              </div>

              <div>
                <Label htmlFor="customerEncryptionKeyArn">
                  Customer Encryption Key ARN
                </Label>
                <Input
                  id="customerEncryptionKeyArn"
                  value={formData.customerEncryptionKeyArn}
                  onChange={(e) =>
                    handleInputChange(
                      "customerEncryptionKeyArn",
                      e.target.value
                    )
                  }
                  placeholder="arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Optional KMS key for additional encryption
                </p>
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
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  How long sessions remain active when idle (300-3600 seconds)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Memory Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Memory Configuration</CardTitle>
              <CardDescription>
                Configure how the agent remembers conversation context
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
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  How many days to retain conversation memory (1-365 days)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Model Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Model Configuration</CardTitle>
              <CardDescription>
                Fine-tune the model&apos;s inference parameters (Preview - not
                yet applied during agent creation)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="basePrompt">Base Prompt Template</Label>
                <Textarea
                  id="basePrompt"
                  value={advancedConfig.basePromptTemplate}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    handleAdvancedConfigChange(
                      "basePromptTemplate",
                      e.target.value
                    )
                  }
                  placeholder="System prompt that sets the context for the agent"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={advancedConfig.temperature}
                    onChange={(e) =>
                      handleAdvancedConfigChange(
                        "temperature",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Controls randomness (0.0 = deterministic, 1.0 = creative)
                  </p>
                </div>

                <div>
                  <Label htmlFor="topP">Top P</Label>
                  <Input
                    id="topP"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={advancedConfig.topP}
                    onChange={(e) =>
                      handleAdvancedConfigChange(
                        "topP",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Nucleus sampling threshold
                  </p>
                </div>

                <div>
                  <Label htmlFor="topK">Top K</Label>
                  <Input
                    id="topK"
                    type="number"
                    min="1"
                    max="500"
                    value={advancedConfig.topK}
                    onChange={(e) =>
                      handleAdvancedConfigChange(
                        "topK",
                        parseInt(e.target.value)
                      )
                    }
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Number of tokens to consider
                  </p>
                </div>

                <div>
                  <Label htmlFor="maximumLength">Maximum Length</Label>
                  <Input
                    id="maximumLength"
                    type="number"
                    min="1"
                    max="8192"
                    value={advancedConfig.maximumLength}
                    onChange={(e) =>
                      handleAdvancedConfigChange(
                        "maximumLength",
                        parseInt(e.target.value)
                      )
                    }
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Maximum response length in tokens
                  </p>
                </div>
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
              <span>{saving ? "Creating..." : "Create Agent"}</span>
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
