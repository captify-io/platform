"use client";

/**
 * Ontology Edge Edit Dialog
 * Allows editing relationship properties between nodes
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
} from '@captify-io/core/components/ui';
import { Save, Trash2, Link } from 'lucide-react';
import { useOntology, OntologyEdge } from '../context/OntologyContext';

interface OntologyEdgeDialogProps {
  edgeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OntologyEdgeDialog({ edgeId, open, onOpenChange }: OntologyEdgeDialogProps) {
  const { model, updateEdge, deleteEdge } = useOntology();
  const [editForm, setEditForm] = useState<Partial<OntologyEdge>>({});

  useEffect(() => {
    if (edgeId && open) {
      const edge = model.edges.find(e => e.id === edgeId);
      if (edge) {
        setEditForm({ ...edge });
      }
    }
  }, [edgeId, open, model.edges]);

  const handleSave = () => {
    if (!edgeId) return;

    updateEdge(edgeId, {
      ...editForm,
      properties: {
        ...editForm.properties,
        updatedAt: new Date().toISOString(),
      },
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!edgeId || !confirm('Are you sure you want to delete this relationship?')) return;
    deleteEdge(edgeId);
    onOpenChange(false);
  };

  if (!edgeId) return null;

  const sourceNode = model.nodes.find(n => n.id === editForm.source);
  const targetNode = model.nodes.find(n => n.id === editForm.target);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Link className="w-5 h-5 text-white" />
            </div>
            Edit Relationship
          </DialogTitle>
          <DialogDescription>
            Configure the relationship between{' '}
            <span className="font-semibold">{sourceNode?.label}</span> and{' '}
            <span className="font-semibold">{targetNode?.label}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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

          <div>
            <label className="text-sm font-medium mb-2 block">Relationship Type</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
              placeholder="e.g., funds, implements, depends on"
              value={editForm.type || ''}
              onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Label (optional)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
              placeholder="Display label for this relationship"
              value={editForm.label || ''}
              onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
              rows={3}
              placeholder="Describe this relationship..."
              value={editForm.properties?.description || ''}
              onChange={(e) => setEditForm({
                ...editForm,
                properties: { ...editForm.properties, description: e.target.value }
              })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Cardinality</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
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

            <div>
              <label className="text-sm font-medium mb-2 block">Required</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700"
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
        </div>

        <div className="flex gap-3 justify-between pt-4 border-t">
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Relationship
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
