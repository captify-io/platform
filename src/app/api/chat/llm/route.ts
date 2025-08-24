import { openai, createOpenAI, anthropic, streamText } from "@captify/core";
import { NextRequest } from "next/server";

// Type definition for supported providers
type LLMProvider = "openai" | "anthropic" | "azure-openai" | "grok" | "bedrock";

export async function POST(req: NextRequest) {
  let provider: LLMProvider = "openai";

  try {
    const requestData = await req.json();
    provider = requestData.provider || "openai";
    const { messages, model, temperature = 0.7 } = requestData;

    // Provider configurations
    const getModel = (provider: LLMProvider, model?: string) => {
      switch (provider) {
        case "openai":
          return openai(model || "gpt-3.5-turbo");

        case "anthropic":
          return anthropic(model || "claude-3-haiku-20240307");

        case "azure-openai":
          // Azure OpenAI configuration
          const azureOpenai = createOpenAI({
            baseURL: process.env.AZURE_OPENAI_ENDPOINT,
            apiKey: process.env.AZURE_OPENAI_API_KEY,
          });
          return azureOpenai(model || "gpt-3.5-turbo");

        case "grok":
          // Grok configuration (using OpenAI-compatible interface)
          const grokProvider = createOpenAI({
            baseURL: "https://api.x.ai/v1",
            apiKey: process.env.GROK_API_KEY,
          });
          return grokProvider(model || "grok-beta");

        case "bedrock":
          // Amazon Bedrock (using Anthropic models through Bedrock)
          return anthropic(model || "claude-3-haiku-20240307");

        default:
          console.error("❌ Unsupported provider:", provider);
          throw new Error(`Unsupported provider: ${provider}`);
      }
    };

    // Validate provider
    const supportedProviders: LLMProvider[] = [
      "openai",
      "anthropic",
      "azure-openai",
      "grok",
      "bedrock",
    ];
    if (!supportedProviders.includes(provider as LLMProvider)) {
      return new Response(
        JSON.stringify({ error: `Invalid provider: ${provider}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check for required API keys
    const apiKeyChecks = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      "azure-openai": process.env.AZURE_OPENAI_API_KEY,
      grok: process.env.GROK_API_KEY,
      bedrock: process.env.ACCESS_KEY_ID, // For Bedrock
    };

    const hasApiKey = !!apiKeyChecks[provider as keyof typeof apiKeyChecks];

    if (!hasApiKey) {
      return new Response(
        JSON.stringify({
          error: `API key not configured for provider: ${provider}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Stream the chat completion
    const result = await streamText({
      model: getModel(provider as LLMProvider, model),
      messages,
      temperature,
      maxTokens: 1000,
    });

    // Create AI SDK 4.2 compatible streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const textPart of result.textStream) {
            // Send text chunk in AI SDK format
            controller.enqueue(
              encoder.encode(
                `0:"${textPart.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"\n`
              )
            );
          }

          // Send completion signal
          controller.enqueue(encoder.encode(`d:{"finishReason":"stop"}\n`));
        } catch (error) {
          console.error("LLM streaming error:", error);
          controller.enqueue(
            encoder.encode(
              `d:{"error":"${
                error instanceof Error ? error.message : "Unknown error"
              }"}\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
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
