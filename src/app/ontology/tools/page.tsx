"use client";

/**
 * Unified Tools Management Page
 * Combines tools, services, and analytics in one view
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageTemplate } from '@captify-io/core';
import {
  Card,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Button
} from '@captify-io/core/components/ui';
import {
  Wrench,
  Search,
  Code,
  Database,
  Cloud,
  Bot,
  Loader2,
  Activity,
  Zap,
  Clock,
  TrendingUp,
  BarChart3,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Settings,
  Trash2,
  FileText,
  Brain,
  Shuffle,
  Users,
  Server
} from 'lucide-react';
import { apiClient } from '@captify-io/core';

// Tool from DynamoDB
interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  implementation: string;
  domain?: string;
  status?: string;
  schema?: any;
  createdAt: string;
}

// AWS Service Definition
interface ServiceDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  operations: string[];
  icon: any;
  color: string;
}

interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  totalAccessCount: number;
  averageAge: number;
}

interface ToolAnalytics {
  toolId: string;
  toolName: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  avgDuration: number;
  totalCost: number;
  lastExecuted: number;
}

export default function UnifiedToolsPage() {
  const router = useRouter();

  // Tool definitions from DynamoDB
  const [tools, setTools] = useState<ToolDefinition[]>([]);

  // AWS Services (static)
  const [services, setServices] = useState<ServiceDefinition[]>([]);

  // Analytics data
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [analytics, setAnalytics] = useState<ToolAnalytics[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('tools');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await Promise.all([
      loadTools(),
      loadServices(),
      loadCacheStats(),
      loadAnalytics(),
    ]);
    setLoading(false);
  };

  const loadTools = async () => {
    try {
      const result = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-tool',
        data: {}
      });

      if (result.success && result.data?.Items) {
        setTools(result.data.Items);
      }
    } catch (error) {
      console.error('Failed to load tools:', error);
    }
  };

  const loadServices = () => {
    // Define all available AWS services that tools can use
    const availableServices: ServiceDefinition[] = [
      {
        id: 'dynamodb',
        name: 'DynamoDB',
        description: 'NoSQL database service for storing and querying data',
        category: 'Database',
        operations: ['query', 'scan', 'get', 'put', 'update', 'delete', 'batchGet', 'batchWrite'],
        icon: Database,
        color: 'blue',
      },
      {
        id: 's3',
        name: 'S3',
        description: 'Object storage service for files and documents',
        category: 'Storage',
        operations: ['upload', 'download', 'list', 'delete', 'getPresignedUrl'],
        icon: FileText,
        color: 'green',
      },
      {
        id: 'bedrock',
        name: 'Bedrock',
        description: 'AI foundation models and agent orchestration',
        category: 'AI/ML',
        operations: ['invokeAgent', 'listAgents', 'createAgent', 'updateAgent', 'deleteAgent'],
        icon: Brain,
        color: 'purple',
      },
      {
        id: 'kendra',
        name: 'Kendra',
        description: 'Intelligent search service powered by machine learning',
        category: 'Search',
        operations: ['query', 'retrieve', 'createIndex', 'createDataSource', 'startSync'],
        icon: Search,
        color: 'orange',
      },
      {
        id: 'glue',
        name: 'Glue',
        description: 'ETL service for data preparation and transformation',
        category: 'Analytics',
        operations: ['startJobRun', 'getCrawler', 'startCrawler', 'getDatabase', 'getTables'],
        icon: Shuffle,
        color: 'teal',
      },
      {
        id: 'sagemaker',
        name: 'SageMaker',
        description: 'Build, train, and deploy machine learning models',
        category: 'AI/ML',
        operations: ['createModel', 'createEndpoint', 'invokeEndpoint', 'describeModel'],
        icon: BarChart3,
        color: 'indigo',
      },
      {
        id: 'quicksight',
        name: 'QuickSight',
        description: 'Business intelligence and data visualization service',
        category: 'Analytics',
        operations: ['getDashboard', 'listDashboards', 'createDashboard', 'updateDashboard'],
        icon: BarChart3,
        color: 'cyan',
      },
      {
        id: 'cognito',
        name: 'Cognito',
        description: 'User authentication and identity management',
        category: 'Security',
        operations: ['listUsers', 'getUser', 'createUser', 'updateUser', 'deleteUser'],
        icon: Users,
        color: 'pink',
      },
      {
        id: 'aurora',
        name: 'Aurora',
        description: 'Relational database service (MySQL/PostgreSQL compatible)',
        category: 'Database',
        operations: ['executeStatement', 'batchExecuteStatement', 'beginTransaction', 'commitTransaction'],
        icon: Server,
        color: 'amber',
      },
    ];

    setServices(availableServices);
  };

  const loadCacheStats = async () => {
    try {
      const response = await apiClient.run({
        service: 'platform.agent',
        operation: 'getToolCacheStats',
        data: {}
      });

      if (response.success && response.data) {
        setCacheStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await apiClient.run({
        service: 'platform.agent',
        operation: 'getToolAnalytics',
        data: { limit: 20 }
      });

      if (response.success && response.data) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const deleteTool = async (toolId: string) => {
    if (!confirm('Are you sure you want to delete this tool?')) {
      return;
    }

    try {
      await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'delete',
        table: 'core-tool',
        data: {
          Key: { id: toolId },
        },
      });

      loadTools();
    } catch (error) {
      console.error('Failed to delete tool:', error);
    }
  };

  const getImplementationIcon = (implementation: string) => {
    switch (implementation) {
      case 'dynamodb':
      case 'dynamodb-get':
        return Database;
      case 'ontology-query':
      case 'ontology-edges':
        return Brain;
      default:
        return Wrench;
    }
  };

  const getImplementationColor = (implementation: string) => {
    const colors: Record<string, string> = {
      'dynamodb': 'blue',
      'dynamodb-get': 'blue',
      'ontology-query': 'purple',
      'ontology-edges': 'purple',
      'bedrock': 'orange',
    };
    return colors[implementation] || 'gray';
  };

  const getServiceColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
      green: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
      purple: { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
      orange: { bg: 'bg-orange-100 dark:bg-orange-900/50', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
      teal: { bg: 'bg-teal-100 dark:bg-teal-900/50', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800' },
      indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/50', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800' },
      cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/50', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800' },
      pink: { bg: 'bg-pink-100 dark:bg-pink-900/50', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800' },
      amber: { bg: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
    };
    return colorMap[color] || colorMap.blue;
  };

  const filteredTools = tools.filter(tool =>
    searchQuery === '' ||
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(services.map(s => s.category)));
  const getCategoryServices = (category: string) => services.filter(s => s.category === category);

  return (
    <PageTemplate
      title="Tools & Services"
      description="Manage tools, view available services, and monitor execution analytics"
      primaryAction={{
        label: 'New Tool',
        onClick: () => router.push('/ontology/workflow/builder'),
        icon: Plus,
      }}
      headerExtra={
        activeTab === 'tools' && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tools..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )
      }
      stats={[
        {
          label: 'Tools',
          value: tools.length,
          icon: Wrench,
          color: 'blue',
        },
        {
          label: 'Services',
          value: services.length,
          icon: Server,
          color: 'purple',
        },
        {
          label: 'Cache Hit Rate',
          value: cacheStats ? `${(cacheStats.hitRate * 100).toFixed(1)}%` : '0%',
          icon: TrendingUp,
          color: 'green',
        },
      ]}
    >
      <div className="h-full flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
            <TabsTrigger value="tools">
              <Wrench className="h-4 w-4 mr-2" />
              Tools
            </TabsTrigger>
            <TabsTrigger value="services">
              <Server className="h-4 w-4 mr-2" />
              Services
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="cache">
              <Zap className="h-4 w-4 mr-2" />
              Cache
            </TabsTrigger>
          </TabsList>

          {/* Tools Tab */}
          <TabsContent value="tools" className="flex-1 overflow-auto space-y-6 mt-6">

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTools.length === 0 ? (
              <Card className="p-12 text-center">
                <Wrench className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No tools yet</h3>
                <p className="text-muted-foreground mb-6">
                  Get started by creating your first tool
                </p>
                <Button onClick={() => router.push('/ontology/workflow/builder')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tool
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredTools.map((tool) => {
                  const Icon = getImplementationIcon(tool.implementation);
                  const color = getImplementationColor(tool.implementation);

                  return (
                    <Card key={tool.id} className="group p-4 hover:shadow-md transition-all">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/50 flex-shrink-0`}>
                          <Icon className={`h-4 w-4 text-${color}-600 dark:text-${color}-400`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <h3 className="font-semibold text-sm">{tool.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {tool.implementation}
                                </Badge>
                                {tool.domain && (
                                  <Badge variant="secondary" className="text-xs">
                                    {tool.domain}
                                  </Badge>
                                )}
                                {tool.status && (
                                  <Badge variant={tool.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                    {tool.status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/ontology/workflow/builder?workflowId=${tool.id}`)}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteTool(tool.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>

                          {tool.description && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {tool.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="flex-1 overflow-auto space-y-8 mt-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-2">AWS Services</h2>
              <p className="text-sm text-muted-foreground">
                Tools can use these AWS services through the platform API. Each service provides specific operations that tools can invoke with proper permissions.
              </p>
            </Card>

            {categories.map((category) => (
              <div key={category}>
                <h2 className="text-xl font-semibold mb-4">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getCategoryServices(category).map((service) => {
                    const Icon = service.icon;
                    const colors = getServiceColorClasses(service.color);

                    return (
                      <Card
                        key={service.id}
                        className={`p-4 hover:shadow-md transition-all border-2 ${colors.border}`}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${colors.bg}`}>
                            <Icon className={`h-5 w-5 ${colors.text}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{service.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {service.description}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">
                            Operations ({service.operations.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {service.operations.map((op) => (
                              <Badge key={op} variant="outline" className="text-xs">
                                {op}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="flex-1 overflow-auto space-y-6 mt-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Tool Usage Analytics</h2>
                <button
                  onClick={() => loadAnalytics()}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-accent transition-colors"
                >
                  <RefreshCw className="h-4 w-4 inline mr-2" />
                  Refresh
                </button>
              </div>

              {analytics.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No analytics data available yet
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics.map((stat) => {
                    const successRate = stat.executionCount > 0
                      ? (stat.successCount / stat.executionCount) * 100
                      : 0;

                    return (
                      <Card key={stat.toolId} className="p-4">
                        <h3 className="font-semibold text-sm mb-3">{stat.toolName}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Executions</p>
                            <p className="text-lg font-semibold">{stat.executionCount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Success Rate</p>
                            <p className="text-lg font-semibold">
                              {successRate.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Avg Duration</p>
                            <p className="text-lg font-semibold">{stat.avgDuration}ms</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Total Cost</p>
                            <p className="text-lg font-semibold">
                              ${stat.totalCost.toFixed(4)}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Cache Tab */}
          <TabsContent value="cache" className="flex-1 overflow-auto space-y-6 mt-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Tool Result Cache</h2>
                <button
                  onClick={() => loadCacheStats()}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-accent transition-colors"
                >
                  <RefreshCw className="h-4 w-4 inline mr-2" />
                  Refresh
                </button>
              </div>

              {!cacheStats ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading cache statistics...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="p-4 border-2">
                    <div className="flex items-center gap-3">
                      <Database className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Cache Size</p>
                        <p className="text-2xl font-bold">{cacheStats.size}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 border-2">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Cache Hits</p>
                        <p className="text-2xl font-bold">{cacheStats.hits}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 border-2">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-8 w-8 text-red-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Cache Misses</p>
                        <p className="text-2xl font-bold">{cacheStats.misses}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 border-2">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-purple-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Hit Rate</p>
                        <p className="text-2xl font-bold">
                          {(cacheStats.hitRate * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 border-2">
                    <div className="flex items-center gap-3">
                      <Activity className="h-8 w-8 text-orange-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Access</p>
                        <p className="text-2xl font-bold">{cacheStats.totalAccessCount}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 border-2">
                    <div className="flex items-center gap-3">
                      <Clock className="h-8 w-8 text-cyan-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Age</p>
                        <p className="text-2xl font-bold">
                          {(cacheStats.averageAge / 1000).toFixed(1)}s
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageTemplate>
  );
}

export const dynamic = "force-dynamic";
