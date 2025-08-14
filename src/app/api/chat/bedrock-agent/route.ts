import { NextRequest } from "next/server";
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";
import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { getUserSession } from "@/lib/services/session";

export async function GET(req: NextRequest) {
  try {
    // Try to get user session for authentication, but don't fail if not available
    // TODO: Make this required once authentication is properly integrated
    try {
      await getUserSession(req);
    } catch (error) {
      console.warn("No session available for GET /api/chat/bedrock-agent", error);
    }

    // For now, return a static list of agents based on environment variables
    // In the future, this could query AWS Bedrock to get available agents
    const agents = [
      {
        id: process.env.BEDROCK_AGENT_ID || "console-agent",
        name: "Captify Console Agent",
        description: "AI assistant for general chat and console operations",
        icon: "Bot",
        default: true,
      },
    ];

    const defaultAgentId = process.env.BEDROCK_AGENT_ID || "console-agent";

    return new Response(
      JSON.stringify({
        agents,
        defaultAgentId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching agents:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch agents" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Helper function to get DynamoDB client
function getDynamoDBClient() {
  return new DynamoDBClient({
    region: process.env.REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
  });
}

// Helper function to save a message to DynamoDB
async function saveMessageToDynamoDB(
  client: DynamoDBClient,
  threadId: string,
  messageId: string,
  role: string,
  content: string,
  userId: string
) {
  const timestamp = new Date().toISOString();
  const timestampWithMicros = `${timestamp.slice(0, -1)}${String(
    Date.now()
  ).slice(-3)}Z`;

  await client.send(
    new PutItemCommand({
      TableName: "captify-chat-messages",
      Item: marshall({
        thread_id: threadId,
        timestamp: timestampWithMicros,
        message_id: messageId,
        role: role,
        content: content,
        created_at: timestamp,
        tool_runs: [],
        citations: [],
        meta: {},
      }),
    })
  );

  // Update thread's updated_at and message_count (upsert operation)
  await client.send(
    new UpdateItemCommand({
      TableName: "captify-chat-threads",
      Key: marshall({
        app_id: "console",
        thread_id: threadId,
      }),
      UpdateExpression:
        "SET updated_at = :updated_at, user_id = :userId ADD message_count :inc",
      ExpressionAttributeValues: marshall({
        ":updated_at": timestamp,
        ":inc": 1,
        ":userId": userId,
      }),
      // Remove the condition to allow upsert (create if not exists, update if exists)
    })
  );
}

export async function POST(req: NextRequest) {
  try {
    // Get user session for authentication
    const session = await getUserSession(req);
    if (!session) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const requestBody = await req.json();
    const { messages, sessionId, agentId, agentAliasId, workspaceId } =
      requestBody;

    // Get the last user message as input for the agent
    const lastMessage = messages[messages.length - 1];
    const inputText = lastMessage?.content || "";

    const { ACCESS_KEY_ID, SECRET_ACCESS_KEY, SESSION_TOKEN, REGION } =
      process.env;

    if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !REGION) {
      return new Response(
        JSON.stringify({
          error: "Configuration Error",
          details:
            "Missing AWS credentials or region. Set ACCESS_KEY_ID, SECRET_ACCESS_KEY, and REGION on the server.",
          type: "ConfigError",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const client = new BedrockAgentRuntimeClient({
      region: REGION,
      credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
        ...(SESSION_TOKEN ? { sessionToken: SESSION_TOKEN } : {}),
      },
    });

    // Generate user-specific session ID (sanitize for Bedrock Agent regex: [0-9a-zA-Z._:-]+)
    const sanitizeSessionId = (id: string) => {
      return id
        .replace(/@/g, "-at-")
        .replace(/[^0-9a-zA-Z._:-]/g, "-")
        .substring(0, 100);
    };

    const userSessionId =
      sessionId ||
      `session-${sanitizeSessionId(session.user_id)}-${
        workspaceId || "default"
      }-${Date.now()}`;

    const commandParams = {
      agentId: agentId || process.env.BEDROCK_AGENT_ID,
      agentAliasId: agentAliasId || process.env.BEDROCK_AGENT_ALIAS_ID,
      sessionId: userSessionId,
      inputText,
      enableTrace: true,
    };

    const command = new InvokeAgentCommand(commandParams);
    const response = await client.send(command);

    // Create a readable stream for AI SDK 4.2 compatibility
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullResponse = "";

        try {
          if (response.completion) {
            for await (const chunk of response.completion) {
              // Handle actual response content
              if (chunk.chunk?.bytes) {
                const text = new TextDecoder().decode(chunk.chunk.bytes);
                fullResponse += text;

                // Send text chunk in AI SDK format
                controller.enqueue(
                  encoder.encode(
                    `0:"${text.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"\n`
                  )
                );
              }
            }

            // Send completion signal
            controller.enqueue(encoder.encode(`d:{"finishReason":"stop"}\n`));

            // Save messages to database if sessionId is provided
            if (
              sessionId &&
              sessionId.includes("-") &&
              sessionId.length > 20 &&
              session
            ) {
              try {
                const dynamoClient = getDynamoDBClient();

                // Save user message
                await saveMessageToDynamoDB(
                  dynamoClient,
                  sessionId,
                  `msg-${Date.now()}-user`,
                  "user",
                  inputText,
                  session.user_id
                );

                // Save assistant response
                await saveMessageToDynamoDB(
                  dynamoClient,
                  sessionId,
                  `msg-${Date.now()}-assistant`,
                  "assistant",
                  fullResponse,
                  session.user_id
                );
              } catch (dbError) {
                console.error("Failed to save messages to database:", dbError);
              }
            }
          }
        } catch (error) {
          console.error("Stream processing error:", error);
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
    console.error("Bedrock Agent API error:", error);

    const errorInfo =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            ...(typeof error === "object" &&
              error !== null &&
              "$metadata" in error && {
                awsMetadata: (error as Record<string, unknown>).$metadata,
              }),
          }
        : { name: "Unknown", message: "An unknown error occurred" };

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: errorInfo.message,
        type: errorInfo.name,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
