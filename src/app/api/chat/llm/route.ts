import { openai, createOpenAI } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { NextRequest } from "next/server";

// Type definition for supported providers
type LLMProvider = "openai" | "anthropic" | "azure-openai" | "grok" | "bedrock";

interface ChatMessage {
  role: string;
  content: string;
}

export async function POST(req: NextRequest) {
  console.log("🤖 LLM API - Request received");

  let provider: LLMProvider = "openai";

  try {
    const requestData = await req.json();
    provider = requestData.provider || "openai";
    const { messages, model, temperature = 0.7 } = requestData;
    console.log("📝 Request payload:", {
      messageCount: messages?.length,
      provider,
      model,
      temperature,
      messages: messages?.map((m: ChatMessage) => ({
        role: m.role,
        contentLength: m.content?.length,
      })),
    });

    // Provider configurations
    const getModel = (provider: LLMProvider, model?: string) => {
      console.log(`🔧 Configuring model for provider: ${provider}`, { model });

      switch (provider) {
        case "openai":
          console.log("🚀 Using OpenAI provider");
          return openai(model || "gpt-3.5-turbo");

        case "anthropic":
          console.log("🧠 Using Anthropic provider");
          return anthropic(model || "claude-3-haiku-20240307");

        case "azure-openai":
          console.log("☁️ Using Azure OpenAI provider");
          // Azure OpenAI configuration
          const azureOpenai = createOpenAI({
            baseURL: process.env.AZURE_OPENAI_ENDPOINT,
            apiKey: process.env.AZURE_OPENAI_API_KEY,
          });
          return azureOpenai(model || "gpt-3.5-turbo");

        case "grok":
          console.log("⚡ Using Grok provider");
          // Grok configuration (using OpenAI-compatible interface)
          const grokProvider = createOpenAI({
            baseURL: "https://api.x.ai/v1",
            apiKey: process.env.GROK_API_KEY,
          });
          return grokProvider(model || "grok-beta");

        case "bedrock":
          console.log("🏗️ Using Bedrock provider");
          // Amazon Bedrock (using Anthropic models through Bedrock)
          return anthropic(model || "claude-3-haiku-20240307");

        default:
          console.error("❌ Unsupported provider:", provider);
          throw new Error(`Unsupported provider: ${provider}`);
      }
    };

    // Validate provider
    console.log("✅ Validating provider...");
    const supportedProviders: LLMProvider[] = [
      "openai",
      "anthropic",
      "azure-openai",
      "grok",
      "bedrock",
    ];
    if (!supportedProviders.includes(provider as LLMProvider)) {
      console.log("❌ Invalid provider:", provider);
      return new Response(
        JSON.stringify({ error: `Invalid provider: ${provider}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check for required API keys
    console.log("🔑 Checking API key availability...");
    const apiKeyChecks = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      "azure-openai": process.env.AZURE_OPENAI_API_KEY,
      grok: process.env.GROK_API_KEY,
      bedrock: process.env.ACCESS_KEY_ID, // For Bedrock
    };

    const hasApiKey = !!apiKeyChecks[provider as keyof typeof apiKeyChecks];
    console.log(
      `🔐 API key status for ${provider}:`,
      hasApiKey ? "Available" : "Missing"
    );

    if (!hasApiKey) {
      console.log("❌ API key missing for provider:", provider);
      return new Response(
        JSON.stringify({
          error: `API key not configured for provider: ${provider}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Stream the chat completion
    console.log("🌊 Starting streaming chat completion...");
    const result = await streamText({
      model: getModel(provider as LLMProvider, model),
      messages,
      temperature,
      maxTokens: 1000,
    });
    console.log("✅ Stream created successfully");

    return result.toAIStreamResponse();
  } catch (error) {
    console.error("💥 LLM API error:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      provider: provider,
    });
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
        provider: provider,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
