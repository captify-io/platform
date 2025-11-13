'use client';

/**
 * Data Sources Management Page
 * List and manage external data sources
 */

import { useState, useEffect } from 'react';
import { Card } from '@captify-io/core/components/ui/card';
import { Button } from '@captify-io/core';
import { Badge } from '@captify-io/core/components/ui/badge';
import { apiClient } from '@captify-io/core/lib/api';
import {
  Database,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import type { DataSource } from '@captify-io/core/types/dataops';

export default function DataSourcesPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    type?: string;
    classification?: string;
    status?: string;
  }>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDataSources();
  }, [filter]);

  async function loadDataSources() {
    try {
      setLoading(true);
      const response = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-dataops-data-source',
        data: {
          Limit: 100,
        },
      });

      setSources(response.Items || []);
    } catch (error) {
      console.error('Error loading data sources:', error);
    } finally {
      setLoading(false);
    }
  }

  async function testConnection(sourceId: string) {
    try {
      // TODO: Implement actual connection test
      console.log('Testing connection for:', sourceId);
    } catch (error) {
      console.error('Error testing connection:', error);
    }
  }

  const filteredSources = sources.filter((source) => {
    if (filter.type && source.type !== filter.type) return false;
    if (filter.classification && source.classification !== filter.classification) return false;
    if (filter.status && source.status !== filter.status) return false;
    if (searchQuery && !source.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const classificationColor = (level: string) => {
    switch (level) {
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
    <div className="flex-1 overflow-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Data Sources</h1>
          <p className="text-muted-foreground">
            Manage connections to external data systems
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Data Source
        </Button>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search data sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filter.type || ''}
              onChange={(e) => setFilter({ ...filter, type: e.target.value || undefined })}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="">All Types</option>
              <option value="glue">Glue</option>
              <option value="databricks">Databricks</option>
              <option value="snowflake">Snowflake</option>
              <option value="s3">S3</option>
              <option value="athena">Athena</option>
            </select>

            <select
              value={filter.classification || ''}
              onChange={(e) =>
                setFilter({ ...filter, classification: e.target.value || undefined })
              }
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="">All Classifications</option>
              <option value="U">Unclassified</option>
              <option value="C">Confidential</option>
              <option value="S">Secret</option>
              <option value="TS">Top Secret</option>
            </select>

            <select
              value={filter.status || ''}
              onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="">All Status</option>
              <option value="connected">Connected</option>
              <option value="disconnected">Disconnected</option>
              <option value="error">Error</option>
            </select>

            <Button variant="outline" size="sm" onClick={loadDataSources}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold">{sources.length}</div>
          <div className="text-sm text-muted-foreground">Total Sources</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-500">
            {sources.filter((s) => s.status === 'connected').length}
          </div>
          <div className="text-sm text-muted-foreground">Connected</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-500">
            {sources.filter((s) => s.status === 'disconnected').length}
          </div>
          <div className="text-sm text-muted-foreground">Disconnected</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-500">
            {sources.filter((s) => s.status === 'error').length}
          </div>
          <div className="text-sm text-muted-foreground">Errors</div>
        </Card>
      </div>

      {/* Data Sources List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredSources.length === 0 ? (
        <Card className="p-12 text-center">
          <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No data sources found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || Object.keys(filter).length > 0
              ? 'Try adjusting your filters'
              : 'Get started by adding your first data source'}
          </p>
          {!searchQuery && Object.keys(filter).length === 0 && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Data Source
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSources.map((source) => (
            <Card key={source.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Database className="h-6 w-6 text-blue-500" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{source.name}</h3>
                      {statusIcon(source.status)}
                      <Badge variant="outline" className="uppercase text-xs">
                        {source.type}
                      </Badge>
                      <Badge className={`${classificationColor(source.classification)} text-xs`}>
                        {source.classification}
                      </Badge>
                      {source.piiDetected && (
                        <Badge variant="destructive" className="text-xs">
                          PII Detected
                        </Badge>
                      )}
                      {source.encryptionEnabled && (
                        <Badge variant="outline" className="text-xs">
                          Encrypted
                        </Badge>
                      )}
                    </div>

                    {source.description && (
                      <p className="text-sm text-muted-foreground mb-3">{source.description}</p>
                    )}

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      {source.host && (
                        <span>
                          <strong>Host:</strong> {source.host}
                          {source.port && `:${source.port}`}
                        </span>
                      )}
                      {source.database && (
                        <span>
                          <strong>Database:</strong> {source.database}
                        </span>
                      )}
                      <span>
                        <strong>Quality:</strong> {source.qualityScore}/100
                      </span>
                      {source.lastConnected && (
                        <span>
                          <strong>Last Connected:</strong>{' '}
                          {new Date(source.lastConnected).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {source.tags && source.tags.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        {source.tags.slice(0, 5).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {source.tags.length > 5 && (
                          <span className="text-xs text-muted-foreground">
                            +{source.tags.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testConnection(source.id)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                  <Link href={`/dataops/sources/${source.id}`}>
                    <Button variant="outline" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
