import { NextRequest } from "next/server";
import { getAwsCredentialsFromIdentityPool } from "../../lib/credentials";
import { auth } from "../../../../lib/auth";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

export async function GET(request: NextRequest) {
  return handleRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return handleRequest(request, "POST");
}

async function handleRequest(request: NextRequest, method: string) {
  const headers = {
    "Content-Type": "application/json",
  };

  try {

    // Get request data
    const body = method === "POST" ? await request.json() : {};
    const provider = body.provider || request.nextUrl.searchParams.get('provider');

    // Get session for authentication
    const session = await auth();
    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers }
      );
    }

    // Get AWS credentials
    const identityPoolId = process.env.COGNITO_IDENTITY_POOL_ID;
    if (!identityPoolId) {
      return new Response(
        JSON.stringify({ error: "AWS configuration missing" }),
        { status: 500, headers }
      );
    }

    const credentials = await getAwsCredentialsFromIdentityPool(
      session,
      identityPoolId,
      false
    );

    const schema = process.env.SCHEMA || "captify";

    // If no provider specified, return all available providers
    if (!provider) {
      try {
        const providers = await getAvailableProviders(credentials, schema);
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              providers: providers.map(p => ({
                id: p.id,
                name: p.name,
                status: p.status
              }))
            }
          }),
          { status: 200, headers }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: "Failed to fetch providers",
            details: error instanceof Error ? error.message : "Unknown error"
          }),
          { status: 500, headers }
        );
      }
    }

    // Fetch models for the specified provider
    try {
      const models = await getModelsForProvider(provider, credentials, schema);

      if (models.length === 0) {
        return new Response(
          JSON.stringify({
            error: `No models found for provider: ${provider}`,
            success: false
          }),
          { status: 404, headers }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            provider,
            models: models.map(m => ({
              id: m.modelId,
              name: m.name,
              description: m.description,
              status: m.status
            })),
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
      { status: 500, headers }
    );
  }
}

// Get available providers from DynamoDB
async function getAvailableProviders(credentials: any, schema: string): Promise<any[]> {
  const client = new DynamoDBClient({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });

  const docClient = DynamoDBDocumentClient.from(client);
  const tableName = `${schema}-core-provider`;

  const command = new ScanCommand({
    TableName: tableName,
    FilterExpression: '#status = :status',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':status': 'active'
    }
  });

  const response = await docClient.send(command);
  return response.Items || [];
}

// Get models for a specific provider from DynamoDB
async function getModelsForProvider(providerId: string, credentials: any, schema: string): Promise<any[]> {
  const client = new DynamoDBClient({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });

  const docClient = DynamoDBDocumentClient.from(client);
  const tableName = `${schema}-core-provider-model`;

  const command = new QueryCommand({
    TableName: tableName,
    IndexName: 'providerId-index',
    KeyConditionExpression: 'providerId = :providerId',
    FilterExpression: '#status = :status',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':providerId': providerId,
      ':status': 'active'
    }
  });

  const response = await docClient.send(command);
  return response.Items || [];
}
