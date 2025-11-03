/**
 * Base Designer Node
 * Common styling and structure for all designer nodes
 */

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { LucideIcon } from 'lucide-react';

interface BaseNodeProps {
  data: {
    label: string;
    description?: string;
    [key: string]: any;
  };
  icon: LucideIcon;
  color: string; // Tailwind color class like 'bg-orange-500'
  selected?: boolean;
}

export function BaseNode({ data, icon: Icon, color, selected }: BaseNodeProps) {
  // Extract the color name from the class (e.g., 'bg-orange-500' -> 'orange')
  const colorName = color.match(/bg-(\w+)-/)?.[1] || 'gray';

  return (
    <div
      className={`rounded-lg border-2 bg-background shadow-sm transition-all min-w-[160px] ${
        selected
          ? 'border-primary shadow-md'
          : 'border-border hover:border-primary/50'
      }`}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 !bg-primary"
      />

      {/* Node content */}
      <div className="px-2 py-1.5 flex items-center gap-2">
        <div className={`p-1 rounded ${color} bg-opacity-20 flex-shrink-0`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="font-medium text-sm flex-1 truncate">{data.label}</div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 !bg-primary"
      />
    </div>
  );
}
