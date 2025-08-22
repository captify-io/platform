// Configuration management for Captify SDK
import { CaptifyConfig } from "./types";

let globalConfig: CaptifyConfig | null = null;

/**
 * Initialize Captify SDK with configuration
 */
export function initCaptify(config: CaptifyConfig): void {
  globalConfig = config;
}

/**
 * Get current Captify configuration
 */
export function getCaptifyConfig(): CaptifyConfig {
  if (!globalConfig) {
    throw new Error("Captify SDK not initialized. Call initCaptify() first.");
  }
  return globalConfig;
}

/**
 * Check if Captify SDK is initialized
 */
export function isCaptifyInitialized(): boolean {
  return globalConfig !== null;
}

/**
 * Create configuration from environment variables
 */
export function createConfigFromEnv(): CaptifyConfig {
  const requiredEnvVars = [
    "REGION",
    "COGNITO_USER_POOL_ID",
    "COGNITO_IDENTITY_POOL_ID",
    "NEXT_PUBLIC_COGNITO_CLIENT_ID",
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "COGNITO_CLIENT_SECRET",
    "COGNITO_DOMAIN",
  ];

  // Check for required environment variables
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  return {
    aws: {
      region: process.env.REGION!,
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
      userPoolId: process.env.COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
      identityPoolId: process.env.COGNITO_IDENTITY_POOL_ID!,
    },
    database: {
      dynamoTablePrefix: process.env.DYNAMO_TABLE_PREFIX,
      applicationsTable:
        process.env.DYNAMODB_APPLICATIONS_TABLE || "captify-appman-App",
      userStateTable:
        process.env.DYNAMODB_USER_APPLICATION_STATE_TABLE ||
        "captify-user-application-state",
      organizationSettingsTable:
        process.env.DYNAMODB_ORGANIZATION_SETTINGS_TABLE ||
        "captify-organization-settings",
      menuItemsTable:
        process.env.DYNAMODB_MENU_ITEMS_TABLE ||
        "captify-application-menu-items",
      workspaceContentTable:
        process.env.DYNAMODB_WORKSPACE_CONTENT_TABLE ||
        "captify-application-workspace-content",
      chatTable: process.env.DYNAMODB_CHAT_TABLE || "captify-chats",
      agentsTable: process.env.AGENTS_TABLE_NAME || "captify-agents",
      agentJobsTable: process.env.AGENT_JOBS_TABLE_NAME || "captify-agent-jobs",
    },
    agents: {
      bedrockRegion: process.env.REGION,
      bedrockAgentId: process.env.BEDROCK_AGENT_ID,
      bedrockAgentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID,
    },
    storage: {
      s3Bucket: process.env.S3_BUCKET,
      s3Region: process.env.S3_REGION,
    },
    api: {
      gatewayUrl: process.env.API_GATEWAY_URL,
    },
    nextAuth: {
      url: process.env.NEXTAUTH_URL!,
      secret: process.env.NEXTAUTH_SECRET!,
    },
    cognito: {
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      domain: process.env.COGNITO_DOMAIN!,
    },
  };
}

/**
 * Auto-initialize from environment if not already initialized
 */
export function ensureInitialized(): CaptifyConfig {
  if (!globalConfig) {
    try {
      globalConfig = createConfigFromEnv();
    } catch (error) {
      throw new Error(
        `Failed to auto-initialize Captify SDK: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
  return globalConfig;
}
