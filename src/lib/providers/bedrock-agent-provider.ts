import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { fromEnv } from "@aws-sdk/credential-providers";
import type {
  AwsCredentialIdentity,
  AwsCredentialIdentityProvider,
} from "@aws-sdk/types";

// Simple ID generator for this provider
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Types for LanguageModelV2

export interface LanguageModelV2CallOptions {
  prompt: Array<{ role: string; content: LanguageModelV2Content[] }>;
}

export interface LanguageModelV2CallWarning {
  message: string;
  code?: string;
}

export interface LanguageModelV2Content {
  type: string;
  text: string;
}

export interface LanguageModelV2StreamPart {
  type: string;
  id?: string;
  delta?: string;
  finishReason?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  error?: unknown;
  warnings?: LanguageModelV2CallWarning[];
}

export interface LanguageModelV2 {
  readonly specificationVersion: "v2";
  readonly provider: string;
  readonly modelId: string;
  readonly defaultObjectGenerationMode?: unknown;
  doGenerate: (options: LanguageModelV2CallOptions) => Promise<unknown>;
  doStream: (options: LanguageModelV2CallOptions) => Promise<unknown>;
}

export interface ProviderV2 {
  languageModel: (modelId: string, settings?: unknown) => unknown;
}

interface BedrockAgentConfig {
  provider: string;
  region: string;
  client: BedrockAgentRuntimeClient;
  generateId: () => string;
}

interface BedrockAgentSettings {
  agentId?: string;
  agentAliasId?: string;
  sessionId?: string;
}

class BedrockAgentLanguageModel implements LanguageModelV2 {
  readonly specificationVersion = "v2" as const;
  readonly provider: string;
  readonly modelId: string;

  private config: BedrockAgentConfig;
  private settings: BedrockAgentSettings;

  constructor(
    modelId: string,
    settings: BedrockAgentSettings,
    config: BedrockAgentConfig
  ) {
    this.provider = config.provider;
    this.modelId = modelId;
    this.config = config;
    this.settings = settings;
  }

  get defaultObjectGenerationMode() {
    return undefined;
  }

  private getArgs(options: LanguageModelV2CallOptions) {
    const warnings: LanguageModelV2CallWarning[] = [];

    // Extract the last user message as input text
    const userMessages = options.prompt.filter((msg) => msg.role === "user");
    const lastUserMessage = userMessages[userMessages.length - 1];

    let inputText = "";
    if (lastUserMessage && lastUserMessage.content) {
      for (const part of lastUserMessage.content) {
        if (part.type === "text") {
          inputText += part.text;
        }
      }
    }

    // Build request body for Bedrock Agent
    const body = {
      agentId: this.settings.agentId || this.modelId,
      agentAliasId: this.settings.agentAliasId || "TSTALIASID",
      sessionId: this.settings.sessionId || this.config.generateId(),
      inputText,
    };

    return { args: body, warnings };
  }

  async doGenerate(options: LanguageModelV2CallOptions) {
    const { args, warnings } = this.getArgs(options);

    try {
      const command = new InvokeAgentCommand({
        agentId: args.agentId,
        agentAliasId: args.agentAliasId,
        sessionId: args.sessionId,
        inputText: args.inputText,
      });

      const response = await this.config.client.send(command);

      // Extract text from Bedrock Agent response
      let outputText = "";
      if (response.completion) {
        for await (const chunk of response.completion) {
          if (chunk.chunk?.bytes) {
            // Bedrock Agent returns raw text in bytes field
            const text = new TextDecoder().decode(chunk.chunk.bytes);
            outputText += text;
          }
        }
      }

      const content: LanguageModelV2Content[] = [];
      if (outputText) {
        content.push({
          type: "text",
          text: outputText,
        });
      }

      return {
        content,
        finishReason: "stop" as const,
        usage: {
          inputTokens: undefined,
          outputTokens: undefined,
          totalTokens: undefined,
        },
        request: { body: args },
        response: { body: { outputText } },
        warnings,
      };
    } catch (error) {
      throw new Error(
        `Bedrock Agent error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async doStream(options: LanguageModelV2CallOptions) {
    const { args, warnings } = this.getArgs(options);

    try {
      const command = new InvokeAgentCommand({
        agentId: args.agentId,
        agentAliasId: args.agentAliasId,
        sessionId: args.sessionId,
        inputText: args.inputText,
      });

      const response = await this.config.client.send(command);

      // Create a transform stream that converts Bedrock Agent response to AI SDK format
      const { config } = this;
      const stream = new ReadableStream<LanguageModelV2StreamPart>({
        async start(controller) {
          controller.enqueue({ type: "stream-start", warnings });

          try {
            let hasContent = false;

            // Stream the response from Bedrock Agent
            if (response.completion) {
              for await (const chunk of response.completion) {
                if (chunk.chunk?.bytes) {
                  // Bedrock Agent returns raw text in bytes field
                  const text = new TextDecoder().decode(chunk.chunk.bytes);

                  if (text.trim()) {
                    hasContent = true;

                    // Stream each chunk as text-delta
                    controller.enqueue({
                      type: 'text',
                      id: config.generateId(),
                      delta: text,
                    });
                  }
                }
              }
            }

            // If no content was streamed, provide a fallback message
            if (!hasContent) {
              controller.enqueue({
                type: 'text',
                id: config.generateId(),
                delta:
                  "I apologize, but I didn't receive a response from the agent. Please try again.",
              });
            }

            controller.enqueue({
              type: "finish",
              finishReason: "stop",
              usage: {
                inputTokens: undefined,
                outputTokens: undefined,
                totalTokens: undefined,
              },
            });
          } catch (error) {
            controller.enqueue({
              type: "error",
              error,
            });
          } finally {
            controller.close();
          }
        },
      });

      return { stream, warnings };
    } catch (error) {
      throw new Error(
        `Bedrock Agent stream error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

// Provider interface
interface BedrockAgentProvider extends ProviderV2 {
  (modelId: string, settings?: BedrockAgentSettings): BedrockAgentLanguageModel;
  languageModel(modelId: string, settings?: unknown): unknown;
}

interface BedrockAgentProviderSettings {
  region?: string;
  credentials?: AwsCredentialIdentity | AwsCredentialIdentityProvider;
  generateId?: () => string;
}

function createBedrockAgent(
  options: BedrockAgentProviderSettings = {}
): BedrockAgentProvider {
  const createChatModel = (
    modelId: string,
    settings: BedrockAgentSettings = {}
  ) => {
    const client = new BedrockAgentRuntimeClient({
      region: options.region || "us-east-1",
      credentials: options.credentials || fromEnv(),
    });

    return new BedrockAgentLanguageModel(modelId, settings, {
      provider: "bedrock-agent",
      region: options.region || "us-east-1",
      client,
      generateId: options.generateId ?? generateId,
    });
  };

  const provider = function (modelId: string, settings?: BedrockAgentSettings) {
    if (new.target) {
      throw new Error(
        "The model factory function cannot be called with the new keyword."
      );
    }

    return createChatModel(modelId, settings);
  };

  provider.languageModel = createChatModel;

  return provider as BedrockAgentProvider;
}

// Export default provider instance
export const bedrockAgent = createBedrockAgent();
export { createBedrockAgent, BedrockAgentLanguageModel };
export type { BedrockAgentSettings, BedrockAgentProviderSettings };
