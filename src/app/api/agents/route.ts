import { NextRequest, NextResponse } from "next/server";
import { AgentService } from "@/lib/services/agent-service";
import { AgentType, UserRole } from "@/types/agents";
import { getServerSession } from "next-auth/next";

// GET /api/agents - List agents (DynamoDB-based)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userRole = searchParams.get("userRole") as UserRole;
    const agentType = searchParams.get("type") as AgentType;
    const userId = session.user.email; // Use email as userId

    console.log("🔍 Listing agents for user:", { userId, userRole, agentType });

    if (agentType) {
      // Get agents by specific type
      const agents = await AgentService.getAgentsByType(agentType, true);
      return NextResponse.json({ agents });
    } else {
      // Get all accessible agents for user
      const agents = await AgentService.getAccessibleAgents(userId, userRole);
      return NextResponse.json({ agents });
    }
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

// POST /api/agents - Create agent (for specialized/application agents)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      type,
      instructions,
      bedrockAgentId,
      bedrockAliasId,
      s3FolderPath,
      allowedUserRoles,
      isPublic = false,
      memoryEnabled = true,
      isActive = true,
    } = body;

    // Validate required fields
    if (
      !name ||
      !type ||
      !instructions ||
      !bedrockAgentId ||
      !bedrockAliasId ||
      !s3FolderPath
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const agentId = `${type}-${Date.now()}`;
    const now = new Date().toISOString();

    const agent = await AgentService.createAgent({
      id: agentId,
      name,
      type,
      instructions,
      bedrockAgentId,
      bedrockAliasId,
      s3FolderPath,
      allowedUserRoles,
      isPublic,
      memoryEnabled,
      isActive,
      createdAt: now,
      updatedAt: now,
      maintainerId: session.user.email,
    });

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
