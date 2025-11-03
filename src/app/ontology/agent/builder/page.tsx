"use client";

/**
 * Agent Builder - Configuration & Test Page
 * Left: AgentConfigPanel (configuration)
 * Right: ChatPanel (testing)
 */

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@captify-io/core';
import { AgentProvider, ChatPanel, AgentConfigPanel } from '@captify-io/core';
import type { AgentConfig } from '@captify-io/core';

function AgentBuilderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const agentId = searchParams.get('id');

  // Agent configuration state
  const [config, setConfig] = useState<AgentConfig>({
    name: '',
    description: '',
    status: 'draft',
    type: 'captify-agent', // Changed from mode to type
    temperature: 0.7,
    maxTokens: 4000,
    tools: [],
    workflows: [],
    enableMarkdownFormatting: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!agentId);
  const [error, setError] = useState<string | null>(null);

  // Load agent if editing
  useEffect(() => {
    if (agentId) {
      loadAgent(agentId);
    }
  }, [agentId]);

  async function loadAgent(id: string) {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'get',
        table: 'core-agent',
        data: {
          Key: { id },
        },
      });

      if (result.success && result.data) {
        setConfig({
          id: result.data.id,
          name: result.data.name || '',
          description: result.data.description || '',
          status: result.data.status || 'draft',
          type: result.data.type || 'captify-agent', // Changed from mode to type
          provider: result.data.provider,
          model: result.data.model,
          agentId: result.data.agentId,
          agentAliasId: result.data.agentAliasId,
          spaceId: result.data.spaceId,
          system_instruction: result.data.system_instruction || '',
          system: result.data.system,
          temperature: result.data.temperature ?? 0.7,
          topP: result.data.topP,
          maxTokens: result.data.maxTokens ?? 4000,
          tools: result.data.tools || [],
          workflows: result.data.workflows || [],
          enableCodeInterpreter: result.data.enableCodeInterpreter,
          enableMarkdownFormatting: result.data.enableMarkdownFormatting ?? true,
          useAgentAbstraction: result.data.useAgentAbstraction,
          toolApprovalConfig: result.data.toolApprovalConfig,
          enablePrepareStep: result.data.enablePrepareStep,
          maxSteps: result.data.maxSteps,
          phases: result.data.phases,
        });
      } else {
        setError('Agent not found');
      }
    } catch (err) {
      console.error('Error loading agent:', err);
      setError('Failed to load agent');
    } finally {
      setIsLoading(false);
    }
  }

  async function saveAgent() {
    setIsSaving(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const agentData = {
        ...config,
        id: config.id || `agent-${Date.now()}`,
        updatedAt: now,
        createdAt: config.id ? undefined : now, // Only set createdAt for new agents
      };

      const result = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'put',
        table: 'core-agent',
        data: {
          Item: agentData,
        },
      });

      if (result.success) {
        // If new agent, update URL to include ID
        if (!config.id) {
          router.push(`/ontology/agent/builder?id=${agentData.id}`);
        }
        setConfig(agentData);
      } else {
        setError(result.error || 'Failed to save agent');
      }
    } catch (err) {
      console.error('Error saving agent:', err);
      setError('Failed to save agent');
    } finally {
      setIsSaving(false);
    }
  }

  function handleConfigChange(updates: Partial<AgentConfig>) {
    setConfig(prev => ({ ...prev, ...updates }));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Loading agent...</p>
        </div>
      </div>
    );
  }

  if (error && !config.id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md p-6">
          <div className="text-destructive text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Error</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Left Panel: Configuration */}
      <div className="w-96 flex-shrink-0">
        <AgentConfigPanel
          config={config}
          onChange={handleConfigChange}
          onSave={saveAgent}
          isSaving={isSaving}
        />
      </div>

      {/* Right Panel: Chat Interface for Testing */}
      <div className="flex-1 flex flex-col bg-muted/10">
        {config.id ? (
          <AgentProvider
            captifyAgentId={config.id}
            mode="compact"
          >
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b bg-background">
                <h3 className="font-semibold">Test Agent</h3>
                <p className="text-sm text-muted-foreground">
                  {config.type === 'captify-agent'
                    ? `Testing with ${config.provider || 'default'} / ${config.model || 'default model'}`
                    : `Testing AWS Bedrock Agent`
                  }
                </p>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatPanel />
              </div>
            </div>
          </AgentProvider>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md p-6">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold mb-2">Save to Test</h3>
              <p className="text-sm text-muted-foreground">
                Save your agent configuration to start testing it with the chat interface.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow-lg max-w-md">
          <p className="text-sm font-medium">Error</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="absolute top-2 right-2 text-destructive-foreground/80 hover:text-destructive-foreground"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default function AgentBuilderPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
      </div>
    }>
      <AgentBuilderContent />
    </Suspense>
  );
}
