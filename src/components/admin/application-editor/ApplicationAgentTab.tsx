"use client";

import { useState, useEffect } from "react";
import { ApplicationEntity } from "@/types/database";
import { AgentCapability } from "@/types/application";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, RefreshCw, AlertCircle, Bot, TestTube } from "lucide-react";

interface ApplicationAgentTabProps {
  application: ApplicationEntity;
  onUpdate: (application: ApplicationEntity) => void;
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export function ApplicationAgentTab({
  application,
  onUpdate,
  onUnsavedChanges,
}: ApplicationAgentTabProps) {
  const [formData, setFormData] = useState({
    agentId: application.ai_agent?.agentId || "",
    bedrockAliasId: application.ai_agent?.bedrockAliasId || "",
    instructions: application.ai_agent?.instructions || "",
    model: application.ai_agent?.model || "claude-3-sonnet",
    temperature: application.ai_agent?.temperature?.toString() || "0.7",
    maxOutputTokens: application.ai_agent?.maxOutputTokens?.toString() || "2000",
    capabilities: application.ai_agent?.capabilities || [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Track changes
  useEffect(() => {
    const hasChanges =
      formData.agentId !== (application.ai_agent?.agentId || "") ||
      formData.bedrockAliasId !==
        (application.ai_agent?.bedrockAliasId || "") ||
      formData.instructions !== (application.ai_agent?.instructions || "") ||
      formData.model !== (application.ai_agent?.model || "claude-3-sonnet") ||
      formData.temperature !==
        (application.ai_agent?.temperature?.toString() || "0.7") ||
      formData.maxOutputTokens !==
        (application.ai_agent?.maxOutputTokens?.toString() || "2000") ||
      JSON.stringify(formData.capabilities) !==
        JSON.stringify(application.ai_agent?.capabilities || []);

    onUnsavedChanges(hasChanges);
  }, [formData, application, onUnsavedChanges]);

  const handleInputChange = (
    field: string,
    value: string | AgentCapability[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleCapabilityToggle = (capabilityId: string) => {
    const updatedCapabilities = formData.capabilities.map((cap) =>
      cap.id === capabilityId ? { ...cap, enabled: !cap.enabled } : cap
    );
    handleInputChange("capabilities", updatedCapabilities);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // For now, we'll just update the local state
      // In a real implementation, you'd call an API to save agent configuration
      const updatedApp = {
        ...application,
        ai_agent: {
          ...application.ai_agent,
          agentId: formData.agentId,
          bedrockAliasId: formData.bedrockAliasId,
          instructions: formData.instructions,
          model: formData.model as
            | "claude-3-sonnet"
            | "claude-3-haiku"
            | "claude-3-opus"
            | "gpt-4"
            | "custom",
          temperature: parseFloat(formData.temperature),
          maxOutputTokens: parseInt(formData.maxOutputTokens),
          capabilities: formData.capabilities,
        },
      };

      onUpdate(updatedApp);
      setSuccess("Agent configuration saved successfully!");
      onUnsavedChanges(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Failed to save agent configuration:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save agent configuration"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestAgent = () => {
    // This would open a test chat interface
    alert("Test agent functionality would open a chat interface here");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Agent Configuration
          </h2>
          <p className="text-muted-foreground">
            Configure the AI agent behavior and capabilities for this
            application
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleTestAgent}>
            <TestTube className="h-4 w-4 mr-2" />
            Test Agent
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-destructive mr-2" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
          <div className="flex items-center">
            <div className="h-4 w-4 bg-green-500 rounded-full mr-2" />
            <span className="text-sm text-green-700">{success}</span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bot className="h-5 w-5 mr-2" />
              Agent Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="agent-id">Agent ID</Label>
              <Input
                id="agent-id"
                value={formData.agentId}
                onChange={(e) => handleInputChange("agentId", e.target.value)}
                placeholder="Enter Bedrock Agent ID"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                AWS Bedrock Agent ID for this application
              </p>
            </div>

            <div>
              <Label htmlFor="bedrock-alias-id">Bedrock Alias ID</Label>
              <Input
                id="bedrock-alias-id"
                value={formData.bedrockAliasId}
                onChange={(e) =>
                  handleInputChange("bedrockAliasId", e.target.value)
                }
                placeholder="Enter Bedrock Alias ID"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Specific agent version/alias to use
              </p>
            </div>

            <div>
              <Label htmlFor="model">AI Model</Label>
              <Select
                value={formData.model}
                onValueChange={(value) => handleInputChange("model", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-3-sonnet">
                    Claude 3 Sonnet
                  </SelectItem>
                  <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                  <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Agent Behavior */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Behavior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="temperature">Temperature</Label>
              <Select
                value={formData.temperature}
                onValueChange={(value) =>
                  handleInputChange("temperature", value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select temperature" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.1">0.1 (Very Focused)</SelectItem>
                  <SelectItem value="0.3">0.3 (Focused)</SelectItem>
                  <SelectItem value="0.5">0.5 (Balanced)</SelectItem>
                  <SelectItem value="0.7">0.7 (Creative)</SelectItem>
                  <SelectItem value="0.9">0.9 (Very Creative)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="max-tokens">Max Tokens</Label>
              <Input
                id="max-tokens"
                type="number"
                value={formData.maxOutputTokens}
                onChange={(e) => handleInputChange("maxTokens", e.target.value)}
                placeholder="2000"
                className="mt-1"
                min="100"
                max="4000"
              />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Agent Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="instructions">System Instructions</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) =>
                handleInputChange("instructions", e.target.value)
              }
              placeholder="You are a helpful AI assistant for this application. Your role is to..."
              className="mt-1"
              rows={6}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Define how the agent should behave and what context it should have
              about this application
            </p>
          </div>
        </CardContent>
      </Card>
      {/* Agent Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {formData.capabilities.length > 0 ? (
              formData.capabilities.map((capability) => (
                <div
                  key={capability.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{capability.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {capability.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCapabilityToggle(capability.id)}
                    className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${
                      capability.enabled
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {capability.enabled ? "Enabled" : "Disabled"}
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No capabilities configured for this agent.</p>
                <p className="text-sm">
                  Capabilities can be added through the Bedrock Agent
                  configuration.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
