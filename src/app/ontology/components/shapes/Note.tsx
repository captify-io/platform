/**
 * Note Shape
 * Resizable sticky note for annotations
 */

import React, { useState, useCallback } from 'react';
import { NodeResizer } from '@xyflow/react';
import { StickyNote, type LucideIcon } from 'lucide-react';

interface NoteProps {
  data: { label: string; text?: string; [key: string]: any };
  selected?: boolean;
  id: string;
  icon?: LucideIcon;
}

export function Note({ data, selected, id, icon }: NoteProps) {
  const Icon = icon || StickyNote;
  const [text, setText] = useState(data.text || '');

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // TODO: Update node data in context
  }, []);

  return (
    <>
      <NodeResizer
        minWidth={150}
        minHeight={100}
        isVisible={selected}
        lineClassName="!border-yellow-500"
        handleClassName="!h-3 !w-3 !bg-yellow-500 !rounded-sm"
      />

      <div
        className={`h-full w-full bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded shadow-md transition-all ${
          selected ? 'shadow-lg ring-2 ring-yellow-500/50' : ''
        }`}
        style={{ padding: '8px' }}
      >
        <div className="flex items-center gap-1.5 mb-2 pb-1 border-b border-yellow-300 dark:border-yellow-700">
          <Icon className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
          <div className="text-xs font-medium text-yellow-700 dark:text-yellow-300 truncate">
            {data.label || 'Note'}
          </div>
        </div>

        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Type your note here..."
          className="w-full h-[calc(100%-32px)] bg-transparent border-none outline-none resize-none text-xs text-yellow-900 dark:text-yellow-100 placeholder:text-yellow-400"
          style={{ fontFamily: 'inherit' }}
        />
      </div>
    </>
  );
}
