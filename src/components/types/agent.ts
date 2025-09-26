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

export interface AgentResponse {
  message: AgentMessage;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AgentThread {
  id: string;
  title: string;
  messages: AgentMessage[];
  settings: AgentSettings;
  createdAt: number;
  updatedAt: number;
  userId: string;
  // Captify-core specific fields
  tenantId?: string;
  app?: string;
  status?: 'active' | 'archived' | 'deleted';
  // AI provider info
  provider?: string;
  model?: string;
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
    [key: string]: any;
  };
}