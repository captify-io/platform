/**
 * Rectangle Shape
 * Standard rectangular node (for Decision, Rule, Task)
 */

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { LucideIcon } from 'lucide-react';

interface RectangleProps {
  data: { label: string; [key: string]: any };
  icon: LucideIcon;
  color: string;
  selected?: boolean;
}

export function Rectangle({ data, icon: Icon, color, selected }: RectangleProps) {
  return (
    <div
      className={`rounded-lg border-2 bg-background shadow-sm transition-all min-w-[160px] ${
        selected ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'
      }`}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-primary" />

      <div className="px-2 py-1.5 flex items-center gap-2">
        <div className={`p-1 rounded ${color} bg-opacity-20 flex-shrink-0`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="font-medium text-sm flex-1 truncate">{data.label}</div>
      </div>

      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-primary" />
    </div>
  );
}
