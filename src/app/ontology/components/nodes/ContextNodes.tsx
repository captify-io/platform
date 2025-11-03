/**
 * Context Node Components
 * Nodes for People/Process/Technology context
 */

import React from 'react';
import { BaseNode } from './BaseNode';
import { User, Workflow, Server, FileText } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';

export function PersonNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      icon={User}
      color="bg-green-500"
    />
  );
}

export function ProcessNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      icon={Workflow}
      color="bg-green-500"
    />
  );
}

export function SystemNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      icon={Server}
      color="bg-green-500"
    />
  );
}

export function PolicyNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      icon={FileText}
      color="bg-green-500"
    />
  );
}
