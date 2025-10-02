import { NextRequest } from "next/server";
import { getAwsCredentialsFromIdentityPool } from "../../lib/credentials";
import { auth } from "../../../../lib/auth";

export async function GET(request: NextRequest) {
  return handleRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return handleRequest(request, "POST");
}

async function handleRequest(request: NextRequest, method: string) {
  try {
    // Add CORS headers
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": process.env.NODE_ENV === "development"
        ? request.headers.get("origin") || process.env.DEV_ORIGIN || "http://localhost:3001"
        : `https://${process.env.DOMAIN || "captify.io"}`,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-app",
      "Access-Control-Allow-Credentials": "true",
    };

    // Handle OPTIONS request for CORS
    if (method === "OPTIONS") {
      return new Response(null, { status: 200, headers });
    }

    // Get request data
    const body = method === "POST" ? await request.json() : {};
    const provider = body.provider || request.nextUrl.searchParams.get('provider');

    if (!provider) {
      return new Response(
        JSON.stringify({
          error: "Provider parameter is required",
          availableProviders: ["agent", "openai", "anthropic", "bedrock"],
        }),
        { status: 400, headers }
      );
    }

    // Get session for authentication
    const session = await auth();
    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers }
      );
    }

    let models: string[] = [];

    try {
      switch (provider) {
        case "agent":
          // For agents, return available agent models based on app context
          const app = request.headers.get("x-app") || "core";
          models = await getAgentModels(app, session, request);
          break;

        case "openai":
          models = [
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4-turbo",
            "gpt-3.5-turbo"
          ];
          break;

        case "anthropic":
          models = [
            "claude-3-5-sonnet-20241022",
            "claude-3-5-haiku-20241022",
            "claude-3-opus-20240229",
            "claude-3-sonnet-20240229",
            "claude-3-haiku-20240307"
          ];
          break;

        case "bedrock":
          // Try to fetch models from Bedrock API if credentials available
          try {
            const identityPoolId = process.env.COGNITO_IDENTITY_POOL_ID;
            if (!identityPoolId) {
              throw new Error("COGNITO_IDENTITY_POOL_ID not configured");
            }
            const credentials = await getAwsCredentialsFromIdentityPool(
              session,
              identityPoolId,
              false
            );
            models = await getBedrockModels(credentials);
          } catch (error) {
            models = [
              "anthropic.claude-3-5-sonnet-20241022-v2:0",
              "anthropic.claude-3-haiku-20240307-v1:0",
              "anthropic.claude-3-opus-20240229-v1:0",
              "amazon.titan-text-premier-v1:0",
              "meta.llama3-70b-instruct-v1:0"
            ];
          }
          break;

        default:
          return new Response(
            JSON.stringify({
              error: `Unknown provider: ${provider}`,
              availableProviders: ["agent", "openai", "anthropic", "bedrock"],
            }),
            { status: 400, headers }
          );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            provider,
            models,
            count: models.length
          }
        }),
        { status: 200, headers }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to fetch models for ${provider}`,
          details: error instanceof Error ? error.message : "Unknown error"
        }),
        { status: 500, headers }
      );
    }

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500 }
    );
  }
}

// Get available agent models based on app context
async function getAgentModels(app: string, session: any, request: NextRequest): Promise<string[]> {
  // Default core agent is always available
  const models = ["core"];

  // Only core agents are supported - external apps are no longer dynamically loaded

  return models;
}

// Get available Bedrock models via API
async function getBedrockModels(credentials: any): Promise<string[]> {
  try {
    const { BedrockClient, ListFoundationModelsCommand } = await import("@aws-sdk/client-bedrock");

    const client = new BedrockClient({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    });

    const command = new ListFoundationModelsCommand({
      byOutputModality: "TEXT"
    });

    const response = await client.send(command);

    return response.modelSummaries?.map(model => model.modelId || "") || [];
  } catch (error) {
    // Return default models as fallback
    return [
      "anthropic.claude-3-5-sonnet-20241022-v2:0",
      "anthropic.claude-3-haiku-20240307-v1:0",
      "amazon.titan-text-premier-v1:0"
    ];
  }
}