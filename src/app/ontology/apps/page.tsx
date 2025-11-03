"use client";

/**
 * Apps Management Page
 * View and manage applications in the captify-core-App table
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
} from '@captify-io/core/components/ui';
import {
  Plus,
  LayoutGrid,
  Trash2,
  Save,
  ExternalLink,
  Calendar,
  User,
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  order: number;
}

interface Agent {
  id: string;
  name: string;
  app: string;
  description?: string;
  status?: string;
}

interface App {
  id: string;
  name: string;
  slug: string;
  app: string;
  description: string;
  icon?: string;
  color?: string;
  tenantId?: string;
  status?: string;
  owner?: string;
  ownerId?: string;
  url?: string;
  category?: string;
  version?: string;
  visibility?: string;
  order?: string;
  agentId?: string | null;
  agentAliasId?: string | null;
  menu?: MenuItem[];
  fields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export default function AppsPage() {
  const router = useRouter();
  const [apps, setApps] = useState<App[]>([]);
  const [filteredApps, setFilteredApps] = useState<App[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<App>>({});

  useEffect(() => {
    loadApps();
    loadAgents();
  }, []);

  useEffect(() => {
    filterApps();
  }, [apps, searchQuery]);

  const loadApps = async () => {
    setLoading(true);
    try {
      const result = await apiClient.run({
        service: "platform.dynamodb",
        operation: "scan",
        table: "core-app",
      });

      if (result.success && result.data) {
        const items = result.data.Items || result.data;
        const appList = Array.isArray(items) ? items : [];
        setApps(appList);
        setFilteredApps(appList);
      }
    } catch (error) {
      console.error("Failed to load apps:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    setLoadingAgents(true);
    try {
      const result = await apiClient.run({
        service: "platform.dynamodb",
        operation: "scan",
        table: "core-agent",
      });

      if (result.success && result.data) {
        const items = result.data.Items || result.data;
        const agentList = Array.isArray(items) ? items : [];
        setAgents(agentList);
      }
    } catch (error) {
      console.error("Failed to load agents:", error);
    } finally {
      setLoadingAgents(false);
    }
  };

  const filterApps = () => {
    let filtered = [...apps];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.name.toLowerCase().includes(query) ||
          app.slug.toLowerCase().includes(query) ||
          (app.description && app.description.toLowerCase().includes(query))
      );
    }

    setFilteredApps(filtered);
  };

  const handleEditApp = (app: App) => {
    setSelectedApp(app);
    setEditForm({ ...app });
    setShowEditDialog(true);
  };

  const handleCreateApp = () => {
    setEditForm({
      name: '',
      slug: '',
      app: '',
      description: '',
      icon: 'LayoutGrid',
      color: 'bg-blue-600',
      tenantId: 'default',
      status: 'active',
      category: 'application',
      version: '1.0.0',
      visibility: 'internal',
      order: '0',
      ownerId: 'system',
      createdBy: 'admin',
      menu: [],
      fields: {},
    });
    setShowCreateDialog(true);
  };

  const handleSaveApp = async () => {
    if (!editForm.name || !editForm.slug || !editForm.app) {
      alert('Name, Slug, and App are required');
      return;
    }

    try {
      const now = new Date().toISOString();
      const appData = {
        id: selectedApp?.id || crypto.randomUUID(),
        ...editForm,
        app: editForm.app || editForm.slug,
        updatedAt: now,
        updatedBy: 'admin',
        createdAt: selectedApp?.createdAt || now,
        createdBy: selectedApp?.createdBy || editForm.createdBy || 'admin',
        // Ensure menu and fields exist even if empty
        menu: editForm.menu || [],
        fields: editForm.fields || {},
      };

      const result = await apiClient.run({
        service: "platform.dynamodb",
        operation: "put",
        table: "core-app",
        data: {
          item: appData,
        },
      });

      if (result.success) {
        setShowEditDialog(false);
        setShowCreateDialog(false);
        setSelectedApp(null);
        loadApps();
      } else {
        alert(`Failed to save app: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to save app:", error);
      alert("An error occurred while saving the app");
    }
  };

  const handleDeleteApp = async (appId: string) => {
    if (!confirm("Are you sure you want to delete this app? This action cannot be undone.")) {
      return;
    }

    try {
      const result = await apiClient.run({
        service: "platform.dynamodb",
        operation: "delete",
        table: "core-app",
        data: {
          key: { id: appId },
        },
      });

      if (result.success) {
        setShowEditDialog(false);
        setSelectedApp(null);
        loadApps();
      } else {
        alert(`Failed to delete app: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to delete app:", error);
      alert("An error occurred while deleting the app");
    }
  };

  return (
    <>
    <PageTemplate
      title="Apps Management"
      description="Manage applications in the system"
      primaryAction={{
        label: 'Create App',
        onClick: handleCreateApp,
        icon: Plus,
      }}
      stats={[
        {
          label: 'Total Apps',
          value: filteredApps.length,
          icon: LayoutGrid,
          color: 'blue',
        },
        {
          label: 'Active',
          value: filteredApps.filter(a => a.status === 'active').length,
          icon: LayoutGrid,
          color: 'green',
        },
        {
          label: 'Inactive',
          value: filteredApps.filter(a => a.status !== 'active').length,
          icon: LayoutGrid,
          color: 'slate',
        },
      ]}
      search={{
        value: searchQuery,
        onChange: setSearchQuery,
        placeholder: 'Search apps by name, slug, or description...',
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading apps...</p>
          </div>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <Card className="p-12 text-center max-w-md">
            <LayoutGrid className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              No apps found
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create your first app to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreateApp}>
                <Plus className="w-4 h-4 mr-2" />
                Create App
              </Button>
            )}
          </Card>
        </div>
      ) : (
        <div className="h-full overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => (
              <Card
                key={app.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleEditApp(app)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 ${app.color || 'bg-blue-600 dark:bg-blue-700'} rounded-xl`}>
                      <LayoutGrid className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {app.name}
                      </h3>
                      <code className="text-xs text-muted-foreground">
                        {app.slug}
                      </code>
                    </div>
                  </div>
                  <Badge variant={app.status === 'active' ? 'default' : 'secondary'}>
                    {app.status || 'active'}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {app.description || 'No description provided'}
                </p>

                <div className="space-y-2 text-xs text-muted-foreground">
                  {app.owner && (
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3" />
                      <span>Owner: {app.owner}</span>
                    </div>
                  )}
                  {app.url && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-3 h-3" />
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {app.url}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>Updated: {new Date(app.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={showEditDialog || showCreateDialog} onOpenChange={(open) => {
        if (!open) {
          setShowEditDialog(false);
          setShowCreateDialog(false);
          setSelectedApp(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`p-2 ${editForm.color || 'bg-blue-600'} rounded-lg`}>
                <LayoutGrid className="w-5 h-5 text-white" />
              </div>
              {showCreateDialog ? 'Create Application' : `Edit ${editForm.name}`}
            </DialogTitle>
            <DialogDescription>
              {showCreateDialog
                ? 'Define a new application in the system'
                : 'Update application details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Basic Information */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Name *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="My Application"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Slug *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="my-app"
                    value={editForm.slug || ''}
                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">App *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="app-name"
                    value={editForm.app || ''}
                    onChange={(e) => setEditForm({ ...editForm, app: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                  placeholder="Describe this application..."
                  rows={3}
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
            </div>

            {/* Appearance */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm border-b pb-2">Appearance</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Icon</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="Lucide icon name"
                    value={editForm.icon || ''}
                    onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Color</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="bg-blue-600"
                    value={editForm.color || ''}
                    onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Order</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="0"
                    value={editForm.order || ''}
                    onChange={(e) => setEditForm({ ...editForm, order: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Configuration */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm border-b pb-2">Configuration</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                    value={editForm.status || 'active'}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="development">Development</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="application"
                    value={editForm.category || ''}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Version</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="1.0.0"
                    value={editForm.version || ''}
                    onChange={(e) => setEditForm({ ...editForm, version: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Visibility</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                    value={editForm.visibility || 'internal'}
                    onChange={(e) => setEditForm({ ...editForm, visibility: e.target.value })}
                  >
                    <option value="internal">Internal</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tenant ID</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="default"
                    value={editForm.tenantId || ''}
                    onChange={(e) => setEditForm({ ...editForm, tenantId: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Ownership & URLs */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm border-b pb-2">Ownership & URLs</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Owner</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="Owner name"
                    value={editForm.owner || ''}
                    onChange={(e) => setEditForm({ ...editForm, owner: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Owner ID</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="system"
                    value={editForm.ownerId || ''}
                    onChange={(e) => setEditForm({ ...editForm, ownerId: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">URL</label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                  placeholder="https://example.com"
                  value={editForm.url || ''}
                  onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                />
              </div>
            </div>

            {/* Agent Integration */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm border-b pb-2">Agent Integration (Optional)</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Agent</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                    value={editForm.agentId || ''}
                    onChange={(e) => setEditForm({ ...editForm, agentId: e.target.value || null })}
                    disabled={loadingAgents}
                  >
                    <option value="">No agent (None)</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.app}) - {agent.id}
                      </option>
                    ))}
                  </select>
                  {loadingAgents && (
                    <p className="text-xs text-muted-foreground mt-1">Loading agents...</p>
                  )}
                  {!loadingAgents && agents.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      No agents found. Create an agent first in the Agent Builder.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Agent Alias ID (Optional)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="Leave empty for default alias"
                    value={editForm.agentAliasId || ''}
                    onChange={(e) => setEditForm({ ...editForm, agentAliasId: e.target.value || null })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional: Specify a specific agent alias ID if needed
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Configuration */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm border-b pb-2">Menu Configuration (JSON)</h3>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Menu items for navigation. Leave empty for default or edit as JSON array.
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 font-mono text-xs"
                  placeholder='[{"id": "item-1", "label": "Home", "href": "/", "icon": "home", "order": 0}]'
                  rows={5}
                  value={JSON.stringify(editForm.menu || [], null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setEditForm({ ...editForm, menu: parsed });
                    } catch {
                      // Invalid JSON, keep as is for user to fix
                    }
                  }}
                />
              </div>
            </div>

            {/* Custom Fields */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm border-b pb-2">Custom Fields (JSON)</h3>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Additional custom fields as JSON object. Leave empty for none.
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 font-mono text-xs"
                  placeholder='{"key": "value"}'
                  rows={4}
                  value={JSON.stringify(editForm.fields || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setEditForm({ ...editForm, fields: parsed });
                    } catch {
                      // Invalid JSON, keep as is for user to fix
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-between pt-4 border-t">
            <div>
              {selectedApp && (
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteApp(selectedApp.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete App
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setShowCreateDialog(false);
                  setSelectedApp(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveApp}
                disabled={!editForm.name || !editForm.slug || !editForm.app}
                className="bg-gradient-to-r from-blue-600 to-cyan-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {showCreateDialog ? 'Create App' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageTemplate>
    </>
  );
}

export const dynamic = "force-dynamic";
