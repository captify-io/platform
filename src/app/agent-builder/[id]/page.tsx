"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@captify-io/core/components";
import { Agent as AgentComponent } from "@captify-io/core/components";
import { apiClient } from "@captify-io/core/lib/api";
import { cn } from "@captify-io/core/lib/utils";
import type { Agent, Provider, ProviderModel, CaptifyApplication } from "@captify-io/core/types";
import { ChevronLeft, Save, Trash2 } from "lucide-react";

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [applications, setApplications] = useState<CaptifyApplication[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<ProviderModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [agentType, setAgentType] = useState<"assistant" | "bedrock">("assistant");
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [providerId, setProviderId] = useState("");
  const [modelId, setModelId] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [fileSearch, setFileSearch] = useState(false);
  const [codeInterpreter, setCodeInterpreter] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (providerId) {
      loadModelsForProvider(providerId);
    }
  }, [providerId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const agentResult = await apiClient.run({
        service: "platform.dynamodb",
        operation: "get",
        table: "captify-core-Agent",
        data: {
          Key: { id },
        },
      });

      const agentData = agentResult.data;
      if (agentData) {
        setAgent(agentData);
        setAgentType(agentData.type || "assistant");
        setName(agentData.name);
        setSystemPrompt(agentData.config?.systemPrompt || "");
        setProviderId(agentData.config?.providerId || "");
        setModelId(agentData.config?.modelId || "");
        setTemperature(agentData.config?.temperature || 0.7);
        setFileSearch(agentData.config?.fileSearch || false);
        setCodeInterpreter(agentData.config?.codeInterpreter || false);
      }

      const appsResult = await apiClient.run({
        service: "platform.dynamodb",
        operation: "scan",
        table: "captify-core-App",
        data: {},
      });
      setApplications(appsResult.data?.Items || []);

      const providersResult = await apiClient.run({
        service: "platform.dynamodb",
        operation: "scan",
        table: "captify-core-Provider",
        data: {},
      });
      setProviders(providersResult.data?.Items || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadModelsForProvider = async (providerId: string) => {
    try {
      const result = await apiClient.run({
        service: "platform.dynamodb",
        operation: "query",
        table: "captify-core-ProviderModel",
        data: {
          IndexName: "providerId-index",
          KeyConditionExpression: "providerId = :pid",
          ExpressionAttributeValues: {
            ":pid": providerId,
          },
        },
      });
      setModels(result.data?.Items || []);
    } catch (error) {
      console.error("Failed to load models:", error);
      setModels([]);
    }
  };

  const handleSave = async () => {
    if (!agent) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();

      // Update DynamoDB
      await apiClient.run({
        service: "platform.dynamodb",
        operation: "update",
        table: "captify-core-Agent",
        data: {
          Key: { id: agent.id },
          UpdateExpression:
            "SET #name = :name, #type = :type, slug = :slug, config = :config, updatedAt = :updated, updatedBy = :updatedBy",
          ExpressionAttributeNames: {
            "#name": "name",
            "#type": "type",
          },
          ExpressionAttributeValues: {
            ":name": name,
            ":type": agentType,
            ":slug": name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            ":config": {
              systemPrompt: systemPrompt,
              providerId: providerId,
              modelId: modelId,
              temperature: temperature,
              fileSearch: fileSearch,
              codeInterpreter: codeInterpreter,
            },
            ":updated": now,
            ":updatedBy": "current-user",
          },
        },
      });

      alert("Agent saved successfully");
      await loadData();
    } catch (error) {
      console.error("Failed to save agent:", error);
      alert("Failed to save agent");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!agent) return;
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      await apiClient.run({
        service: "platform.dynamodb",
        operation: "delete",
        table: "captify-core-Agent",
        data: {
          Key: { id: agent.id },
        },
      });

      router.push("/agent-builder");
    } catch (error) {
      console.error("Failed to delete agent:", error);
      alert("Failed to delete agent");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading agent...</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Agent not found</h2>
          <Button onClick={() => router.push("/agent-builder")}>
            Back to Agent Builder
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Config Panel - Left Side */}
      <div className="w-96 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <button
            onClick={() => router.push("/agent-builder")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="font-medium">{name}</span>
          </button>

          {/* Agent Type Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setAgentType("assistant")}
              className={cn(
                "flex-1 px-3 py-2 text-sm rounded-md transition-colors",
                agentType === "assistant"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              <div className="font-medium">Assistant</div>
              <div className="text-xs opacity-80">In-app managed</div>
            </button>
            <button
              onClick={() => setAgentType("bedrock")}
              className={cn(
                "flex-1 px-3 py-2 text-sm rounded-md transition-colors",
                agentType === "bedrock"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              <div className="font-medium">Agent</div>
              <div className="text-xs opacity-80">AWS Bedrock</div>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <Label htmlFor="name" className="text-xs">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="systemPrompt" className="text-xs">System Instructions</Label>
            <Textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={8}
              placeholder="Enter system instructions..."
              className="mt-1 font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="provider" className="text-xs">Provider</Label>
              <Select value={providerId} onValueChange={setProviderId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="model" className="text-xs">Model</Label>
              <Select value={modelId} onValueChange={setModelId} disabled={!providerId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="fileSearch" className="text-xs">File Search</Label>
            <Switch
              id="fileSearch"
              checked={fileSearch}
              onCheckedChange={setFileSearch}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="codeInterpreter" className="text-xs">Code Interpreter</Label>
            <Switch
              id="codeInterpreter"
              checked={codeInterpreter}
              onCheckedChange={setCodeInterpreter}
            />
          </div>

          <div>
            <Label htmlFor="temperature" className="text-xs">
              Temperature: {temperature.toFixed(1)}
            </Label>
            <Input
              id="temperature"
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="mt-1"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t space-y-2">
          <Button onClick={handleSave} disabled={saving} size="sm" className="w-full">
            <Save className="mr-2 h-3 w-3" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            size="sm"
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="mr-2 h-3 w-3" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      {/* Chat Panel - Right Side */}
      <div className="flex-1 flex flex-col">
        <AgentComponent
          mode="side"
          agentId={agent.id}
          llm={agentType === "bedrock" ? "agent" : "anthropic"}
          model={agentType === "bedrock" ? agent.config?.bedrockAgentId : agent.config?.modelId}
          systemPrompt={systemPrompt}
          temperature={temperature}
          placeholder={`Chat with ${name}...`}
          welcome={`Hello! I'm ${name}. How can I help you today?`}
        />
      </div>
    </div>
  );
}
