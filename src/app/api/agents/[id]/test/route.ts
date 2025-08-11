/**
 * POST /api/agents/[id]/test - Test agent functionality with a sample conversation
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { AgentService } from "@/lib/services/agent-service";
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { v4 as uuidv4 } from "uuid";

interface TestAgentRequest {
  testMessage?: string;
  sessionId?: string;
  includeContext?: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const agentId = resolvedParams.id;
    const body: TestAgentRequest = await request.json();
    const {
      testMessage = "Hello! Can you tell me about yourself and what you can help me with?",
      sessionId = uuidv4(),
      includeContext = true,
    } = body;

    // Get agent details
    const agent = await AgentService.getAgent(agentId);
    if (!agent) {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }

    // Check permissions - user must own personal agents or be admin for others
    if (agent.type === "personal" && agent.userId !== session.user.email) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Validate agent is deployed
    if (!agent.bedrockAgentId || !agent.bedrockAliasId) {
      return NextResponse.json(
        {
          message: "Agent is not deployed yet. Please deploy the agent first.",
          needsDeployment: true,
        },
        { status: 400 }
      );
    }

    if (!agent.isActive) {
      return NextResponse.json(
        {
          message: "Agent is not active. Please deploy the agent first.",
          needsDeployment: true,
        },
        { status: 400 }
      );
    }

    // Prepare test message with context if requested
    let finalTestMessage = testMessage;
    if (includeContext && agent.type === "personal" && agent.profileData) {
      const role = agent.profileData.organizationalRole || "unspecified";
      const dept = agent.profileData.department || "unspecified department";
      finalTestMessage = `${testMessage}\n\nContext: I am a ${role} in ${dept}.`;
    }

    // Test the agent
    const testStartTime = Date.now();

    try {
      const client = new BedrockAgentRuntimeClient({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      const command = new InvokeAgentCommand({
        agentId: agent.bedrockAgentId,
        agentAliasId: agent.bedrockAliasId,
        sessionId,
        inputText: finalTestMessage,
      });

      const response = await client.send(command);

      const testEndTime = Date.now();
      const responseTime = testEndTime - testStartTime;

      // Process the streaming response
      let fullResponse = "";
      if (response.completion) {
        for await (const chunk of response.completion) {
          if (chunk.chunk?.bytes) {
            const chunkText = new TextDecoder().decode(chunk.chunk.bytes);
            fullResponse += chunkText;
          }
        }
      }

      return NextResponse.json({
        success: true,
        test: {
          agentId: agent.id,
          agentName: agent.name,
          agentType: agent.type,
          sessionId,
          testMessage: finalTestMessage,
          response: fullResponse,
          responseTime,
          timestamp: new Date().toISOString(),
        },
        agent: {
          id: agent.id,
          name: agent.name,
          type: agent.type,
          isActive: agent.isActive,
          bedrockAgentId: agent.bedrockAgentId,
          bedrockAliasId: agent.bedrockAliasId,
        },
        sessionId: response.sessionId,
      });
    } catch (invokeError) {
      console.error("Error invoking agent:", invokeError);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Failed to invoke agent",
            details:
              invokeError instanceof Error
                ? invokeError.message
                : "Unknown error",
            agentId: agent.bedrockAgentId,
            aliasId: agent.bedrockAliasId,
          },
          agent: {
            id: agent.id,
            name: agent.name,
            type: agent.type,
            isActive: agent.isActive,
            bedrockAgentId: agent.bedrockAgentId,
            bedrockAliasId: agent.bedrockAliasId,
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error testing agent:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to test agent",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
