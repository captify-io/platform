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

interface ChatMessage {
  role: string;
  content: string;
}

export async function GET(req: NextRequest) {
  try {
    // Try to get user session for authentication, but don't fail if not available
    // TODO: Make this required once authentication is properly integrated
    try {
      await getUserSession(req);
    } catch (_error) {
      console.warn("No session available for GET /api/chat/bedrock-agent");
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

  // Update thread's updated_at and message_count
  await client.send(
    new UpdateItemCommand({
      TableName: "captify-chat-threads",
      Key: marshall({
        app_id: "console",
        thread_id: threadId,
      }),
      UpdateExpression: "SET updated_at = :updated_at ADD message_count :inc",
      ExpressionAttributeValues: marshall({
        ":updated_at": timestamp,
        ":inc": 1,
        ":userId": userId,
      }),
      ConditionExpression: "user_id = :userId",
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

    const { messages, sessionId, agentId, agentAliasId, workspaceId } =
      await req.json();
    console.log("📝 Request payload:", {
      messageCount: messages?.length,
      sessionId,
      agentId: agentId || process.env.BEDROCK_AGENT_ID,
      agentAliasId: agentAliasId || process.env.BEDROCK_AGENT_ALIAS_ID,
      userId: session.user_id,
      workspaceId,
      messages: messages?.map((m: ChatMessage) => ({
        role: m.role,
        contentLength: m.content?.length,
      })),
    });

    // Get the last user message as input for the agent
    const lastMessage = messages[messages.length - 1];
    const inputText = lastMessage?.content || "";
    console.log("💬 Input text for agent:", {
      inputLength: inputText.length,
      preview:
        inputText.substring(0, 100) + (inputText.length > 100 ? "..." : ""),
    });

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

    // Generate user-specific session ID
    const userSessionId =
      sessionId ||
      `session-${session.user_id}-${workspaceId || "default"}-${Date.now()}`;
    console.log("👤 User session ID:", userSessionId);
    console.log("✅ Bedrock Agent client initialized");

    const commandParams = {
      agentId: agentId || process.env.BEDROCK_AGENT_ID,
      agentAliasId: agentAliasId || process.env.BEDROCK_AGENT_ALIAS_ID,
      sessionId: userSessionId,
      inputText,
      enableTrace: false, // Disabled to reduce API payload size
    };
    console.log("📋 Command parameters:", commandParams);

    const command = new InvokeAgentCommand(commandParams);
    console.log("🚀 Invoking Bedrock Agent...");

    const response = await client.send(command);
    console.log("📥 Bedrock Agent response received:", {
      hasCompletion: !!response.completion,
      sessionId: response.sessionId,
      contentType: response.contentType,
    });

    // Create a streaming response compatible with the AI SDK
    console.log("🌊 Creating streaming response...");
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        console.log("📡 Stream started");

        try {
          if (response.completion) {
            console.log("✅ Completion stream available, processing chunks...");
            let fullResponse = "";
            let chunkCount = 0;

            for await (const chunk of response.completion) {
              chunkCount++;
              console.log(`📦 Processing chunk ${chunkCount}:`, {
                hasTrace: !!chunk.trace,
                hasChunk: !!chunk.chunk,
                chunkBytes: chunk.chunk?.bytes ? chunk.chunk.bytes.length : 0,
              });

              // Handle trace events for reasoning
              if (chunk.trace) {
                try {
                  const traceJson = JSON.stringify(chunk.trace);
                  const marker = `<!--TRACEJSON:${Buffer.from(
                    traceJson
                  ).toString("base64")}-->`;
                  const escaped = marker.replace(/"/g, '\\"');
                  controller.enqueue(encoder.encode(`0:"${escaped}"\n`));
                } catch {}
              }

              const t: unknown = chunk.trace;
              const rationaleText =
                (
                  t as {
                    orchestrationTrace?: { rationale?: { text?: string } };
                    postProcessingTrace?: { rationale?: { text?: string } };
                    preProcessingTrace?: { rationale?: { text?: string } };
                  }
                )?.orchestrationTrace?.rationale?.text ??
                (
                  t as {
                    orchestrationTrace?: { rationale?: { text?: string } };
                    postProcessingTrace?: { rationale?: { text?: string } };
                    preProcessingTrace?: { rationale?: { text?: string } };
                  }
                )?.postProcessingTrace?.rationale?.text ??
                (
                  t as {
                    orchestrationTrace?: { rationale?: { text?: string } };
                    postProcessingTrace?: { rationale?: { text?: string } };
                    preProcessingTrace?: { rationale?: { text?: string } };
                  }
                )?.preProcessingTrace?.rationale?.text;

              if (rationaleText) {
                const marker = `<!--TRACE:${Buffer.from(rationaleText).toString(
                  "base64"
                )}-->`;
                const escaped = marker.replace(/"/g, '\\"');
                controller.enqueue(encoder.encode(`0:"${escaped}"\n`));
              }

              // Handle actual response content
              if (chunk.chunk?.bytes) {
                const text = new TextDecoder().decode(chunk.chunk.bytes);
                console.log("📝 Text chunk decoded:", {
                  length: text.length,
                  preview:
                    text.substring(0, 50) + (text.length > 50 ? "..." : ""),
                });
                fullResponse += text;

                // Stream the text chunk
                const escapedText = text
                  .replace(/\\/g, "\\\\")
                  .replace(/"/g, '\\"')
                  .replace(/\n/g, "\\n")
                  .replace(/\r/g, "\\r");
                const streamChunk = `0:"${escapedText}"\n`;
                controller.enqueue(encoder.encode(streamChunk));
                console.log("📤 Chunk sent to client");
              }
            }

            console.log("🏁 Streaming complete:", {
              totalChunks: chunkCount,
              totalResponseLength: fullResponse.length,
              responsePreview:
                fullResponse.substring(0, 100) +
                (fullResponse.length > 100 ? "..." : ""),
            });

            // Send completion signal
            const finishChunk = `d:{"finishReason":"stop","usage":{"promptTokens":${inputText.length},"completionTokens":${fullResponse.length}}}\n`;
            controller.enqueue(encoder.encode(finishChunk));
            console.log("✅ Completion signal sent");

            // Save messages to database if threadId is provided (looks like a UUID)
            if (sessionId && sessionId.includes("-") && sessionId.length > 20) {
              try {
                console.log(
                  "💾 Saving messages to database for thread:",
                  sessionId
                );
                const dynamoClient = getDynamoDBClient();

                // Save user message
                await saveMessageToDynamoDB(
                  dynamoClient,
                  sessionId, // threadId
                  `msg-${Date.now()}-user`,
                  "user",
                  inputText,
                  session.user_id
                );

                // Save assistant response
                await saveMessageToDynamoDB(
                  dynamoClient,
                  sessionId, // threadId
                  `msg-${Date.now()}-assistant`,
                  "assistant",
                  fullResponse,
                  session.user_id
                );

                console.log("✅ Messages saved to database");
              } catch (dbError) {
                console.error(
                  "❌ Failed to save messages to database:",
                  dbError
                );
                // Don't fail the request if database save fails
              }
            }
          } else {
            console.log("❌ No completion stream in response");
          }
        } catch (error) {
          console.error("💥 Stream processing error:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          const errorChunk = `d:{"error":"${errorMessage}"}\n`;
          controller.enqueue(encoder.encode(errorChunk));
        } finally {
          console.log("🔚 Stream closed");
          controller.close();
        }
      },
    });

    console.log("📡 Creating HTTP response with streaming headers...");
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "x-vercel-ai-data-stream": "v1",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("💥 Bedrock Agent API error:", error);

    const errorInfo =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            // AWS SDK errors might have $metadata
            ...(typeof error === "object" &&
              error !== null &&
              "$metadata" in error && {
                awsMetadata: (error as Record<string, unknown>).$metadata,
              }),
          }
        : { name: "Unknown", message: "An unknown error occurred" };

    console.error("Error details:", errorInfo);

    // Log specific AWS errors
    if (errorInfo.name === "AccessDeniedException") {
      console.error(
        "🔒 AWS Access Denied - Check your credentials and permissions"
      );
    } else if (errorInfo.name === "ResourceNotFoundException") {
      console.error("🔍 AWS Resource Not Found - Check agent ID and alias ID");
    } else if (errorInfo.name === "ValidationException") {
      console.error("⚠️ AWS Validation Error - Check request parameters");
    }

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
