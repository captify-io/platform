'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card } from '@captify-io/core';
import { apiClient } from '@captify-io/core/lib/api';
import type { QualityCheck, QualityRule, DataProduct } from '@captify-io/core/types/dataops';
import {
  BarChart3,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Filter,
  Calendar,
  Download,
} from 'lucide-react';

export default function QualityDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState<QualityCheck[]>([]);
  const [rules, setRules] = useState<QualityRule[]>([]);
  const [products, setProducts] = useState<DataProduct[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed' | 'warning'>('all');

  useEffect(() => {
    loadData();
  }, [timeRange]);

  async function loadData() {
    try {
      setLoading(true);

      // Load recent quality checks
      const checksResponse = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-quality-check',
        data: { Limit: 100 },
      });
      setChecks((checksResponse.Items || []) as QualityCheck[]);

      // Load quality rules
      const rulesResponse = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-quality-rule',
        data: { Limit: 50 },
      });
      setRules((rulesResponse.Items || []) as QualityRule[]);

      // Load data products with quality scores
      const productsResponse = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-dataops-data-product',
        data: { Limit: 100 },
      });
      setProducts((productsResponse.Items || []) as DataProduct[]);
    } catch (error) {
      console.error('Failed to load quality data:', error);
    } finally {
      setLoading(false);
    }
  }

  const stats = {
    totalChecks: checks.length,
    passed: checks.filter((c) => c.status === 'passed').length,
    failed: checks.filter((c) => c.status === 'failed').length,
    warnings: checks.filter((c) => c.status === 'warning').length,
    avgQuality: products.length > 0
      ? Math.round(products.reduce((sum, p) => sum + p.qualityScore, 0) / products.length)
      : 0,
  };

  const dimensionAverages = {
    completeness: 0,
    validity: 0,
    consistency: 0,
    timeliness: 0,
    uniqueness: 0,
    accuracy: 0,
  };

  if (products.length > 0) {
    products.forEach((p) => {
      if (p.qualityDimensions) {
        dimensionAverages.completeness += p.qualityDimensions.completeness;
        dimensionAverages.validity += p.qualityDimensions.validity;
        dimensionAverages.consistency += p.qualityDimensions.consistency;
        dimensionAverages.timeliness += p.qualityDimensions.timeliness;
        dimensionAverages.uniqueness += p.qualityDimensions.uniqueness;
        dimensionAverages.accuracy += p.qualityDimensions.accuracy;
      }
    });

    Object.keys(dimensionAverages).forEach((key) => {
      dimensionAverages[key as keyof typeof dimensionAverages] = Math.round(
        dimensionAverages[key as keyof typeof dimensionAverages] / products.length
      );
    });
  }

  const filteredChecks =
    statusFilter === 'all' ? checks : checks.filter((c) => c.status === statusFilter);

  const qualityColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const dimensionColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const passRate = stats.totalChecks > 0
    ? ((stats.passed / stats.totalChecks) * 100).toFixed(1)
    : '0';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quality dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-green-500" />
              Quality Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor data quality across all products and datasets
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              {timeRange === '24h' && 'Last 24 Hours'}
              {timeRange === '7d' && 'Last 7 Days'}
              {timeRange === '30d' && 'Last 30 Days'}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Quality</p>
                <p className={`text-2xl font-bold ${qualityColor(stats.avgQuality)}`}>
                  {stats.avgQuality}/100
                </p>
              </div>
              <Target className={`h-8 w-8 ${qualityColor(stats.avgQuality)}`} />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
                <p className="text-2xl font-bold">{passRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Passed</p>
                <p className="text-2xl font-bold text-green-500">{stats.passed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.warnings}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Quality Dimensions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Quality Dimensions (Average)</h3>
            <div className="space-y-4">
              {Object.entries(dimensionAverages).map(([dimension, score]) => (
                <div key={dimension}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium capitalize">{dimension}</span>
                    <span className={`text-sm font-bold ${qualityColor(score)}`}>
                      {score}/100
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${dimensionColor(score)} transition-all`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quality by Product */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Quality by Data Product</h3>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select className="px-3 py-1 border rounded-md text-sm">
                  <option>All Domains</option>
                  <option>Sales</option>
                  <option>Logistics</option>
                  <option>Finance</option>
                </select>
              </div>
            </div>
            <div className="space-y-3">
              {products.slice(0, 10).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium">{product.name}</p>
                      <Badge variant="outline">{product.domain}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Completeness:</span>
                        <span className={qualityColor(product.qualityDimensions?.completeness || 0)}>
                          {product.qualityDimensions?.completeness || 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Validity:</span>
                        <span className={qualityColor(product.qualityDimensions?.validity || 0)}>
                          {product.qualityDimensions?.validity || 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Accuracy:</span>
                        <span className={qualityColor(product.qualityDimensions?.accuracy || 0)}>
                          {product.qualityDimensions?.accuracy || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${qualityColor(product.qualityScore)}`}>
                      {product.qualityScore}
                    </p>
                    <p className="text-xs text-muted-foreground">Overall</p>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No data products found</p>
                </div>
              )}
            </div>
          </Card>

          {/* Active Quality Rules */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Active Quality Rules</h3>
            <div className="space-y-3">
              {rules.filter((r) => r.active === 'true').map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-start justify-between p-3 border rounded-md"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{rule.name}</p>
                      <Badge variant="outline">{rule.dimension}</Badge>
                      <Badge variant="secondary">{rule.checkType}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  </div>
                  <Badge variant={rule.severity === 'critical' ? 'destructive' : 'default'}>
                    {rule.severity}
                  </Badge>
                </div>
              ))}
              {rules.filter((r) => r.active === 'true').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active quality rules</p>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Quality Checks */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Recent Quality Checks</h3>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'passed' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('passed')}
                >
                  Passed
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'failed' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('failed')}
                >
                  Failed
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'warning' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('warning')}
                >
                  Warnings
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {filteredChecks.slice(0, 20).map((check) => (
                <div
                  key={check.id}
                  className="flex items-start justify-between p-3 border rounded-md"
                >
                  <div className="flex items-start gap-3">
                    {check.status === 'passed' && (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    )}
                    {check.status === 'failed' && (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    )}
                    {check.status === 'warning' && (
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{check.ruleId}</p>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{check.entityId}</code>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(check.timestamp).toLocaleString()}
                      </p>
                      {check.details && (
                        <p className="text-xs text-muted-foreground mt-1">{check.details}</p>
                      )}
                      {check.failedRecords !== undefined && check.status === 'failed' && (
                        <p className="text-xs text-red-500 mt-1">
                          {check.failedRecords} records failed
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      check.status === 'passed'
                        ? 'default'
                        : check.status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {check.status}
                  </Badge>
                </div>
              ))}
              {filteredChecks.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No quality checks found</p>
                </div>
              )}
            </div>
          </Card>

          {/* Trends */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Quality Trends</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 border rounded-md">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <p className="font-semibold text-lg">+5.2%</p>
                </div>
                <p className="text-sm text-muted-foreground">Overall Quality</p>
                <p className="text-xs text-muted-foreground mt-1">vs last week</p>
              </div>
              <div className="text-center p-4 border rounded-md">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <p className="font-semibold text-lg">+3.8%</p>
                </div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
                <p className="text-xs text-muted-foreground mt-1">vs last week</p>
              </div>
              <div className="text-center p-4 border rounded-md">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  <p className="font-semibold text-lg">-12</p>
                </div>
                <p className="text-sm text-muted-foreground">Failed Checks</p>
                <p className="text-xs text-muted-foreground mt-1">vs last week</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
