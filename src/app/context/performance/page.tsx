"use client";

/**
 * Performance Page
 * Readiness metrics, DORA capabilities, and VSM triggers
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@captify-io/core/components/ui/card';
import { Badge } from '@captify-io/core/components/ui/badge';
import { Alert, AlertDescription } from '@captify-io/core/components/ui/alert';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
} from 'lucide-react';

export default function PerformancePage() {
  // TODO: Fetch actual metrics from readiness service
  const readinessScore = 45; // Example: 45% readiness
  const needsVSM = readinessScore < 70;

  return (
    <div className="h-screen overflow-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Performance & Readiness</h1>
        <p className="text-sm text-muted-foreground">
          DORA metrics, readiness assessment, and improvement triggers
        </p>
      </div>

      {/* VSM Trigger Alert */}
      {needsVSM && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Readiness below 70%</strong> - Consider scheduling a Value Stream Mapping workshop to identify bottlenecks and improvement opportunities.
          </AlertDescription>
        </Alert>
      )}

      {/* Readiness Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Overall Readiness Score
          </CardTitle>
          <CardDescription>
            Calculated from context coverage and DORA metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold">{readinessScore}%</div>
            <div className="flex-1">
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    readinessScore >= 70
                      ? 'bg-green-600'
                      : readinessScore >= 50
                      ? 'bg-yellow-600'
                      : 'bg-red-600'
                  }`}
                  style={{ width: `${readinessScore}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {readinessScore >= 70
                  ? 'Good - Ready for production'
                  : readinessScore >= 50
                  ? 'Fair - Needs improvement'
                  : 'Poor - Critical gaps identified'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DORA Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Deployment Frequency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.5 / week</div>
            <Badge className="mt-2" variant="secondary">Elite</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Lead Time for Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2 days</div>
            <Badge className="mt-2" variant="secondary">High</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Mean Time to Restore
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.5 hours</div>
            <Badge className="mt-2" variant="secondary">Medium</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Change Failure Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8%</div>
            <Badge className="mt-2" variant="secondary">High</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Context Coverage */}
      <Card>
        <CardHeader>
          <CardTitle>Context Coverage</CardTitle>
          <CardDescription>
            Percentage of required context elements defined
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { domain: 'People', coverage: 60, color: 'bg-blue-600' },
              { domain: 'Process', coverage: 40, color: 'bg-green-600' },
              { domain: 'Technology', coverage: 75, color: 'bg-purple-600' },
              { domain: 'Data', coverage: 30, color: 'bg-orange-600' },
              { domain: 'Discovery', coverage: 20, color: 'bg-yellow-600' },
              { domain: 'Alignment', coverage: 50, color: 'bg-red-600' },
            ].map((item) => (
              <div key={item.domain}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{item.domain}</span>
                  <span className="text-sm text-muted-foreground">{item.coverage}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={item.color}
                    style={{ width: `${item.coverage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">
                <strong>Low Data coverage (30%)</strong> - Add more Dataset and DataProduct nodes to improve data lineage
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">
                <strong>Low Discovery coverage (20%)</strong> - Document Insights, PainPoints, and Opportunities from user research
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">
                <strong>Readiness below threshold</strong> - Schedule Value Stream Mapping workshop to identify improvement areas
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
