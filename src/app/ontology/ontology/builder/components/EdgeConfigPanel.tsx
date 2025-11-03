"use client";

/**
 * Edge Configuration Panel
 * Right-side panel for editing edge/relationship properties
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@captify-io/core/components/ui';
import { Save, X, Trash2, Link } from 'lucide-react';
import { useOntology, OntologyEdge } from '../context/OntologyContext';

interface EdgeConfigPanelProps {
  edgeId: string;
  onClose: () => void;
}

export function EdgeConfigPanel({ edgeId, onClose }: EdgeConfigPanelProps) {
  const { model, updateEdge, deleteEdge } = useOntology();
  const [editForm, setEditForm] = useState<Partial<OntologyEdge>>({});

  useEffect(() => {
    const edge = model.edges.find(e => e.id === edgeId);
    if (edge) {
      setEditForm({ ...edge });
    }
  }, [edgeId, model.edges]);

  const handleSave = () => {
    updateEdge(edgeId, {
      ...editForm,
      properties: {
        ...editForm.properties,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this relationship?')) return;
    deleteEdge(edgeId);
    onClose();
  };

  const sourceNode = model.nodes.find(n => n.id === editForm.source);
  const targetNode = model.nodes.find(n => n.id === editForm.target);

  return (
    <div className="h-full flex flex-col bg-background border-l">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Link className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">Edit Relationship</h3>
            <p className="text-xs text-muted-foreground">
              {sourceNode?.label} → {targetNode?.label}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Visual Representation */}
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 ${sourceNode?.color || 'bg-slate-600'} rounded`}>
                <div className="w-3 h-3 bg-white rounded-full" />
              </div>
              <span className="font-medium">{sourceNode?.label}</span>
            </div>
            <div className="text-muted-foreground">→</div>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 ${targetNode?.color || 'bg-slate-600'} rounded`}>
                <div className="w-3 h-3 bg-white rounded-full" />
              </div>
              <span className="font-medium">{targetNode?.label}</span>
            </div>
          </div>
        </div>

        {/* Relationship Type */}
        <div>
          <label className="text-sm font-medium mb-2 block">Relationship Type</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., funds, implements, depends on"
            value={editForm.type || ''}
            onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
          />
        </div>

        {/* Label */}
        <div>
          <label className="text-sm font-medium mb-2 block">Label (optional)</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            placeholder="Display label for this relationship"
            value={editForm.label || ''}
            onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium mb-2 block">Description</label>
          <textarea
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            rows={3}
            placeholder="Describe this relationship..."
            value={editForm.properties?.description || ''}
            onChange={(e) => setEditForm({
              ...editForm,
              properties: { ...editForm.properties, description: e.target.value }
            })}
          />
        </div>

        {/* Cardinality */}
        <div>
          <label className="text-sm font-medium mb-2 block">Cardinality</label>
          <select
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            value={editForm.properties?.cardinality || 'one-to-many'}
            onChange={(e) => setEditForm({
              ...editForm,
              properties: { ...editForm.properties, cardinality: e.target.value }
            })}
          >
            <option value="one-to-one">One to One</option>
            <option value="one-to-many">One to Many</option>
            <option value="many-to-one">Many to One</option>
            <option value="many-to-many">Many to Many</option>
          </select>
        </div>

        {/* Required */}
        <div>
          <label className="text-sm font-medium mb-2 block">Required</label>
          <select
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            value={editForm.properties?.required ? 'yes' : 'no'}
            onChange={(e) => setEditForm({
              ...editForm,
              properties: { ...editForm.properties, required: e.target.value === 'yes' }
            })}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
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
