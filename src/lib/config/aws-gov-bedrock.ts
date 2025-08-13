/**
 * AWS GovCloud Bedrock Configuration
 * This file contains the available models and settings for AWS Gov environment
 */

export interface BedrockAgentConfig {
  name: string;
  description?: string;
  foundationModel: string;
  instructions: string;
  serviceRole?: string;
  guardrails?: {
    name?: string;
    version?: string;
  };
  knowledgeBases?: string[];
  actionGroups?: ActionGroup[];
}

export interface ActionGroup {
  name: string;
  description: string;
  state: "ENABLED" | "DISABLED";
}

// Available Foundation Models in AWS GovCloud
export const GOV_FOUNDATION_MODELS = {
  // Amazon Nova Models
  "amazon.nova-pro-v1:0": "Nova Pro 1.0",
  "amazon.nova-lite-v1:0": "Nova Lite 1.0",
  "amazon.nova-micro-v1:0": "Nova Micro 1.0",

  // Anthropic Claude Models
  "anthropic.claude-3-haiku-20240307-v1:0": "Claude 3 Haiku v1",
  "anthropic.claude-3-5-sonnet-20241022-v2:0": "Claude 3.5 Sonnet v7",
  "anthropic.claude-3-7-sonnet-20241022-v1:0": "Claude 3.7 Sonnet v7",
} as const;

export type AwsGovFoundationModel = keyof typeof GOV_FOUNDATION_MODELS;

// Default Service Role for AWS Gov
export const DEFAULT_SERVICE_ROLE =
  "AmazonBedrockExecutionRoleForAgents_FL86ZF8H2B9";

// Agent naming constraints for AWS Gov
export const AGENT_NAME_CONSTRAINTS = {
  validChars: /^[a-zA-Z0-9_-]+$/,
  maxLength: 100,
  minLength: 1,
};

// Instruction constraints
export const INSTRUCTION_CONSTRAINTS = {
  minLength: 40,
  maxLength: 4000, // Typical AWS limit
};

// Description constraints
export const DESCRIPTION_CONSTRAINTS = {
  maxLength: 200,
};

// Default agent configurations for different types
export const DEFAULT_AGENT_CONFIGS: Record<
  string,
  Partial<BedrockAgentConfig>
> = {
  personal: {
    foundationModel: "anthropic.claude-3-5-sonnet-20241022-v2:0", // Claude 3.5 Sonnet for personal agents
    instructions:
      "You are a personal AI assistant that helps with daily tasks and questions. Be helpful, accurate, and professional in your responses.",
    serviceRole: DEFAULT_SERVICE_ROLE,
  },
  "policy-advisor": {
    foundationModel: "anthropic.claude-3-5-sonnet-20241022-v2:0", // Claude 3.5 Sonnet for complex policy analysis
    instructions:
      "You are a policy advisor AI that helps with policy analysis, compliance guidance, and regulatory questions. Provide accurate, well-researched responses based on official documentation and policies.",
    serviceRole: DEFAULT_SERVICE_ROLE,
  },
  "technical-writer": {
    foundationModel: "anthropic.claude-3-haiku-20240307-v1:0", // Claude 3 Haiku for faster technical writing
    instructions:
      "You are a technical writing assistant that helps create clear, concise documentation. Focus on clarity, accuracy, and proper technical writing standards.",
    serviceRole: DEFAULT_SERVICE_ROLE,
  },
  "data-analyst": {
    foundationModel: "amazon.nova-pro-v1:0", // Nova Pro for data analysis tasks
    instructions:
      "You are a data analysis assistant that helps with data interpretation, statistical analysis, and reporting. Provide clear insights and actionable recommendations.",
    serviceRole: DEFAULT_SERVICE_ROLE,
  },
  "quality-assurance": {
    foundationModel: "anthropic.claude-3-haiku-20240307-v1:0", // Claude 3 Haiku for QA tasks
    instructions:
      "You are a quality assurance assistant that helps with testing procedures, quality standards, and process improvement. Focus on accuracy and attention to detail.",
    serviceRole: DEFAULT_SERVICE_ROLE,
  },
};

