"use client";

/**
 * Designer Properties Section
 * Simplified properties editor for designer nodes
 * Based on workflow PropertiesSection but adapted for designer context
 */

import React, { useState } from 'react';
import { Plus, X, Pencil } from 'lucide-react';
import { Button } from '@captify-io/core/components/ui';

type PropertyType = 'string' | 'number' | 'date' | 'variable';

interface NodeProperty {
  name: string;
  type: PropertyType;
  value: any;
}

interface DesignerPropertiesSectionProps {
  properties: NodeProperty[];
  onUpdate: (properties: NodeProperty[]) => void;
  upstreamVariables?: Array<{ name: string; type: string; source: string }>;
}

export function DesignerPropertiesSection({
  properties = [],
  onUpdate,
  upstreamVariables = [],
}: DesignerPropertiesSectionProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState<NodeProperty>({
    name: '',
    type: 'string',
    value: '',
  });
  const [nameError, setNameError] = useState<string | null>(null);

  const validateCamelCase = (name: string): boolean => {
    if (!name) return false;
    const camelCaseRegex = /^[a-z][a-zA-Z0-9]*$/;
    return camelCaseRegex.test(name);
  };

  const handleNameChange = (newName: string) => {
    setEditForm({ ...editForm, name: newName });
    if (!newName) {
      setNameError('Name is required');
    } else if (!validateCamelCase(newName)) {
      setNameError('Must be camelCase (start with lowercase, no special characters)');
    } else {
      setNameError(null);
    }
  };

  const handleTypeChange = (newType: PropertyType) => {
    let defaultValue = '';
    switch (newType) {
      case 'number':
        defaultValue = '0';
        break;
      case 'date':
        defaultValue = new Date().toISOString().split('T')[0];
        break;
      default:
        defaultValue = '';
    }
    setEditForm({ ...editForm, type: newType, value: defaultValue });
  };

  const handleSave = () => {
    if (!editForm.name || nameError) return;

    if (editingIndex !== null) {
      const updated = [...properties];
      updated[editingIndex] = editForm;
      onUpdate(updated);
      setEditingIndex(null);
    } else {
      onUpdate([...properties, editForm]);
      setIsAdding(false);
    }

    setEditForm({ name: '', type: 'string', value: '' });
  };

  const handleDelete = (index: number) => {
    onUpdate(properties.filter((_, i) => i !== index));
  };

  const handleEdit = (index: number) => {
    setEditForm(properties[index]);
    setEditingIndex(index);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setIsAdding(false);
    setEditForm({ name: '', type: 'string', value: '' });
    setNameError(null);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Properties</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setIsAdding(true);
            setEditingIndex(null);
            setEditForm({ name: '', type: 'string', value: '' });
          }}
          disabled={isAdding || editingIndex !== null}
          className="h-7 text-xs gap-1"
        >
          <Plus className="w-3 h-3" />
          Add
        </Button>
      </div>

      {/* Properties Pills */}
      {properties.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {properties.map((prop, index) => (
            <div
              key={index}
              className="pl-2 pr-1 py-1 gap-2 text-xs font-normal bg-secondary hover:bg-secondary/80 rounded-md flex items-center cursor-pointer group"
              onClick={() => handleEdit(index)}
            >
              <span className="font-mono">
                {prop.name}: <span className="text-muted-foreground">{String(prop.value)}</span>
              </span>
              <div className="flex gap-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(index);
                  }}
                  className="hover:bg-primary/20 rounded p-0.5"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(index);
                  }}
                  className="hover:bg-destructive/20 rounded p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {properties.length === 0 && !isAdding && !editingIndex && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No properties yet. Click Add to create one.
        </p>
      )}

      {/* Property Editor */}
      {(isAdding || editingIndex !== null) && (
        <div className="p-3 space-y-3 bg-muted/30 rounded-md">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="prop-name" className="text-xs font-medium">
              Property Name
            </label>
            <input
              id="prop-name"
              value={editForm.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="myProperty"
              className="w-full h-7 px-2 text-sm rounded-md border border-input bg-background"
            />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label htmlFor="prop-type" className="text-xs font-medium">
              Type
            </label>
            <select
              id="prop-type"
              value={editForm.type}
              onChange={(e) => handleTypeChange(e.target.value as PropertyType)}
              className="w-full h-7 px-2 text-sm rounded-md border border-input bg-background"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="variable">Variable</option>
            </select>
          </div>

          {/* Value */}
          <div className="space-y-1.5">
            <label htmlFor="prop-value" className="text-xs font-medium">
              Value
            </label>
            {editForm.type === 'variable' ? (
              <select
                id="prop-value"
                value={editForm.value}
                onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                className="w-full h-7 px-2 text-sm rounded-md border border-input bg-background"
              >
                <option value="">Select a variable...</option>
                {upstreamVariables.map((v, idx) => (
                  <option key={idx} value={v.name}>
                    {v.name} ({v.type} from {v.source})
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="prop-value"
                type={editForm.type === 'number' ? 'number' : editForm.type === 'date' ? 'date' : 'text'}
                value={editForm.value}
                onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                placeholder={editForm.type === 'number' ? '0' : editForm.type === 'date' ? 'YYYY-MM-DD' : 'Enter value...'}
                className="w-full h-7 px-2 text-sm rounded-md border border-input bg-background"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={!editForm.name || !!nameError}
              className="h-7 text-xs"
            >
              {editingIndex !== null ? 'Update' : 'Add'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
