/**
 * DataOps Pipelines Page
 * Visual pipeline builder and management with 18+ node types
 */

"use client";

import { useState } from 'react';
import { Button } from '@captify-io/core';
import {
  Workflow, Plus, Search, Filter, Play, Pause, Settings,
  MoreVertical, CheckCircle, XCircle, Clock, AlertCircle,
  TrendingUp, Database, FileCode, GitBranch, Zap,
} from 'lucide-react';

// Mock pipeline data
const mockPipelines = [
  {
    id: 'pipeline-1',
    name: 'Customer Data Enrichment',
    description: 'Enriches customer data with demographic and behavioral attributes',
    status: 'running',
    schedule: 'Every 6 hours',
    lastRun: '2025-11-06T12:00:00Z',
    nextRun: '2025-11-06T18:00:00Z',
    successRate: 98.5,
    avgDuration: '12m 30s',
    nodes: 8,
    category: 'etl',
  },
  {
    id: 'pipeline-2',
    name: 'Sales Analytics Pipeline',
    description: 'Processes sales data and generates daily analytics reports',
    status: 'idle',
    schedule: 'Daily at 2:00 AM',
    lastRun: '2025-11-06T02:00:00Z',
    nextRun: '2025-11-07T02:00:00Z',
    successRate: 99.2,
    avgDuration: '8m 15s',
    nodes: 12,
    category: 'analytics',
  },
  {
    id: 'pipeline-3',
    name: 'Data Quality Validation',
    description: 'Runs comprehensive quality checks on all datasets',
    status: 'running',
    schedule: 'Every 4 hours',
    lastRun: '2025-11-06T11:00:00Z',
    nextRun: '2025-11-06T15:00:00Z',
    successRate: 96.8,
    avgDuration: '5m 45s',
    nodes: 6,
    category: 'quality',
  },
  {
    id: 'pipeline-4',
    name: 'ML Feature Engineering',
    description: 'Prepares features for machine learning models',
    status: 'failed',
    schedule: 'Every 2 hours',
    lastRun: '2025-11-06T12:30:00Z',
    nextRun: '2025-11-06T14:30:00Z',
    successRate: 92.4,
    avgDuration: '18m 20s',
    nodes: 15,
    category: 'ml',
  },
  {
    id: 'pipeline-5',
    name: 'Compliance Audit Trail',
    description: 'Generates audit logs for compliance reporting',
    status: 'idle',
    schedule: 'Weekly on Monday',
    lastRun: '2025-11-04T00:00:00Z',
    nextRun: '2025-11-11T00:00:00Z',
    successRate: 100,
    avgDuration: '3m 10s',
    nodes: 4,
    category: 'compliance',
  },
];

const recentRuns = [
  {
    id: 'run-1',
    pipeline: 'Customer Data Enrichment',
    status: 'success',
    startTime: '2025-11-06T12:00:00Z',
    duration: '12m 28s',
    recordsProcessed: 145823,
  },
  {
    id: 'run-2',
    pipeline: 'ML Feature Engineering',
    status: 'failed',
    startTime: '2025-11-06T12:30:00Z',
    duration: '2m 15s',
    recordsProcessed: 0,
    error: 'Connection timeout to S3 bucket',
  },
  {
    id: 'run-3',
    pipeline: 'Data Quality Validation',
    status: 'running',
    startTime: '2025-11-06T11:00:00Z',
    duration: '3m 12s',
    recordsProcessed: 89234,
  },
];

