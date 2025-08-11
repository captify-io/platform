/**
 * POST /api/agents/[id]/deploy - Deploy agent updates to AWS Bedrock
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { AgentService } from "@/lib/services/agent-service";
import {
  BedrockAgentClient,
  PrepareAgentCommand,
  CreateAgentAliasCommand,
} from "@aws-sdk/client-bedrock-agent";

// Initialize Bedrock Agent client
const bedrockClient = new BedrockAgentClient({
  region: process.env.REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

interface DeployAgentRequest {
  version?: string;
  description?: string;
  forceUpdate?: boolean;
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
    const body: DeployAgentRequest = await request.json();
    const { version, description, forceUpdate = false } = body;

    // Get agent details
    const agent = await AgentService.getAgent(agentId);
    if (!agent) {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }

    // Check permissions - user must own personal agents or be admin for others
    if (agent.type === "personal" && agent.userId !== session.user.email) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Validate agent is ready for deployment
    if (!agent.bedrockAgentId) {
      return NextResponse.json(
        { message: "Agent has not been created in Bedrock yet" },
        { status: 400 }
      );
    }

    // Check if agent needs update
    if (!forceUpdate && agent.isActive) {
      return NextResponse.json(
        {
          message:
            "Agent is already deployed. Use forceUpdate=true to redeploy.",
          currentVersion: agent.bedrockAliasId,
        },
        { status: 200 }
      );
    }

    // Prepare agent for deployment
    const prepareCommand = new PrepareAgentCommand({
      agentId: agent.bedrockAgentId,
    });

    const prepareResponse = await bedrockClient.send(prepareCommand);

    if (
      !prepareResponse.agentStatus ||
      prepareResponse.agentStatus === "FAILED"
    ) {
      return NextResponse.json(
        {
          message: "Failed to prepare agent for deployment",
          error: "Agent preparation failed",
        },
        { status: 500 }
      );
    }

    // Create new alias for this deployment
    const aliasName = version || `deployment-${Date.now()}`;
    const aliasDescription =
      description || `Deployment on ${new Date().toISOString()}`;

    const createAliasCommand = new CreateAgentAliasCommand({
      agentId: agent.bedrockAgentId,
      agentAliasName: aliasName,
      description: aliasDescription,
    });

    const aliasResponse = await bedrockClient.send(createAliasCommand);

    if (!aliasResponse.agentAlias?.agentAliasId) {
      return NextResponse.json(
        {
          message: "Failed to create agent alias",
          error: "No alias ID returned from Bedrock",
        },
        { status: 500 }
      );
    }

    // Update agent record with new alias
    const updatedAgent = await AgentService.updateAgent(agentId, {
      bedrockAliasId: aliasResponse.agentAlias.agentAliasId,
      isActive: true,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      message: "Agent deployed successfully",
      agent: updatedAgent,
      deployment: {
        aliasId: aliasResponse.agentAlias.agentAliasId,
        aliasName,
        description: aliasDescription,
        status: aliasResponse.agentAlias.agentAliasStatus,
        createdAt: aliasResponse.agentAlias.createdAt,
      },
    });
  } catch (error) {
    console.error("Error deploying agent:", error);
    return NextResponse.json(
      {
        message: "Failed to deploy agent",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
