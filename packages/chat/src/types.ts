/**
 * Chat Package Types
 * All type definitions for the @captify/chat package
 * Chat and agent domain types only
 */

// Chat Agent Types
export interface UserAgent {
  // DynamoDB keys
  pk: string; // "AGENT#{id}"
  sk: string; // "METADATA"

  // Core properties
  id: string;
  userId?: string; // Set for personal digital twins, null for specialized/application
  name: string; // Agent display name
  type: string; // 'personal' | 'policyAdvisor' | 'application' etc.
  role?: string; // User's organizational role (personal agents only)
  isDefault?: boolean; // Primary agent for user (personal agents only)

  // AWS Bedrock configuration
  bedrockAgentId: string; // AWS Bedrock Agent ID
  bedrockAliasId: string; // Agent alias version
  knowledgeBaseId?: string; // AWS Bedrock Knowledge Base ID

  // Agent configuration
  instructions: string; // Personalized/specialized behavior instructions
  profileData?: Record<string, any>; // Profile from interview (personal agents only)
  s3FolderPath: string; // S3 path for knowledge base
  allowedUserRoles?: string[]; // For specialized agents - access control
  isPublic?: boolean; // Available to all users vs role-restricted
  memoryEnabled: boolean; // Conversation persistence
  isActive: boolean;
  isProfileComplete?: boolean; // Whether user completed interview
  maintainerId?: string; // Admin who maintains specialized agents

  // Audit fields
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string

  // GSI keys for querying
  gsi1Pk: string; // "USER#{userId}" for personal agents
  gsi1Sk: string; // "AGENT#{type}#{createdAt}"
  gsi2Pk: string; // "TYPE#{type}" for filtering by agent type
  gsi2Sk: string; // "ACTIVE#{isActive}#{createdAt}"
}

export interface AgentCreationJob {
  // DynamoDB keys
  pk: string; // "JOB#{jobId}"
  sk: string; // "STATUS"

  // Core properties
  id: string; // Job UUID
  userId: string; // User creating the agent
  agentType: string; // Type of agent being created
  status:
    | "pending"
    | "creatingKb"
    | "creatingAgent"
    | "deploying"
    | "completed"
    | "failed";
  progress: number; // 0-100 percentage
  currentStep: string; // Human-readable current step

  // Created resources
  knowledgeBaseId?: string; // Created knowledge base ID
  agentId?: string; // Created agent ID
  aliasId?: string; // Created alias ID
  error?: string; // Error message if failed

  // Audit fields
  createdAt: string; // ISO date string
  completedAt?: string; // ISO date string when finished
  ttl: number; // Unix timestamp for DynamoDB TTL
}

// Chat Thread and Message Types
export interface ChatThread {
  id: string;
  userId: string;
  agentId: string;
  title: string;
  isPinned?: boolean;
  lastMessageAt: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  metadata?: {
    agentId?: string;
    model?: string;
    tokens?: number;
    cost?: number;
  };
}

export interface ChatSession {
  threadId: string;
  agentId: string;
  userId: string;
  startedAt: string;
  lastActivityAt: string;
  isActive: boolean;
}

export interface MessageData {
  id: string;
  threadId: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
}

// AI Agent Configuration Types
export interface AiAgentConfig {
  agentId: string;
  bedrockAgentId?: string;
  bedrockAliasId?: string;
  bedrockRegion?: string;
  model: "claude3Sonnet" | "claude3Haiku" | "claude3Opus" | "gpt4" | "custom";
  instructions: string;
  maxOutputTokens?: number;
  temperature?: number;
  capabilities: AgentCapability[];
  knowledgeBases?: string[];
  tools?: AgentTool[];
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  type: "function" | "knowledgeBase" | "api";
  config: Record<string, any>;
}
