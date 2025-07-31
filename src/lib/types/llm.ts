export interface LLMProvider {
  id: string;
  name: string;
  type: "openai" | "bedrock" | "bedrock-agent" | "anthropic" | "grok";
  enabled: boolean;
}

export interface BedrockAgentConfig {
  agentId: string;
  agentAliasId: string;
  region: string;
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
}

export interface AnthropicConfig {
  apiKey: string;
  model: string;
}

export interface BedrockConfig {
  region: string;
  model: string;
}

export interface GrokConfig {
  apiKey: string;
  model: string;
}

export interface LLMConfiguration {
  provider: LLMProvider;
  config:
    | BedrockAgentConfig
    | OpenAIConfig
    | AnthropicConfig
    | BedrockConfig
    | GrokConfig;
}