/**
 * Validates agent name according to AWS Gov constraints
 */
export function validateAgentName(name: string): {
  valid: boolean;
  error?: string;
} {
  if (!name || name.length < AGENT_NAME_CONSTRAINTS.minLength) {
    return { valid: false, error: "Agent name is required" };
  }

  if (name.length > AGENT_NAME_CONSTRAINTS.maxLength) {
    return {
      valid: false,
      error: `Agent name must be ${AGENT_NAME_CONSTRAINTS.maxLength} characters or less`,
    };
  }

  if (!AGENT_NAME_CONSTRAINTS.validChars.test(name)) {
    return {
      valid: false,
      error:
        "Agent name can only contain letters, numbers, underscores, and hyphens",
    };
  }

  return { valid: true };
}

/**
 * Validates agent instructions according to AWS Gov constraints
 */
export function validateInstructions(instructions: string): {
  valid: boolean;
  error?: string;
} {
  if (
    !instructions ||
    instructions.length < INSTRUCTION_CONSTRAINTS.minLength
  ) {
    return {
      valid: false,
      error: `Instructions must be at least ${INSTRUCTION_CONSTRAINTS.minLength} characters`,
    };
  }

  if (instructions.length > INSTRUCTION_CONSTRAINTS.maxLength) {
    return {
      valid: false,
      error: `Instructions must be ${INSTRUCTION_CONSTRAINTS.maxLength} characters or less`,
    };
  }

  return { valid: true };
}

/**
 * Generates a unique agent name for AWS Gov
 */
export function generateAgentName(type: string, userId?: string): string {
  const prefix = type === "personal" ? "personal" : type;
  const suffix = userId
    ? userId.slice(-8)
    : Math.random().toString(36).slice(-8);
  return `${prefix}-agent-${suffix}`.toLowerCase();
}

/**
 * Get model capabilities and token limits
 */
export function getModelCapabilities(modelId: AwsGovFoundationModel) {
  const capabilities = {
    "amazon.nova-pro-v1:0": {
      maxTokens: 300000,
      type: "text-vision",
      capabilities: ["text", "vision"],
      recommended: ["data-analysis", "complex-reasoning"],
    },
    "amazon.nova-lite-v1:0": {
      maxTokens: 300000,
      type: "text-vision",
      capabilities: ["text", "vision"],
      recommended: ["general-purpose", "document-analysis"],
    },
    "amazon.nova-micro-v1:0": {
      maxTokens: 128000,
      type: "text",
      capabilities: ["text"],
      recommended: ["simple-tasks", "quick-responses"],
    },
    "anthropic.claude-3-haiku-20240307-v1:0": {
      maxTokens: 200000,
      type: "text-vision",
      capabilities: ["text", "vision"],
      recommended: ["fast-responses", "technical-writing", "qa"],
    },
    "anthropic.claude-3-5-sonnet-20241022-v2:0": {
      maxTokens: 200000,
      type: "text-vision",
      capabilities: ["text", "vision"],
      recommended: ["complex-analysis", "policy-work", "personal-assistant"],
    },
    "anthropic.claude-3-7-sonnet-20241022-v1:0": {
      maxTokens: 200000,
      type: "text-vision",
      capabilities: ["text", "vision"],
      recommended: ["advanced-reasoning", "specialized-tasks"],
    },
  };

  return capabilities[modelId];
}

/**
 * Get recommended model for agent type
 */
export function getRecommendedModel(agentType: string): AwsGovFoundationModel {
  const recommendations: Record<string, AwsGovFoundationModel> = {
    personal: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "policy-advisor": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "technical-writer": "anthropic.claude-3-haiku-20240307-v1:0",
    "data-analyst": "amazon.nova-pro-v1:0",
    "quality-assurance": "anthropic.claude-3-haiku-20240307-v1:0",
    "safety-compliance": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "procurement-specialist": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "project-manager": "anthropic.claude-3-haiku-20240307-v1:0",
    "training-coordinator": "anthropic.claude-3-haiku-20240307-v1:0",
  };

  return (
    recommendations[agentType] || "anthropic.claude-3-5-sonnet-20241022-v2:0"
  );
}
