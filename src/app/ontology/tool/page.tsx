'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@captify-io/core/components/ui';
import { Input } from '@captify-io/core/components/ui';
import { Label } from '@captify-io/core/components/ui';
import { Textarea } from '@captify-io/core/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@captify-io/core/components/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@captify-io/core/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@captify-io/core/components/ui';
import { Badge } from '@captify-io/core/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@captify-io/core/components/ui';
import { apiClient } from '@captify-io/core';
import { Plus, Edit, Trash2, Copy, Play, Wrench, Code2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@captify-io/core/components/ui';
import { Switch } from '@captify-io/core/components/ui';
import { Separator } from '@captify-io/core/components/ui';

interface Tool {
  id: string;
  name: string;
  description: string;
  schema: any;
  implementation: string;
  table?: string;
  multiStep?: boolean;
  confirmationRequired?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PropertyDefinition {
  type: string;
  description: string;
  enum?: string[];
  items?: any;
  properties?: Record<string, any>;
  required?: string[];
}

export default function ToolManagementPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [availableServices, setAvailableServices] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    implementation: 'dynamodb',
    table: '',
    multiStep: false,
    confirmationRequired: false,
    properties: {} as Record<string, PropertyDefinition>,
    required: [] as string[],
  });

  useEffect(() => {
    loadTools();
    loadAvailableServices();
  }, []);

  const loadTools = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-tool',
      });

      if (response.success && response.data?.Items) {
        setTools(response.data.Items);
      }
    } catch (error) {
      console.error('Failed to load tools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableServices = async () => {
    // List of available service implementations
    const services = [
      'dynamodb',
      's3',
      'bedrock',
      'kendra',
      'glue',
      'sagemaker',
      'quicksight',
      'cognito',
      'aurora',
    ];
    setAvailableServices(services);
  };

  const handleCreateOrUpdate = async () => {
    try {
      const now = new Date().toISOString();
      const toolId = selectedTool?.id || `tool-${Date.now()}`;

      const schema = {
        type: 'object',
        properties: formData.properties,
        required: formData.required,
      };

      const toolData: Tool = {
        id: toolId,
        name: formData.name,
        description: formData.description,
        schema,
        implementation: formData.implementation,
        table: formData.table || undefined,
        multiStep: formData.multiStep,
        confirmationRequired: formData.confirmationRequired,
        createdAt: selectedTool?.createdAt || now,
        updatedAt: now,
      };

      const response = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'put',
        table: 'core-tool',
        data: {
          Item: toolData,
        },
      });

      if (response.success) {
        await loadTools();
        handleCloseDialog();
      }
    } catch (error) {
      console.error('Failed to save tool:', error);
    }
  };

  const handleEdit = (tool: Tool) => {
    setSelectedTool(tool);
    setFormData({
      name: tool.name,
      description: tool.description,
      implementation: tool.implementation,
      table: tool.table || '',
      multiStep: tool.multiStep || false,
      confirmationRequired: tool.confirmationRequired || false,
      properties: tool.schema?.properties || {},
      required: tool.schema?.required || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (toolId: string) => {
    if (!confirm('Are you sure you want to delete this tool?')) return;

    try {
      await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'delete',
        table: 'core-tool',
        data: {
          Key: { id: toolId },
        },
      });
      await loadTools();
    } catch (error) {
      console.error('Failed to delete tool:', error);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedTool(null);
    setFormData({
      name: '',
      description: '',
      implementation: 'dynamodb',
      table: '',
      multiStep: false,
      confirmationRequired: false,
      properties: {},
      required: [],
    });
  };

  const addProperty = () => {
    const propName = prompt('Enter property name:');
    if (!propName) return;

    setFormData({
      ...formData,
      properties: {
        ...formData.properties,
        [propName]: {
          type: 'string',
          description: '',
        },
      },
    });
  };

  const updateProperty = (propName: string, updates: Partial<PropertyDefinition>) => {
    setFormData({
      ...formData,
      properties: {
        ...formData.properties,
        [propName]: {
          ...formData.properties[propName],
          ...updates,
        },
      },
    });
  };

  const removeProperty = (propName: string) => {
    const { [propName]: removed, ...rest } = formData.properties;
    setFormData({
      ...formData,
      properties: rest,
      required: formData.required.filter((r) => r !== propName),
    });
  };

  const toggleRequired = (propName: string) => {
    setFormData({
      ...formData,
      required: formData.required.includes(propName)
        ? formData.required.filter((r) => r !== propName)
        : [...formData.required, propName],
    });
  };

  const createExampleTool = async () => {
    const exampleTool = {
      id: 'tool-create-change-request',
      name: 'create_change_request',
      description: 'Create a new change request in the system. This is a multi-step tool that requires user confirmation before creating the record. When confirmed=false or not provided, prepare the request and ask user for confirmation. When user confirms (says yes/confirm), call this tool again with the same parameters PLUS confirmed=true to actually create it.',
      schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'The title of the change request',
          },
          description: {
            type: 'string',
            description: 'Detailed description of the change request',
          },
          priority: {
            type: 'string',
            description: 'Priority level of the change request',
            enum: ['Low', 'Medium', 'High', 'Critical'],
          },
          category: {
            type: 'string',
            description: 'Category or type of the change request',
            enum: ['Infrastructure', 'Software', 'Process', 'Security', 'Other'],
          },
          confirmed: {
            type: 'boolean',
            description: 'Set to true to confirm and create the change request after reviewing. The AI should set this to true only after the user explicitly confirms.',
          },
        },
        required: ['title', 'description'],
      },
      implementation: 'dynamodb',
      table: 'pmbook-changerequest',
      multiStep: true,
      confirmationRequired: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'put',
        table: 'core-tool',
        data: {
          Item: exampleTool,
        },
      });
      await loadTools();
    } catch (error) {
      console.error('Failed to create example tool:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI SDK Tools</h1>
          <p className="text-muted-foreground mt-1">
            Manage custom tools for AI agents with AI SDK compatibility
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={createExampleTool}>
            <Play className="w-4 h-4 mr-2" />
            Add Example Tool
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedTool(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Tool
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedTool ? 'Edit Tool' : 'Create New Tool'}
                </DialogTitle>
                <DialogDescription>
                  Define a custom tool for AI agents. Use multi-step mode for tools that require user confirmation.
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="schema">Schema</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tool Name</Label>
                    <Input
                      id="name"
                      placeholder="create_change_request"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Function name used by AI SDK (snake_case recommended)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what this tool does and when to use it..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Clear description helps the AI understand when to use this tool
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="implementation">Implementation</Label>
                    <Select
                      value={formData.implementation}
                      onValueChange={(value) => setFormData({ ...formData, implementation: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableServices.map((service) => (
                          <SelectItem key={service} value={service}>
                            {service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.implementation === 'dynamodb' && (
                    <div className="space-y-2">
                      <Label htmlFor="table">DynamoDB Table</Label>
                      <Input
                        id="table"
                        placeholder="pmbook-ChangeRequest"
                        value={formData.table}
                        onChange={(e) => setFormData({ ...formData, table: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Table name without schema prefix (e.g., pmbook-ChangeRequest)
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="multiStep">Multi-Step Tool</Label>
                      <p className="text-xs text-muted-foreground">
                        Enable for tools that involve multiple conversation turns
                      </p>
                    </div>
                    <Switch
                      id="multiStep"
                      checked={formData.multiStep}
                      onCheckedChange={(checked) => setFormData({ ...formData, multiStep: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="confirmationRequired">Confirmation Required</Label>
                      <p className="text-xs text-muted-foreground">
                        Tool will ask for user confirmation before executing
                      </p>
                    </div>
                    <Switch
                      id="confirmationRequired"
                      checked={formData.confirmationRequired}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, confirmationRequired: checked })
                      }
                    />
                  </div>

                  {formData.confirmationRequired && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Confirmation Flow</AlertTitle>
                      <AlertDescription>
                        Add a <code>confirmed: boolean</code> parameter to your schema. The tool will:
                        <ol className="list-decimal list-inside mt-2 space-y-1">
                          <li>First call without confirmed=true: Show preview and ask for confirmation</li>
                          <li>User confirms: AI calls again with confirmed=true to execute</li>
                        </ol>
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="schema" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <Label>Parameters</Label>
                    <Button variant="outline" size="sm" onClick={addProperty}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Parameter
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(formData.properties).map(([propName, propDef]) => (
                      <Card key={propName}>
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                {propName}
                              </code>
                              {formData.required.includes(propName) && (
                                <Badge variant="secondary" className="text-xs">
                                  Required
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeProperty(propName)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Type</Label>
                              <Select
                                value={propDef.type}
                                onValueChange={(value) =>
                                  updateProperty(propName, { type: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="string">String</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="boolean">Boolean</SelectItem>
                                  <SelectItem value="object">Object</SelectItem>
                                  <SelectItem value="array">Array</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleRequired(propName)}
                                className="w-full"
                              >
                                {formData.required.includes(propName)
                                  ? 'Make Optional'
                                  : 'Make Required'}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              placeholder="Describe this parameter..."
                              value={propDef.description}
                              onChange={(e) =>
                                updateProperty(propName, { description: e.target.value })
                              }
                              rows={2}
                            />
                          </div>

                          {propDef.type === 'string' && (
                            <div className="space-y-2">
                              <Label>Enum Values (optional)</Label>
                              <Input
                                placeholder="Option1, Option2, Option3"
                                value={propDef.enum?.join(', ') || ''}
                                onChange={(e) => {
                                  const values = e.target.value
                                    .split(',')
                                    .map((v) => v.trim())
                                    .filter(Boolean);
                                  updateProperty(propName, {
                                    enum: values.length > 0 ? values : undefined,
                                  });
                                }}
                              />
                              <p className="text-xs text-muted-foreground">
                                Comma-separated list of allowed values
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    {Object.keys(formData.properties).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No parameters defined. Click "Add Parameter" to get started.
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-mono">{formData.name || 'tool_name'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Description</Label>
                        <p className="text-sm mt-1">
                          {formData.description || 'No description provided'}
                        </p>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Implementation</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge>{formData.implementation}</Badge>
                          {formData.table && (
                            <Badge variant="outline">{formData.table}</Badge>
                          )}
                        </div>
                      </div>

                      {(formData.multiStep || formData.confirmationRequired) && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Features</Label>
                          <div className="flex items-center gap-2 mt-1">
                            {formData.multiStep && (
                              <Badge variant="secondary">Multi-Step</Badge>
                            )}
                            {formData.confirmationRequired && (
                              <Badge variant="secondary">Confirmation Required</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <Separator />

                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">
                          AI SDK Schema
                        </Label>
                        <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                          {JSON.stringify(
                            {
                              type: 'object',
                              properties: formData.properties,
                              required: formData.required,
                            },
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button onClick={handleCreateOrUpdate}>
                  {selectedTool ? 'Update Tool' : 'Create Tool'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading tools...</div>
      ) : tools.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Wrench className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tools yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first AI SDK tool to get started
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Tool
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <Card key={tool.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-mono flex items-center gap-2">
                      <Code2 className="w-4 h-4" />
                      {tool.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {tool.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{tool.implementation}</Badge>
                  {tool.table && <Badge variant="outline">{tool.table}</Badge>}
                  {tool.multiStep && (
                    <Badge variant="secondary" className="text-xs">
                      Multi-Step
                    </Badge>
                  )}
                  {tool.confirmationRequired && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Confirmation
                    </Badge>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Parameters</Label>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {tool.schema?.required?.map((param: string) => (
                      <Badge key={param} variant="outline" className="text-xs">
                        {param}
                      </Badge>
                    ))}
                    {(!tool.schema?.required || tool.schema.required.length === 0) && (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(tool)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(tool.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Available Services</AlertTitle>
        <AlertDescription>
          Your tools can integrate with these services: <strong>dynamodb, s3, bedrock, kendra, glue, sagemaker, quicksight, cognito, aurora</strong>.
          All services support the AI SDK tool format and can be used in agent conversations.
        </AlertDescription>
      </Alert>
    </div>
  );
}
