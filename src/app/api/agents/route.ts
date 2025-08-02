import { NextRequest, NextResponse } from "next/server";
import {
  CreateAgentCommand,
  ListAgentsCommand,
  GetAgentCommand,
} from "@aws-sdk/client-bedrock-agent";
import { bedrockAgentClient, generateClientToken } from "@/lib/aws-bedrock";
import { CreateAgentRequest, BedrockAgent } from "@/types/agents";

// GET /api/agents - List all agents
export async function GET() {
  try {
    const command = new ListAgentsCommand({
      maxResults: 50,
    });

    const response = await bedrockAgentClient.send(command);

    // Get detailed information for each agent
    const agents: BedrockAgent[] = [];

    if (response.agentSummaries) {
      for (const summary of response.agentSummaries) {
        try {
          const detailCommand = new GetAgentCommand({
            agentId: summary.agentId,
          });
          const detailResponse = await bedrockAgentClient.send(detailCommand);

          if (detailResponse.agent) {
            agents.push({
              agentId: detailResponse.agent.agentId || "",
              agentName: detailResponse.agent.agentName || "",
              agentArn: detailResponse.agent.agentArn,
              description: detailResponse.agent.description,
              foundationModel: detailResponse.agent.foundationModel || "",
              instruction: detailResponse.agent.instruction,
              agentStatus: detailResponse.agent.agentStatus as
                | "CREATING"
                | "PREPARING"
                | "PREPARED"
                | "NOT_PREPARED"
                | "DELETING"
                | "FAILED"
                | "VERSIONING"
                | "UPDATING",
              agentResourceRoleArn: detailResponse.agent.agentResourceRoleArn,
              createdAt: detailResponse.agent.createdAt?.toISOString() || "",
              updatedAt: detailResponse.agent.updatedAt?.toISOString() || "",
              agentVersion: detailResponse.agent.agentVersion,
              idleSessionTTLInSeconds:
                detailResponse.agent.idleSessionTTLInSeconds,
              memoryConfiguration: detailResponse.agent.memoryConfiguration
                ? {
                    enabledMemoryTypes:
                      detailResponse.agent.memoryConfiguration
                        .enabledMemoryTypes || [],
                    storageDays:
                      detailResponse.agent.memoryConfiguration.storageDays,
                    sessionSummaryConfiguration: detailResponse.agent
                      .memoryConfiguration.sessionSummaryConfiguration
                      ? {
                          maxRecentSessions:
                            detailResponse.agent.memoryConfiguration
                              .sessionSummaryConfiguration.maxRecentSessions ||
                            0,
                        }
                      : undefined,
                  }
                : undefined,
              guardrailConfiguration: detailResponse.agent
                .guardrailConfiguration
                ? {
                    guardrailIdentifier:
                      detailResponse.agent.guardrailConfiguration
                        .guardrailIdentifier || "",
                    guardrailVersion:
                      detailResponse.agent.guardrailConfiguration
                        .guardrailVersion || "",
                  }
                : undefined,
              failureReasons: detailResponse.agent.failureReasons,
              recommendedActions: detailResponse.agent.recommendedActions,
              clientToken: detailResponse.agent.clientToken,
              customerEncryptionKeyArn:
                detailResponse.agent.customerEncryptionKeyArn,
            });
          }
        } catch (detailError) {
          console.error(
            `Error fetching details for agent ${summary.agentId}:`,
            detailError
          );
          // Add basic info if detail fetch fails
          agents.push({
            agentId: summary.agentId || "",
            agentName: summary.agentName || "",
            description: summary.description,
            foundationModel: "",
            agentStatus: summary.agentStatus as
              | "CREATING"
              | "PREPARING"
              | "PREPARED"
              | "NOT_PREPARED"
              | "DELETING"
              | "FAILED"
              | "VERSIONING"
              | "UPDATING",
            createdAt: summary.updatedAt?.toISOString() || "",
            updatedAt: summary.updatedAt?.toISOString() || "",
          });
        }
      }
    }

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Error listing agents:", error);
    return NextResponse.json(
      {
        message: "Failed to list agents",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
  try {
    const body: CreateAgentRequest = await request.json();

    const command = new CreateAgentCommand({
      agentName: body.agentName,
      description: body.description,
      foundationModel: body.foundationModel,
      instruction: body.instruction,
      agentResourceRoleArn: body.agentResourceRoleArn,
      idleSessionTTLInSeconds: body.idleSessionTTLInSeconds || 3600, // 1 hour default
      memoryConfiguration: body.memoryConfiguration,
      guardrailConfiguration: body.guardrailConfiguration,
      tags: body.tags,
      clientToken: generateClientToken(),
      customerEncryptionKeyArn: body.customerEncryptionKeyArn,
    });

    const response = await bedrockAgentClient.send(command);

    if (!response.agent) {
      throw new Error("Agent creation failed - no agent returned");
    }

    const agent: BedrockAgent = {
      agentId: response.agent.agentId || "",
      agentName: response.agent.agentName || "",
      agentArn: response.agent.agentArn,
      description: response.agent.description,
      foundationModel: response.agent.foundationModel || "",
      instruction: response.agent.instruction,
      agentStatus: response.agent.agentStatus as
        | "CREATING"
        | "PREPARING"
        | "PREPARED"
        | "NOT_PREPARED"
        | "DELETING"
        | "FAILED"
        | "VERSIONING"
        | "UPDATING",
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

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error("Error creating agent:", error);
    return NextResponse.json(
      {
        message: "Failed to create agent",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
