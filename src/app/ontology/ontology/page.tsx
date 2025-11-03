"use client";

/**
 * Ontology Management Page
 * View and manage ontology nodes, properties, and relationships
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DataTable,
  type ColumnDef,
} from '@captify-io/core/components/ui';
import {
  Plus,
  Network,
  Edit,
  Trash2,
  Save,
  X,
  Database,
  Tag,
  Link,
  Boxes,
} from 'lucide-react';

interface OntologyNode {
  id: string;
  type: string;
  category: string;
  domain: string;
  app: string;
  schema: string;
  tenantId: string;
  table: string;
  label: string;
  description: string;
  usage: string;
  icon: string;
  color: string;
  shape: string;
  allowedSources: string[];
  allowedTargets: string[];
  allowedConnectors: string[];
  properties?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export default function OntologyPage() {
  const router = useRouter();
  const [nodes, setNodes] = useState<OntologyNode[]>([]);
  const [filteredNodes, setFilteredNodes] = useState<OntologyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<OntologyNode | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<OntologyNode>>({});
  const [newSourceType, setNewSourceType] = useState('');
  const [newTargetType, setNewTargetType] = useState('');
  const [newConnectorType, setNewConnectorType] = useState('');

  useEffect(() => {
    loadNodes();
  }, []);

  useEffect(() => {
    filterNodes();
  }, [nodes, searchQuery, selectedDomain, selectedApp, selectedCategory]);

  const loadNodes = async () => {
    setLoading(true);
    try {
      const result = await apiClient.run({
        service: "platform.dynamodb",
        operation: "scan",
        table: "core-ontology-node",
      });

      if (result.success && result.data) {
        const items = result.data.Items || result.data;
        const nodeList = Array.isArray(items) ? items : [];
        setNodes(nodeList);
        setFilteredNodes(nodeList);
      }
    } catch (error) {
      console.error("Failed to load ontology nodes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterNodes = () => {
    let filtered = [...nodes];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (node) =>
          node.label.toLowerCase().includes(query) ||
          node.type.toLowerCase().includes(query) ||
          node.description.toLowerCase().includes(query)
      );
    }

    if (selectedDomain !== 'all') {
      filtered = filtered.filter((node) => node.domain === selectedDomain);
    }

    if (selectedApp !== 'all') {
      filtered = filtered.filter((node) => node.app === selectedApp);
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((node) => node.category === selectedCategory);
    }

    setFilteredNodes(filtered);
  };

  const domains = Array.from(new Set(nodes.map((n) => n.domain))).sort();
  const apps = Array.from(new Set(nodes.map((n) => n.app))).sort();
  const categories = Array.from(new Set(nodes.map((n) => n.category))).sort();

  // Column definitions for DataTable
  const columns: ColumnDef<OntologyNode>[] = [
    {
      accessorKey: 'type',
      header: 'Type',
      cell: (node) => (
        <div className="flex items-center gap-2">
          <div className={`p-1.5 ${node.color} rounded`}>
            <Boxes className="w-3 h-3 text-white" />
          </div>
          <code className="text-sm text-slate-900 dark:text-slate-100 font-mono">
            {node.type}
          </code>
        </div>
      ),
    },
    {
      accessorKey: 'label',
      header: 'Label',
      cell: (node) => (
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {node.label}
        </span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: (node) => (
        <span className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 max-w-xs">
          {node.description}
        </span>
      ),
      className: 'max-w-xs',
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: (node) => (
        <Badge variant="outline" className="text-xs">
          {node.category}
        </Badge>
      ),
    },
    {
      accessorKey: 'domain',
      header: 'Domain',
      cell: (node) => (
        <Badge variant="outline" className="text-xs">
          {node.domain}
        </Badge>
      ),
    },
    {
      accessorKey: 'app',
      header: 'App',
      cell: (node) => (
        <Badge variant="outline" className="text-xs">
          {node.app}
        </Badge>
      ),
    },
    {
      accessorKey: 'allowedTargets',
      header: 'Relationships',
      cell: (node) => (
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Link className="w-3 h-3" />
          <span>
            {node.allowedTargets?.length || 0}→ / {node.allowedSources?.length || 0}←
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'id',
      header: 'Actions',
      sortable: false,
      cell: (node) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenBuilder(node);
            }}
            title="Open in Flow"
          >
            <Network className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleEditNode(node);
            }}
            title="Edit Properties"
          >
            <Edit className="h-4 w-4 text-slate-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteNode(node.id);
            }}
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
      className: 'text-right',
    },
  ];

  const handleEditNode = (node: OntologyNode) => {
    setSelectedNode(node);
    setEditForm({
      ...node,
      allowedSources: node.allowedSources || [],
      allowedTargets: node.allowedTargets || [],
      allowedConnectors: node.allowedConnectors || [],
    });
    setShowEditDialog(true);
  };

  const handleOpenBuilder = (node: OntologyNode) => {
    router.push(`/ontology/ontology/builder?nodeId=${node.id}`);
  };

  const handleCreateNode = () => {
    setEditForm({
      type: '',
      category: '',
      domain: '',
      app: 'core',
      schema: 'captify',
      tenantId: 'default',
      table: '',
      label: '',
      description: '',
      usage: '',
      icon: 'Box',
      color: 'bg-slate-600',
      shape: 'rectangle',
      allowedSources: [],
      allowedTargets: [],
      allowedConnectors: [],
    });
    setShowCreateDialog(true);
  };

  const handleSaveNode = async () => {
    if (!editForm.type || !editForm.label) {
      alert('Type and Label are required');
      return;
    }

    try {
      const nodeData = {
        id: selectedNode?.id || `node-${editForm.type}`,
        ...editForm,
        updatedAt: new Date().toISOString(),
        createdAt: selectedNode?.createdAt || new Date().toISOString(),
      };

      const result = await apiClient.run({
        service: "platform.dynamodb",
        operation: "put",
        table: "core-ontology-node",
        data: {
          item: nodeData,
        },
      });

      if (result.success) {
        setShowEditDialog(false);
        setShowCreateDialog(false);
        setSelectedNode(null);
        loadNodes();
      } else {
        alert(`Failed to save node: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to save node:", error);
      alert("An error occurred while saving the node");
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm("Are you sure you want to delete this ontology node? This action cannot be undone.")) {
      return;
    }

    try {
      const result = await apiClient.run({
        service: "platform.dynamodb",
        operation: "delete",
        table: "core-ontology-node",
        data: {
          key: { id: nodeId },
        },
      });

      if (result.success) {
        setShowEditDialog(false);
        setSelectedNode(null);
        loadNodes();
      } else {
        alert(`Failed to delete node: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to delete node:", error);
      alert("An error occurred while deleting the node");
    }
  };

  const addToArray = (field: 'allowedSources' | 'allowedTargets' | 'allowedConnectors', value: string) => {
    if (!value.trim()) return;
    const current = editForm[field] || [];
    if (!current.includes(value)) {
      setEditForm({ ...editForm, [field]: [...current, value] });
    }
    // Reset input
    if (field === 'allowedSources') setNewSourceType('');
    if (field === 'allowedTargets') setNewTargetType('');
    if (field === 'allowedConnectors') setNewConnectorType('');
  };

  const removeFromArray = (field: 'allowedSources' | 'allowedTargets' | 'allowedConnectors', value: string) => {
    const current = editForm[field] || [];
    setEditForm({ ...editForm, [field]: current.filter((v) => v !== value) });
  };

  return (
    <>
    <PageTemplate
      title="Ontology Management"
      description="Manage ontology nodes, properties, and relationships"
      primaryAction={{
        label: 'Create Node',
        onClick: handleCreateNode,
        icon: Plus,
      }}
      stats={[
        {
          label: 'Total Nodes',
          value: filteredNodes.length,
          icon: Boxes,
          color: 'purple',
        },
        {
          label: 'Domains',
          value: domains.length,
          icon: Tag,
          color: 'blue',
        },
        {
          label: 'Apps',
          value: apps.length,
          icon: Database,
          color: 'green',
        },
        {
          label: 'Categories',
          value: categories.length,
          icon: Network,
          color: 'orange',
        },
      ]}
      search={{
        value: searchQuery,
        onChange: setSearchQuery,
        placeholder: 'Search nodes by label, type, or description...',
      }}
      filters={[
        <Select key="domain" value={selectedDomain} onValueChange={setSelectedDomain}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Domains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            {domains.map((domain) => (
              <SelectItem key={domain} value={domain}>
                {domain}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>,
        <Select key="app" value={selectedApp} onValueChange={setSelectedApp}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Apps" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Apps</SelectItem>
            {apps.map((app) => (
              <SelectItem key={app} value={app}>
                {app}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>,
        <Select key="category" value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>,
      ]}
    >
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading ontology nodes...</p>
          </div>
        </div>
      ) : filteredNodes.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <Card className="p-12 text-center max-w-md">
            <Network className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              No nodes found
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || selectedDomain !== 'all' || selectedApp !== 'all' || selectedCategory !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first ontology node to get started'}
            </p>
            {!searchQuery && selectedDomain === 'all' && selectedApp === 'all' && selectedCategory === 'all' && (
              <Button onClick={handleCreateNode}>
                <Plus className="w-4 h-4 mr-2" />
                Create Node
              </Button>
            )}
          </Card>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredNodes}
        />
      )}
    </PageTemplate>

    {/* Edit/Create Dialog */}
    <Dialog open={showEditDialog || showCreateDialog} onOpenChange={(open) => {
        if (!open) {
          setShowEditDialog(false);
          setShowCreateDialog(false);
          setSelectedNode(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`p-2 ${editForm.color || 'bg-slate-600'} rounded-lg`}>
                <Boxes className="w-5 h-5 text-white" />
              </div>
              {showCreateDialog ? 'Create Ontology Node' : `Edit ${editForm.label}`}
            </DialogTitle>
            <DialogDescription>
              {showCreateDialog
                ? 'Define a new ontology node with properties and relationships'
                : 'Update node properties, relationships, and metadata'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Type *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="e.g., contract, feature, task"
                    value={editForm.type || ''}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Label *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="Display name"
                    value={editForm.label || ''}
                    onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="e.g., financial, product"
                    value={editForm.category || ''}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Domain</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="e.g., Financial, Product"
                    value={editForm.domain || ''}
                    onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">App</label>
                  <Select
                    value={editForm.app || 'core'}
                    onValueChange={(value) => setEditForm({ ...editForm, app: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="core">core</SelectItem>
                      <SelectItem value="platform">platform</SelectItem>
                      <SelectItem value="pmbook">pmbook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Table</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="captify-core-TypeName"
                    value={editForm.table || ''}
                    onChange={(e) => setEditForm({ ...editForm, table: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
                  placeholder="Describe this node type..."
                  rows={2}
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Usage</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
                  placeholder="How this node is used..."
                  rows={2}
                  value={editForm.usage || ''}
                  onChange={(e) => setEditForm({ ...editForm, usage: e.target.value })}
                />
              </div>
            </div>

            {/* Visual Properties */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Visual Properties</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Icon</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="Lucide icon name"
                    value={editForm.icon || ''}
                    onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Color</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="bg-blue-600"
                    value={editForm.color || ''}
                    onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Shape</label>
                  <Select
                    value={editForm.shape || 'rectangle'}
                    onValueChange={(value) => setEditForm({ ...editForm, shape: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rectangle">Rectangle</SelectItem>
                      <SelectItem value="circle">Circle</SelectItem>
                      <SelectItem value="diamond">Diamond</SelectItem>
                      <SelectItem value="hexagon">Hexagon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Relationships */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Relationships</h4>

              {/* Allowed Sources */}
              <div>
                <label className="text-sm font-medium mb-2 block">Allowed Sources</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="Node type that can connect TO this"
                    value={newSourceType}
                    onChange={(e) => setNewSourceType(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('allowedSources', newSourceType);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => addToArray('allowedSources', newSourceType)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(editForm.allowedSources || []).map((source) => (
                    <Badge key={source} variant="secondary" className="gap-1">
                      {source}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeFromArray('allowedSources', source)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Allowed Targets */}
              <div>
                <label className="text-sm font-medium mb-2 block">Allowed Targets</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="Node type this can connect TO"
                    value={newTargetType}
                    onChange={(e) => setNewTargetType(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('allowedTargets', newTargetType);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => addToArray('allowedTargets', newTargetType)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(editForm.allowedTargets || []).map((target) => (
                    <Badge key={target} variant="secondary" className="gap-1">
                      {target}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeFromArray('allowedTargets', target)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Allowed Connectors */}
              <div>
                <label className="text-sm font-medium mb-2 block">Allowed Connectors</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="Relationship type (e.g., funds, implements)"
                    value={newConnectorType}
                    onChange={(e) => setNewConnectorType(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('allowedConnectors', newConnectorType);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => addToArray('allowedConnectors', newConnectorType)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(editForm.allowedConnectors || []).map((connector) => (
                    <Badge key={connector} variant="secondary" className="gap-1">
                      {connector}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeFromArray('allowedConnectors', connector)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-between pt-4 border-t">
            <div>
              {selectedNode && (
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteNode(selectedNode.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Node
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setShowCreateDialog(false);
                  setSelectedNode(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveNode}
                disabled={!editForm.type || !editForm.label}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {showCreateDialog ? 'Create Node' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const dynamic = "force-dynamic";
