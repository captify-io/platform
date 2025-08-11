import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { AgentService } from "@/lib/services/agent-service";

// GET /api/agents/[id]/interview - Get current interview state
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

    // Get current interview state
    const interviewState = agent.profileData?.interviewState || {
      currentStep: 0,
      totalSteps: 5,
      completed: false,
      responses: {},
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      interviewState,
      agent: {
        id: agent.id,
        name: agent.name,
        profileComplete: agent.isProfileComplete || false,
      },
    });
  } catch (error) {
    console.error("Error getting interview state:", error);
    return NextResponse.json(
      { error: "Failed to get interview state" },
      { status: 500 }
    );
  }
}

// POST /api/agents/[id]/interview - Start or continue interview
export async function POST(
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

    const { action, stepData, currentStep } = body;

    if (action === "start") {
      // Initialize or reset interview
      const interviewState = {
        currentStep: 0,
        totalSteps: 5,
        completed: false,
        responses: {},
        lastUpdated: new Date().toISOString(),
      };

      await AgentService.updateAgent(agentId, {
        profileData: {
          ...agent.profileData,
          interviewCompleted: false,
          lastUpdated: new Date().toISOString(),
          interviewState,
        },
      });

      return NextResponse.json({
        success: true,
        interviewState,
        nextQuestion: getInterviewQuestion(0),
      });
    }

    if (action === "submit_step") {
      // Save step response and advance
      const currentState = agent.profileData?.interviewState || {
        currentStep: 0,
        totalSteps: 5,
        completed: false,
        responses: {},
        lastUpdated: new Date().toISOString(),
      };

      // Create a properly typed state object
      const updatedState = {
        currentStep: currentState.currentStep,
        totalSteps: currentState.totalSteps,
        completed: currentState.completed,
        responses: { ...currentState.responses, [currentStep]: stepData },
        lastUpdated: new Date().toISOString(),
      };

      // Check if this was the last step
      if (currentStep >= updatedState.totalSteps - 1) {
        updatedState.completed = true;

        // Generate personalized instructions from responses
        const personalizedInstructions = generatePersonalizedInstructions(
          updatedState.responses
        );

        // Update agent with completed profile
        await AgentService.updateAgent(agentId, {
          profileData: {
            ...agent.profileData,
            interviewCompleted: true,
            lastUpdated: new Date().toISOString(),
            interviewState: updatedState,
            personalizedInstructions,
          },
          isProfileComplete: true,
          instructions: personalizedInstructions,
        });

        return NextResponse.json({
          success: true,
          completed: true,
          interviewState: updatedState,
          personalizedInstructions,
        });
      } else {
        // Move to next step
        updatedState.currentStep = currentStep + 1;

        await AgentService.updateAgent(agentId, {
          profileData: {
            ...agent.profileData,
            interviewCompleted: false,
            lastUpdated: new Date().toISOString(),
            interviewState: updatedState,
          },
        });

        return NextResponse.json({
          success: true,
          interviewState: updatedState,
          nextQuestion: getInterviewQuestion(updatedState.currentStep),
        });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing interview:", error);
    return NextResponse.json(
      { error: "Failed to process interview" },
      { status: 500 }
    );
  }
}

function getInterviewQuestion(step: number) {
  const questions = [
    {
      id: "role_context",
      title: "Your Professional Role",
      question:
        "What is your primary role or profession? This helps me understand the context in which you work.",
      type: "text",
      placeholder: "e.g., Data Scientist, Marketing Manager, Software Engineer",
    },
    {
      id: "daily_tasks",
      title: "Daily Responsibilities",
      question:
        "What are your main daily tasks and responsibilities? What do you spend most of your time doing?",
      type: "textarea",
      placeholder: "Describe your typical workday and key responsibilities...",
    },
    {
      id: "challenges",
      title: "Current Challenges",
      question:
        "What are the biggest challenges or pain points you face in your work? What would you like help with?",
      type: "textarea",
      placeholder:
        "Describe the challenges you face and areas where you need support...",
    },
    {
      id: "communication_style",
      title: "Communication Preferences",
      question:
        "How do you prefer to receive information and communicate? What style works best for you?",
      type: "select",
      options: [
        { value: "detailed", label: "Detailed and comprehensive explanations" },
        { value: "concise", label: "Concise and to-the-point responses" },
        { value: "conversational", label: "Conversational and friendly tone" },
        { value: "formal", label: "Formal and professional tone" },
        { value: "technical", label: "Technical and data-driven approach" },
      ],
    },
    {
      id: "goals",
      title: "Goals and Objectives",
      question:
        "What are your main goals or objectives? What would success look like for you?",
      type: "textarea",
      placeholder: "Describe your short-term and long-term goals...",
    },
  ];

  return questions[step] || null;
}

function generatePersonalizedInstructions(
  responses: Record<string, { value?: string }>
): string {
  const roleContext = responses[0]?.value || "";
  const dailyTasks = responses[1]?.value || "";
  const challenges = responses[2]?.value || "";
  const communicationStyle = responses[3]?.value || "conversational";
  const goals = responses[4]?.value || "";

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
