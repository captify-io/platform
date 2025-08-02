import { BedrockAgentClient } from "@aws-sdk/client-bedrock-agent";
import { BedrockAgentRuntimeClient } from "@aws-sdk/client-bedrock-agent-runtime";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";

// Initialize AWS Bedrock clients
const awsConfig = {
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
};

export const bedrockAgentClient = new BedrockAgentClient(awsConfig);
export const bedrockAgentRuntimeClient = new BedrockAgentRuntimeClient(
  awsConfig
);
export const bedrockRuntimeClient = new BedrockRuntimeClient(awsConfig);

// Available foundation models for agents
export const FOUNDATION_MODELS = {
  // Claude Models
  CLAUDE_3_5_SONNET: "anthropic.claude-3-5-sonnet-20241022-v2:0",
  CLAUDE_3_SONNET: "anthropic.claude-3-sonnet-20240229-v1:0",
  CLAUDE_3_HAIKU: "anthropic.claude-3-haiku-20240307-v1:0",

  // Nova Models
  NOVA_PRO: "amazon.nova-pro-v1:0",
  NOVA_LITE: "amazon.nova-lite-v1:0",
  NOVA_MICRO: "amazon.nova-micro-v1:0",
} as const;

export const FOUNDATION_MODEL_DISPLAY_NAMES = {
  [FOUNDATION_MODELS.CLAUDE_3_5_SONNET]: "Claude 3.5 Sonnet",
  [FOUNDATION_MODELS.CLAUDE_3_SONNET]: "Claude 3 Sonnet",
  [FOUNDATION_MODELS.CLAUDE_3_HAIKU]: "Claude 3 Haiku",
  [FOUNDATION_MODELS.NOVA_PRO]: "Amazon Nova Pro",
  [FOUNDATION_MODELS.NOVA_LITE]: "Amazon Nova Lite",
  [FOUNDATION_MODELS.NOVA_MICRO]: "Amazon Nova Micro",
} as const;

// Default agent configurations for different application types
export const DEFAULT_AGENT_CONFIGS = {
  "aircraft-console": {
    foundationModel: FOUNDATION_MODELS.CLAUDE_3_5_SONNET,
    instruction:
      "You are an AI assistant specialized in aircraft readiness and maintenance operations. Help users monitor aircraft status, analyze maintenance data, and provide insights for optimal fleet management. Focus on safety, compliance, and operational efficiency.",
    description:
      "AI assistant for aircraft readiness and maintenance operations",
  },
  "materiel-insights": {
    foundationModel: FOUNDATION_MODELS.NOVA_PRO,
    instruction:
      "You are an AI assistant for materiel management and supply chain analytics. Help users analyze supply chain data, predict maintenance needs, optimize inventory levels, and identify cost-saving opportunities. Provide data-driven insights for strategic decision making.",
    description:
      "AI assistant for materiel management and supply chain analytics",
  },
  dataops: {
    foundationModel: FOUNDATION_MODELS.CLAUDE_3_5_SONNET,
    instruction:
      "You are an AI assistant for data operations and analytics. Help users with data pipeline management, quality monitoring, analytics workflows, and data governance. Provide insights on data trends, anomalies, and optimization opportunities.",
    description: "AI assistant for data operations and analytics",
  },
  "express-dashboard": {
    foundationModel: FOUNDATION_MODELS.NOVA_LITE,
    instruction:
      "You are an AI assistant for operational dashboard management. Help users interpret key performance indicators, identify trends, and provide quick operational insights. Focus on real-time monitoring and rapid decision support.",
    description: "AI assistant for operational dashboard management",
  },
  mescip: {
    foundationModel: FOUNDATION_MODELS.CLAUDE_3_SONNET,
    instruction:
      "You are an AI assistant for the Mission Essential Supply Chain Information Portal. Help users with supply chain visibility, logistics coordination, and mission-critical resource management. Ensure supply chain continuity for mission success.",
    description: "AI assistant for mission essential supply chain operations",
  },
  "supply-chain": {
    foundationModel: FOUNDATION_MODELS.NOVA_PRO,
    instruction:
      "You are an AI assistant for comprehensive supply chain management. Help users with vendor management, procurement optimization, logistics coordination, and supply chain risk assessment. Provide strategic recommendations for supply chain efficiency.",
    description: "AI assistant for comprehensive supply chain management",
  },
  "maintenance-ops": {
    foundationModel: FOUNDATION_MODELS.CLAUDE_3_5_SONNET,
    instruction:
      "You are an AI assistant for maintenance operations management. Help users with maintenance scheduling, resource allocation, work order management, and predictive maintenance insights. Focus on maximizing equipment uptime and operational readiness.",
    description: "AI assistant for maintenance operations management",
  },
  "strategic-planning": {
    foundationModel: FOUNDATION_MODELS.CLAUDE_3_5_SONNET,
    instruction:
      "You are an AI assistant for strategic planning and decision support. Help users with strategic analysis, scenario planning, resource allocation decisions, and long-term operational planning. Provide comprehensive insights for leadership decision making.",
    description: "AI assistant for strategic planning and decision support",
  },
  "financial-forecasting": {
    foundationModel: FOUNDATION_MODELS.NOVA_PRO,
    instruction:
      "You are an AI assistant for financial forecasting and budget analysis. Help users with financial modeling, budget planning, cost analysis, and fiscal projections. Provide data-driven financial insights and recommendations for optimal resource allocation.",
    description: "AI assistant for financial forecasting and budget analysis",
  },
} as const;

// Generate client token for idempotent operations
export function generateClientToken(): string {
  return `titan-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// Get default configuration for an application
export function getDefaultAgentConfig(applicationId: string) {
  return (
    DEFAULT_AGENT_CONFIGS[
      applicationId as keyof typeof DEFAULT_AGENT_CONFIGS
    ] || {
      foundationModel: FOUNDATION_MODELS.CLAUDE_3_5_SONNET,
      instruction:
        "You are a helpful AI assistant. Provide accurate, helpful, and relevant information to assist users with their tasks.",
      description: "General-purpose AI assistant",
    }
  );
}
