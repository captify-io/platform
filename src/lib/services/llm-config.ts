import {
  LLMProvider,
  LLMConfiguration,
  BedrockAgentConfig,
} from "@/lib/types/llm";

export class LLMConfigurationService {
  private static instance: LLMConfigurationService;
  private providers: Map<string, LLMConfiguration> = new Map();

  private constructor() {
    this.initializeProviders();
  }

  public static getInstance(): LLMConfigurationService {
    if (!LLMConfigurationService.instance) {
      LLMConfigurationService.instance = new LLMConfigurationService();
    }
    return LLMConfigurationService.instance;
  }

  private initializeProviders(): void {
    // Bedrock Agent Provider
    const bedrockAgentProvider: LLMProvider = {
      id: "bedrock-agent",
      name: "AWS Bedrock Agent",
      type: "bedrock-agent",
      enabled: !!(
        process.env.AWS_BEDROCK_AGENT_ID &&
        process.env.AWS_BEDROCK_AGENT_ALIAS_ID
      ),
    };

    const bedrockAgentConfig: BedrockAgentConfig = {
      agentId: process.env.AWS_BEDROCK_AGENT_ID || "",
      agentAliasId: process.env.AWS_BEDROCK_AGENT_ALIAS_ID || "",
      region: process.env.AWS_REGION || "us-east-1",
    };

    this.providers.set("bedrock-agent", {
      provider: bedrockAgentProvider,
      config: bedrockAgentConfig,
    });

    // Future: Add other providers
    // this.addOpenAIProvider();
    // this.addAnthropicProvider();
    // this.addGrokProvider();
  }

  public getProvider(providerId: string): LLMConfiguration | undefined {
    return this.providers.get(providerId);
  }

  public getEnabledProviders(): LLMConfiguration[] {
    return Array.from(this.providers.values()).filter(
      (config) => config.provider.enabled
    );
  }

  public getDefaultProvider(): LLMConfiguration | undefined {
    // Priority: Bedrock Agent > others
    return this.providers.get("bedrock-agent") || this.getEnabledProviders()[0];
  }

  public isProviderEnabled(providerId: string): boolean {
    const provider = this.providers.get(providerId);
    return provider?.provider.enabled || false;
  }

  public getBedrockAgentConfig(): BedrockAgentConfig | null {
    const provider = this.providers.get("bedrock-agent");
    if (provider?.provider.enabled) {
      return provider.config as BedrockAgentConfig;
    }
    return null;
  }

  // Future methods for other providers
  // private addOpenAIProvider(): void { ... }
  // private addAnthropicProvider(): void { ... }
  // private addGrokProvider(): void { ... }
}

export const llmConfig = LLMConfigurationService.getInstance();
