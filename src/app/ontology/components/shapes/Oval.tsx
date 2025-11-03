/**
 * Oval Shape
 * Elliptical node (for Source, Dataset)
 */

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { LucideIcon } from 'lucide-react';

interface OvalProps {
  data: { label: string; [key: string]: any };
  icon: LucideIcon;
  color: string;
  selected?: boolean;
}

export function Oval({ data, icon: Icon, color, selected }: OvalProps) {
  return (
    <div
      className={`rounded-full border-2 bg-background shadow-sm transition-all min-w-[160px] ${
        selected ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'
      }`}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-primary" />

      <div className="px-4 py-2 flex items-center gap-2">
        <div className={`p-1 rounded ${color} bg-opacity-20 flex-shrink-0`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="font-medium text-sm flex-1 truncate">{data.label}</div>
      </div>

      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-primary" />
    </div>
  );
}
