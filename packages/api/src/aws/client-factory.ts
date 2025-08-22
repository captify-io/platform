/**
 * AWS Client Factory for @captify/api
 * Centralized AWS client creation with proper credential management
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { BedrockAgentRuntimeClient } from "@aws-sdk/client-bedrock-agent-runtime";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import type {
  AwsCredentials,
  UserSession,
  DatabaseClientOptions,
} from "../types";

/**
 * AWS configuration interface
 */
export interface AwsConfig {
  region: string;
  userPoolId: string;
  userPoolClientId: string;
  identityPoolId: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

/**
 * AWS Client Factory
 * Handles all AWS client creation with proper credential management
 */
export class AwsClientFactory {
  private config: AwsConfig;

  constructor(config: AwsConfig) {
    this.config = config;
  }

  /**
   * Create AWS configuration for clients
   */
  private createAwsConfig(options: DatabaseClientOptions = {}) {
    const awsConfig: any = {
      region: options.region || this.config.region,
    };

    if (options.credentials) {
      awsConfig.credentials = options.credentials;
    } else if (this.config.accessKeyId && this.config.secretAccessKey) {
      awsConfig.credentials = {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      };
    }

    return awsConfig;
  }

  /**
   * Create a DynamoDB Document Client using static credentials
   */
  createStaticDynamoDBClient(
    options: DatabaseClientOptions = {}
  ): DynamoDBDocumentClient {
    const awsConfig = this.createAwsConfig(options);
    const client = new DynamoDBClient(awsConfig);
    return DynamoDBDocumentClient.from(client);
  }

  /**
   * Create a DynamoDB client using user session token
   */
  async createSessionTokenDynamoDBClient(
    userSession: UserSession,
    options: DatabaseClientOptions = {}
  ): Promise<DynamoDBDocumentClient> {
    if (!userSession.awsSessionToken) {
      throw new Error("AWS session token required for DynamoDB access");
    }

    try {
      // Check if token is still valid
      if (userSession.awsExpiresAt) {
        const now = Date.now();
        if (userSession.awsExpiresAt <= now) {
          throw new Error("AWS session token has expired");
        }
      }

      if (!userSession.idToken) {
        throw new Error("ID token required to get full AWS credentials");
      }

      const credentials = await fromCognitoIdentityPool({
        clientConfig: { region: options.region || this.config.region },
        identityPoolId: this.config.identityPoolId,
        logins: {
          [`cognito-idp.${this.config.region}.amazonaws.com/${this.config.userPoolId}`]:
            userSession.idToken,
        },
      })();

      const client = new DynamoDBClient({
        region: options.region || this.config.region,
        credentials: {
          accessKeyId: credentials.accessKeyId!,
          secretAccessKey: credentials.secretAccessKey!,
          sessionToken: credentials.sessionToken!,
        },
      });

      return DynamoDBDocumentClient.from(client);
    } catch (error) {
      throw new Error("Failed to initialize session token database access");
    }
  }

  /**
   * Create a DynamoDB client using user-scoped credentials
   */
  async createUserDynamoDBClient(
    userSession: UserSession,
    options: DatabaseClientOptions = {}
  ): Promise<DynamoDBDocumentClient> {
    if (!userSession.idToken) {
      throw new Error("ID token required for user DynamoDB access");
    }

    try {
      const credentials = await fromCognitoIdentityPool({
        clientConfig: { region: options.region || this.config.region },
        identityPoolId: this.config.identityPoolId,
        logins: {
          [`cognito-idp.${this.config.region}.amazonaws.com/${this.config.userPoolId}`]:
            userSession.idToken,
        },
      })();

      const client = new DynamoDBClient({
        region: options.region || this.config.region,
        credentials: {
          accessKeyId: credentials.accessKeyId!,
          secretAccessKey: credentials.secretAccessKey!,
          sessionToken: credentials.sessionToken,
        },
      });

      return DynamoDBDocumentClient.from(client);
    } catch (error) {
      throw new Error("Failed to initialize user database access");
    }
  }

  /**
   * Create DynamoDB client with three-tier fallback
   */
  async createDynamoDBClientWithFallback(
    userSession: UserSession,
    options: DatabaseClientOptions = {}
  ): Promise<DynamoDBDocumentClient> {
    // Tier 1: Session token (preferred) - from NextAuth JWT callback
    if (userSession.awsSessionToken && userSession.idToken) {
      try {
        return await this.createSessionTokenDynamoDBClient(
          userSession,
          options
        );
      } catch (error) {
        console.warn(
          "Session token auth failed, falling back to user credentials:",
          error
        );
      }
    }

    // Tier 2: User credentials - Cognito Identity Pool
    if (userSession.idToken) {
      try {
        return await this.createUserDynamoDBClient(userSession, options);
      } catch (error) {
        console.warn(
          "User credential auth failed, falling back to static:",
          error
        );
      }
    }

    // Tier 3: Static fallback - service account (least preferred)
    console.warn("Using static credentials as fallback");
    return this.createStaticDynamoDBClient(options);
  }

  /**
   * Create Bedrock Agent Runtime client
   */
  createBedrockAgentRuntimeClient(
    credentials?: AwsCredentials,
    region?: string
  ): BedrockAgentRuntimeClient {
    return new BedrockAgentRuntimeClient({
      region: region || this.config.region,
      credentials: credentials || {
        accessKeyId: this.config.accessKeyId!,
        secretAccessKey: this.config.secretAccessKey!,
      },
    });
  }

  /**
   * Create Bedrock Runtime client
   */
  createBedrockRuntimeClient(
    credentials?: AwsCredentials,
    region?: string
  ): BedrockRuntimeClient {
    return new BedrockRuntimeClient({
      region: region || this.config.region,
      credentials: credentials || {
        accessKeyId: this.config.accessKeyId!,
        secretAccessKey: this.config.secretAccessKey!,
      },
    });
  }
}
