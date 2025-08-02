import { NextRequest, NextResponse } from "next/server";
import {
  PrepareAgentCommand,
  GetAgentCommand,
} from "@aws-sdk/client-bedrock-agent";
import { bedrockAgentClient } from "@/lib/aws-bedrock";
import { BedrockAgent } from "@/types/agents";

// POST /api/agents/[id]/prepare - Prepare agent for deployment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const command = new PrepareAgentCommand({
      agentId: id,
    });

    const response = await bedrockAgentClient.send(command);

    if (!response.agentId) {
      throw new Error("Agent preparation failed - no agent ID returned");
    }

    // After preparing, fetch the updated agent details
    const getCommand = new GetAgentCommand({
      agentId: id,
    });

    const agentResponse = await bedrockAgentClient.send(getCommand);

    if (!agentResponse.agent) {
      throw new Error("Failed to fetch updated agent after preparation");
    }

    const agent: BedrockAgent = {
      agentId: agentResponse.agent.agentId || "",
      agentName: agentResponse.agent.agentName || "",
      agentArn: agentResponse.agent.agentArn,
      description: agentResponse.agent.description,
      foundationModel: agentResponse.agent.foundationModel || "",
      instruction: agentResponse.agent.instruction,
      agentStatus: agentResponse.agent.agentStatus as
        | "CREATING"
        | "PREPARING"
        | "PREPARED"
        | "NOT_PREPARED"
        | "DELETING"
        | "FAILED"
        | "VERSIONING"
        | "UPDATING",
      agentResourceRoleArn: agentResponse.agent.agentResourceRoleArn,
      createdAt: agentResponse.agent.createdAt?.toISOString() || "",
      updatedAt: agentResponse.agent.updatedAt?.toISOString() || "",
      agentVersion: agentResponse.agent.agentVersion,
      idleSessionTTLInSeconds: agentResponse.agent.idleSessionTTLInSeconds,
      memoryConfiguration: agentResponse.agent.memoryConfiguration
        ? {
            enabledMemoryTypes:
              agentResponse.agent.memoryConfiguration.enabledMemoryTypes || [],
            storageDays: agentResponse.agent.memoryConfiguration.storageDays,
            sessionSummaryConfiguration: agentResponse.agent.memoryConfiguration
              .sessionSummaryConfiguration
              ? {
                  maxRecentSessions:
                    agentResponse.agent.memoryConfiguration
                      .sessionSummaryConfiguration.maxRecentSessions || 0,
                }
              : undefined,
          }
        : undefined,
      guardrailConfiguration: agentResponse.agent.guardrailConfiguration
        ? {
            guardrailIdentifier:
              agentResponse.agent.guardrailConfiguration.guardrailIdentifier ||
              "",
            guardrailVersion:
              agentResponse.agent.guardrailConfiguration.guardrailVersion || "",
          }
        : undefined,
      failureReasons: agentResponse.agent.failureReasons,
      recommendedActions: agentResponse.agent.recommendedActions,
      clientToken: agentResponse.agent.clientToken,
      customerEncryptionKeyArn: agentResponse.agent.customerEncryptionKeyArn,
    };

    return NextResponse.json({
      agent,
      preparedAt: response.preparedAt?.toISOString(),
      agentVersion: response.agentVersion,
    });
  } catch (error) {
    console.error("Error preparing agent:", error);
    return NextResponse.json(
      {
        message: "Failed to prepare agent",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
