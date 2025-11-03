/**
 * Default Node Component
 * Fallback component for nodes without specific implementations
 * Uses BaseNode with dynamic icon and color based on category
 */

import React from 'react';
import { BaseNode } from './BaseNode';
import * as Icons from 'lucide-react';
import type { NodeProps } from '@xyflow/react';

// Category color mapping
const categoryColors: Record<string, string> = {
  core: 'bg-slate-500',
  discovery: 'bg-pink-500',
  decision: 'bg-blue-500',
  process: 'bg-blue-500',
  logic: 'bg-indigo-500',
  people: 'bg-purple-500',
  data: 'bg-green-500',
  technology: 'bg-orange-500',
  tools: 'bg-slate-500',
  knowledge: 'bg-amber-500',
  risk: 'bg-red-500',
  product: 'bg-cyan-500',
  financial: 'bg-emerald-500',
  supply_chain: 'bg-teal-500',
  governance: 'bg-violet-500',
  metrics: 'bg-fuchsia-500',
  timeline: 'bg-rose-500',
  development: 'bg-sky-500',
};

export function DefaultNode(props: NodeProps) {
  const category = props.data?.category || 'process';
  const icon = props.data?.icon || 'Circle';

  // @ts-ignore - dynamic icon lookup
  const IconComponent = Icons[icon] || Icons.Circle;
  const color = categoryColors[category] || 'bg-gray-500';

  return (
    <BaseNode
      {...props}
      icon={IconComponent}
      color={color}
    />
  );
}
