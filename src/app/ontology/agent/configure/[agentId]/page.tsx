"use client";

/**
 * Agent Configure Page
 * Configure agent settings with Test, Builder, and Space tabs
 */

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@captify-io/core';
import { AgentProvider, ChatPanel } from '@captify-io/core';
import {
  Card,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Label,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@captify-io/core/components/ui';
import {
  ArrowLeft,
  Save,
  Bot,
  Sparkles,
  Network,
  Folder,
  Check,
  X,
} from 'lucide-react';
import { DesignerProvider, useDesigner } from '../../../context/DesignerContext';
import { DesignerCanvas } from '../../../components/DesignerCanvas';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: string;
  provider?: string;
  model?: string;
  spaceId?: string;
  system_instruction?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  tools?: string[];
  functions?: string[];
  createdAt: string;
  updatedAt?: string;
}

interface Space {
  id: string;
  name: string;
  description?: string;
  type: string;
}

interface Tool {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
}

function ConfigureContent() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('test');

  // Form state
  const [formData, setFormData] = useState<Partial<Agent>>({});
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [agentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load agent
      const agentResult = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'get',
        table: 'core-agent',
        data: { key: { id: agentId } },
      });

      if (agentResult.success && agentResult.data?.Item) {
        const agentData = agentResult.data.Item;
        setAgent(agentData);
        setFormData(agentData);
        if (agentData.tools) {
          setSelectedTools(new Set(agentData.tools));
        }
      }

      // Load spaces
      const spacesResult = await apiClient.run({
        service: 'platform.space',
        operation: 'listSpaces',
        data: { limit: 100 },
      });

      if (spacesResult.success && spacesResult.data?.spaces) {
        setSpaces(spacesResult.data.spaces);
      }

      // Load tools
      const toolsResult = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-tool',
      });

      if (toolsResult.success && toolsResult.data?.Items) {
        setTools(toolsResult.data.Items);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedAgent = {
        ...agent,
        ...formData,
        tools: Array.from(selectedTools),
        updatedAt: new Date().toISOString(),
      };

      const result = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'put',
        table: 'core-agent',
        data: { item: updatedAgent },
      });

      if (result.success) {
        setAgent(updatedAgent as Agent);
        alert('Agent saved successfully');
      } else {
        alert(`Failed to save: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to save agent:', error);
      alert('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const toggleTool = (toolId: string) => {
    const newSelected = new Set(selectedTools);
    if (newSelected.has(toolId)) {
      newSelected.delete(toolId);
    } else {
      newSelected.add(toolId);
    }
    setSelectedTools(newSelected);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-muted-foreground">Loading agent configuration...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Agent not found</h3>
          <p className="text-muted-foreground mb-4">The agent you're looking for doesn't exist</p>
          <Button onClick={() => router.push('/ontology/agent')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-blue-50 to-purple-100 dark:from-blue-950 dark:to-purple-900">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/ontology/agent')}
                className="h-8"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">{agent.name}</h1>
                  <p className="text-xs text-muted-foreground">{agent.description}</p>
                </div>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Configuration */}
        <div className="w-80 border-r flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-muted/30">
            <h2 className="font-semibold text-sm">Configuration</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select
                value={formData.model || ''}
                onValueChange={(value) => setFormData({ ...formData, model: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
                  <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                  <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Space */}
            <div className="space-y-2">
              <Label htmlFor="space">Space</Label>
              <Select
                value={formData.spaceId || ''}
                onValueChange={(value) => setFormData({ ...formData, spaceId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a space" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {spaces.map((space) => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* System Instructions */}
            <div className="space-y-2">
              <Label htmlFor="instructions">System Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.system_instruction || ''}
                onChange={(e) => setFormData({ ...formData, system_instruction: e.target.value })}
                rows={6}
                placeholder="You are a helpful AI assistant..."
              />
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature: {formData.temperature || 0.7}</Label>
              <input
                type="range"
                id="temperature"
                min="0"
                max="1"
                step="0.1"
                value={formData.temperature || 0.7}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Top P */}
            <div className="space-y-2">
              <Label htmlFor="topP">Top P: {formData.topP || 0.9}</Label>
              <input
                type="range"
                id="topP"
                min="0"
                max="1"
                step="0.1"
                value={formData.topP || 0.9}
                onChange={(e) => setFormData({ ...formData, topP: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Tools */}
            <div className="space-y-2">
              <Label>Tools</Label>
              <div className="space-y-2">
                {tools.map((tool) => (
                  <div key={tool.id} className="flex items-center gap-2">
                    <button
                      onClick={() => toggleTool(tool.id)}
                      className={`flex-1 text-left px-3 py-2 rounded-lg border transition-colors ${
                        selectedTools.has(tool.id)
                          ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{tool.name}</div>
                          {tool.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {tool.description}
                            </div>
                          )}
                        </div>
                        {selectedTools.has(tool.id) && (
                          <Check className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </button>
                  </div>
                ))}
                {tools.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tools available</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Tabs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b px-4">
              <TabsList className="h-10">
                <TabsTrigger value="test" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Test
                </TabsTrigger>
                <TabsTrigger value="builder" className="gap-2">
                  <Network className="h-4 w-4" />
                  Builder
                </TabsTrigger>
                <TabsTrigger value="space" className="gap-2">
                  <Folder className="h-4 w-4" />
                  Space
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="test" className="h-full m-0 p-0">
                <AgentProvider captifyAgentId={agentId} mode="compact">
                  <ChatPanel
                    showThreads={false}
                    showHelper={false}
                    isMobile={false}
                  />
                </AgentProvider>
              </TabsContent>

              <TabsContent value="builder" className="h-full m-0 p-0">
                <DesignerCanvas
                  showPalette={false}
                  onAddNode={() => {}}
                />
              </TabsContent>

              <TabsContent value="space" className="h-full m-0 p-4">
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <Folder className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Space File Management</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {formData.spaceId
                        ? `Manage files for this agent's space`
                        : 'Select a space in the configuration panel to manage files'}
                    </p>
                    {formData.spaceId && (
                      <Button onClick={() => router.push(`/spaces/${formData.spaceId}`)}>
                        <Folder className="h-4 w-4 mr-2" />
                        Open Space
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function AgentConfigurePage() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center">Loading...</div>}>
      <DesignerProvider>
        <ConfigureContent />
      </DesignerProvider>
    </Suspense>
  );
}

export const dynamic = "force-dynamic";
