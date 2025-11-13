'use client';

/**
 * Data Source Detail Page
 * View and manage individual data source
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@captify-io/core/components/ui/card';
import { Button } from '@captify-io/core';
import { Badge } from '@captify-io/core/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@captify-io/core/components/ui/tabs';
import { apiClient } from '@captify-io/core/lib/api';
import {
  Database,
  ArrowLeft,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  ShieldCheck,
  TrendingUp,
  Calendar,
  User,
} from 'lucide-react';
import Link from 'next/link';
import type { DataSource, Dataset } from '@captify-io/core/types/dataops';

export default function DataSourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sourceId = params.id as string;

  const [source, setSource] = useState<DataSource | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadDataSource();
    loadDatasets();
  }, [sourceId]);

  async function loadDataSource() {
    try {
      setLoading(true);
      const response = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'get',
        table: 'core-dataops-data-source',
        data: {
          Key: { id: sourceId },
        },
      });

      setSource(response.Item || null);
    } catch (error) {
      console.error('Error loading data source:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDatasets() {
    try {
      // Query datasets by sourceId
      const response = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-dataset',
        data: {
          FilterExpression: 'sourceId = :sourceId',
          ExpressionAttributeValues: {
            ':sourceId': sourceId,
          },
        },
      });

      setDatasets(response.Items || []);
    } catch (error) {
      console.error('Error loading datasets:', error);
    }
  }

  async function testConnection() {
    try {
      setTesting(true);
      // TODO: Implement actual connection test
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log('Connection test successful');
    } catch (error) {
      console.error('Error testing connection:', error);
    } finally {
      setTesting(false);
    }
  }

  async function syncCatalog() {
    try {
      // TODO: Implement Glue catalog sync
      console.log('Syncing catalog...');
    } catch (error) {
      console.error('Error syncing catalog:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!source) {
    return (
      <div className="flex-1 overflow-auto p-8">
        <Card className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Data source not found</h3>
          <p className="text-muted-foreground mb-4">
            The data source you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="/dataops/sources">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Data Sources
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="flex-1 overflow-auto p-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dataops/sources">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Data Sources
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Database className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{source.name}</h1>
                {statusIcon(source.status)}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="uppercase">
                  {source.type}
                </Badge>
                <Badge className="bg-blue-500 text-white">{source.classification}</Badge>
                {source.piiDetected && <Badge variant="destructive">PII Detected</Badge>}
                {source.encryptionEnabled && <Badge variant="outline">Encrypted</Badge>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={testConnection} disabled={testing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
              Test Connection
            </Button>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline">
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Quality Score</span>
          </div>
          <div className="text-2xl font-bold">{source.qualityScore}/100</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Datasets</span>
          </div>
          <div className="text-2xl font-bold">{datasets.length}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Classification</span>
          </div>
          <div className="text-2xl font-bold">{source.classification}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Last Connected</span>
          </div>
          <div className="text-sm font-semibold">
            {source.lastConnected
              ? new Date(source.lastConnected).toLocaleDateString()
              : 'Never'}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="datasets">Datasets ({datasets.length})</TabsTrigger>
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <p className="text-sm mt-1">{source.type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm mt-1 capitalize">{source.status}</p>
              </div>
              {source.host && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Host</label>
                  <p className="text-sm mt-1">
                    {source.host}
                    {source.port && `:${source.port}`}
                  </p>
                </div>
              )}
              {source.database && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Database</label>
                  <p className="text-sm mt-1">{source.database}</p>
                </div>
              )}
              {source.schema && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Schema</label>
                  <p className="text-sm mt-1">{source.schema}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Encryption Enabled
                </label>
                <p className="text-sm mt-1">{source.encryptionEnabled ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">PII Detected</label>
                <p className="text-sm mt-1">{source.piiDetected ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Owner</label>
                <p className="text-sm mt-1">{source.owner || 'Not assigned'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Steward</label>
                <p className="text-sm mt-1">{source.steward || 'Not assigned'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm mt-1">
                  {new Date(source.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm mt-1">
                  {new Date(source.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {source.description && (
              <div className="mt-4">
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm mt-1">{source.description}</p>
              </div>
            )}

            {source.tags && source.tags.length > 0 && (
              <div className="mt-4">
                <label className="text-sm font-medium text-muted-foreground">Tags</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {source.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="datasets" className="space-y-4">
          {source.type === 'glue' && (
            <Card className="p-4 bg-blue-500/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sync Glue Catalog</p>
                  <p className="text-sm text-muted-foreground">
                    Import tables from AWS Glue as datasets
                  </p>
                </div>
                <Button onClick={syncCatalog}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </Button>
              </div>
            </Card>
          )}

          {datasets.length === 0 ? (
            <Card className="p-12 text-center">
              <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No datasets found</h3>
              <p className="text-muted-foreground">
                No datasets are currently linked to this data source
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {datasets.map((dataset) => (
                <Card key={dataset.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{dataset.displayName}</h4>
                      <p className="text-sm text-muted-foreground">{dataset.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          Quality: {dataset.qualityScore}/100
                        </Badge>
                        <Badge className="text-xs">{dataset.classification}</Badge>
                      </div>
                    </div>
                    <Link href={`/dataops/catalog/${dataset.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="connection">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Connection Settings</h3>
            <p className="text-sm text-muted-foreground">
              Connection configuration is managed through environment variables and secure
              credential stores.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">IL5 NIST Rev 5 Compliance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-medium">Classification Level</p>
                  <p className="text-sm text-muted-foreground">
                    Data classification: {source.classification}
                  </p>
                </div>
                <Badge className="bg-blue-500 text-white">{source.classification}</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-medium">Encryption</p>
                  <p className="text-sm text-muted-foreground">Data encryption at rest</p>
                </div>
                {source.encryptionEnabled ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-medium">PII Detection</p>
                  <p className="text-sm text-muted-foreground">
                    Personally identifiable information
                  </p>
                </div>
                {source.piiDetected ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">No recent activity to display</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
