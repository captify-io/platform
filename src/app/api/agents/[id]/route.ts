import { NextRequest, NextResponse } from "next/server";
import { GetAgentCommand } from "@aws-sdk/client-bedrock-agent";
import { bedrockAgentClient } from "@/lib/aws-bedrock";
import { BedrockAgent } from "@/types/agents";

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
    console.error("Error getting agent:", error);
    return NextResponse.json(
      {
        message: "Failed to get agent",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
