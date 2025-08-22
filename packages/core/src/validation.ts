import { CaptifyConfig } from "./types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ConfigValidationOptions {
  strict?: boolean; // If true, warnings become errors
  environment?: "development" | "production" | "test";
}

/**
 * Validates a Captify configuration object
 */
export function validateConfig(
  config: Partial<CaptifyConfig>,
  options: ConfigValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { strict = false, environment = "development" } = options;

  // AWS Configuration Validation
  if (!config.aws?.region) {
    errors.push("AWS region is required");
  }

  if (!config.aws?.userPoolId) {
    errors.push("AWS User Pool ID is required");
  }

  if (!config.aws?.userPoolClientId) {
    errors.push("AWS User Pool Client ID is required");
  }

  if (!config.aws?.identityPoolId) {
    errors.push("AWS Identity Pool ID is required");
  }

  if (!config.aws?.accessKeyId && environment === "production") {
    errors.push("AWS access key ID is required in production");
  }

  if (!config.aws?.secretAccessKey && environment === "production") {
    errors.push("AWS secret access key is required in production");
  }

  // Cognito Configuration Validation
  if (!config.cognito?.clientSecret) {
    warnings.push("Cognito client secret should be set for OAuth flows");
  }

  if (!config.cognito?.domain) {
    warnings.push("Cognito domain should be set for hosted UI");
  }

  // Database Configuration Validation
  if (!config.database?.applicationsTable) {
    warnings.push("Applications table name should be configured");
  }

  // NextAuth Configuration Validation
  if (!config.nextAuth?.secret) {
    if (environment === "production") {
      errors.push("NextAuth secret is required in production");
    } else {
      warnings.push("NextAuth secret should be set for security");
    }
  }

  if (!config.nextAuth?.url && environment === "production") {
    errors.push("NextAuth URL is required in production");
  }

  // Agents Configuration Validation
  if (config.agents?.bedrockAgentId && !config.agents?.bedrockAgentAliasId) {
    warnings.push(
      "Bedrock agent alias ID should be set when agent ID is configured"
    );
  }

  // Storage Configuration Validation
  if (config.storage?.s3Bucket && !config.storage?.s3Region) {
    warnings.push("S3 region should be set when S3 bucket is configured");
  }

  // Convert warnings to errors if strict mode is enabled
  if (strict) {
    errors.push(...warnings);
    warnings.length = 0;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates required environment variables
 */
export function validateEnvironmentVariables(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const requiredVars = [
    "AWS_REGION",
    "AWS_USER_POOL_ID",
    "AWS_USER_POOL_CLIENT_ID",
    "AWS_IDENTITY_POOL_ID",
  ];

  const productionVars = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
  ];

  // Check required variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Check production variables
  const isProduction = process.env.NODE_ENV === "production";
  for (const varName of productionVars) {
    if (!process.env[varName]) {
      if (isProduction) {
        errors.push(
          `Missing required production environment variable: ${varName}`
        );
      } else {
        warnings.push(`Missing recommended environment variable: ${varName}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Checks if a configuration object has all required properties
 */
export function isConfigComplete(config: Partial<CaptifyConfig>): boolean {
  const validation = validateConfig(config, { strict: true });
  return validation.isValid;
}

/**
 * Returns a list of missing configuration properties
 */
export function getMissingConfigProperties(
  config: Partial<CaptifyConfig>
): string[] {
  const validation = validateConfig(config);
  return validation.errors.filter((error) => error.includes("is required"));
}

/**
 * Validates specific configuration sections
 */
export const validators = {
  aws: (config: CaptifyConfig["aws"]) => {
    const errors: string[] = [];
    if (!config?.region) errors.push("AWS region is required");
    if (!config?.userPoolId) errors.push("AWS User Pool ID is required");
    if (!config?.userPoolClientId)
      errors.push("AWS User Pool Client ID is required");
    if (!config?.identityPoolId)
      errors.push("AWS Identity Pool ID is required");
    return { isValid: errors.length === 0, errors };
  },

  cognito: (config: CaptifyConfig["cognito"]) => {
    const errors: string[] = [];
    if (!config?.clientSecret) errors.push("Cognito client secret is required");
    if (!config?.domain) errors.push("Cognito domain is required");
    return { isValid: errors.length === 0, errors };
  },

  database: (config: CaptifyConfig["database"]) => {
    const errors: string[] = [];
    if (!config?.applicationsTable)
      errors.push("Applications table name is required");
    return { isValid: errors.length === 0, errors };
  },
};
