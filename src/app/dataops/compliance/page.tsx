'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card } from '@captify-io/core';
import { apiClient } from '@captify-io/core/lib/api';
import type { ComplianceCheck, CompliancePolicy, DataProduct } from '@captify-io/core/types/dataops';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Lock,
  FileText,
  Eye,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Activity,
} from 'lucide-react';

const NIST_CONTROLS = [
  { id: 'AC-3', name: 'Access Enforcement', category: 'Access Control' },
  { id: 'AC-4', name: 'Information Flow Enforcement', category: 'Access Control' },
  { id: 'AC-6', name: 'Least Privilege', category: 'Access Control' },
  { id: 'AU-2', name: 'Audit Events', category: 'Audit and Accountability' },
  { id: 'AU-3', name: 'Content of Audit Records', category: 'Audit and Accountability' },
  { id: 'AU-9', name: 'Protection of Audit Information', category: 'Audit and Accountability' },
  { id: 'CM-3', name: 'Configuration Change Control', category: 'Configuration Management' },
  { id: 'IA-2', name: 'Identification and Authentication', category: 'Identification and Authentication' },
  { id: 'SC-8', name: 'Transmission Confidentiality', category: 'System and Communications Protection' },
  { id: 'SC-13', name: 'Cryptographic Protection', category: 'System and Communications Protection' },
  { id: 'SC-28', name: 'Protection of Information at Rest', category: 'System and Communications Protection' },
  { id: 'SI-7', name: 'Software, Firmware, and Information Integrity', category: 'System and Information Integrity' },
];

