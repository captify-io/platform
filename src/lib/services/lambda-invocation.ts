/**
 * Lambda Invocation Service
 * Handles triggering Lambda functions for agent creation and monitoring progress
 */

import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

// Use the same configuration pattern as the application
const REGION = process.env.REGION || "us-east-1";

const lambdaClient = new LambdaClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || process.env.ACCESS_KEY_ID!,
    secretAccessKey:
      process.env.SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY!,
  },
});

const AGENT_CREATION_LAMBDA_ARN =
  process.env.AGENT_CREATION_LAMBDA_ARN ||
  `arn:aws:lambda:${REGION}:ACCOUNT:function:agent-creation`;

export interface AgentCreationRequest {
  jobId: string;
  userId: string;
  agentName: string;
  agentType: string;
  instructions: string;
  organizationalRole?: string;
  description?: string;
}

export interface LambdaInvocationResult {
  success: boolean;
  executionId?: string;
  error?: string;
}

export class LambdaInvocationService {
  /**
   * Trigger Lambda function for agent creation
   */
  static async invokeAgentCreation(
    request: AgentCreationRequest
  ): Promise<LambdaInvocationResult> {
    try {
      const command = new InvokeCommand({
        FunctionName: AGENT_CREATION_LAMBDA_ARN,
        InvocationType: "Event", // Async invocation
        Payload: JSON.stringify(request),
      });

      const response = await lambdaClient.send(command);

      if (response.StatusCode === 202) {
        return {
          success: true,
          executionId: response.Payload
            ? new TextDecoder().decode(response.Payload)
            : undefined,
        };
      } else {
        return {
          success: false,
          error: `Lambda invocation failed with status: ${response.StatusCode}`,
        };
      }
    } catch (error) {
      console.error("Error invoking agent creation Lambda:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check Lambda function health
   */
  static async checkLambdaHealth(): Promise<boolean> {
    try {
      const command = new InvokeCommand({
        FunctionName: AGENT_CREATION_LAMBDA_ARN,
        InvocationType: "RequestResponse",
        Payload: JSON.stringify({ healthCheck: true }),
      });

      const response = await lambdaClient.send(command);
      return response.StatusCode === 200;
    } catch (error) {
      console.error("Lambda health check failed:", error);
      return false;
    }
  }
}
