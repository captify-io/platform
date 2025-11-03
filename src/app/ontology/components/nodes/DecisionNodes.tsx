/**
 * Decision Node Components
 * Nodes for action logic and flow control
 */

import React from 'react';
import type { NodeProps } from '@xyflow/react';
import { GitBranch, Brain, Package, Database, Layers, FileText } from 'lucide-react';
import { Rectangle, Decision, Oval, Parallelogram, Group, Note } from '../shapes';

// DMN Decision Elements

export function DecisionNode(props: NodeProps) {
  return <Decision {...props} icon={GitBranch} color="bg-blue-500" />;
}

export function BkmNode(props: NodeProps) {
  return <Rectangle {...props} icon={Brain} color="bg-purple-500" />;
}

export function KnowledgeSourceNode(props: NodeProps) {
  return <Parallelogram {...props} icon={Package} color="bg-amber-500" />;
}

export function InputDataNode(props: NodeProps) {
  return <Oval {...props} icon={Database} color="bg-green-500" />;
}

export function DecisionServiceNode(props: NodeProps) {
  return <Rectangle {...props} icon={Layers} color="bg-cyan-500" />;
}

export function GroupNode(props: NodeProps) {
  return <Group {...props} />;
}

export function TextAnnotationNode(props: NodeProps) {
  return <Note {...props} icon={FileText} />;
}
