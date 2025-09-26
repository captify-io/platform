// AI SDK compatible types for Agent functionality
export interface AgentSettings {
  // Model configuration
  model: string;
  provider: 'openai' | 'anthropic' | 'bedrock';
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;

  // System configuration
  systemPrompt?: string;
  tools?: AgentTool[];

  // Stream settings
  stream?: boolean;

  // Safety settings
  maxRetries?: number;
  timeout?: number;
}

// AI SDK compatible message interface
export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | Array<{
    type: 'text' | 'image';
    text?: string;
    image?: string;
  }>;
  name?: string; // For tool messages
  tool_call_id?: string; // For tool responses
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  timestamp?: number;
  createdAt?: number;
  threadId?: string;
  metadata?: Record<string, any>;
  // Token usage tracking
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  // File attachments
  attachments?: AgentAttachment[];
}

// AI SDK compatible tool interface
export interface AgentTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters?: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

// For internal tool execution tracking
export interface AgentToolCall {
  id: string;
  name: string;
  type: string;
  input?: any;
  output?: any;
  status?: 'pending' | 'completed' | 'error';
}

// File attachment interface
export interface AgentAttachment {
  id: string;
  type: 'file' | 'image' | 'document';
  name: string;
  url: string;
  size: number;
  mimeType: string;
  s3Key?: string;
  bucket?: string;
}

export interface AgentResponse {
  message: AgentMessage;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Agent definition for filtering
export interface CaptifyAgent {
  id: string;
  name: string;
  description: string;
  type: 'bedrock' | 'openai' | 'anthropic' | 'custom';
  model: string;
  provider: string;
  settings: AgentSettings;
  capabilities?: string[];
  icon?: string;
}

// Project definition for filtering
export interface CaptifyProject {
  id: string;
  name: string;
  description: string;
  tenantId: string;
  ownerId: string;
  status: 'active' | 'archived' | 'completed';
  createdAt: number;
  updatedAt: number;
  members?: string[];
  tags?: string[];
}

// DynamoDB Thread table structure
export interface AgentThread {
  // Primary key
  id: string; // PK: thread#{threadId}
  userId: string; // SK: user#{userId}

  // Thread details
  title: string; // GSI: title-index for searchability
  messages: AgentMessage[];
  settings: AgentSettings;

  // Timestamps (as numbers for DynamoDB)
  createdAt: number;
  updatedAt: number;

  // Captify-core specific fields
  tenantId?: string;
  app: string; // e.g., "core"
  status?: 'active' | 'archived' | 'deleted';

  // AI provider info
  provider: string;
  model: string;

  // Filtering properties
  agentId?: string; // Reference to CaptifyAgent for filtering
  projectId?: string; // Reference to CaptifyProject for filtering
  threadType: 'chat' | 'agent' | 'project'; // For icon selection and filtering

  // Thread metadata
  metadata?: {
    messageCount?: number;
    lastMessageAt?: number;
    tokenUsage?: {
      total: number;
      input: number;
      output: number;
    };
    tags?: string[];
    summary?: string;
    agentName?: string; // Cache agent name for display
    projectName?: string; // Cache project name for display
    [key: string]: any;
  };

  // DynamoDB attributes
  entityType: 'thread'; // For type filtering
  ttl?: number; // Optional TTL for auto-cleanup
}

// Token usage tracking
export interface AgentTokenUsage {
  userId: string;
  period: string; // e.g., "2025-01"
  usage: {
    input: number;
    output: number;
    total: number;
  };
  limit: number;
  updatedAt: number;
}

// Service operation types
export interface CreateThreadInput {
  title?: string;
  model: string;
  provider: string;
  settings: AgentSettings;
  userId: string;
  tenantId?: string;
  app: string;
}

export interface SendMessageInput {
  threadId: string;
  message: string;
  settings: AgentSettings;
  userId: string;
  attachments?: AgentAttachment[];
}

export interface UpdateThreadInput {
  threadId: string;
  userId: string;
  updates: Partial<Pick<AgentThread, 'title' | 'settings' | 'status' | 'metadata'>>;
}