/**
 * DataOps Lineage Page
 * Interactive data lineage visualization with impact analysis
 */

"use client";

import { useState } from 'react';
import { Button } from '@captify-io/core';
import {
  GitBranch, Search, Filter, Download, Maximize2,
  ArrowRight, Database, Table, FileCode, BarChart,
  AlertTriangle, CheckCircle, Clock, Users,
} from 'lucide-react';

// Mock lineage data
const mockLineageData = {
  nodes: [
    {
      id: 'source-1',
      name: 'AWS S3 - Raw Data',
      type: 'source',
      status: 'active',
      lastUpdated: '2025-11-06T10:30:00Z',
    },
    {
      id: 'transform-1',
      name: 'ETL Pipeline - Cleansing',
      type: 'transformation',
      status: 'active',
      lastUpdated: '2025-11-06T11:00:00Z',
    },
    {
      id: 'dataset-1',
      name: 'Customer Analytics Dataset',
      type: 'dataset',
      status: 'active',
      lastUpdated: '2025-11-06T11:30:00Z',
    },
    {
      id: 'product-1',
      name: 'Customer 360 Data Product',
      type: 'product',
      status: 'active',
      lastUpdated: '2025-11-06T12:00:00Z',
    },
  ],
  edges: [
    { source: 'source-1', target: 'transform-1' },
    { source: 'transform-1', target: 'dataset-1' },
    { source: 'dataset-1', target: 'product-1' },
  ],
};

const recentLineage = [
  {
    id: '1',
    entity: 'Customer 360 Data Product',
    type: 'product',
    operation: 'Updated',
    user: 'Sarah Chen',
    timestamp: '2025-11-06T12:00:00Z',
    impact: 'high',
  },
  {
    id: '2',
    entity: 'Sales Pipeline Dataset',
    type: 'dataset',
    operation: 'Created',
    user: 'Mike Johnson',
    timestamp: '2025-11-06T11:45:00Z',
    impact: 'medium',
  },
  {
    id: '3',
    entity: 'ETL Pipeline - Enrichment',
    type: 'transformation',
    operation: 'Modified',
    user: 'Emily Davis',
    timestamp: '2025-11-06T11:30:00Z',
    impact: 'low',
  },
];

export default function LineagePage() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [view, setView] = useState<'graph' | 'table'>('graph');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GitBranch className="h-6 w-6 text-blue-600" />
              Data Lineage
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track data flow and impact across your ecosystem
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Maximize2 className="h-4 w-4 mr-2" />
              Full Screen
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search entities, datasets, or transformations..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant={view === 'graph' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('graph')}
            >
              Graph
            </Button>
            <Button
              variant={view === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('table')}
            >
              Table
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lineage Visualization */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Data Sources</p>
                    <p className="text-2xl font-bold mt-1">24</p>
                  </div>
                  <Database className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Datasets</p>
                    <p className="text-2xl font-bold mt-1">156</p>
                  </div>
                  <Table className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pipelines</p>
                    <p className="text-2xl font-bold mt-1">42</p>
                  </div>
                  <FileCode className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Products</p>
                    <p className="text-2xl font-bold mt-1">18</p>
                  </div>
                  <BarChart className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Lineage Graph View */}
            {view === 'graph' && (
              <div className="bg-card border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Lineage Graph</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                      <span>Source</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                      <span>Transform</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-600"></div>
                      <span>Dataset</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                      <span>Product</span>
                    </div>
                  </div>
                </div>

                {/* Simple lineage flow visualization */}
                <div className="flex items-center justify-center gap-8 py-12">
                  {mockLineageData.nodes.map((node, idx) => (
                    <div key={node.id} className="flex items-center gap-8">
                      <button
                        onClick={() => setSelectedNode(node.id)}
                        className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                          selectedNode === node.id
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            node.type === 'source'
                              ? 'bg-blue-100 text-blue-600'
                              : node.type === 'transformation'
                              ? 'bg-purple-100 text-purple-600'
                              : node.type === 'dataset'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-orange-100 text-orange-600'
                          }`}
                        >
                          {node.type === 'source' && <Database className="h-6 w-6" />}
                          {node.type === 'transformation' && <FileCode className="h-6 w-6" />}
                          {node.type === 'dataset' && <Table className="h-6 w-6" />}
                          {node.type === 'product' && <BarChart className="h-6 w-6" />}
                        </div>
                        <div className="text-sm font-medium text-center max-w-[120px]">
                          {node.name}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Active
                        </div>
                      </button>
                      {idx < mockLineageData.nodes.length - 1 && (
                        <ArrowRight className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="text-center text-sm text-muted-foreground mt-8">
                  <p>Click on any node to view detailed lineage information</p>
                  <p className="mt-1">Full interactive graph visualization coming soon</p>
                </div>
              </div>
            )}

            {/* Table View */}
            {view === 'table' && (
              <div className="bg-card border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium">Entity</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Type</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Upstream</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Downstream</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {mockLineageData.nodes.map((node) => (
                      <tr key={node.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="font-medium">{node.name}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                            {node.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {mockLineageData.edges.filter((e) => e.target === node.id).length || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {mockLineageData.edges.filter((e) => e.source === node.id).length || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(node.lastUpdated).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Sidebar - Details & Activity */}
          <div className="space-y-6">
            {/* Selected Node Details */}
            {selectedNode ? (
              <div className="bg-card border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Node Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">
                      {mockLineageData.nodes.find((n) => n.id === selectedNode)?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">
                      {mockLineageData.nodes.find((n) => n.id === selectedNode)?.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Upstream Dependencies</p>
                    <p className="font-medium">
                      {mockLineageData.edges.filter((e) => e.target === selectedNode).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Downstream Consumers</p>
                    <p className="font-medium">
                      {mockLineageData.edges.filter((e) => e.source === selectedNode).length}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    View Full Lineage
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-card border rounded-lg p-4">
                <p className="text-sm text-muted-foreground text-center">
                  Select a node to view details
                </p>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-card border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentLineage.map((item) => (
                  <div key={item.id} className="border-l-2 border-blue-600 pl-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{item.entity}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.operation} by {item.user}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          item.impact === 'high'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : item.impact === 'medium'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                        }`}
                      >
                        {item.impact}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                      <Clock className="h-3 w-3" />
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Impact Analysis */}
            <div className="bg-card border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Impact Analysis</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">High Impact Changes</span>
                  <span className="font-bold text-red-600">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Medium Impact Changes</span>
                  <span className="font-bold text-yellow-600">7</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Low Impact Changes</span>
                  <span className="font-bold text-green-600">12</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  View All Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
