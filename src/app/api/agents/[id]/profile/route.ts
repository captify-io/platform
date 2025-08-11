import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { AgentService } from "@/lib/services/agent-service";
import { UserAgent, UserProfile } from "@/types/agents";

// GET /api/agents/[id]/profile - Get agent profile data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const agentId = resolvedParams.id;

    // Get agent and verify ownership
    const agent = await AgentService.getAgent(agentId);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (agent.userId !== session.user.email) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      profile: agent.profileData || null,
      isProfileComplete: agent.isProfileComplete || false,
      instructions: agent.instructions,
    });
  } catch (error) {
    console.error("Error getting profile:", error);
    return NextResponse.json(
      { error: "Failed to get profile" },
      { status: 500 }
    );
  }
}

// PUT /api/agents/[id]/profile - Update agent profile data
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const agentId = resolvedParams.id;

    // Get agent and verify ownership
    const agent = await AgentService.getAgent(agentId);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (agent.userId !== session.user.email) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { profileData, regenerateInstructions } = body;

    const updateData: Partial<UserAgent> = {
      profileData: {
        ...agent.profileData,
        ...profileData,
        lastUpdated: new Date().toISOString(),
        interviewCompleted: true,
      } as UserProfile,
    };

    // If requested, regenerate instructions from profile data
    if (regenerateInstructions && profileData?.interviewState?.responses) {
      const personalizedInstructions = generatePersonalizedInstructions(
        profileData.interviewState.responses as Record<string, unknown>
      );
      updateData.instructions = personalizedInstructions;
    }

    // Update the agent
    await AgentService.updateAgent(agentId, updateData);

    // Get updated agent
    const updatedAgent = await AgentService.getAgent(agentId);

    return NextResponse.json({
      success: true,
      profile: updatedAgent?.profileData,
      instructions: updatedAgent?.instructions,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

function generatePersonalizedInstructions(
  responses: Record<string, unknown>
): string {
  const roleContext = (responses[0] as { value?: string })?.value || "";
  const dailyTasks = (responses[1] as { value?: string })?.value || "";
  const challenges = (responses[2] as { value?: string })?.value || "";
  const communicationStyle =
    (responses[3] as { value?: string })?.value || "conversational";
  const goals = (responses[4] as { value?: string })?.value || "";

  let instructions = `You are a personalized AI assistant for ${
    roleContext ? `a ${roleContext}` : "a professional"
  }.`;

  if (dailyTasks) {
    instructions += ` Your user's main responsibilities include: ${dailyTasks}.`;
  }

  if (challenges) {
    instructions += ` They are currently facing these challenges: ${challenges}. Be particularly helpful in addressing these areas.`;
  }

  // Adjust communication style
  switch (communicationStyle) {
    case "detailed":
      instructions +=
        " Provide comprehensive, detailed explanations with examples and context.";
      break;
    case "concise":
      instructions +=
        " Keep responses concise and to the point. Avoid unnecessary details.";
      break;
    case "conversational":
      instructions +=
        " Use a friendly, conversational tone. Be approachable and engaging.";
      break;
    case "formal":
      instructions +=
        " Maintain a professional, formal tone in all interactions.";
      break;
    case "technical":
      instructions +=
        " Focus on technical accuracy and data-driven insights. Use precise terminology.";
      break;
  }

  if (goals) {
    instructions += ` Help them achieve their goals: ${goals}.`;
  }

  instructions +=
    " Always be helpful, accurate, and aligned with their specific needs and working style.";

  return instructions;
}