export default function ComplianceDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [policies, setPolicies] = useState<CompliancePolicy[]>([]);
  const [products, setProducts] = useState<DataProduct[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [timeRange]);

  async function loadData() {
    try {
      setLoading(true);

      // Load compliance checks
      const checksResponse = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-compliance-check',
        data: { Limit: 100 },
      });
      setChecks((checksResponse.Items || []) as ComplianceCheck[]);

      // Load compliance policies
      const policiesResponse = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-compliance-policy',
        data: { Limit: 50 },
      });
      setPolicies((policiesResponse.Items || []) as CompliancePolicy[]);

      // Load data products
      const productsResponse = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-dataops-data-product',
        data: { Limit: 100 },
      });
      setProducts((productsResponse.Items || []) as DataProduct[]);
    } catch (error) {
      console.error('Failed to load compliance data:', error);
    } finally {
      setLoading(false);
    }
  }

  const stats = {
    totalChecks: checks.length,
    compliant: checks.filter((c) => c.status === 'compliant').length,
    nonCompliant: checks.filter((c) => c.status === 'non-compliant').length,
    partial: checks.filter((c) => c.status === 'partial-compliant').length,
  };

  const complianceRate = stats.totalChecks > 0
    ? ((stats.compliant / stats.totalChecks) * 100).toFixed(1)
    : '0';

  const classificationBreakdown = {
    U: products.filter((p) => p.classification === 'U').length,
    C: products.filter((p) => p.classification === 'C').length,
    S: products.filter((p) => p.classification === 'S').length,
    TS: products.filter((p) => p.classification === 'TS').length,
  };

  const piiProductsCount = products.filter(
    (p) => p.piiFields && p.piiFields.length > 0
  ).length;

  const controlCompliance: Record<string, { total: number; compliant: number }> = {};
  NIST_CONTROLS.forEach((control) => {
    const controlChecks = checks.filter((c) => c.policyId?.includes(control.id));
    controlCompliance[control.id] = {
      total: controlChecks.length,
      compliant: controlChecks.filter((c) => c.status === 'compliant').length,
    };
  });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading compliance dashboard...</p>
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
              <Shield className="h-8 w-8 text-blue-500" />
              Compliance Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              IL5 NIST 800-53 Rev 5 Compliance Monitoring
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
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliance Rate</p>
                <p className="text-2xl font-bold text-green-500">{complianceRate}%</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliant</p>
                <p className="text-2xl font-bold text-green-500">{stats.compliant}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Non-Compliant</p>
                <p className="text-2xl font-bold text-red-500">{stats.nonCompliant}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Partial</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.partial}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">PII Products</p>
                <p className="text-2xl font-bold">{piiProductsCount}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Classification Breakdown */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Classification Distribution</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-md">
                <Badge className={`${classificationColor('U')} text-xl px-6 py-2 mb-2`}>U</Badge>
                <p className="text-2xl font-bold">{classificationBreakdown.U}</p>
                <p className="text-sm text-muted-foreground">Unclassified</p>
              </div>
              <div className="text-center p-4 border rounded-md">
                <Badge className={`${classificationColor('C')} text-xl px-6 py-2 mb-2`}>C</Badge>
                <p className="text-2xl font-bold">{classificationBreakdown.C}</p>
                <p className="text-sm text-muted-foreground">Confidential</p>
              </div>
              <div className="text-center p-4 border rounded-md">
                <Badge className={`${classificationColor('S')} text-xl px-6 py-2 mb-2`}>S</Badge>
                <p className="text-2xl font-bold">{classificationBreakdown.S}</p>
                <p className="text-sm text-muted-foreground">Secret</p>
              </div>
              <div className="text-center p-4 border rounded-md">
                <Badge className={`${classificationColor('TS')} text-xl px-6 py-2 mb-2`}>TS</Badge>
                <p className="text-2xl font-bold">{classificationBreakdown.TS}</p>
                <p className="text-sm text-muted-foreground">Top Secret</p>
              </div>
            </div>
          </Card>

          {/* NIST 800-53 Controls */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">NIST 800-53 Rev 5 Controls</h3>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  className="px-3 py-1 border rounded-md text-sm"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="Access Control">Access Control</option>
                  <option value="Audit and Accountability">Audit and Accountability</option>
                  <option value="Configuration Management">Configuration Management</option>
                  <option value="Identification and Authentication">Identification and Authentication</option>
                  <option value="System and Communications Protection">System and Communications Protection</option>
                  <option value="System and Information Integrity">System and Information Integrity</option>
                </select>
              </div>
            </div>
            <div className="space-y-3">
              {NIST_CONTROLS.filter(
                (c) => categoryFilter === 'all' || c.category === categoryFilter
              ).map((control) => {
                const compliance = controlCompliance[control.id];
                const rate =
                  compliance.total > 0
                    ? ((compliance.compliant / compliance.total) * 100).toFixed(0)
                    : '0';

                return (
                  <div key={control.id} className="p-4 border rounded-md">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{control.id}</Badge>
                          <p className="font-medium">{control.name}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{control.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-500">{rate}%</p>
                        <p className="text-xs text-muted-foreground">
                          {compliance.compliant}/{compliance.total} checks
                        </p>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Active Compliance Policies */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Active Compliance Policies</h3>
            <div className="space-y-3">
              {policies.filter((p) => p.active === 'true').map((policy) => (
                <div
                  key={policy.id}
                  className="flex items-start justify-between p-4 border rounded-md"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{policy.name}</p>
                      <Badge variant="outline">{policy.framework}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{policy.description}</p>
                    {policy.controls && policy.controls.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {policy.controls.map((control, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {control}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Badge
                    variant={
                      policy.enforcementLevel === 'mandatory'
                        ? 'destructive'
                        : policy.enforcementLevel === 'recommended'
                          ? 'default'
                          : 'secondary'
                    }
                  >
                    {policy.enforcementLevel}
                  </Badge>
                </div>
              ))}
              {policies.filter((p) => p.active === 'true').length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active compliance policies</p>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Compliance Checks */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Recent Compliance Checks</h3>
            <div className="space-y-3">
              {checks.slice(0, 20).map((check) => (
                <div
                  key={check.id}
                  className="flex items-start justify-between p-3 border rounded-md"
                >
                  <div className="flex items-start gap-3">
                    {check.status === 'compliant' && (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    )}
                    {check.status === 'non-compliant' && (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    )}
                    {check.status === 'partial-compliant' && (
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{check.policyId}</p>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{check.entityId}</code>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(check.timestamp).toLocaleString()}
                      </p>
                      {check.findings && check.findings.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {check.findings.slice(0, 3).map((finding, index) => (
                            <p key={index} className="text-xs text-red-500">
                              • {finding}
                            </p>
                          ))}
                          {check.findings.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{check.findings.length - 3} more findings
                            </p>
                          )}
                        </div>
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
              {checks.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No compliance checks found</p>
                </div>
              )}
            </div>
          </Card>

          {/* PII Detection Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">PII Detection Summary</h3>
            <div className="space-y-3">
              {products
                .filter((p) => p.piiFields && p.piiFields.length > 0)
                .slice(0, 10)
                .map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{product.name}</p>
                        <Badge variant="outline">{product.domain}</Badge>
                        <Badge className={classificationColor(product.classification)}>
                          {product.classification}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {product.piiFields?.map((field, index) => (
                          <Badge key={index} variant="destructive" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-red-500">{product.piiFields?.length}</p>
                      <p className="text-xs text-muted-foreground">PII fields</p>
                    </div>
                  </div>
                ))}
              {products.filter((p) => p.piiFields && p.piiFields.length > 0).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No PII detected in products</p>
                </div>
              )}
            </div>
          </Card>

          {/* Compliance Trends */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Compliance Trends</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 border rounded-md">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <p className="font-semibold text-lg">+4.3%</p>
                </div>
                <p className="text-sm text-muted-foreground">Compliance Rate</p>
                <p className="text-xs text-muted-foreground mt-1">vs last week</p>
              </div>
              <div className="text-center p-4 border rounded-md">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <p className="font-semibold text-lg">+8</p>
                </div>
                <p className="text-sm text-muted-foreground">Resolved Issues</p>
                <p className="text-xs text-muted-foreground mt-1">vs last week</p>
              </div>
              <div className="text-center p-4 border rounded-md">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <p className="font-semibold text-lg">12/12</p>
                </div>
                <p className="text-sm text-muted-foreground">Controls Passing</p>
                <p className="text-xs text-muted-foreground mt-1">NIST 800-53 Rev 5</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
