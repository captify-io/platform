/**
 * Agent types for AI/LLM interactions and thread management
 */

import type { Core } from "./core";

// ===== DATABASE ENTITIES (extend Core) =====

/**
 * AgentThread - Represents a conversation thread in DynamoDB
 * This will create an AgentThread table via the installer
 */
export interface AgentThread extends Core {
  userId: string; // UUID of the user who owns this thread
  title: string; // Human-readable thread title
  model: string; // AI model used (e.g., 'gpt-4o', 'claude-3-sonnet')
  provider: 'openai' | 'anthropic' | 'bedrock'; // AI provider
  settings: AgentSettings; // Thread-specific AI settings
  metadata: AgentThreadMetadata; // Usage statistics and thread info
  messages: AgentMessage[]; // Array of messages in this thread
}

/**
 * AgentSettings - AI model configuration stored with threads
 * This is embedded in AgentThread, not a separate table
 */
export interface AgentSettings {
  model: string; // Model identifier
  provider: 'openai' | 'anthropic' | 'bedrock'; // AI provider
  temperature: number; // Creativity/randomness (0-2)
  maxTokens: number; // Maximum output tokens
  systemPrompt?: string; // Custom system instructions
  tools?: string[]; // Enabled tool names
  agentId?: string; // Bedrock agent ID (if using Bedrock agents)
  agentAliasId?: string; // Bedrock agent alias ID
}

/**
 * AgentThreadMetadata - Usage tracking and thread statistics
 * This is embedded in AgentThread, not a separate table
 */
export interface AgentThreadMetadata {
  tokenUsage: {
    input: number; // Total input tokens used
    output: number; // Total output tokens used
    total: number; // Total tokens (input + output)
  };
  lastActivity: string; // ISO timestamp of last message
  messageCount: number; // Number of messages in thread
}

/**
 * AgentMessage - Individual message within a thread
 * This is embedded in AgentThread as an array, not a separate table
 */
export interface AgentMessage {
  id: string; // Unique message ID
  threadId: string; // Reference to parent thread
  role: 'user' | 'assistant' | 'system' | 'tool'; // Message type
  content: string; // Message content (stored as string, converted as needed)
  tokenUsage?: {
    input: number; // Tokens used for this message input
    output: number; // Tokens used for this message output
  };
  tools?: AgentTool[]; // Tools used in this message
  createdAt?: string; // ISO timestamp when message was created
}

/**
 * AgentTool - Tool usage information within messages
 * This is embedded in AgentMessage, not a separate table
 */
export interface AgentTool {
  type: 'code' | 'chart' | 'image' | 'file' | 'search' | 'custom';
  name: string; // Tool name
  input: any; // Tool input parameters
  output: any; // Tool output/result
}

// ===== API REQUEST/RESPONSE TYPES =====

/**
 * AgentRequest - API request structure for agent operations
 */
export interface AgentRequest {
  operation: 
    | 'createThread'
    | 'getThreads'
    | 'getThread'
    | 'sendMessage'
    | 'streamMessage'
    | 'deleteThread'
    | 'updateThread'
    | 'getTokenUsage'
    | 'updateSettings';
  data?: any; // Operation-specific data
  schema?: string; // Database schema name
  app?: string; // App context
}

/**
 * AgentResponse - Standard API response structure
 */
export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// ===== USAGE TRACKING TYPES =====

/**
 * AgentUsage - Token usage tracking for billing/limits
 */
export interface AgentUsage {
  period: 'day' | 'week' | 'month' | 'year';
  usage: {
    input: number;
    output: number;
    total: number;
  };
  threadCount: number;
  startDate: string;
}

// ===== STREAMING TYPES =====

/**
 * AgentStreamChunk - Real-time streaming message chunk
 */
export interface AgentStreamChunk {
  type: 'start' | 'delta' | 'end' | 'error';
  content?: string;
  error?: string;
  metadata?: {
    tokenUsage?: {
      input: number;
      output: number;
    };
  };
}

// Types are exported via interface declarations above
// No need for additional export statements