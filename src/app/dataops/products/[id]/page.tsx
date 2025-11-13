'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Badge,
  Button,
  Card,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@captify-io/core';
import { apiClient } from '@captify-io/core/lib/api';
import type { DataProduct, QualityCheck, LineageNode, ComplianceCheck } from '@captify-io/core/types/dataops';
import {
  ArrowLeft,
  Package,
  Code,
  Database,
  Activity,
  Users,
  Star,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  FileText,
  Lock,
  Settings,
  BarChart3,
  GitBranch,
  Download,
  Copy,
  ExternalLink,
  Clock,
  Zap,
  Shield,
  Edit,
} from 'lucide-react';

export default function DataProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<DataProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [lineageNodes, setLineageNodes] = useState<LineageNode[]>([]);
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);

  useEffect(() => {
    loadProduct();
    loadQualityChecks();
    loadLineage();
    loadComplianceChecks();
  }, [productId]);

  async function loadProduct() {
    try {
      setLoading(true);
      const response = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'get',
        table: 'core-dataops-data-product',
        data: { Key: { id: productId } },
      });

      if (response.Item) {
        setProduct(response.Item as DataProduct);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadQualityChecks() {
    try {
      const response = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'query',
        table: 'core-quality-check',
        data: {
          IndexName: 'entityId-timestamp-index',
          KeyConditionExpression: 'entityId = :entityId',
          ExpressionAttributeValues: { ':entityId': productId },
          Limit: 10,
          ScanIndexForward: false,
        },
      });
      setQualityChecks((response.Items || []) as QualityCheck[]);
    } catch (error) {
      console.error('Failed to load quality checks:', error);
    }
  }

  async function loadLineage() {
    try {
      const response = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'query',
        table: 'core-lineage',
        data: {
          IndexName: 'targetId-timestamp-index',
          KeyConditionExpression: 'targetId = :targetId',
          ExpressionAttributeValues: { ':targetId': productId },
          Limit: 20,
        },
      });
      setLineageNodes((response.Items || []) as LineageNode[]);
    } catch (error) {
      console.error('Failed to load lineage:', error);
    }
  }

  async function loadComplianceChecks() {
    try {
      const response = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'query',
        table: 'core-compliance-check',
        data: {
          IndexName: 'entityId-timestamp-index',
          KeyConditionExpression: 'entityId = :entityId',
          ExpressionAttributeValues: { ':entityId': productId },
          Limit: 10,
          ScanIndexForward: false,
        },
      });
      setComplianceChecks((response.Items || []) as ComplianceCheck[]);
    } catch (error) {
      console.error('Failed to load compliance checks:', error);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'production':
        return 'bg-green-500 text-white';
      case 'staging':
        return 'bg-blue-500 text-white';
      case 'dev':
        return 'bg-yellow-500 text-black';
      case 'draft':
        return 'bg-gray-500 text-white';
      case 'deprecated':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

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

  const maturityIcon = (maturity: string) => {
    switch (maturity) {
      case 'mature':
      case 'stable':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'beta':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'experimental':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The data product you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push('/dataops/products')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/dataops/products')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{product.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{product.domain}</Badge>
                    <Badge variant="outline">v{product.version}</Badge>
                    <Badge className={classificationColor(product.classification)}>
                      {product.classification}
                    </Badge>
                    <Badge className={statusColor(product.status)}>{product.status}</Badge>
                    {maturityIcon(product.maturity)}
                    <span className="text-sm text-muted-foreground">{product.maturity}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quality Score</p>
                <p className="text-2xl font-bold">{product.qualityScore}/100</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Availability</p>
                <p className="text-2xl font-bold">{product.slos.availability}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Latency P95</p>
                <p className="text-2xl font-bold">{product.slos.latencyP95}ms</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Consumers</p>
                <p className="text-2xl font-bold">{product.uniqueConsumers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  <p className="text-2xl font-bold">{product.rating.toFixed(1)}</p>
                </div>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="mx-6 mt-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="api">API Documentation</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="lineage">Lineage</TabsTrigger>
            <TabsTrigger value="quality">Quality</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto p-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Description</h3>
                    <p className="text-muted-foreground">{product.description}</p>
                    {product.businessUseCase && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Business Use Case</h4>
                        <p className="text-sm text-muted-foreground">{product.businessUseCase}</p>
                      </div>
                    )}
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Service Level Objectives</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Availability Target</p>
                        <p className="text-xl font-semibold">{product.slos.availability}%</p>
                        {product.slis && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Current: {product.slis.currentAvailability?.toFixed(2)}%
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Latency P50 Target</p>
                        <p className="text-xl font-semibold">{product.slos.latencyP50}ms</p>
                        {product.slis && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Current: {product.slis.currentLatencyP50}ms
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Latency P95 Target</p>
                        <p className="text-xl font-semibold">{product.slos.latencyP95}ms</p>
                        {product.slis && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Current: {product.slis.currentLatencyP95}ms
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Latency P99 Target</p>
                        <p className="text-xl font-semibold">{product.slos.latencyP99}ms</p>
                        {product.slis && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Current: {product.slis.currentLatencyP99}ms
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Freshness Target</p>
                        <p className="text-xl font-semibold">{product.slos.freshnessMinutes} min</p>
                        {product.slis && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Current: {product.slis.currentFreshnessMinutes} min
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Completeness Target</p>
                        <p className="text-xl font-semibold">{product.slos.completeness}%</p>
                      </div>
                    </div>
                  </Card>

                  {product.changelog && product.changelog.length > 0 && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Version History</h3>
                      <div className="space-y-3">
                        {product.changelog.slice(0, 5).map((entry, index) => (
                          <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                            <Badge variant="outline">{entry.version}</Badge>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{entry.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(entry.date).toLocaleDateString()} by {entry.author}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>

                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Ownership</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Owner</p>
                        <p className="font-medium">{product.owner}</p>
                      </div>
                      {product.team && (
                        <div>
                          <p className="text-sm text-muted-foreground">Team</p>
                          <p className="font-medium">{product.team}</p>
                        </div>
                      )}
                      {product.steward && (
                        <div>
                          <p className="text-sm text-muted-foreground">Data Steward</p>
                          <p className="font-medium">{product.steward}</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Consumers</h3>
                    {product.consumers && product.consumers.length > 0 ? (
                      <div className="space-y-2">
                        {product.consumers.map((consumer, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{consumer}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No consumers yet</p>
                    )}
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Tags & Keywords</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {product.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    {product.keywords && product.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {product.keywords.map((keyword, index) => (
                          <Badge key={index} variant="outline">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Card>

                  {product.refreshSchedule && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Refresh Schedule</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-mono">{product.refreshSchedule}</span>
                        </div>
                        {product.lastRefreshed && (
                          <p className="text-xs text-muted-foreground">
                            Last: {new Date(product.lastRefreshed).toLocaleString()}
                          </p>
                        )}
                        {product.nextRefresh && (
                          <p className="text-xs text-muted-foreground">
                            Next: {new Date(product.nextRefresh).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* API Documentation Tab */}
            <TabsContent value="api" className="mt-0">
              <div className="space-y-6">
                {product.endpoints.rest && (
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        REST API
                      </h3>
                      <Badge variant="secondary">REST</Badge>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Endpoint</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-3 bg-muted rounded-md text-sm">
                            {product.endpoints.rest.url}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(product.endpoints.rest!.url)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Methods</p>
                        <div className="flex gap-2">
                          {product.endpoints.rest.methods.map((method, index) => (
                            <Badge key={index} variant="outline">
                              {method}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Authentication</p>
                        <p className="text-sm">{product.endpoints.rest.authentication}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Example Request (cURL)</p>
                        <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto">
{`curl -X GET "${product.endpoints.rest.url}" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json"`}
                        </pre>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Example Request (Python)</p>
                        <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto">
{`import requests

response = requests.get(
    "${product.endpoints.rest.url}",
    headers={
        "Authorization": "Bearer YOUR_TOKEN",
        "Content-Type": "application/json"
    }
)
data = response.json()`}
                        </pre>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Example Request (JavaScript)</p>
                        <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto">
{`const response = await fetch("${product.endpoints.rest.url}", {
  headers: {
    "Authorization": "Bearer YOUR_TOKEN",
    "Content-Type": "application/json"
  }
});
const data = await response.json();`}
                        </pre>
                      </div>
                    </div>
                  </Card>
                )}

                {product.endpoints.graphql && (
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        GraphQL API
                      </h3>
                      <Badge variant="secondary">GraphQL</Badge>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Endpoint</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-3 bg-muted rounded-md text-sm">
                            {product.endpoints.graphql.url}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(product.endpoints.graphql!.url)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {product.endpoints.graphql.schema && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Schema</p>
                          <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto max-h-64">
                            {product.endpoints.graphql.schema}
                          </pre>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {product.endpoints.sql && (
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        SQL Interface
                      </h3>
                      <Badge variant="secondary">SQL</Badge>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Table Name</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-3 bg-muted rounded-md text-sm">
                            dataproducts.{product.endpoints.sql.tableName}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              copyToClipboard(`dataproducts.${product.endpoints.sql!.tableName}`)
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {product.endpoints.sql.connectionString && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Connection String</p>
                          <code className="block p-3 bg-muted rounded-md text-sm">
                            {product.endpoints.sql.connectionString}
                          </code>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Example Query</p>
                        <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto">
{`SELECT *
FROM dataproducts.${product.endpoints.sql.tableName}
WHERE date >= CURRENT_DATE - INTERVAL '30' DAY
LIMIT 100;`}
                        </pre>
                      </div>
                    </div>
                  </Card>
                )}

                {product.endpoints.grpc && (
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        gRPC API
                      </h3>
                      <Badge variant="secondary">gRPC</Badge>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Host</p>
                        <code className="block p-3 bg-muted rounded-md text-sm">
                          {product.endpoints.grpc.host}:{product.endpoints.grpc.port}
                        </code>
                      </div>
                      {product.endpoints.grpc.protoFile && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Proto File</p>
                          <code className="block p-3 bg-muted rounded-md text-sm">
                            {product.endpoints.grpc.protoFile}
                          </code>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {product.documentation && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Additional Documentation</h3>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {product.documentation}
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Data Tab */}
            <TabsContent value="data" className="mt-0">
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Output Schema</h3>
                    {product.sampleData && (
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download Sample
                      </Button>
                    )}
                  </div>
                  {product.outputSchema ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-4 p-3 bg-muted rounded-md font-medium text-sm">
                        <div>Field Name</div>
                        <div>Type</div>
                        <div>Required</div>
                        <div>Description</div>
                      </div>
                      {product.outputSchema.properties &&
                        Object.entries(product.outputSchema.properties).map(([key, prop]) => (
                          <div key={key} className="grid grid-cols-4 gap-4 p-3 border-b">
                            <div className="font-mono text-sm">{key}</div>
                            <div>
                              <Badge variant="outline">{prop.type}</Badge>
                            </div>
                            <div>
                              {product.outputSchema!.required?.includes(key) && (
                                <Badge variant="destructive">Required</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{prop.description}</div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No schema defined</p>
                  )}
                </Card>

                {product.sampleData && product.sampleData.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Sample Data</h3>
                    <div className="overflow-x-auto">
                      <pre className="p-4 bg-muted rounded-md text-xs">
                        {JSON.stringify(product.sampleData, null, 2)}
                      </pre>
                    </div>
                  </Card>
                )}

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Data Freshness</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Target Freshness</p>
                      <p className="text-xl font-semibold">{product.slos.freshnessMinutes} min</p>
                    </div>
                    {product.slis && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Current Freshness</p>
                        <p className="text-xl font-semibold">
                          {product.slis.currentFreshnessMinutes} min
                        </p>
                      </div>
                    )}
                    {product.lastRefreshed && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Last Refreshed</p>
                        <p className="text-sm">{new Date(product.lastRefreshed).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </Card>

                {product.piiFields && product.piiFields.length > 0 && (
                  <Card className="p-6 border-yellow-500">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      PII Fields Warning
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      This data product contains the following PII fields:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.piiFields.map((field, index) => (
                        <Badge key={index} variant="destructive">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Lineage Tab */}
            <TabsContent value="lineage" className="mt-0">
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Source Datasets
                  </h3>
                  {product.sourceDatasets && product.sourceDatasets.length > 0 ? (
                    <div className="space-y-2">
                      {product.sourceDatasets.map((datasetId, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-md"
                        >
                          <div className="flex items-center gap-3">
                            <Database className="h-5 w-5 text-muted-foreground" />
                            <span className="font-mono text-sm">{datasetId}</span>
                          </div>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Dataset
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No source datasets configured</p>
                  )}
                </Card>

                {product.transformationPipelineId && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Transformation Pipeline</h3>
                    <div className="flex items-center justify-between p-4 border rounded-md">
                      <div className="flex items-center gap-3">
                        <GitBranch className="h-5 w-5 text-muted-foreground" />
                        <span className="font-mono text-sm">{product.transformationPipelineId}</span>
                      </div>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Pipeline
                      </Button>
                    </div>
                  </Card>
                )}

                {lineageNodes.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Upstream Dependencies</h3>
                    <div className="space-y-2">
                      {lineageNodes.map((node) => (
                        <div
                          key={node.id}
                          className="flex items-center justify-between p-3 border rounded-md"
                        >
                          <div className="flex items-center gap-3">
                            <GitBranch className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{node.sourceId}</p>
                              <p className="text-xs text-muted-foreground">
                                {node.transformationType || 'Direct'}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">{node.sourceType}</Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Impact Analysis</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    See what would be affected if this data product changes or becomes unavailable.
                  </p>
                  <Button variant="outline">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Run Impact Analysis
                  </Button>
                </Card>
              </div>
            </TabsContent>

            {/* Quality Tab */}
            <TabsContent value="quality" className="mt-0">
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Quality Score Breakdown</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Quality</span>
                      <span className="text-2xl font-bold">{product.qualityScore}/100</span>
                    </div>
                    {product.qualityDimensions && (
                      <>
                        <div className="space-y-3">
                          {Object.entries(product.qualityDimensions).map(([dimension, score]) => (
                            <div key={dimension}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm capitalize">{dimension}</span>
                                <span className="text-sm font-medium">{score}/100</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 transition-all"
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                {qualityChecks.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Quality Checks</h3>
                    <div className="space-y-3">
                      {qualityChecks.map((check) => (
                        <div
                          key={check.id}
                          className="flex items-start justify-between p-3 border rounded-md"
                        >
                          <div className="flex items-start gap-3">
                            {check.status === 'passed' ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                            )}
                            <div>
                              <p className="font-medium text-sm">{check.ruleId}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(check.timestamp).toLocaleString()}
                              </p>
                              {check.details && (
                                <p className="text-xs text-muted-foreground mt-1">{check.details}</p>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant={check.status === 'passed' ? 'default' : 'destructive'}
                          >
                            {check.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {product.piiFields && product.piiFields.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">PII Fields</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.piiFields.map((field, index) => (
                        <Badge key={index} variant="destructive">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}

                {product.sensitiveFields && product.sensitiveFields.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Sensitive Fields</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.sensitiveFields.map((field, index) => (
                        <Badge key={index} variant="secondary">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="mt-0">
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Classification Level
                  </h3>
                  <div className="flex items-center gap-4">
                    <Badge className={`${classificationColor(product.classification)} text-xl px-6 py-2`}>
                      {product.classification}
                    </Badge>
                    <div>
                      <p className="font-medium">
                        {product.classification === 'TS' && 'Top Secret'}
                        {product.classification === 'S' && 'Secret'}
                        {product.classification === 'C' && 'Confidential'}
                        {product.classification === 'U' && 'Unclassified'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        IL5 NIST 800-53 Rev 5 Compliant
                      </p>
                    </div>
                  </div>
                </Card>

                {product.piiFields && product.piiFields.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">PII Masking Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">PII Fields Detected</span>
                        <Badge variant="destructive">{product.piiFields.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Masking Strategy</span>
                        <Badge variant="default">Automatic</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {product.piiFields.map((field, index) => (
                          <Badge key={index} variant="outline">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                )}

                {product.certifications && product.certifications.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Certifications</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.certifications.map((cert, index) => (
                        <Badge key={index} variant="default" className="px-4 py-2">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}

                {complianceChecks.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Compliance Audit History</h3>
                    <div className="space-y-3">
                      {complianceChecks.map((check) => (
                        <div
                          key={check.id}
                          className="flex items-start justify-between p-3 border rounded-md"
                        >
                          <div className="flex items-start gap-3">
                            {check.status === 'compliant' ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                            )}
                            <div>
                              <p className="font-medium text-sm">{check.policyId}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(check.timestamp).toLocaleString()}
                              </p>
                              {check.findings && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {check.findings.length} findings
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant={
                              check.status === 'compliant'
                                ? 'default'
                                : check.status === 'non-compliant'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {check.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Run Compliance Audit</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Run a comprehensive compliance audit against IL5 NIST 800-53 Rev 5 controls.
                  </p>
                  <Button variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Run Audit
                  </Button>
                </Card>
              </div>
            </TabsContent>

            {/* Usage Tab */}
            <TabsContent value="usage" className="mt-0">
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Total API Calls</p>
                      <Activity className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-3xl font-bold">{product.accessCount.toLocaleString()}</p>
                  </Card>
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Unique Consumers</p>
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-3xl font-bold">{product.uniqueConsumers}</p>
                  </Card>
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Avg Daily Requests</p>
                      <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-3xl font-bold">{product.avgDailyRequests.toLocaleString()}</p>
                  </Card>
                </div>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Latency Metrics</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">P50 (Median)</p>
                      {product.slis ? (
                        <>
                          <p className="text-2xl font-bold">{product.slis.currentLatencyP50}ms</p>
                          <p className="text-xs text-muted-foreground">
                            Target: {product.slos.latencyP50}ms
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">No data</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">P95</p>
                      {product.slis ? (
                        <>
                          <p className="text-2xl font-bold">{product.slis.currentLatencyP95}ms</p>
                          <p className="text-xs text-muted-foreground">
                            Target: {product.slos.latencyP95}ms
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">No data</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">P99</p>
                      {product.slis ? (
                        <>
                          <p className="text-2xl font-bold">{product.slis.currentLatencyP99}ms</p>
                          <p className="text-xs text-muted-foreground">
                            Target: {product.slos.latencyP99}ms
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">No data</p>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">User Ratings</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-8 w-8 fill-yellow-500 text-yellow-500" />
                      <span className="text-4xl font-bold">{product.rating.toFixed(1)}</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {product.ratingCount} rating{product.ratingCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Popularity Score</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all"
                          style={{ width: `${product.popularityScore}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-2xl font-bold">{product.popularityScore}/100</span>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-0">
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Product Lifecycle</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Current Status</p>
                      <Badge className={statusColor(product.status)}>{product.status}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Maturity Level</p>
                      <div className="flex items-center gap-2">
                        {maturityIcon(product.maturity)}
                        <span className="font-medium">{product.maturity}</span>
                      </div>
                    </div>
                    <div className="pt-4">
                      <p className="text-sm text-muted-foreground mb-2">Change Status</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Move to Staging</Button>
                        <Button size="sm" variant="outline">Move to Production</Button>
                        <Button size="sm" variant="destructive">Deprecate</Button>
                      </div>
                    </div>
                  </div>
                </Card>

                {product.status === 'deprecated' && (
                  <Card className="p-6 border-red-500">
                    <h3 className="text-lg font-semibold mb-4 text-red-500">Deprecation Info</h3>
                    <div className="space-y-2">
                      {product.deprecationDate && (
                        <div>
                          <p className="text-sm text-muted-foreground">Deprecation Date</p>
                          <p className="font-medium">
                            {new Date(product.deprecationDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {product.replacedBy && (
                        <div>
                          <p className="text-sm text-muted-foreground">Replaced By</p>
                          <div className="flex items-center gap-2">
                            <code className="text-sm">{product.replacedBy}</code>
                            <Button size="sm" variant="outline">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Ownership Management</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Product Owner</p>
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{product.owner}</p>
                        <Button size="sm" variant="outline">Change</Button>
                      </div>
                    </div>
                    {product.team && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Team</p>
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{product.team}</p>
                          <Button size="sm" variant="outline">Change</Button>
                        </div>
                      </div>
                    )}
                    {product.steward && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Data Steward</p>
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{product.steward}</p>
                          <Button size="sm" variant="outline">Change</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">SLO Configuration</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Availability Target (%)</p>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border rounded-md"
                          defaultValue={product.slos.availability}
                          step="0.1"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Latency P95 (ms)</p>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border rounded-md"
                          defaultValue={product.slos.latencyP95}
                        />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Freshness (minutes)</p>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border rounded-md"
                          defaultValue={product.slos.freshnessMinutes}
                        />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Completeness (%)</p>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border rounded-md"
                          defaultValue={product.slos.completeness}
                          step="0.1"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                    <Button className="mt-4">Save SLO Changes</Button>
                  </div>
                </Card>

                <Card className="p-6 border-red-500">
                  <h3 className="text-lg font-semibold mb-4 text-red-500">Danger Zone</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-red-500 rounded-md">
                      <div>
                        <p className="font-medium">Archive this product</p>
                        <p className="text-sm text-muted-foreground">
                          Mark as inactive and hide from catalog
                        </p>
                      </div>
                      <Button size="sm" variant="outline">Archive</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-red-500 rounded-md">
                      <div>
                        <p className="font-medium">Delete this product</p>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete this data product
                        </p>
                      </div>
                      <Button size="sm" variant="destructive">Delete</Button>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
