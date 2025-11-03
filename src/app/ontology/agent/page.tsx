"use client";

/**
 * Agent Designer - Agent Selection Page
 * Shows available agents with ability to create new or configure existing ones
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@captify-io/core';
import { PageTemplate } from '@captify-io/core';
import {
  Card,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@captify-io/core/components/ui';
import {
  Bot,
  Plus,
  Settings,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: string;
  provider?: string;
  model?: string;
  spaceId?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function AgentDesignerPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentDescription, setNewAgentDescription] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    filterAgents();
  }, [agents, searchQuery]);

  const filterAgents = () => {
    let filtered = [...agents];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (agent) =>
          agent.name.toLowerCase().includes(query) ||
          (agent.description && agent.description.toLowerCase().includes(query)) ||
          (agent.model && agent.model.toLowerCase().includes(query))
      );
    }

    setFilteredAgents(filtered);
  };

  const loadAgents = async () => {
    setLoading(true);
    try {
      const result = await apiClient.run({
        service: "platform.dynamodb",
        operation: "scan",
        table: "core-agent",
      });

      if (result.success && result.data) {
        // DynamoDB scan returns { Items: [...], Count: n, ScannedCount: n }
        const items = result.data.Items || result.data;
        const agentList = Array.isArray(items) ? items : [];
        setAgents(agentList);
        setFilteredAgents(agentList);
      }
    } catch (error) {
      console.error("Failed to load agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async () => {
    if (!newAgentName.trim()) return;

    try {
      const timestamp = Date.now();
      const agentData = {
        id: `agent-${timestamp}`,
        name: newAgentName,
        description: newAgentDescription || `AI agent: ${newAgentName}`,
        status: "draft",
        provider: "",
        model: "",
        system_instruction: "",
        temperature: 0.7,
        maxTokens: 2000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await apiClient.run({
        service: "platform.dynamodb",
        operation: "put",
        table: "core-agent",
        data: {
          item: agentData,
        },
      });

      if (result.success) {
        setShowCreateDialog(false);
        setNewAgentName("");
        setNewAgentDescription("");
        loadAgents();
      } else {
        alert(`Failed to create agent: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to create agent:", error);
      alert("An error occurred while creating the agent");
    }
  };

  const deleteAgent = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent? This action cannot be undone.")) {
      return;
    }

    try {
      const result = await apiClient.run({
        service: "platform.dynamodb",
        operation: "delete",
        table: "core-agent",
        data: {
          key: { id: agentId },
        },
      });

      if (result.success) {
        loadAgents();
      } else {
        alert(`Failed to delete agent: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to delete agent:", error);
      alert("An error occurred while deleting the agent");
    }
  };

  const openBuilder = (agentId: string) => {
    router.push(`/ontology/agent/builder?agentId=${agentId}`);
  };

  const openEditDialog = (agent: Agent) => {
    setEditingAgent({ ...agent });
    setShowEditDialog(true);
  };

  const updateAgent = async () => {
    if (!editingAgent) return;

    try {
      const result = await apiClient.run({
        service: "platform.dynamodb",
        operation: "put",
        table: "core-agent",
        data: {
          item: {
            ...editingAgent,
            updatedAt: new Date().toISOString(),
          },
        },
      });

      if (result.success) {
        setShowEditDialog(false);
        setEditingAgent(null);
        loadAgents();
      } else {
        alert(`Failed to update agent: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to update agent:", error);
      alert("An error occurred while updating the agent");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'inactive':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200';
    }
  };

  const activeAgents = agents.filter(a => a.status === 'active').length;
  const draftAgents = agents.filter(a => a.status === 'draft').length;

  return (
    <>
    <PageTemplate
      title="Agent Designer"
      description="Create and configure AI agents with visual workflow design"
      primaryAction={{
        label: 'New Agent',
        onClick: () => setShowCreateDialog(true),
        icon: Plus,
      }}
      stats={[
        {
          label: 'Total Agents',
          value: agents.length,
          icon: Bot,
          color: 'purple',
        },
        {
          label: 'Active',
          value: activeAgents,
          icon: Sparkles,
          color: 'green',
        },
        {
          label: 'Draft',
          value: draftAgents,
          icon: Bot,
          color: 'orange',
        },
      ]}
      search={{
        value: searchQuery,
        onChange: setSearchQuery,
        placeholder: 'Search agents by name, description, or model...',
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading agents...</p>
          </div>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <Card className="p-12 text-center max-w-md">
            <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No agents found' : 'No agents yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? 'Try adjusting your search criteria'
                : 'Create your first AI agent to start building intelligent workflows'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Agent
              </Button>
            )}
          </Card>
        </div>
      ) : (
        <div className="h-full overflow-auto">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Space</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((agent) => (
                  <TableRow
                    key={agent.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openBuilder(agent.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-600 dark:bg-purple-700 rounded-lg">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-xs text-muted-foreground">{agent.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm text-muted-foreground">
                        {agent.description || 'No description'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {agent.model || <span className="text-muted-foreground">Not set</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {agent.spaceId || <span className="text-muted-foreground">None</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(agent.status)}>
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(agent.updatedAt || agent.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(agent);
                          }}
                          title="Quick Edit Settings"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAgent(agent.id);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Create Agent Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Agent</DialogTitle>
            <DialogDescription>
              Create a new AI agent with visual workflow configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                Agent Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                placeholder="My AI Agent"
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                placeholder="Describe what this agent does..."
                rows={3}
                value={newAgentDescription}
                onChange={(e) => setNewAgentDescription(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={createAgent}
              disabled={!newAgentName.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Edit Agent Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quick Edit Agent</DialogTitle>
            <DialogDescription>
              Edit basic agent attributes. For advanced configuration, open the agent in the builder.
            </DialogDescription>
          </DialogHeader>
          {editingAgent && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="Agent Name"
                    value={editingAgent.name}
                    onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                    Status
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                    value={editingAgent.status}
                    onChange={(e) => setEditingAgent({ ...editingAgent, status: e.target.value })}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                  placeholder="Describe what this agent does..."
                  rows={3}
                  value={editingAgent.description}
                  onChange={(e) => setEditingAgent({ ...editingAgent, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                    Model
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="e.g., gpt-4o"
                    value={editingAgent.model || ''}
                    onChange={(e) => setEditingAgent({ ...editingAgent, model: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                    Space ID
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="Optional space ID"
                    value={editingAgent.spaceId || ''}
                    onChange={(e) => setEditingAgent({ ...editingAgent, spaceId: e.target.value })}
                  />
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  💡 For advanced settings like provider configuration, tools, and workflows,
                  click the agent row to open it in the builder.
                </p>
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => {
              setShowEditDialog(false);
              setEditingAgent(null);
            }}>
              Cancel
            </Button>
            <Button onClick={updateAgent}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTemplate>
    </>
  );
}

export const dynamic = "force-dynamic";
