"use client";

import React, { useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@captify-io/core";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

export default function OntologySetupPage() {
  const [nodesStatus, setNodesStatus] = useState<'pending' | 'loading' | 'success' | 'error'>('pending');
  const [edgesStatus, setEdgesStatus] = useState<'pending' | 'loading' | 'success' | 'error'>('pending');
  const [nodesResult, setNodesResult] = useState<any>(null);
  const [edgesResult, setEdgesResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const createNodes = async () => {
    setNodesStatus('loading');
    setError('');

    try {
      const response = await fetch('/api/admin/ontology/create-app-nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create nodes');
      }

      setNodesResult(data);
      setNodesStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setNodesStatus('error');
    }
  };

  const createEdges = async () => {
    setEdgesStatus('loading');
    setError('');

    try {
      const response = await fetch('/api/admin/ontology/create-app-edges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create edges');
      }

      setEdgesResult(data);
      setEdgesStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setEdgesStatus('error');
    }
  };

  const createAll = async () => {
    await createNodes();
    await createEdges();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">App Management Ontology Setup</h1>
        <p className="text-muted-foreground">
          Create ontology nodes and edges for the app management system
        </p>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 mb-6">
        {/* Nodes Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {nodesStatus === 'pending' && <Circle className="h-5 w-5 text-muted-foreground" />}
                  {nodesStatus === 'loading' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                  {nodesStatus === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {nodesStatus === 'error' && <Circle className="h-5 w-5 text-destructive" />}
                  Ontology Nodes
                </CardTitle>
                <CardDescription>
                  Create nodes for app, app-member, app-role, and app-access-request
                </CardDescription>
              </div>
              <Button
                onClick={createNodes}
                disabled={nodesStatus === 'loading'}
                variant={nodesStatus === 'success' ? 'outline' : 'default'}
              >
                {nodesStatus === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {nodesStatus === 'success' ? 'Recreate Nodes' : 'Create Nodes'}
              </Button>
            </div>
          </CardHeader>
          {nodesResult && (
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-600">{nodesResult.message}</p>
                {nodesResult.nodes && (
                  <div className="space-y-1">
                    {nodesResult.nodes.map((node: any) => (
                      <div key={node.id} className="flex items-center justify-between text-sm border-l-2 border-blue-500 pl-3 py-1">
                        <div>
                          <span className="font-medium">{node.name}</span>
                          <span className="text-muted-foreground ml-2">({node.type})</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {node.existed ? 'Updated' : 'Created'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Edges Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {edgesStatus === 'pending' && <Circle className="h-5 w-5 text-muted-foreground" />}
                  {edgesStatus === 'loading' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                  {edgesStatus === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {edgesStatus === 'error' && <Circle className="h-5 w-5 text-destructive" />}
                  Ontology Edges
                </CardTitle>
                <CardDescription>
                  Create relationships between nodes
                </CardDescription>
              </div>
              <Button
                onClick={createEdges}
                disabled={edgesStatus === 'loading'}
                variant={edgesStatus === 'success' ? 'outline' : 'default'}
              >
                {edgesStatus === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {edgesStatus === 'success' ? 'Recreate Edges' : 'Create Edges'}
              </Button>
            </div>
          </CardHeader>
          {edgesResult && (
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-600">{edgesResult.message}</p>
                {edgesResult.edges && (
                  <div className="space-y-1">
                    {edgesResult.edges.map((edge: any) => (
                      <div key={edge.id} className="flex items-center justify-between text-sm border-l-2 border-purple-500 pl-3 py-1">
                        <div className="flex-1">
                          <span className="font-mono text-xs">{edge.relationship}</span>
                          <span className="text-muted-foreground ml-2">"{edge.label}"</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {edge.existed ? 'Updated' : 'Created'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Create All Button */}
      <div className="flex justify-center">
        <Button
          onClick={createAll}
          size="lg"
          disabled={nodesStatus === 'loading' || edgesStatus === 'loading'}
          className="min-w-[200px]"
        >
          {(nodesStatus === 'loading' || edgesStatus === 'loading') && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Create All
        </Button>
      </div>

      {/* Summary */}
      {nodesStatus === 'success' && edgesStatus === 'success' && (
        <Card className="mt-6 bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">✅ Setup Complete!</CardTitle>
            <CardDescription className="text-green-700">
              All ontology nodes and edges have been created successfully.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1 text-green-800">
              <p>• {nodesResult?.nodes?.length || 0} ontology nodes created</p>
              <p>• {edgesResult?.edges?.length || 0} ontology edges created</p>
              <p className="mt-4 font-medium">Next steps:</p>
              <ol className="list-decimal list-inside ml-2 space-y-1">
                <li>Build membership service</li>
                <li>Update access control logic</li>
                <li>Build app catalog UI</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
