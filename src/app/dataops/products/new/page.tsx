'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, Input, Textarea } from '@captify-io/core';
import { apiClient } from '@captify-io/core/lib/api';
import type { DataProduct } from '@captify-io/core/types/dataops';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Package,
  Database,
  Code,
  Settings,
  Shield,
  Zap,
  GitBranch,
  FileText,
} from 'lucide-react';

type Step = 'metadata' | 'sources' | 'transformations' | 'schema' | 'apis' | 'slos' | 'review';

const STEPS: { id: Step; label: string; icon: any }[] = [
  { id: 'metadata', label: 'Metadata', icon: FileText },
  { id: 'sources', label: 'Source Datasets', icon: Database },
  { id: 'transformations', label: 'Transformations', icon: GitBranch },
  { id: 'schema', label: 'Output Schema', icon: Code },
  { id: 'apis', label: 'APIs', icon: Zap },
  { id: 'slos', label: 'SLOs', icon: Settings },
  { id: 'review', label: 'Review & Deploy', icon: Check },
];

export default function NewDataProductPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('metadata');
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Metadata
    name: '',
    domain: '',
    description: '',
    businessUseCase: '',
    owner: '',
    team: '',
    steward: '',
    classification: 'U' as 'U' | 'C' | 'S' | 'TS',
    tags: [] as string[],
    keywords: [] as string[],

    // Sources
    sourceDatasets: [] as string[],

    // Transformations
    transformations: [] as any[],

    // Schema
    outputSchema: {
      type: 'object',
      properties: {} as Record<string, any>,
      required: [] as string[],
    },

    // APIs
    endpoints: {
      rest: true,
      graphql: false,
      sql: true,
      grpc: false,
    },

    // SLOs
    slos: {
      availability: 99.9,
      latencyP50: 100,
      latencyP95: 200,
      latencyP99: 500,
      freshnessMinutes: 60,
      completeness: 99.0,
    },
  });

  const [tagInput, setTagInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [sourceInput, setSourceInput] = useState('');
  const [schemaFieldName, setSchemaFieldName] = useState('');
  const [schemaFieldType, setSchemaFieldType] = useState('string');
  const [schemaFieldDesc, setSchemaFieldDesc] = useState('');
  const [schemaFieldRequired, setSchemaFieldRequired] = useState(false);

  function getCurrentStepIndex() {
    return STEPS.findIndex((s) => s.id === currentStep);
  }

  function goToStep(step: Step) {
    setCurrentStep(step);
  }

  function nextStep() {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  }

  function previousStep() {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  }

  function addTag() {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput] });
      setTagInput('');
    }
  }

  function removeTag(tag: string) {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  }

  function addKeyword() {
    if (keywordInput && !formData.keywords.includes(keywordInput)) {
      setFormData({ ...formData, keywords: [...formData.keywords, keywordInput] });
      setKeywordInput('');
    }
  }

  function removeKeyword(keyword: string) {
    setFormData({ ...formData, keywords: formData.keywords.filter((k) => k !== keyword) });
  }

  function addSource() {
    if (sourceInput && !formData.sourceDatasets.includes(sourceInput)) {
      setFormData({
        ...formData,
        sourceDatasets: [...formData.sourceDatasets, sourceInput],
      });
      setSourceInput('');
    }
  }

  function removeSource(source: string) {
    setFormData({
      ...formData,
      sourceDatasets: formData.sourceDatasets.filter((s) => s !== source),
    });
  }

  function addSchemaField() {
    if (schemaFieldName && schemaFieldType) {
      const newProperties = {
        ...formData.outputSchema.properties,
        [schemaFieldName]: {
          type: schemaFieldType,
          description: schemaFieldDesc,
        },
      };

      const newRequired = schemaFieldRequired
        ? [...formData.outputSchema.required, schemaFieldName]
        : formData.outputSchema.required;

      setFormData({
        ...formData,
        outputSchema: {
          ...formData.outputSchema,
          properties: newProperties,
          required: newRequired,
        },
      });

      setSchemaFieldName('');
      setSchemaFieldType('string');
      setSchemaFieldDesc('');
      setSchemaFieldRequired(false);
    }
  }

  function removeSchemaField(fieldName: string) {
    const { [fieldName]: removed, ...rest } = formData.outputSchema.properties;
    setFormData({
      ...formData,
      outputSchema: {
        ...formData.outputSchema,
        properties: rest,
        required: formData.outputSchema.required.filter((f) => f !== fieldName),
      },
    });
  }

  async function handleSubmit() {
    try {
      setSaving(true);

      const productId = `product-${formData.domain.toLowerCase()}-${formData.name.toLowerCase().replace(/\s+/g, '-')}`;

      const endpoints: any = {};
      if (formData.endpoints.rest) {
        endpoints.rest = {
          url: `https://api.captify.io/dataops/products/${productId}/data`,
          methods: ['GET'],
          authentication: 'Bearer token',
        };
      }
      if (formData.endpoints.graphql) {
        endpoints.graphql = {
          url: `https://api.captify.io/graphql`,
        };
      }
      if (formData.endpoints.sql) {
        endpoints.sql = {
          tableName: formData.name.toLowerCase().replace(/\s+/g, '_'),
        };
      }

      const product: Partial<DataProduct> = {
        id: productId,
        name: formData.name,
        domain: formData.domain,
        version: '0.1.0',
        owner: formData.owner,
        team: formData.team || undefined,
        steward: formData.steward || undefined,
        description: formData.description,
        businessUseCase: formData.businessUseCase || undefined,
        classification: formData.classification,
        tags: formData.tags,
        keywords: formData.keywords.length > 0 ? formData.keywords : undefined,
        sourceDatasets: formData.sourceDatasets,
        outputSchema: formData.outputSchema,
        endpoints,
        slos: formData.slos,
        status: 'draft',
        maturity: 'experimental',
        qualityScore: 0,
        qualityDimensions: {
          completeness: 0,
          validity: 0,
          consistency: 0,
          timeliness: 0,
          uniqueness: 0,
          accuracy: 0,
        },
        accessCount: 0,
        uniqueConsumers: 0,
        avgDailyRequests: 0,
        popularityScore: 0,
        rating: 0,
        ratingCount: 0,
        piiFields: [],
        sensitiveFields: [],
        consumers: [],
        changelog: [],
        active: true,
        createdBy: 'current-user', // TODO: Get from session
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'put',
        table: 'core-dataops-data-product',
        data: { Item: product },
      });

      router.push(`/dataops/products/${productId}`);
    } catch (error) {
      console.error('Failed to create product:', error);
      alert('Failed to create data product. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const classificationColor = (classification: string) => {
    switch (classification) {
      case 'TS':
        return 'bg-red-500 text-white';
      case 'S':
        return 'bg-orange-500 text-white';
      case 'C':
        return 'bg-yellow-500 text-black';
      case 'U':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/dataops/products')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Package className="h-8 w-8 text-green-500" />
                Create Data Product
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Build a curated, API-accessible data product
              </p>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCurrent = step.id === currentStep;
            const isCompleted = getCurrentStepIndex() > index;

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => goToStep(step.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">{step.label}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Metadata Step */}
          {currentStep === 'metadata' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Product Metadata</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Sales Daily Metrics"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Domain <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      placeholder="e.g., sales, logistics"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Business purpose and what this product provides"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Business Use Case</label>
                  <Textarea
                    value={formData.businessUseCase}
                    onChange={(e) =>
                      setFormData({ ...formData, businessUseCase: e.target.value })
                    }
                    placeholder="What problem does this solve? Who uses it?"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Owner <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                      placeholder="Product manager user ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Team</label>
                    <Input
                      value={formData.team}
                      onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                      placeholder="Owning team name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Data Steward</label>
                    <Input
                      value={formData.steward}
                      onChange={(e) => setFormData({ ...formData, steward: e.target.value })}
                      placeholder="Data steward user ID"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Classification <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {['U', 'C', 'S', 'TS'].map((level) => (
                      <button
                        key={level}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            classification: level as 'U' | 'C' | 'S' | 'TS',
                          })
                        }
                        className={`px-4 py-2 rounded-md ${
                          formData.classification === level
                            ? classificationColor(level)
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    IL5 NIST 800-53 Rev 5 Classification Level
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add a tag"
                    />
                    <Button onClick={addTag}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Keywords</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === 'Enter' && (e.preventDefault(), addKeyword())
                      }
                      placeholder="Add a keyword"
                    />
                    <Button onClick={addKeyword}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.keywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => removeKeyword(keyword)}
                      >
                        {keyword} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Source Datasets Step */}
          {currentStep === 'sources' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Source Datasets</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Select the datasets that will feed into this data product.
              </p>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={sourceInput}
                    onChange={(e) => setSourceInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSource())}
                    placeholder="Dataset ID (e.g., dataset-glue-sales-transactions)"
                  />
                  <Button onClick={addSource}>Add Dataset</Button>
                </div>

                {formData.sourceDatasets.length > 0 ? (
                  <div className="space-y-2">
                    {formData.sourceDatasets.map((source, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          <Database className="h-5 w-5 text-muted-foreground" />
                          <code className="text-sm">{source}</code>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeSource(source)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed rounded-md">
                    <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No source datasets added yet</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Transformations Step */}
          {currentStep === 'transformations' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Transformations</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Define how source datasets are transformed into the final product.
              </p>

              <div className="text-center py-12 border-2 border-dashed rounded-md">
                <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Visual pipeline builder coming soon
                </p>
                <p className="text-xs text-muted-foreground">
                  For now, transformations can be configured after product creation
                </p>
              </div>
            </Card>
          )}

          {/* Output Schema Step */}
          {currentStep === 'schema' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Output Schema</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Define the schema of the data this product will provide.
              </p>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Field Name</label>
                      <Input
                        value={schemaFieldName}
                        onChange={(e) => setSchemaFieldName(e.target.value)}
                        placeholder="e.g., totalRevenue"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Type</label>
                      <select
                        value={schemaFieldType}
                        onChange={(e) => setSchemaFieldType(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="array">Array</option>
                        <option value="object">Object</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <Input
                        value={schemaFieldDesc}
                        onChange={(e) => setSchemaFieldDesc(e.target.value)}
                        placeholder="Field description"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={schemaFieldRequired}
                        onChange={(e) => setSchemaFieldRequired(e.target.checked)}
                      />
                      <span className="text-sm">Required field</span>
                    </label>
                    <Button onClick={addSchemaField}>Add Field</Button>
                  </div>
                </div>

                {Object.keys(formData.outputSchema.properties).length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-4 p-3 bg-muted rounded-md font-medium text-sm">
                      <div>Field Name</div>
                      <div>Type</div>
                      <div>Required</div>
                      <div>Description</div>
                    </div>
                    {Object.entries(formData.outputSchema.properties).map(([key, prop]) => (
                      <div
                        key={key}
                        className="grid grid-cols-4 gap-4 p-3 border rounded-md items-center"
                      >
                        <div className="font-mono text-sm">{key}</div>
                        <div>
                          <Badge variant="outline">{prop.type}</Badge>
                        </div>
                        <div>
                          {formData.outputSchema.required.includes(key) && (
                            <Badge variant="destructive">Required</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{prop.description}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeSchemaField(key)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed rounded-md">
                    <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No schema fields added yet</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* APIs Step */}
          {currentStep === 'apis' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">API Access Methods</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Select which API interfaces to expose for this data product.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center gap-3">
                    <Code className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">REST API</p>
                      <p className="text-sm text-muted-foreground">
                        Standard HTTP JSON endpoints
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.endpoints.rest}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endpoints: { ...formData.endpoints, rest: e.target.checked },
                      })
                    }
                    className="h-5 w-5"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">GraphQL API</p>
                      <p className="text-sm text-muted-foreground">Flexible query interface</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.endpoints.graphql}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endpoints: { ...formData.endpoints, graphql: e.target.checked },
                      })
                    }
                    className="h-5 w-5"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">SQL Interface</p>
                      <p className="text-sm text-muted-foreground">
                        Athena/Glue table access
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.endpoints.sql}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endpoints: { ...formData.endpoints, sql: e.target.checked },
                      })
                    }
                    className="h-5 w-5"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">gRPC API</p>
                      <p className="text-sm text-muted-foreground">
                        High-performance streaming
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.endpoints.grpc}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endpoints: { ...formData.endpoints, grpc: e.target.checked },
                      })
                    }
                    className="h-5 w-5"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* SLOs Step */}
          {currentStep === 'slos' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Service Level Objectives</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Define quality and performance targets for this data product.
              </p>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Availability Target (%)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.slos.availability}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          slos: {
                            ...formData.slos,
                            availability: parseFloat(e.target.value),
                          },
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">e.g., 99.9 for 3 nines</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Latency P50 Target (ms)
                    </label>
                    <Input
                      type="number"
                      value={formData.slos.latencyP50}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          slos: { ...formData.slos, latencyP50: parseInt(e.target.value) },
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">Median response time</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Latency P95 Target (ms)
                    </label>
                    <Input
                      type="number"
                      value={formData.slos.latencyP95}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          slos: { ...formData.slos, latencyP95: parseInt(e.target.value) },
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      95th percentile response time
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Latency P99 Target (ms)
                    </label>
                    <Input
                      type="number"
                      value={formData.slos.latencyP99}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          slos: { ...formData.slos, latencyP99: parseInt(e.target.value) },
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      99th percentile response time
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Freshness Target (minutes)
                    </label>
                    <Input
                      type="number"
                      value={formData.slos.freshnessMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          slos: {
                            ...formData.slos,
                            freshnessMinutes: parseInt(e.target.value),
                          },
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum data age in minutes
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Completeness Target (%)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.slos.completeness}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          slos: {
                            ...formData.slos,
                            completeness: parseFloat(e.target.value),
                          },
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum data completeness
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Review & Deploy Step */}
          {currentStep === 'review' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Review & Deploy</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Review your data product configuration before deployment.
              </p>

              <div className="space-y-6">
                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-3">Metadata</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>{' '}
                      <span className="font-medium">{formData.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Domain:</span>{' '}
                      <span className="font-medium">{formData.domain}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Owner:</span>{' '}
                      <span className="font-medium">{formData.owner}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Classification:</span>{' '}
                      <Badge className={classificationColor(formData.classification)}>
                        {formData.classification}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-3">Source Datasets</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.sourceDatasets.map((source, index) => (
                      <Badge key={index} variant="outline">
                        {source}
                      </Badge>
                    ))}
                    {formData.sourceDatasets.length === 0 && (
                      <p className="text-sm text-muted-foreground">No sources configured</p>
                    )}
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-3">Output Schema</h4>
                  <p className="text-sm text-muted-foreground">
                    {Object.keys(formData.outputSchema.properties).length} fields defined
                  </p>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-3">API Endpoints</h4>
                  <div className="flex gap-2">
                    {formData.endpoints.rest && <Badge>REST</Badge>}
                    {formData.endpoints.graphql && <Badge>GraphQL</Badge>}
                    {formData.endpoints.sql && <Badge>SQL</Badge>}
                    {formData.endpoints.grpc && <Badge>gRPC</Badge>}
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-3">SLO Targets</h4>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Availability:</span>{' '}
                      {formData.slos.availability}%
                    </div>
                    <div>
                      <span className="text-muted-foreground">Latency P95:</span>{' '}
                      {formData.slos.latencyP95}ms
                    </div>
                    <div>
                      <span className="text-muted-foreground">Freshness:</span>{' '}
                      {formData.slos.freshnessMinutes} min
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500 rounded-md p-4">
                  <p className="text-sm">
                    This product will be created with status <Badge>draft</Badge> and maturity{' '}
                    <Badge>experimental</Badge>. You can configure transformations and promote to
                    production after creation.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={previousStep}
              disabled={getCurrentStepIndex() === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep === 'review' ? (
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Product
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={nextStep}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