export default function PipelinesPage() {
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'idle':
        return <Pause className="h-4 w-4 text-gray-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      case 'idle':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300';
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
      default:
        return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'etl':
        return <Database className="h-4 w-4" />;
      case 'analytics':
        return <TrendingUp className="h-4 w-4" />;
      case 'quality':
        return <CheckCircle className="h-4 w-4" />;
      case 'ml':
        return <Zap className="h-4 w-4" />;
      case 'compliance':
        return <FileCode className="h-4 w-4" />;
      default:
        return <Workflow className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Workflow className="h-6 w-6 text-purple-600" />
              Data Pipelines
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visual pipeline builder and orchestration
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Pipeline
            </Button>
          </div>
        </div>

        {/* Search and View Toggle */}
        <div className="flex items-center gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search pipelines..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
            />
          </div>
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant={view === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('grid')}
            >
              Grid
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
            >
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipelines List/Grid */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pipelines</p>
                    <p className="text-2xl font-bold mt-1">{mockPipelines.length}</p>
                  </div>
                  <Workflow className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Running</p>
                    <p className="text-2xl font-bold mt-1">
                      {mockPipelines.filter((p) => p.status === 'running').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Success</p>
                    <p className="text-2xl font-bold mt-1">97.4%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold mt-1">
                      {mockPipelines.filter((p) => p.status === 'failed').length}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </div>

            {/* Grid View */}
            {view === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockPipelines.map((pipeline) => (
                  <div
                    key={pipeline.id}
                    className={`bg-card border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedPipeline === pipeline.id
                        ? 'border-blue-600 ring-2 ring-blue-600 ring-opacity-50'
                        : ''
                    }`}
                    onClick={() => setSelectedPipeline(pipeline.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded">
                          {getCategoryIcon(pipeline.category)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{pipeline.name}</h3>
                          <p className="text-xs text-muted-foreground">{pipeline.nodes} nodes</p>
                        </div>
                      </div>
                      <button className="p-1 hover:bg-muted rounded">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{pipeline.description}</p>

                    <div className="flex items-center gap-2 mb-3">
                      {getStatusIcon(pipeline.status)}
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(pipeline.status)}`}>
                        {pipeline.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                      <div>
                        <p>Success Rate</p>
                        <p className="font-medium text-foreground">{pipeline.successRate}%</p>
                      </div>
                      <div>
                        <p>Avg Duration</p>
                        <p className="font-medium text-foreground">{pipeline.avgDuration}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="text-xs text-muted-foreground">{pipeline.schedule}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <Play className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {view === 'list' && (
              <div className="bg-card border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium">Pipeline</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Schedule</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Success Rate</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Avg Duration</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {mockPipelines.map((pipeline) => (
                      <tr
                        key={pipeline.id}
                        className="hover:bg-muted/30 cursor-pointer"
                        onClick={() => setSelectedPipeline(pipeline.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-purple-100 dark:bg-purple-950 rounded">
                              {getCategoryIcon(pipeline.category)}
                            </div>
                            <div>
                              <div className="font-medium">{pipeline.name}</div>
                              <div className="text-xs text-muted-foreground">{pipeline.nodes} nodes</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(pipeline.status)}
                            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(pipeline.status)}`}>
                              {pipeline.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{pipeline.schedule}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-600"
                                style={{ width: `${pipeline.successRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{pipeline.successRate}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{pipeline.avgDuration}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 px-2">
                              <Play className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2">
                              <Settings className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Sidebar - Details & Recent Runs */}
          <div className="space-y-6">
            {/* Selected Pipeline Details */}
            {selectedPipeline ? (
              <div className="bg-card border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Pipeline Details</h3>
                <div className="space-y-3">
                  {(() => {
                    const pipeline = mockPipelines.find((p) => p.id === selectedPipeline);
                    return pipeline ? (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-medium">{pipeline.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(pipeline.status)}
                            <span className="font-medium capitalize">{pipeline.status}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Schedule</p>
                          <p className="font-medium">{pipeline.schedule}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Last Run</p>
                          <p className="font-medium">
                            {new Date(pipeline.lastRun).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Next Run</p>
                          <p className="font-medium">
                            {new Date(pipeline.nextRun).toLocaleString()}
                          </p>
                        </div>
                        <div className="pt-3 border-t space-y-2">
                          <Button variant="default" size="sm" className="w-full">
                            <Play className="h-4 w-4 mr-2" />
                            Run Now
                          </Button>
                          <Button variant="outline" size="sm" className="w-full">
                            <Settings className="h-4 w-4 mr-2" />
                            Configure
                          </Button>
                          <Button variant="outline" size="sm" className="w-full">
                            <GitBranch className="h-4 w-4 mr-2" />
                            View Lineage
                          </Button>
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
              </div>
            ) : (
              <div className="bg-card border rounded-lg p-4">
                <p className="text-sm text-muted-foreground text-center">
                  Select a pipeline to view details
                </p>
              </div>
            )}

            {/* Recent Runs */}
            <div className="bg-card border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Recent Runs</h3>
              <div className="space-y-3">
                {recentRuns.map((run) => (
                  <div key={run.id} className="border-l-2 border-blue-600 pl-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{run.pipeline}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {run.recordsProcessed.toLocaleString()} records
                        </p>
                      </div>
                      {run.status === 'success' && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {run.status === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
                      {run.status === 'running' && (
                        <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                      <Clock className="h-3 w-3" />
                      {run.duration}
                    </div>
                    {run.error && (
                      <div className="flex items-start gap-1 text-xs text-red-600 mt-2">
                        <AlertCircle className="h-3 w-3 mt-0.5" />
                        <span>{run.error}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline Builder Info */}
            <div className="bg-card border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Pipeline Builder</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create complex data pipelines with our visual builder featuring 18+ node types:
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Database className="h-3 w-3 text-blue-600" />
                  <span>Data Sources & Sinks</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileCode className="h-3 w-3 text-purple-600" />
                  <span>Transformations & ETL</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Quality Checks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-orange-600" />
                  <span>ML & Analytics</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Open Builder
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
