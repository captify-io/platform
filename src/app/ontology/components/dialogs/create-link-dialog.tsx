"use client";

/**
 * Create Link Dialog
 * Dialog for creating new ontology edges/relationships
 */

import { useState, useEffect } from 'react';
import { apiClient, cn, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, Checkbox } from '@captify-io/core';

interface CreateLinkDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (link: any) => void;
  preselectedSource?: string;
  preselectedTarget?: string;
}

interface OntologyNode {
  id: string;
  name: string;
  type: string;
  category?: string;
  domain?: string;
}

const RELATION_TYPES = [
  'hasMany',
  'belongsTo',
  'references',
  'extends',
  'implements',
  'contains',
  'dependsOn',
  'produces',
  'consumes',
  'triggers',
];

const CARDINALITY_TYPES = [
  'one-to-one',
  'one-to-many',
  'many-to-many',
];

export function CreateLinkDialog({
  open,
  onClose,
  onSuccess,
  preselectedSource,
  preselectedTarget,
}: CreateLinkDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<OntologyNode[]>([]);

  // Form state
  const [source, setSource] = useState<string>(preselectedSource || '');
  const [target, setTarget] = useState<string>(preselectedTarget || '');
  const [relation, setRelation] = useState<string>('references');
  const [description, setDescription] = useState('');
  const [cardinality, setCardinality] = useState<string>('one-to-many');
  const [cascadeDelete, setCascadeDelete] = useState(false);
  const [foreignKey, setForeignKey] = useState('');
  const [inverseRelation, setInverseRelation] = useState('');
  const [active, setActive] = useState(true);

  // Load available nodes
  useEffect(() => {
    if (open) {
      loadNodes();
    }
  }, [open]);

  // Auto-generate inverse relation
  useEffect(() => {
    if (relation && !inverseRelation) {
      const inverses: Record<string, string> = {
        hasMany: 'belongsTo',
        belongsTo: 'hasMany',
        references: 'referencedBy',
        extends: 'extendedBy',
        implements: 'implementedBy',
        contains: 'containedBy',
        dependsOn: 'dependencyOf',
        produces: 'producedBy',
        consumes: 'consumedBy',
        triggers: 'triggeredBy',
      };
      setInverseRelation(inverses[relation] || '');
    }
  }, [relation]);

  const loadNodes = async () => {
    setLoadingNodes(true);
    try {
      const result = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-ontology-node',
      });

      if (result.success && result.data?.Items) {
        setNodes(result.data.Items);
      }
    } catch (error) {
      console.error('Failed to load nodes:', error);
    } finally {
      setLoadingNodes(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get source and target node details
      const sourceNode = nodes.find(n => n.id === source);
      const targetNode = nodes.find(n => n.id === target);

      if (!sourceNode || !targetNode) {
        setError('Invalid source or target node');
        return;
      }

      // Generate edge ID
      const edgeId = `edge-${source}-${relation}-${target}`;

      // Create link
      const result = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'put',
        table: 'core-ontology-edge',
        data: {
          Item: {
            id: edgeId,
            source,
            target,
            relation,
            sourceType: sourceNode.type,
            targetType: targetNode.type,
            description,
            properties: {
              cardinality,
              cascadeDelete,
              ...(foreignKey && { foreignKey }),
              ...(inverseRelation && { inverseRelation }),
            },
            active: active.toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      });

      if (result.success) {
        onSuccess?.(result.data);
        onClose();
        // Reset form
        resetForm();
      } else {
        setError(result.error?.message || 'Failed to create link');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSource(preselectedSource || '');
    setTarget(preselectedTarget || '');
    setRelation('references');
    setDescription('');
    setCardinality('one-to-many');
    setCascadeDelete(false);
    setForeignKey('');
    setInverseRelation('');
    setActive(true);
  };

  const selectedSource = nodes.find(n => n.id === source);
  const selectedTarget = nodes.find(n => n.id === target);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Create Ontology Link</DialogTitle>
          <DialogDescription>
            Define a relationship between two entity types
          </DialogDescription>
        </DialogHeader>

        {loadingNodes ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-muted-foreground">Loading nodes...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 space-y-6">
              {/* Connection */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Connection</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source">Source Node *</Label>
                    <Select value={source} onValueChange={setSource} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source..." />
                      </SelectTrigger>
                      <SelectContent>
                        {nodes.map(node => (
                          <SelectItem key={node.id} value={node.id}>
                            <div className="flex flex-col">
                              <span>{node.name}</span>
                              <span className="text-xs text-muted-foreground">{node.type}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedSource && (
                      <p className="text-xs text-muted-foreground">
                        {selectedSource.domain} › {selectedSource.category}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target">Target Node *</Label>
                    <Select value={target} onValueChange={setTarget} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target..." />
                      </SelectTrigger>
                      <SelectContent>
                        {nodes.map(node => (
                          <SelectItem key={node.id} value={node.id}>
                            <div className="flex flex-col">
                              <span>{node.name}</span>
                              <span className="text-xs text-muted-foreground">{node.type}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedTarget && (
                      <p className="text-xs text-muted-foreground">
                        {selectedTarget.domain} › {selectedTarget.category}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relation">Relation Type *</Label>
                  <Select value={relation} onValueChange={setRelation} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATION_TYPES.map(rel => (
                        <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {source && target && relation && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm">
                      <span className="font-medium">{selectedSource?.name}</span>
                      {' '}
                      <span className="text-muted-foreground">{relation}</span>
                      {' '}
                      <span className="font-medium">{selectedTarget?.name}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Properties */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="font-semibold text-lg">Properties</h3>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe this relationship..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardinality">Cardinality *</Label>
                    <Select value={cardinality} onValueChange={setCardinality} required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CARDINALITY_TYPES.map(card => (
                          <SelectItem key={card} value={card}>{card}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="foreignKey">Foreign Key</Label>
                    <Input
                      id="foreignKey"
                      value={foreignKey}
                      onChange={(e) => setForeignKey(e.target.value)}
                      placeholder="e.g., contractId"
                    />
                    <p className="text-xs text-muted-foreground">
                      Property name in source that references target
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inverseRelation">Inverse Relation</Label>
                  <Input
                    id="inverseRelation"
                    value={inverseRelation}
                    onChange={(e) => setInverseRelation(e.target.value)}
                    placeholder="Auto-generated from relation type"
                  />
                  <p className="text-xs text-muted-foreground">
                    Relation name from target's perspective
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="cascadeDelete"
                      checked={cascadeDelete}
                      onCheckedChange={setCascadeDelete}
                    />
                    <Label htmlFor="cascadeDelete" className="text-sm font-medium">
                      Cascade Delete
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="active"
                      checked={active}
                      onCheckedChange={setActive}
                    />
                    <Label htmlFor="active" className="text-sm font-medium">
                      Active
                    </Label>
                  </div>
                </div>

                {cascadeDelete && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-md p-3 text-sm">
                    Warning: Deleting the source node will also delete the target node
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
                  {error}
                </div>
              )}
            </form>

            {/* Footer */}
            <DialogFooter className="p-6 border-t bg-muted/30">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !source || !target || !relation}
              >
                {loading ? 'Creating...' : 'Create Link'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
