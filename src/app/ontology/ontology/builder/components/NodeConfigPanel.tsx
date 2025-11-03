"use client";

/**
 * Node Configuration Panel
 * Right-side panel for editing node properties
 */

import React, { useState, useEffect } from 'react';
import {
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

interface NodeConfigPanelProps {
  nodeId: string;
  onClose: () => void;
}

export function NodeConfigPanel({ nodeId, onClose }: NodeConfigPanelProps) {
  const { model, updateNode, deleteNode, attachDataToNode } = useOntology();
  const [editForm, setEditForm] = useState<Partial<OntologyNode>>({});
  const [newSource, setNewSource] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newConnector, setNewConnector] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [newRole, setNewRole] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
  }, [nodeId, model.nodes]);

  const handleSave = () => {
    updateNode(nodeId, {
      ...editForm,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this node?')) return;
    deleteNode(nodeId);
    onClose();
  };

  const handleAttachData = async () => {
    if (!editForm.table) return;

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

  return (
    <div className="h-full flex flex-col bg-background border-l">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${editForm.color || 'bg-slate-600'} rounded-lg`}>
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">{editForm.label}</h3>
            <p className="text-xs text-muted-foreground">{editForm.type}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="relationships">Relations</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          {/* Basic Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={editForm.type || ''}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Label</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={editForm.label || ''}
                onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={editForm.category || ''}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">App</label>
              <Select
                value={editForm.app || 'core'}
                onValueChange={(value) => setEditForm({ ...editForm, app: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an app..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="platform">Platform</SelectItem>
                  <SelectItem value="pmbook">PMBook</SelectItem>
                  <SelectItem value="aihub">AI Hub</SelectItem>
                  <SelectItem value="mi">Materiel Insights</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={3}
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Color</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={editForm.color || ''}
                onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
              />
            </div>
          </TabsContent>

          {/* Relationships Tab */}
          <TabsContent value="relationships" className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Allowed Targets</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  placeholder="Node type"
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
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  placeholder="Relationship type"
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
            <div>
              <label className="text-sm font-medium mb-2 block">Table Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="captify-core-TypeName"
                value={editForm.table || ''}
                onChange={(e) => setEditForm({ ...editForm, table: e.target.value })}
              />
            </div>
            <Button
              onClick={handleAttachData}
              disabled={!editForm.table || loading}
              className="w-full"
            >
              <Database className="w-4 h-4 mr-2" />
              {loading ? 'Loading...' : 'Attach Data'}
            </Button>

            {editForm.properties?.attachedData && (
              <div className="mt-4 p-3 bg-muted rounded">
                <div className="text-sm font-medium mb-1">
                  Data Source: <code className="text-purple-600">{editForm.properties.dataSource}</code>
                </div>
                <div className="text-sm text-muted-foreground">
                  Records: {editForm.properties.dataCount}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="p-4 border-t flex gap-2">
        <Button variant="destructive" onClick={handleDelete} className="mr-auto">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
        <Button onClick={handleSave} className="bg-purple-600">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>
    </div>
  );
}
