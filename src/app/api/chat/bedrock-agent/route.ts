import { NextRequest } from "next/server";
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { getUserSession } from "@/lib/services/session";

interface ChatMessage {
  role: string;
  content: string;
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

    const {
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
      AWS_SESSION_TOKEN,
      AWS_REGION,
    } = process.env;

    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
      return new Response(
        JSON.stringify({
          error: "Configuration Error",
          details:
            "Missing AWS credentials or region. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION on the server.",
          type: "ConfigError",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const client = new BedrockAgentRuntimeClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
        ...(AWS_SESSION_TOKEN ? { sessionToken: AWS_SESSION_TOKEN } : {}),
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
