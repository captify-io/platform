"use client";

/**
 * Ontology Node Edit Dialog
 * Allows editing node properties, groups, roles, permissions, and data attachments
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@captify-io/core/components/ui';
import { Save, X, Plus, Trash2, Database } from 'lucide-react';
import { useOntology, OntologyNode } from '../context/OntologyContext';
import { toast } from 'sonner';

interface OntologyNodeDialogProps {
  nodeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OntologyNodeDialog({ nodeId, open, onOpenChange }: OntologyNodeDialogProps) {
  const { model, updateNode, deleteNode, attachDataToNode } = useOntology();
  const [editForm, setEditForm] = useState<Partial<OntologyNode>>({});
  const [newSource, setNewSource] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newConnector, setNewConnector] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [newRole, setNewRole] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (nodeId && open) {
      const node = model.nodes.find(n => n.id === nodeId);
      if (node) {
        setEditForm({
          ...node,
          allowedSources: node.allowedSources || [],
          allowedTargets: node.allowedTargets || [],
          allowedConnectors: node.allowedConnectors || [],
          groups: node.groups || [],
          roles: node.roles || [],
          permissions: node.permissions || {},
        });
      }
    }
  }, [nodeId, open, model.nodes]);

  const handleSave = () => {
    if (!nodeId) return;

    updateNode(nodeId, {
      ...editForm,
      updatedAt: new Date().toISOString(),
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!nodeId || !confirm('Are you sure you want to delete this node?')) return;
    deleteNode(nodeId);
    onOpenChange(false);
  };

  const handleAttachData = async () => {
    if (!nodeId || !editForm.table) return;

    setLoading(true);
    try {
      await attachDataToNode(nodeId, editForm.table);
      toast.success('Data attached successfully to node');
    } catch (error) {
      console.error('Failed to attach data:', error);
      toast.error('Failed to attach data to node');
    } finally {
      setLoading(false);
    }
  };

  const addToArray = (field: 'allowedSources' | 'allowedTargets' | 'allowedConnectors' | 'groups' | 'roles', value: string) => {
    if (!value.trim()) return;
    const current = (editForm[field] as string[]) || [];
    if (!current.includes(value)) {
      setEditForm({ ...editForm, [field]: [...current, value] });
    }
    // Reset input
    if (field === 'allowedSources') setNewSource('');
    if (field === 'allowedTargets') setNewTarget('');
    if (field === 'allowedConnectors') setNewConnector('');
    if (field === 'groups') setNewGroup('');
    if (field === 'roles') setNewRole('');
  };

  const removeFromArray = (field: 'allowedSources' | 'allowedTargets' | 'allowedConnectors' | 'groups' | 'roles', value: string) => {
    const current = (editForm[field] as string[]) || [];
    setEditForm({ ...editForm, [field]: current.filter((v) => v !== value) });
  };

  if (!nodeId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 ${editForm.color || 'bg-slate-600'} rounded-lg`}>
              <Database className="w-5 h-5 text-white" />
            </div>
            Edit {editForm.label}
          </DialogTitle>
          <DialogDescription>
            Configure node properties, relationships, permissions, and data
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Type *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
                  value={editForm.type || ''}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Label *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
                  value={editForm.label || ''}
                  onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
                  value={editForm.category || ''}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Domain</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
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
                rows={2}
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Icon</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
                  value={editForm.icon || ''}
                  onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Color</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
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
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Relationships Tab */}
          <TabsContent value="relationships" className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Allowed Sources</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
                  placeholder="Node type that can connect TO this"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addToArray('allowedSources', newSource)}
                />
                <Button size="sm" onClick={() => addToArray('allowedSources', newSource)}>
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

            <div>
              <label className="text-sm font-medium mb-2 block">Allowed Targets</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
                  placeholder="Node type this can connect TO"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addToArray('allowedTargets', newTarget)}
                />
                <Button size="sm" onClick={() => addToArray('allowedTargets', newTarget)}>
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

            <div>
              <label className="text-sm font-medium mb-2 block">Allowed Connectors</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
                  placeholder="Relationship type (e.g., funds, implements)"
                  value={newConnector}
                  onChange={(e) => setNewConnector(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addToArray('allowedConnectors', newConnector)}
                />
                <Button size="sm" onClick={() => addToArray('allowedConnectors', newConnector)}>
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
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-4 mt-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold">Attach Table Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Connect this node to a DynamoDB table
                  </p>
                </div>
                <Button onClick={handleAttachData} disabled={!editForm.table || loading}>
                  <Database className="w-4 h-4 mr-2" />
                  {loading ? 'Loading...' : 'Attach Data'}
                </Button>
              </div>

              {editForm.properties?.attachedData && (
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">
                    Data Source: <code className="text-purple-600">{editForm.properties.dataSource}</code>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Records: {editForm.properties.dataCount}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Groups</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
                  placeholder="Add group"
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addToArray('groups', newGroup)}
                />
                <Button size="sm" onClick={() => addToArray('groups', newGroup)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(editForm.groups || []).map((group) => (
                  <Badge key={group} variant="secondary" className="gap-1">
                    {group}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeFromArray('groups', group)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Roles</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
                  placeholder="Add role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addToArray('roles', newRole)}
                />
                <Button size="sm" onClick={() => addToArray('roles', newRole)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(editForm.roles || []).map((role) => (
                  <Badge key={role} variant="secondary" className="gap-1">
                    {role}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeFromArray('roles', role)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 justify-between pt-4 border-t">
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Node
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-purple-600 to-pink-600">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
