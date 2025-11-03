/**
 * Group Shape
 * Resizable container for grouping nodes (renamed from Container)
 */

import React from 'react';
import { NodeResizer } from '@xyflow/react';
import { Box } from 'lucide-react';

interface GroupProps {
  data: { label: string; isHovered?: boolean; [key: string]: any };
  selected?: boolean;
  id: string;
}

export function Group({ data, selected, id }: GroupProps) {
  const isHovered = data.isHovered;

  return (
    <>
      <NodeResizer
        minWidth={250}
        minHeight={150}
        isVisible={selected}
        lineClassName="!border-blue-500"
        handleClassName="!h-3 !w-3 !bg-blue-500 !rounded-sm"
      />

      {/* Group title - outside the box, top left */}
      <div
        className="absolute -top-6 left-0 flex items-center gap-1.5 px-2 py-0.5 rounded-t bg-blue-500/10 border border-blue-500/30 border-b-0"
        style={{ pointerEvents: 'all' }}
      >
        <Box className="h-3 w-3 text-blue-500" />
        <span className="text-xs font-medium text-blue-600">{data.label || 'Group'}</span>
      </div>

      {/* Group box - empty and resizable */}
      <div
        className={`rounded-lg border-2 border-dashed transition-all h-full w-full ${
          isHovered
            ? 'bg-blue-500/20 border-blue-500 shadow-xl ring-2 ring-blue-500/50'
            : selected
            ? 'bg-blue-500/10 border-blue-500 shadow-lg'
            : 'bg-blue-500/5 border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/8'
        }`}
      />
    </>
  );
}
