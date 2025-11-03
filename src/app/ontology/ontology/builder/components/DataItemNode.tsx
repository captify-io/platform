"use client";

/**
 * Circular Data Item Node Component
 * Represents individual data items from DynamoDB tables
 */

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Circle } from 'lucide-react';
import { OntologyNode } from '../context/OntologyContext';

export const DataItemNode = memo(({ data, selected }: NodeProps<OntologyNode>) => {
  return (
    <div
      className={`
        w-24 h-24 rounded-full flex items-center justify-center
        border-2 transition-all shadow-md
        ${selected ? 'border-blue-500 shadow-lg shadow-blue-500/30 scale-110' : 'border-blue-300 dark:border-blue-700'}
        bg-gradient-to-br from-blue-400 to-blue-600
        hover:shadow-xl hover:scale-105
      `}
    >
      {/* Connection Handles - all around the circle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-blue-300 !border-2 !border-white dark:!border-slate-800 opacity-0 hover:opacity-100"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-blue-300 !border-2 !border-white dark:!border-slate-800 opacity-0 hover:opacity-100"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-blue-300 !border-2 !border-white dark:!border-slate-800 opacity-0 hover:opacity-100"
      />
      <Handle
        type="target"
        position={Position.Right}
        className="!w-2 !h-2 !bg-blue-300 !border-2 !border-white dark:!border-slate-800 opacity-0 hover:opacity-100"
      />

      {/* Node Content */}
      <div className="text-center px-2">
        <Circle className="w-6 h-6 text-white mx-auto mb-1" />
        <div className="text-xs font-semibold text-white truncate max-w-[80px]">
          {data.label}
        </div>
      </div>

      {/* Source Handles */}
      <Handle
        type="source"
        position={Position.Top}
        className="!w-2 !h-2 !bg-blue-500 !border-2 !border-white dark:!border-slate-800 opacity-0 hover:opacity-100"
      />
      <Handle
        type="source"
        position={Position.Left}
        className="!w-2 !h-2 !bg-blue-500 !border-2 !border-white dark:!border-slate-800 opacity-0 hover:opacity-100"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-blue-500 !border-2 !border-white dark:!border-slate-800 opacity-0 hover:opacity-100"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-blue-500 !border-2 !border-white dark:!border-slate-800 opacity-0 hover:opacity-100"
      />
    </div>
  );
});

DataItemNode.displayName = 'DataItemNode';
