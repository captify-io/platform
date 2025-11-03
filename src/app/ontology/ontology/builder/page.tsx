"use client";

/**
 * Ontology Builder - Visual Designer
 * Interactive xyflow-based designer for ontology nodes and relationships
 *
 * Features:
 * - Visual node-based canvas
 * - Right-click to add nodes
 * - Click and drag to create relationships
 * - Edit node properties, groups, roles, permissions
 * - Attach table data to nodes
 * - Save and load ontology models
 */

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ReactFlowProvider } from '@xyflow/react';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@captify-io/core/components/ui';
import { Save, Download, ArrowLeft, Network } from 'lucide-react';
import { OntologyProvider, useOntology } from './context/OntologyContext';
import { OntologyCanvas } from './components/OntologyCanvas';
import { NodeConfigPanel } from './components/NodeConfigPanel';
import { EdgeConfigPanel } from './components/EdgeConfigPanel';
import { } from '@captify-io/core';
import { toast } from 'sonner';
import { apiClient } from '@captify-io/core';

function BuilderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const nodeId = searchParams.get('nodeId');

  const {
    model,
    isDirty,
    lastSavedAt,
    save,
    exportJSON,
    load,
    selectedNodeId,
    selectedEdgeId,
    setSelectedNode,
    setSelectedEdge,
  } = useOntology();

  const [loading, setLoading] = useState(true);
  const [availableNodes, setAvailableNodes] = useState<Array<{ id: string; label: string; type: string }>>([]);
  const [selectedNodeForSwitch, setSelectedNodeForSwitch] = useState<string>('');

  // Load available nodes for the dropdown
  useEffect(() => {
    const loadAvailableNodes = async () => {
      try {
        const result = await apiClient.run({
          service: "platform.dynamodb",
          operation: "scan",
          table: "core-ontology-node",
        });

        if (result.success && result.data) {
          const items = result.data.Items || result.data;
          const nodeList = Array.isArray(items) ? items : [];
          setAvailableNodes(nodeList.map((n: any) => ({
            id: n.id,
            label: n.label || n.type,
            type: n.type
          })));
        }
      } catch (error) {
        console.error('Failed to load nodes:', error);
      }
    };
    loadAvailableNodes();
  }, []);

  useEffect(() => {
    const loadOntology = async () => {
      setLoading(true);
      try {
        if (nodeId) {
          await load(nodeId);
        } else {
          await load();
        }
      } catch (error) {
        console.error('Failed to load ontology:', error);
      } finally {
        setLoading(false);
      }
    };
    loadOntology();
  }, [nodeId, load]);

  const handleSave = async () => {
    try {
      await save();
      toast.success('Ontology saved successfully!');
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Failed to save ontology');
    }
  };

  const handleNodeSwitch = (value: string) => {
    if (value && value !== nodeId) {
      router.push(`/ontology/ontology/builder?nodeId=${value}`);
    }
  };

  const handleExport = () => {
    const json = exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ontology-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBack = () => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push('/ontology/ontology');
      }
    } else {
      router.push('/ontology/ontology');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading ontology...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header Toolbar */}
      <div className="h-14 border-b flex items-center justify-between px-6 bg-slate-50 dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="h-9 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border" />
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Ontology Builder
          </h1>
          {isDirty && (
            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
              * Unsaved changes
            </span>
          )}
          <div className="w-px h-6 bg-border ml-2" />
          <Select value={nodeId || ''} onValueChange={handleNodeSwitch}>
            <SelectTrigger className="h-9 w-64 bg-white dark:bg-slate-800">
              <SelectValue placeholder="Search and select a node..." />
            </SelectTrigger>
            <SelectContent>
              {availableNodes.map((node) => (
                <SelectItem key={node.id} value={node.id}>
                  {node.label} ({node.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleExport} className="h-9">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button size="sm" onClick={handleSave} className="h-9 bg-purple-600 hover:bg-purple-700 text-white">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 transition-all ${(selectedNodeId || selectedEdgeId) ? 'mr-0' : ''}`}>
          <OntologyCanvas />
        </div>

        {/* Right Config Panel */}
        {selectedNodeId && (
          <div className="w-96 flex-shrink-0">
            <NodeConfigPanel
              nodeId={selectedNodeId}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        )}

        {selectedEdgeId && !selectedNodeId && (
          <div className="w-96 flex-shrink-0">
            <EdgeConfigPanel
              edgeId={selectedEdgeId}
              onClose={() => setSelectedEdge(null)}
            />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-8 border-t bg-muted/30 flex items-center justify-between px-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div>Ready</div>
          <div className="h-3 w-px bg-border" />
          <div>{model.nodes.length} nodes</div>
          <div className="h-3 w-px bg-border" />
          <div>{model.edges.length} relationships</div>
        </div>
        <div className="flex items-center gap-4">
          <div>
            Last saved: {lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : 'Never'}
          </div>
        </div>
      </div>
    </div>
  );
}

function BuilderPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <ReactFlowProvider>
        <OntologyProvider>
          <BuilderContent />
        </OntologyProvider>
      </ReactFlowProvider>
    </Suspense>
  );
}

export default BuilderPage;

export const dynamic = "force-dynamic";
