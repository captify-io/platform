/**
 * Discovery Node Components
 * Nodes for understanding the problem
 */

import React from 'react';
import { BaseNode } from './BaseNode';
import { AlertCircle, TrendingUp, Lightbulb, Eye } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';

export function PainPointNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      icon={AlertCircle}
      color="bg-orange-500"
    />
  );
}

export function OpportunityNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      icon={TrendingUp}
      color="bg-orange-500"
    />
  );
}

export function HypothesisNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      icon={Lightbulb}
      color="bg-orange-500"
    />
  );
}

export function InsightNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      icon={Eye}
      color="bg-orange-500"
    />
  );
}
