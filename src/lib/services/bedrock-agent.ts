import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";
import type { BedrockInvokeRequest, BedrockInvokeResponse } from "@/lib/types";

// Initialize Bedrock Agent Runtime client
const bedrockClient = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export class BedrockAgentService {
  /**
   * Invoke a Bedrock agent with the provided input
   */
  static async invokeAgent(
    request: BedrockInvokeRequest
  ): Promise<BedrockInvokeResponse> {
    try {
      const command = new InvokeAgentCommand({
        agentId: request.agentId,
        agentAliasId: request.agentAliasId,
        sessionId: request.sessionId,
        inputText: request.inputText,
        sessionState: request.sessionState,
      });

      const response = await bedrockClient.send(command);

      // Process the streaming response
      let completion = "";
      let trace: any = null;
      let citations: any[] = [];

      if (response.completion) {
        for await (const chunk of response.completion) {
          if (chunk.chunk?.bytes) {
            const chunkText = new TextDecoder().decode(chunk.chunk.bytes);
            completion += chunkText;
          }

          if (chunk.trace) {
            trace = chunk.trace;
          }

          if (chunk.attribution?.citations) {
            citations.push(...chunk.attribution.citations);
          }
        }
      }

      return {
        completion,
        trace,
        sessionId: request.sessionId,
        citations,
      };
    } catch (error) {
      console.error("Error invoking Bedrock agent:", error);
      throw new Error(
        `Failed to invoke Bedrock agent: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Create a new session ID for a conversation
   */
  static generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate agent configuration
   */
  static async validateAgentConfig(
    agentId: string,
    aliasId: string
  ): Promise<boolean> {
    try {
      // Simple validation by attempting to invoke with empty input
      const sessionId = this.generateSessionId();
      await this.invokeAgent({
        agentId,
        agentAliasId: aliasId,
        sessionId,
        inputText: "Hello", // Simple test message
      });
      return true;
    } catch (error) {
      console.error("Agent validation failed:", error);
      return false;
    }
  }
}

export default BedrockAgentService;
