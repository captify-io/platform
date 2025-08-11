/**
 * AWS Bedrock Integration
 *
 * Provides Bedrock Agent client and configuration utilities.
 */

import { BedrockAgentClient } from "@aws-sdk/client-bedrock-agent";

// Initialize Bedrock Agent client
export const bedrockAgentClient = new BedrockAgentClient({
  region: process.env.REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

// Foundation Model Display Names
export const FOUNDATION_MODEL_DISPLAY_NAMES = {
  "anthropic.claude-3-sonnet-20240229-v1:0": "Claude 3 Sonnet",
  "anthropic.claude-3-haiku-20240307-v1:0": "Claude 3 Haiku",
  "anthropic.claude-3-opus-20240229-v1:0": "Claude 3 Opus",
  "anthropic.claude-instant-v1": "Claude Instant",
  "anthropic.claude-v2": "Claude v2",
  "anthropic.claude-v2:1": "Claude v2.1",
  "amazon.titan-text-lite-v1": "Titan Text Lite",
  "amazon.titan-text-express-v1": "Titan Text Express",
  "amazon.titan-text-premier-v1:0": "Titan Text Premier",
  "meta.llama2-13b-chat-v1": "Llama 2 13B Chat",
  "meta.llama2-70b-chat-v1": "Llama 2 70B Chat",
  "cohere.command-text-v14": "Command",
  "cohere.command-light-text-v14": "Command Light",
} as const;

// Foundation Models list for dropdowns/selects
export const FOUNDATION_MODELS = Object.keys(FOUNDATION_MODEL_DISPLAY_NAMES);

// Agent Capabilities
export const AGENT_CAPABILITIES = [
  {
    id: "text-generation",
    name: "Text Generation",
    description: "Generate human-like text responses",
  },
  {
    id: "code-generation",
    name: "Code Generation",
    description: "Generate and review code",
  },
  {
    id: "data-analysis",
    name: "Data Analysis",
    description: "Analyze and interpret data",
  },
  {
    id: "search-retrieval",
    name: "Search & Retrieval",
    description: "Search and retrieve information",
  },
  {
    id: "task-automation",
    name: "Task Automation",
    description: "Automate repetitive tasks",
  },
  {
    id: "api-integration",
    name: "API Integration",
    description: "Integrate with external APIs",
  },
] as const;

// Default Agent Configuration
export interface DefaultAgentConfig {
  agentName: string;
  description: string;
  instruction: string;
  foundationModel: string;
  capabilities: string[];
}

/**
 * Get default agent configuration for an application
 */
export function getDefaultAgentConfig(appAlias: string): DefaultAgentConfig {
  return {
    agentName: `${appAlias}-agent`,
    description: `AI Agent for ${appAlias} application`,
    instruction: `You are an AI assistant for the ${appAlias} application. Help users with their tasks, provide information, and assist with application-specific workflows. Be helpful, accurate, and professional in your responses.`,
    foundationModel: "anthropic.claude-3-sonnet-20240229-v1:0",
    capabilities: ["text-generation", "search-retrieval"],
  };
}

// Agent Status Types
export type AgentStatus =
  | "CREATING"
  | "PREPARING"
  | "PREPARED"
  | "NOT_PREPARED"
  | "DELETING"
  | "FAILED"
  | "UPDATING"
  | "VERSIONING";

export type AgentAliasStatus =
  | "CREATING"
  | "PREPARED"
  | "FAILED"
  | "UPDATING"
  | "DELETING";

// Utility functions for agent management
export function isAgentReady(status: AgentStatus): boolean {
  return status === "PREPARED";
}

export function isAgentAliasReady(status: AgentAliasStatus): boolean {
  return status === "PREPARED";
}

export function getAgentStatusColor(status: AgentStatus): string {
  switch (status) {
    case "PREPARED":
      return "green";
    case "CREATING":
    case "PREPARING":
    case "UPDATING":
    case "VERSIONING":
      return "yellow";
    case "FAILED":
      return "red";
    case "DELETING":
      return "gray";
    case "NOT_PREPARED":
      return "orange";
    default:
      return "gray";
  }
}

export function getAgentStatusLabel(status: AgentStatus): string {
  switch (status) {
    case "PREPARED":
      return "Ready";
    case "CREATING":
      return "Creating";
    case "PREPARING":
      return "Preparing";
    case "UPDATING":
      return "Updating";
    case "VERSIONING":
      return "Versioning";
    case "FAILED":
      return "Failed";
    case "DELETING":
      return "Deleting";
    case "NOT_PREPARED":
      return "Not Prepared";
    default:
      return "Unknown";
  }
}
