"use client";

/**
 * Create Node Dialog
 * Dialog for creating new ontology nodes
 */

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  apiClient,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Checkbox
} from '@captify-io/core';

interface CreateNodeDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (node: any) => void;
}

interface Property {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date' | 'enum';
  description: string;
  required: boolean;
  searchable: boolean;
  primaryKey: boolean;
  defaultValue?: string;
  enumValues?: string[];
}

const CATEGORIES = [
  'entity',
  'concept',
  'process',
  'workflow',
  'interface',
  'value-type',
  'link-type',
];

const APPS = ['core', 'pmbook', 'aihub', 'mi'];

const PROPERTY_TYPES = [
  'string',
  'number',
  'boolean',
  'object',
  'array',
  'date',
  'enum',
];

export function CreateNodeDialog({ open, onClose, onSuccess }: CreateNodeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState<string>('entity');
  const [domain, setDomain] = useState('');
  const [app, setApp] = useState<string>('core');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [active, setActive] = useState(true);
  const [tableName, setTableName] = useState('');
  const [createTable, setCreateTable] = useState(true);
  const [properties, setProperties] = useState<Property[]>([
    {
      name: 'id',
      type: 'string',
      description: 'Unique identifier',
      required: true,
      searchable: true,
      primaryKey: true,
    },
  ]);

  // Auto-generate type from name
  const handleNameChange = (newName: string) => {
    setName(newName);
    const kebabCase = newName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setType(kebabCase);
    setTableName(`${app}-${kebabCase}`);
  };

  // Update table name when app changes
  const handleAppChange = (newApp: string) => {
    setApp(newApp);
    if (type) {
      setTableName(`${newApp}-${type}`);
    }
  };

  const addProperty = () => {
    setProperties([
      ...properties,
      {
        name: '',
        type: 'string',
        description: '',
        required: false,
        searchable: false,
        primaryKey: false,
      },
    ]);
  };

  const removeProperty = (index: number) => {
    setProperties(properties.filter((_, i) => i !== index));
  };

  const updateProperty = (index: number, field: keyof Property, value: any) => {
    const updated = [...properties];
    updated[index] = { ...updated[index], [field]: value };

    // If marking as primary key, also mark as required and searchable
    if (field === 'primaryKey' && value === true) {
      updated[index].required = true;
      updated[index].searchable = true;
    }

    setProperties(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Build schema from properties
      const schema = {
        type: 'object',
        properties: properties.reduce((acc, prop) => {
          acc[prop.name] = {
            type: prop.type,
            description: prop.description,
            ...(prop.defaultValue && { default: prop.defaultValue }),
            ...(prop.enumValues && { enum: prop.enumValues }),
          };
          return acc;
        }, {} as any),
        required: properties.filter(p => p.required).map(p => p.name),
      };

      // Build indexes
      const indexes: any = {};
      properties
        .filter(p => p.searchable)
        .forEach(p => {
          indexes[`${p.name}-index`] = {
            hashKey: p.name,
            type: 'GSI',
          };
        });

      // Find primary key
      const primaryKey = properties.find(p => p.primaryKey)?.name || 'id';

      // Create node
      const result = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'put',
        table: 'core-ontology-node',
        data: {
          Item: {
            id: `${app}-${type}`,
            name,
            type,
            category,
            domain,
            app,
            description,
            icon,
            color,
            active: active.toString(),
            properties: {
              dataSource: tableName,
              schema,
              primaryKey,
              indexes,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      });

      if (result.success) {
        onSuccess?.(result.data);
        onClose();
      } else {
        setError(result.error?.message || 'Failed to create node');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Create Ontology Node</DialogTitle>
          <DialogDescription>
            Define a new entity type in the ontology
          </DialogDescription>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Contract Modification"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Input
                  id="type"
                  required
                  value={type}
                  disabled
                  placeholder="contract-modification"
                />
                <p className="text-xs text-muted-foreground">
                  Auto-generated from name
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Domain *</Label>
                <Input
                  id="domain"
                  required
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="Contract"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="app">App *</Label>
                <Select value={app} onValueChange={handleAppChange} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPS.map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe this entity type..."
              />
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

          {/* Data Source */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-semibold text-lg">Data Source</h3>

            <div className="space-y-2">
              <Label htmlFor="tableName">Table Name</Label>
              <Input
                id="tableName"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Auto-generated, but can be customized
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="createTable"
                checked={createTable}
                onCheckedChange={setCreateTable}
              />
              <Label htmlFor="createTable" className="text-sm font-medium">
                Create DynamoDB table on save
              </Label>
            </div>
          </div>

          {/* Schema */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Schema</h3>
              <Button
                type="button"
                onClick={addProperty}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </div>

            <div className="space-y-3">
              {properties.map((property, index) => (
                <div key={index} className="border rounded-md p-4 space-y-3 bg-muted/30">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <Input
                        value={property.name}
                        onChange={(e) => updateProperty(index, 'name', e.target.value)}
                        placeholder="Property name"
                        disabled={property.primaryKey && index === 0}
                      />

                      <Select
                        value={property.type}
                        onValueChange={(value) => updateProperty(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROPERTY_TYPES.map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        value={property.description}
                        onChange={(e) => updateProperty(index, 'description', e.target.value)}
                        placeholder="Description"
                      />
                    </div>

                    {!property.primaryKey && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProperty(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`required-${index}`}
                        checked={property.required}
                        onCheckedChange={(checked) => updateProperty(index, 'required', checked)}
                        disabled={property.primaryKey}
                      />
                      <Label htmlFor={`required-${index}`}>Required</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`searchable-${index}`}
                        checked={property.searchable}
                        onCheckedChange={(checked) => updateProperty(index, 'searchable', checked)}
                        disabled={property.primaryKey}
                      />
                      <Label htmlFor={`searchable-${index}`}>Searchable</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`primaryKey-${index}`}
                        checked={property.primaryKey}
                        onCheckedChange={(checked) => updateProperty(index, 'primaryKey', checked)}
                        disabled={index === 0}
                      />
                      <Label htmlFor={`primaryKey-${index}`}>Primary Key</Label>
                    </div>
                  </div>

                  {property.type === 'enum' && (
                    <Input
                      value={property.enumValues?.join(', ') || ''}
                      onChange={(e) => updateProperty(index, 'enumValues', e.target.value.split(',').map(v => v.trim()))}
                      placeholder="Enum values (comma-separated)"
                    />
                  )}
                </div>
              ))}
            </div>
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
            disabled={loading || !name || !type || !category || !domain || !app}
          >
            {loading ? 'Creating...' : 'Create Node'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
