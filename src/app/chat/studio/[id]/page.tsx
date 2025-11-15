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
  Popover,
  PopoverContent,
  PopoverTrigger,
  Badge,
  Separator,
} from "@captify-io/core";
import { Agent as AgentComponent } from "@captify-io/core";
import { apiClient } from "@captify-io/core";
import type { Agent, Provider, ProviderModel } from "@captify-io/core/types";
import {
  ChevronLeft,
  Save,
  Wrench,
  Code,
  Database,
  Brain,
  Check,
  X,
  Sparkles,
} from "lucide-react";

interface ToolDefinition {
  id: string;
  name: string;
  description?: string;
  category?: string;
  operation?: string;
  active?: string;
}

interface ToolsByCategory {
  [category: string]: ToolDefinition[];
}

export default function AgentStudioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<ProviderModel[]>([]);
  const [allTools, setAllTools] = useState<ToolDefinition[]>([]);
  const [toolsByCategory, setToolsByCategory] = useState<ToolsByCategory>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toolPopoverOpen, setToolPopoverOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [providerId, setProviderId] = useState("");
  const [modelId, setModelId] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());
  const [codeInterpreter, setCodeInterpreter] = useState(false);
  const [fileSearch, setFileSearch] = useState(false);

  // Memory configuration
  const [memoryEnabled, setMemoryEnabled] = useState(false);
  const [memoryWindowSize, setMemoryWindowSize] = useState(10);
  const [memoryImportanceThreshold, setMemoryImportanceThreshold] = useState(0.5);

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
      // Load agent
      const agentResult = await apiClient.run({
        service: "platform.dynamodb",
        operation: "get",
        table: "core-agent",
        data: { Key: { id } },
      });

      const agentData = agentResult.data;
      if (!agentData) {
        console.error("Agent not found");
        router.push("/agent/studio");
        return;
      }

      setAgent(agentData);
      setName(agentData.name || "");
      setSystemPrompt(agentData.config?.systemPrompt || "");
      setProviderId(agentData.config?.providerId || "");
      setModelId(agentData.config?.modelId || "");
      setTemperature(agentData.config?.temperature || 0.7);
      setSelectedToolIds(new Set(agentData.config?.toolIds || []));
      setCodeInterpreter(agentData.config?.codeInterpreter || false);
      setFileSearch(agentData.config?.fileSearch || false);
      setMemoryEnabled(agentData.config?.memoryEnabled || false);
      setMemoryWindowSize(agentData.config?.memoryWindowSize || 10);
      setMemoryImportanceThreshold(agentData.config?.memoryImportanceThreshold || 0.5);

      // Load providers
      const providersResult = await apiClient.run({
        service: "platform.dynamodb",
        operation: "scan",
        table: "core-provider",
        data: {},
      });
      setProviders(providersResult.data?.Items || []);

      // Load tools
      const toolsResult = await apiClient.run({
        service: "platform.dynamodb",
        operation: "scan",
        table: "core-tool",
        data: {},
      });

      const tools = (toolsResult.data?.Items || []).filter(
        (tool: ToolDefinition) => tool.active !== "false"
      );

      setAllTools(tools);

      // Group tools by category
      const grouped: ToolsByCategory = {};
      tools.forEach((tool: ToolDefinition) => {
        const category = tool.category || "uncategorized";
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(tool);
      });

      setToolsByCategory(grouped);
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
        table: "core-provider-model",
        data: {
          IndexName: "providerId-index",
          KeyConditionExpression: "providerId = :pid",
          ExpressionAttributeValues: { ":pid": providerId },
        },
      });
      setModels(result.data?.Items || []);
    } catch (error) {
      console.error("Failed to load models:", error);
      setModels([]);
    }
  };

  const toggleTool = (toolId: string) => {
    setSelectedToolIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(toolId)) {
        newSet.delete(toolId);
      } else {
        newSet.add(toolId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!agent) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const toolIdsArray = Array.from(selectedToolIds);

      await apiClient.run({
        service: "platform.dynamodb",
        operation: "update",
        table: "core-agent",
        data: {
          Key: { id: agent.id },
          UpdateExpression:
            "SET #name = :name, config = :config, updatedAt = :updated, updatedBy = :updatedBy",
          ExpressionAttributeNames: { "#name": "name" },
          ExpressionAttributeValues: {
            ":name": name,
            ":config": {
              systemPrompt,
              providerId,
              modelId,
              temperature,
              toolIds: toolIdsArray,
              codeInterpreter,
              fileSearch,
              memoryEnabled,
              memoryWindowSize,
              memoryImportanceThreshold,
            },
            ":updated": now,
            ":updatedBy": "current-user",
          },
        },
      });

      alert(`Successfully saved configuration for ${name}`);
      await loadData();
    } catch (error) {
      console.error("Failed to save configuration:", error);
      alert("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="text-muted-foreground mt-4">Loading agent...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return null;
  }

  const categories = Object.keys(toolsByCategory).sort();

  return (
    <div className="flex h-screen">
      {/* Left Panel - Configuration */}
      <div className="w-[480px] border-r flex flex-col bg-background">
        {/* Header */}
        <div className="p-4 border-b flex items-center gap-3">
          <button
            onClick={() => router.push("/agent/studio")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold">Agent Configuration</h2>
        </div>

        {/* Configuration Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5"
              placeholder="My AI Assistant"
            />
          </div>

          <div>
            <Label htmlFor="systemPrompt">Base Instructions</Label>
            <Textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              placeholder="You are a helpful AI assistant that..."
              className="mt-1.5 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tool usage instructions and widget guidelines will be automatically added to these instructions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="provider">Provider</Label>
              <Select value={providerId} onValueChange={setProviderId}>
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select provider" />
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

            <div className="space-y-1.5">
              <Label htmlFor="model">Model</Label>
              <Select value={modelId} onValueChange={setModelId} disabled={!providerId}>
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select model" />
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

          <div className="space-y-1.5">
            <Label htmlFor="temperature">
              Temperature: {temperature.toFixed(2)}
            </Label>
            <Input
              id="temperature"
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Lower = more focused, Higher = more creative
            </p>
          </div>

          {/* Tool Selector */}
          <div className="space-y-1.5">
            <Label>Available Tools</Label>
            <Popover open={toolPopoverOpen} onOpenChange={setToolPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>
                    {selectedToolIds.size === 0
                      ? "Select tools..."
                      : `${selectedToolIds.size} tool${selectedToolIds.size !== 1 ? "s" : ""} selected`}
                  </span>
                  <Wrench className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <div className="max-h-[400px] overflow-y-auto">
                  <div className="p-4 border-b sticky top-0 bg-background">
                    <p className="font-semibold">Select Tools</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Choose which tools this agent can access
                    </p>
                  </div>
                  <div className="p-2">
                    {categories.map((category) => {
                      const categoryTools = toolsByCategory[category];
                      return (
                        <div key={category} className="mb-4">
                          <p className="text-sm font-semibold capitalize px-2 py-1 text-muted-foreground">
                            {category}
                          </p>
                          {categoryTools.map((tool) => (
                            <button
                              key={tool.id}
                              onClick={() => toggleTool(tool.id)}
                              className="w-full flex items-start gap-3 px-2 py-2 hover:bg-muted rounded-md text-left"
                            >
                              <div className="mt-0.5">
                                {selectedToolIds.has(tool.id) ? (
                                  <Check className="h-4 w-4 text-primary" />
                                ) : (
                                  <div className="h-4 w-4 border rounded" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{tool.name}</p>
                                {tool.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                    {tool.description.split("\n")[0]}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {selectedToolIds.size > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {Array.from(selectedToolIds).map((toolId) => {
                  const tool = allTools.find((t) => t.id === toolId);
                  return tool ? (
                    <Badge key={toolId} variant="secondary" className="text-xs">
                      {tool.name}
                      <button
                        onClick={() => toggleTool(toolId)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Built-in Capabilities */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              <Label htmlFor="codeInterpreter" className="cursor-pointer">
                Code Interpreter
              </Label>
            </div>
            <Switch
              id="codeInterpreter"
              checked={codeInterpreter}
              onCheckedChange={setCodeInterpreter}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <Label htmlFor="fileSearch" className="cursor-pointer">
                File Search
              </Label>
            </div>
            <Switch
              id="fileSearch"
              checked={fileSearch}
              onCheckedChange={setFileSearch}
            />
          </div>

          {/* Memory Configuration */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="memoryEnabled">Enable Memory</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Store and retrieve contextual information across conversations
              </p>
            </div>
            <Switch
              id="memoryEnabled"
              checked={memoryEnabled}
              onCheckedChange={setMemoryEnabled}
            />
          </div>

          {memoryEnabled && (
            <>
              <div className="space-y-1.5 pl-4 border-l-2">
                <Label htmlFor="memoryWindowSize">
                  Context Window Size: {memoryWindowSize} messages
                </Label>
                <Input
                  id="memoryWindowSize"
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={memoryWindowSize}
                  onChange={(e) => setMemoryWindowSize(parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Number of recent messages to keep in context
                </p>
              </div>

              <div className="space-y-1.5 pl-4 border-l-2">
                <Label htmlFor="memoryImportanceThreshold">
                  Importance Threshold: {memoryImportanceThreshold.toFixed(2)}
                </Label>
                <Input
                  id="memoryImportanceThreshold"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={memoryImportanceThreshold}
                  onChange={(e) =>
                    setMemoryImportanceThreshold(parseFloat(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Minimum importance score (0-1) for memories to be retained
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-muted/30">
          <Button onClick={handleSave} disabled={saving} size="lg" className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>

      {/* Right Panel - Agent Demo */}
      <div className="flex-1 bg-muted/20">
        <AgentComponent
          mode="compact"
          defaultSettings={{
            agentId: agent.id,
            systemPrompt: systemPrompt || undefined,
            provider: providerId || undefined,
            model: modelId || undefined,
            temperature,
          }}
        />
      </div>
    </div>
  );
}
