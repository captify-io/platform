import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { AgentService } from "@/lib/services/agent-service";

// GET /api/agents/[id] - Get specific agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const agent = await AgentService.getAgent(id);

    if (!agent) {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }

    // Check access permissions
    if (agent.userId && agent.userId !== session.user.email) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

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

// PUT /api/agents/[id] - Update agent
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const updates = await request.json();

    // Get existing agent to check permissions
    const existingAgent = await AgentService.getAgent(id);
    if (!existingAgent) {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }

    // Check access permissions
    if (existingAgent.userId && existingAgent.userId !== session.user.email) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const updatedAgent = await AgentService.updateAgent(id, updates);
    return NextResponse.json({ agent: updatedAgent });
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
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get existing agent to check permissions
    const existingAgent = await AgentService.getAgent(id);
    if (!existingAgent) {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }

    // Check access permissions
    if (existingAgent.userId && existingAgent.userId !== session.user.email) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    await AgentService.deleteAgent(id);
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
