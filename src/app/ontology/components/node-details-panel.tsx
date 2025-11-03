"use client";

/**
 * Node Details Panel
 * Shows details and configuration for selected ontology node
 */

import { useState } from 'react';
import { X, ExternalLink, Trash2, AlertTriangle } from 'lucide-react';
import { Button, Badge, Separator, Label } from '@captify-io/core';
import { apiClient } from '@captify-io/core';
import type { FlowNode } from '@captify-io/core/components/flow';

interface NodeDetailsPanelProps {
  node: FlowNode;
  onClose: () => void;
  onUpdate: () => void;
  totalNodes?: number;
  filteredNodes?: number;
}

export function NodeDetailsPanel({ node, onClose, onUpdate, totalNodes = 0, filteredNodes = 0 }: NodeDetailsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirm(`Delete "${node.data.label}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'delete',
        table: 'core-ontology-node',
        data: {
          Key: { id: node.id },
        },
      });

      if (result.success) {
        onUpdate();
        onClose();
      } else {
        setError(result.error?.message || 'Failed to delete node');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleViewInDatabase = () => {
    // Open DynamoDB table view (if implemented)
    console.log('View in database:', node.id);
  };

  return (
    <div className="w-80 border-l bg-background flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Node Details</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Info */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Name</Label>
            <div className="text-sm font-medium mt-1">{node.data.label}</div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">ID</Label>
            <div className="text-sm font-mono mt-1 text-muted-foreground">{node.id}</div>
          </div>

          {node.data.type && (
            <div>
              <Label className="text-xs text-muted-foreground">Type</Label>
              <div className="mt-1">
                <Badge variant="secondary">{node.data.type}</Badge>
              </div>
            </div>
          )}

          {node.data.category && (
            <div>
              <Label className="text-xs text-muted-foreground">Category</Label>
              <div className="mt-1">
                <Badge variant="outline">{node.data.category}</Badge>
              </div>
            </div>
          )}

          {node.data.domain && (
            <div>
              <Label className="text-xs text-muted-foreground">Domain</Label>
              <div className="text-sm mt-1">{node.data.domain}</div>
            </div>
          )}

          {node.data.description && (
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <div className="text-sm mt-1 text-muted-foreground">
                {node.data.description}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Visual Properties */}
        {(node.data.icon || node.data.color) && (
          <>
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Visual Properties</h4>

              {node.data.icon && (
                <div>
                  <Label className="text-xs text-muted-foreground">Icon</Label>
                  <div className="text-sm mt-1">{node.data.icon}</div>
                </div>
              )}

              {node.data.color && (
                <div>
                  <Label className="text-xs text-muted-foreground">Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: node.data.color }}
                    />
                    <span className="text-sm font-mono">{node.data.color}</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />
          </>
        )}

        {/* Data Source */}
        {node.data.properties?.dataSource && (
          <>
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Data Source</h4>

              <div>
                <Label className="text-xs text-muted-foreground">Table Name</Label>
                <div className="text-sm font-mono mt-1 text-muted-foreground">
                  {node.data.properties.dataSource}
                </div>
              </div>

              {node.data.properties?.primaryKey && (
                <div>
                  <Label className="text-xs text-muted-foreground">Primary Key</Label>
                  <div className="text-sm font-mono mt-1">
                    {node.data.properties.primaryKey}
                  </div>
                </div>
              )}
            </div>

            <Separator />
          </>
        )}

        {/* Schema Properties */}
        {node.data.properties?.schema?.properties && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Schema Properties</h4>

            <div className="space-y-2">
              {Object.entries(node.data.properties.schema.properties).map(([key, prop]: [string, any]) => (
                <div key={key} className="flex items-start justify-between text-sm p-2 bg-muted/50 rounded">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{key}</div>
                    {prop.description && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {prop.description}
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {prop.type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t">
        <div className="p-4 space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleViewInDatabase}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View in Database
          </Button>

          <Button
            variant="destructive"
            className="w-full"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {loading ? 'Deleting...' : 'Delete Node'}
          </Button>
        </div>

        {/* Node Count */}
        <div className="px-4 py-3 border-t bg-muted/50 text-xs text-muted-foreground text-right">
          {filteredNodes} / {totalNodes} nodes
        </div>
      </div>
    </div>
  );
}
