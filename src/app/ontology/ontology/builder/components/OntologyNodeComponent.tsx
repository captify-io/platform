"use client";

/**
 * Custom Ontology Node Component for React Flow
 * Uses common shape components from designer
 */

import React, { memo, useState, useEffect } from 'react';
import { NodeProps } from '@xyflow/react';
import { Database, Download, Network, X } from 'lucide-react';
import { OntologyNode } from '../context/OntologyContext';
import { Rectangle } from '../../../components/shapes';

interface OntologyNodeComponentProps extends NodeProps<OntologyNode> {
  onLoadData?: (nodeId: string) => Promise<void>;
  onLoadRelationships?: (nodeId: string) => Promise<void>;
}

export const OntologyNodeComponent = memo(({ data, selected, id, onLoadData, onLoadRelationships }: OntologyNodeComponentProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [relationshipsLoading, setRelationshipsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-dismiss error after 3.5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLoadData = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onLoadData || !id || dataLoading) return;

    setDataLoading(true);
    setError(null);

    try {
      await onLoadData(id);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setDataLoading(false);
    }
  };

  const handleLoadRelationships = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onLoadRelationships || !id || relationshipsLoading) return;

    setRelationshipsLoading(true);
    setError(null);

    try {
      await onLoadRelationships(id);
    } catch (err: any) {
      setError(err.message || 'Failed to load relationships');
    } finally {
      setRelationshipsLoading(false);
    }
  };

  // Convert color class to actual color
  const getColorClass = (color?: string) => {
    if (!color) return 'bg-slate-600';
    return color;
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Error Message - Shows above node */}
      {error && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-64 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-2 shadow-lg z-20 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-2">
            <div className="flex-1 text-xs text-red-900 dark:text-red-100">
              {error}
            </div>
            <button
              onClick={() => setError(null)}
              className="flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-100"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Use Rectangle shape from designer */}
      <Rectangle
        data={data}
        icon={Database}
        color={getColorClass(data.color)}
        selected={selected}
      />

      {/* Node Toolbar - Show on hover for non-data nodes */}
      {!data.properties?.isDataItem && isHovered && (
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex gap-1 bg-card border rounded-md shadow-lg p-1 z-10 animate-in fade-in duration-150">
          <button
            onClick={handleLoadData}
            disabled={dataLoading}
            className={`p-1.5 hover:bg-accent rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              dataLoading ? 'bg-blue-100 dark:bg-blue-950' : ''
            }`}
            title="Load data from DynamoDB"
          >
            {dataLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            )}
          </button>
          <div className="w-px bg-border" />
          <button
            onClick={handleLoadRelationships}
            disabled={relationshipsLoading}
            className={`p-1.5 hover:bg-accent rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              relationshipsLoading ? 'bg-purple-100 dark:bg-purple-950' : ''
            }`}
            title="Show relationships"
          >
            {relationshipsLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Network className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            )}
          </button>
        </div>
      )}
    </div>
  );
});

OntologyNodeComponent.displayName = 'OntologyNodeComponent';
