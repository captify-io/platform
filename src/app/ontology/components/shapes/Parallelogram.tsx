/**
 * Parallelogram Shape
 * Slanted rectangular node (for Knowledge, Data Product)
 */

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { LucideIcon } from 'lucide-react';

interface ParallelogramProps {
  data: { label: string; [key: string]: any };
  icon: LucideIcon;
  color: string;
  selected?: boolean;
}

export function Parallelogram({ data, icon: Icon, color, selected }: ParallelogramProps) {
  return (
    <div className="relative min-w-[160px]" style={{ paddingLeft: '12px', paddingRight: '12px' }}>
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-primary" style={{ left: '6px' }} />

      <div
        className="relative"
        style={{
          clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)',
        }}
      >
        {/* Border layer */}
        <div
          className={`absolute inset-0 transition-all ${
            selected ? 'bg-primary' : 'bg-border hover:bg-primary/50'
          }`}
          style={{
            clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)',
          }}
        />

        {/* Content layer with inset border effect */}
        <div
          className="relative bg-background shadow-sm"
          style={{
            clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)',
            margin: '2px',
            padding: '6px 12px',
          }}
        >
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded ${color} bg-opacity-20 flex-shrink-0`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="font-medium text-sm flex-1 truncate">{data.label}</div>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-primary" style={{ right: '6px' }} />
    </div>
  );
}
