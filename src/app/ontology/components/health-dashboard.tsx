"use client";

/**
 * Health Dashboard Component
 * Monitors ontology health and identifies issues
 */

import { useState, useEffect } from 'react';
import { apiClient } from '@captify-io/core';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Database,
  Link2,
  RefreshCw,
} from 'lucide-react';
import { Button, Badge } from '@captify-io/core';

interface HealthMetrics {
  totalNodes: number;
  totalEdges: number;
  orphanedNodes: string[];
  missingIndexes: Array<{ nodeId: string; nodeName: string; property: string }>;
  schemaIssues: Array<{ nodeId: string; nodeName: string; issue: string }>;
  lastUpdated: string;
}

interface HealthDashboardProps {
  onNodeClick?: (nodeId: string) => void;
}

export function HealthDashboard({ onNodeClick }: HealthDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHealthMetrics();
  }, []);

  const loadHealthMetrics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load all nodes
      const nodesResult = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-ontology-node',
      });

      // Load all edges
      const edgesResult = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-ontology-edge',
      });

      if (!nodesResult.success || !edgesResult.success) {
        setError('Failed to load ontology data');
        return;
      }

      const nodes = nodesResult.data?.Items || [];
      const edges = edgesResult.data?.Items || [];

      // Calculate metrics
      const nodeIds = new Set(nodes.map((n: any) => n.id));
      const nodesInEdges = new Set<string>();

      // Find all nodes referenced in edges
      edges.forEach((edge: any) => {
        if (edge.source) nodesInEdges.add(edge.source);
        if (edge.target) nodesInEdges.add(edge.target);
      });

      // Find orphaned nodes (not connected to any edges)
      const orphanedNodes = nodes
        .filter((node: any) => !nodesInEdges.has(node.id))
        .map((node: any) => node.id);

      // Find missing indexes
      const missingIndexes: Array<{ nodeId: string; nodeName: string; property: string }> = [];
      nodes.forEach((node: any) => {
        if (node.properties?.schema?.properties) {
          const schemaProps = node.properties.schema.properties;
          const indexes = node.properties.indexes || {};

          Object.keys(schemaProps).forEach((propName) => {
            const prop = schemaProps[propName];

            // Check if searchable properties have indexes
            if (prop.searchable) {
              const hasIndex = Object.values(indexes).some(
                (idx: any) => idx.hashKey === propName
              );

              if (!hasIndex) {
                missingIndexes.push({
                  nodeId: node.id,
                  nodeName: node.name,
                  property: propName,
                });
              }
            }
          });
        }
      });

      // Find schema issues
      const schemaIssues: Array<{ nodeId: string; nodeName: string; issue: string }> = [];
      nodes.forEach((node: any) => {
        // Check for missing properties
        if (!node.properties) {
          schemaIssues.push({
            nodeId: node.id,
            nodeName: node.name,
            issue: 'Missing properties configuration',
          });
          return;
        }

        // Check for missing schema
        if (!node.properties.schema) {
          schemaIssues.push({
            nodeId: node.id,
            nodeName: node.name,
            issue: 'Missing schema definition',
          });
        }

        // Check for missing data source
        if (!node.properties.dataSource) {
          schemaIssues.push({
            nodeId: node.id,
            nodeName: node.name,
            issue: 'Missing data source configuration',
          });
        }

        // Check for missing primary key
        if (!node.properties.primaryKey) {
          schemaIssues.push({
            nodeId: node.id,
            nodeName: node.name,
            issue: 'Missing primary key definition',
          });
        }

        // Check for required fields in schema
        if (node.properties.schema?.required?.length === 0) {
          schemaIssues.push({
            nodeId: node.id,
            nodeName: node.name,
            issue: 'No required fields defined',
          });
        }
      });

      setMetrics({
        totalNodes: nodes.length,
        totalEdges: edges.length,
        orphanedNodes,
        missingIndexes,
        schemaIssues,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load health metrics');
    } finally {
      setLoading(false);
    }
  };

  const getHealthScore = (): { score: number; status: 'healthy' | 'warning' | 'critical' } => {
    if (!metrics) return { score: 0, status: 'critical' };

    const issueCount =
      metrics.orphanedNodes.length +
      metrics.missingIndexes.length +
      metrics.schemaIssues.length;

    if (issueCount === 0) return { score: 100, status: 'healthy' };
    if (issueCount < 5) return { score: 75, status: 'warning' };
    return { score: 50, status: 'critical' };
  };

  const health = getHealthScore();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-muted-foreground" />
          <h2 className="text-2xl font-bold">Ontology Health</h2>
        </div>
        <Button
          onClick={loadHealthMetrics}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Loading State */}
      {loading && !metrics && (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-muted-foreground">Analyzing ontology health...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error Loading Health Metrics</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Health Score */}
      {metrics && !loading && (
        <>
          <div className="grid grid-cols-3 gap-4">
            {/* Overall Health */}
            <div className="col-span-3 bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Health</p>
                  <p className="text-4xl font-bold mt-2">{health.score}%</p>
                </div>
                <div>
                  {health.status === 'healthy' && (
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  )}
                  {health.status === 'warning' && (
                    <AlertTriangle className="h-12 w-12 text-yellow-500" />
                  )}
                  {health.status === 'critical' && (
                    <XCircle className="h-12 w-12 text-red-500" />
                  )}
                </div>
              </div>
              <Badge
                variant={
                  health.status === 'healthy'
                    ? 'default'
                    : health.status === 'warning'
                    ? 'secondary'
                    : 'destructive'
                }
                className="mt-4"
              >
                {health.status.toUpperCase()}
              </Badge>
            </div>

            {/* Total Nodes */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Database className="h-4 w-4" />
                <p className="text-sm">Total Nodes</p>
              </div>
              <p className="text-3xl font-bold">{metrics.totalNodes}</p>
            </div>

            {/* Total Edges */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Link2 className="h-4 w-4" />
                <p className="text-sm">Total Links</p>
              </div>
              <p className="text-3xl font-bold">{metrics.totalEdges}</p>
            </div>

            {/* Issues */}
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm">Issues Found</p>
              </div>
              <p className="text-3xl font-bold">
                {metrics.orphanedNodes.length +
                  metrics.missingIndexes.length +
                  metrics.schemaIssues.length}
              </p>
            </div>
          </div>

          {/* Issues List */}
          <div className="space-y-4">
            {/* Orphaned Nodes */}
            {metrics.orphanedNodes.length > 0 && (
              <div className="bg-card border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold">
                    Orphaned Nodes ({metrics.orphanedNodes.length})
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Nodes that are not connected to any relationships
                </p>
                <div className="space-y-2">
                  {metrics.orphanedNodes.slice(0, 10).map((nodeId) => (
                    <div
                      key={nodeId}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                    >
                      <span className="text-sm font-mono">{nodeId}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onNodeClick?.(nodeId)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                  {metrics.orphanedNodes.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      +{metrics.orphanedNodes.length - 10} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Missing Indexes */}
            {metrics.missingIndexes.length > 0 && (
              <div className="bg-card border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <h3 className="text-lg font-semibold">
                    Missing Indexes ({metrics.missingIndexes.length})
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Searchable properties without database indexes
                </p>
                <div className="space-y-2">
                  {metrics.missingIndexes.slice(0, 10).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                    >
                      <div>
                        <p className="text-sm font-medium">{item.nodeName}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {item.property}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onNodeClick?.(item.nodeId)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                  {metrics.missingIndexes.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      +{metrics.missingIndexes.length - 10} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Schema Issues */}
            {metrics.schemaIssues.length > 0 && (
              <div className="bg-card border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <h3 className="text-lg font-semibold">
                    Schema Issues ({metrics.schemaIssues.length})
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Nodes with incomplete or invalid schema definitions
                </p>
                <div className="space-y-2">
                  {metrics.schemaIssues.slice(0, 10).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                    >
                      <div>
                        <p className="text-sm font-medium">{item.nodeName}</p>
                        <p className="text-xs text-muted-foreground">{item.issue}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onNodeClick?.(item.nodeId)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                  {metrics.schemaIssues.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      +{metrics.schemaIssues.length - 10} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* All Good */}
            {metrics.orphanedNodes.length === 0 &&
              metrics.missingIndexes.length === 0 &&
              metrics.schemaIssues.length === 0 && (
                <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-6 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="font-semibold text-lg">Ontology is Healthy!</p>
                  <p className="text-sm mt-2">No issues detected.</p>
                </div>
              )}
          </div>

          {/* Last Updated */}
          <p className="text-xs text-muted-foreground text-center">
            Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
          </p>
        </>
      )}
    </div>
  );
}
