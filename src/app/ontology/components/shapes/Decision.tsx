/**
 * Decision Shape
 * Rectangle with title and description (DMN Decision node)
 */

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { LucideIcon } from 'lucide-react';

interface DecisionProps {
  data: {
    label: string;
    description?: string;
    [key: string]: any;
  };
  icon: LucideIcon;
  color: string;
  selected?: boolean;
}

export function Decision({ data, icon: Icon, color, selected }: DecisionProps) {
  return (
    <div
      className={`border-2 bg-background shadow-sm transition-all min-w-[200px] max-w-[300px] ${
        selected ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'
      }`}
      style={{
        minHeight: '100px',
      }}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-primary" />

      <div className="px-3 py-3 flex flex-col gap-2 h-full">
        {/* Icon and Title Row */}
        <div className="flex items-center gap-2">
          <div className={`p-1 ${color} bg-opacity-20 flex-shrink-0 rounded`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="font-semibold text-sm leading-tight">{data.label || 'Decision'}</div>
        </div>

        {/* Description */}
        {data.description && (
          <div className="text-xs text-muted-foreground leading-relaxed">
            {data.description}
          </div>
        )}

        {/* Placeholder when no description */}
        {!data.description && (
          <div className="text-xs text-muted-foreground/50 italic">
            Here is where the decision info goes
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-primary" />
    </div>
  );
}
