import { NextRequest, NextResponse } from "next/server";
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";
import {
  AgentTestRequest,
  AgentTestResponse,
  Citation,
  TraceEvent,
} from "@/types/agents";

const client = new BedrockAgentRuntimeClient({
  region: process.env.REGION || "us-east-1",
});

export async function POST(request: NextRequest) {
  try {
    const body: AgentTestRequest = await request.json();
    const {
      agentId,
      agentAliasId = "TSTALIASID",
      sessionId,
      inputText,
      enableTrace = false,
    } = body;

    if (!agentId || !inputText) {
      return NextResponse.json(
        { error: "Agent ID and input text are required" },
        { status: 400 }
      );
    }

    const command = new InvokeAgentCommand({
      agentId,
      agentAliasId,
      sessionId: sessionId || `session-${Date.now()}`,
      inputText,
      enableTrace,
    });

    const response = await client.send(command);

    // Process the response stream
    let completion = "";
    const citations: unknown[] = [];
    const trace: unknown[] = [];

    if (response.completion) {
      for await (const chunk of response.completion) {
        if (chunk.chunk?.bytes) {
          const decoder = new TextDecoder("utf-8");
          const text = decoder.decode(chunk.chunk.bytes);
          completion += text;
        }

        if (chunk.trace) {
          trace.push(chunk.trace);
        }
      }
    }

    const result: AgentTestResponse = {
      agentId,
      sessionId: sessionId || `session-${Date.now()}`,
      completion,
      citations: citations as Citation[],
      trace: enableTrace ? (trace as TraceEvent[]) : undefined,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error testing agent:", error);

    let errorMessage = "An unexpected error occurred while testing the agent";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Handle specific AWS errors
      if (error.name === "ResourceNotFoundException") {
        errorMessage = "Agent not found or not accessible";
        statusCode = 404;
      } else if (error.name === "ValidationException") {
        errorMessage = "Invalid agent configuration or input";
        statusCode = 400;
      } else if (error.name === "AccessDeniedException") {
        errorMessage = "Access denied to agent or required resources";
        statusCode = 403;
      } else if (error.name === "ThrottlingException") {
        errorMessage = "Request rate limit exceeded";
        statusCode = 429;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: statusCode }
    );
  }
}
