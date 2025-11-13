'use client';

/**
 * DataOps Dashboard
 * Main landing page showing overview metrics and quick actions
 */

import { useState, useEffect } from 'react';
import { Card } from '@captify-io/core/components/ui/card';
import { Button } from '@captify-io/core';
import { Badge } from '@captify-io/core/components/ui/badge';
import { apiClient } from '@captify-io/core/lib/api';
import {
  Database,
  ShieldCheck,
  GitBranch,
  Lock,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  FolderOpen,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  dataSources: { total: number; connected: number; disconnected: number };
  datasets: { total: number; quality: { high: number; medium: number; low: number } };
  qualityScore: number;
  compliance: { compliant: number; nonCompliant: number; partial: number };
  lineageRelations: number;
  piiFields: number;
}

export default function DataOpsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  async function loadDashboardStats() {
    try {
      // TODO: Implement actual API calls
      // For now, using mock data
      const mockStats: DashboardStats = {
        dataSources: { total: 12, connected: 10, disconnected: 2 },
        datasets: { total: 156, quality: { high: 98, medium: 42, low: 16 } },
        qualityScore: 87,
        compliance: { compliant: 142, nonCompliant: 8, partial: 6 },
        lineageRelations: 324,
        piiFields: 28,
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">DataOps Dashboard</h1>
        <p className="text-muted-foreground">
          Enterprise data operations with IL5 NIST Rev 5 compliance
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Database className="h-5 w-5 text-blue-500" />
            </div>
            <Badge variant="outline">{stats?.dataSources.connected}/{stats?.dataSources.total}</Badge>
          </div>
          <h3 className="font-semibold mb-1">Data Sources</h3>
          <p className="text-sm text-muted-foreground">
            {stats?.dataSources.connected} connected, {stats?.dataSources.disconnected} offline
          </p>
          <Link href="/dataops/sources">
            <Button variant="link" className="p-0 h-auto mt-2">
              View sources →
            </Button>
          </Link>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-green-500" />
            </div>
            <Badge variant="outline">{stats?.datasets.total}</Badge>
          </div>
          <h3 className="font-semibold mb-1">Datasets</h3>
          <p className="text-sm text-muted-foreground">
            {stats?.datasets.quality.high} high quality, {stats?.datasets.quality.low} need attention
          </p>
          <Link href="/dataops/catalog">
            <Button variant="link" className="p-0 h-auto mt-2">
              Browse catalog →
            </Button>
          </Link>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-purple-500" />
            </div>
            <Badge variant="outline">{stats?.qualityScore}%</Badge>
          </div>
          <h3 className="font-semibold mb-1">Quality Score</h3>
          <p className="text-sm text-muted-foreground">
            Overall data quality across all datasets
          </p>
          <Link href="/dataops/quality">
            <Button variant="link" className="p-0 h-auto mt-2">
              View quality metrics →
            </Button>
          </Link>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-red-500" />
            </div>
            <Badge variant="outline">
              {stats?.compliance.compliant}/{stats && (stats.compliance.compliant + stats.compliance.nonCompliant + stats.compliance.partial)}
            </Badge>
          </div>
          <h3 className="font-semibold mb-1">Compliance</h3>
          <p className="text-sm text-muted-foreground">
            IL5 NIST 800-53 Rev 5 compliant datasets
          </p>
          <Link href="/dataops/compliance">
            <Button variant="link" className="p-0 h-auto mt-2">
              View compliance →
            </Button>
          </Link>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Discovery
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Find datasets using natural language search powered by AWS Kendra
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask me anything about your data..."
              className="flex-1 px-3 py-2 border rounded-md text-sm"
            />
            <Button>
              <Sparkles className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Recent Lineage Activity
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {stats?.lineageRelations} lineage relationships tracked
          </p>
          <Link href="/dataops/lineage">
            <Button variant="outline" className="w-full">
              View Lineage Graph
            </Button>
          </Link>
        </Card>
      </div>

      {/* Alerts & Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Quality Issues
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-orange-500 mt-2" />
              <div className="flex-1">
                <p className="text-sm font-medium">16 datasets below quality threshold</p>
                <p className="text-xs text-muted-foreground">Completeness scores &lt; 80%</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-orange-500 mt-2" />
              <div className="flex-1">
                <p className="text-sm font-medium">8 datasets with high null rates</p>
                <p className="text-xs text-muted-foreground">Validity issues detected</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-red-500" />
            Compliance Alerts
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-red-500 mt-2" />
              <div className="flex-1">
                <p className="text-sm font-medium">{stats?.piiFields} PII fields detected</p>
                <p className="text-xs text-muted-foreground">Masking required for IL5</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-red-500 mt-2" />
              <div className="flex-1">
                <p className="text-sm font-medium">{stats?.compliance.nonCompliant} non-compliant datasets</p>
                <p className="text-xs text-muted-foreground">NIST controls need review</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Recent Successes
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
              <div className="flex-1">
                <p className="text-sm font-medium">Glue catalog synced</p>
                <p className="text-xs text-muted-foreground">42 tables imported successfully</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
              <div className="flex-1">
                <p className="text-sm font-medium">Quality checks completed</p>
                <p className="text-xs text-muted-foreground">156 datasets profiled</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
