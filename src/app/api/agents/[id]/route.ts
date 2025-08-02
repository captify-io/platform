import { NextRequest, NextResponse } from "next/server";
import {
  GetAgentCommand,
  UpdateAgentCommand,
  DeleteAgentCommand,
} from "@aws-sdk/client-bedrock-agent";
import { bedrockAgentClient } from "@/lib/aws-bedrock";
import { UpdateAgentRequest, BedrockAgent } from "@/types/agents";

// GET /api/agents/[id] - Get specific agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const command = new GetAgentCommand({
      agentId: id,
    });

    const response = await bedrockAgentClient.send(command);

    if (!response.agent) {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }

    const agent: BedrockAgent = {
      agentId: response.agent.agentId || "",
      agentName: response.agent.agentName || "",
      agentArn: response.agent.agentArn,
      description: response.agent.description,
      foundationModel: response.agent.foundationModel || "",
      instruction: response.agent.instruction,
      agentStatus: response.agent.agentStatus as BedrockAgent["agentStatus"],
      agentResourceRoleArn: response.agent.agentResourceRoleArn,
      createdAt: response.agent.createdAt?.toISOString() || "",
      updatedAt: response.agent.updatedAt?.toISOString() || "",
      agentVersion: response.agent.agentVersion,
      idleSessionTTLInSeconds: response.agent.idleSessionTTLInSeconds,
      memoryConfiguration: response.agent.memoryConfiguration
        ? {
            enabledMemoryTypes:
              response.agent.memoryConfiguration.enabledMemoryTypes || [],
            storageDays: response.agent.memoryConfiguration.storageDays,
            sessionSummaryConfiguration: response.agent.memoryConfiguration
              .sessionSummaryConfiguration
              ? {
                  maxRecentSessions:
                    response.agent.memoryConfiguration
                      .sessionSummaryConfiguration.maxRecentSessions || 0,
                }
              : undefined,
          }
        : undefined,
      guardrailConfiguration: response.agent.guardrailConfiguration
        ? {
            guardrailIdentifier:
              response.agent.guardrailConfiguration.guardrailIdentifier || "",
            guardrailVersion:
              response.agent.guardrailConfiguration.guardrailVersion || "",
          }
        : undefined,
      failureReasons: response.agent.failureReasons,
      recommendedActions: response.agent.recommendedActions,
      clientToken: response.agent.clientToken,
      customerEncryptionKeyArn: response.agent.customerEncryptionKeyArn,
    };

    return NextResponse.json({ agent });
  } catch (error) {
    console.error("Error fetching agent:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch agent",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT /api/agents/[id] - Update agent
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateAgentRequest = await request.json();

    const command = new UpdateAgentCommand({
      agentId: id,
      agentName: body.agentName,
      description: body.description,
      foundationModel: body.foundationModel,
      instruction: body.instruction,
      agentResourceRoleArn: body.agentResourceRoleArn,
      idleSessionTTLInSeconds: body.idleSessionTTLInSeconds,
      memoryConfiguration: body.memoryConfiguration,
      guardrailConfiguration: body.guardrailConfiguration,
    });

    const response = await bedrockAgentClient.send(command);

    if (!response.agent) {
      throw new Error("Agent update failed - no agent returned");
    }

    const agent: BedrockAgent = {
      agentId: response.agent.agentId || "",
      agentName: response.agent.agentName || "",
      agentArn: response.agent.agentArn,
      description: response.agent.description,
      foundationModel: response.agent.foundationModel || "",
      instruction: response.agent.instruction,
      agentStatus: response.agent.agentStatus as BedrockAgent["agentStatus"],
      agentResourceRoleArn: response.agent.agentResourceRoleArn,
      createdAt: response.agent.createdAt?.toISOString() || "",
      updatedAt: response.agent.updatedAt?.toISOString() || "",
      agentVersion: response.agent.agentVersion,
      idleSessionTTLInSeconds: response.agent.idleSessionTTLInSeconds,
      memoryConfiguration: response.agent.memoryConfiguration
        ? {
            enabledMemoryTypes:
              response.agent.memoryConfiguration.enabledMemoryTypes || [],
            storageDays: response.agent.memoryConfiguration.storageDays,
            sessionSummaryConfiguration: response.agent.memoryConfiguration
              .sessionSummaryConfiguration
              ? {
                  maxRecentSessions:
                    response.agent.memoryConfiguration
                      .sessionSummaryConfiguration.maxRecentSessions || 0,
                }
              : undefined,
          }
        : undefined,
      guardrailConfiguration: response.agent.guardrailConfiguration
        ? {
            guardrailIdentifier:
              response.agent.guardrailConfiguration.guardrailIdentifier || "",
            guardrailVersion:
              response.agent.guardrailConfiguration.guardrailVersion || "",
          }
        : undefined,
      failureReasons: response.agent.failureReasons,
      recommendedActions: response.agent.recommendedActions,
      clientToken: response.agent.clientToken,
      customerEncryptionKeyArn: response.agent.customerEncryptionKeyArn,
    };

    return NextResponse.json({ agent });
  } catch (error) {
    console.error("Error updating agent:", error);
    return NextResponse.json(
      {
        message: "Failed to update agent",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/[id] - Delete agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const command = new DeleteAgentCommand({
      agentId: id,
      skipResourceInUseCheck: false,
    });

    await bedrockAgentClient.send(command);

    return NextResponse.json({ message: "Agent deleted successfully" });
  } catch (error) {
    console.error("Error deleting agent:", error);
    return NextResponse.json(
      {
        message: "Failed to delete agent",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
