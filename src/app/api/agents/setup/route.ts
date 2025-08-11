import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { AgentService } from "@/lib/services/agent-service";
import { LambdaInvocationService } from "@/lib/services/lambda-invocation";
import { v4 as uuidv4 } from "uuid";

// GET /api/agents/setup - Check user setup status
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.email;
    const setupStatus = await AgentService.checkUserSetupStatus(userId);

    return NextResponse.json(setupStatus);
  } catch (error) {
    console.error("Error checking setup status:", error);
    return NextResponse.json(
      {
        message: "Failed to check setup status",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/agents/setup - Create personal agent
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      agentName,
      agentDescription,
      organizationalRole,
      department,
      specialFocus,
    } = body;

    // Validate required fields
    if (!agentName) {
      return NextResponse.json(
        { message: "Missing required field: agentName" },
        { status: 400 }
      );
    }

    const userId = session.user.email;

    // Check if user already has a personal agent
    const existingAgent = await AgentService.getUserPersonalAgent(userId);
    if (existingAgent) {
      return NextResponse.json(
        {
          message: "User already has a personal agent",
          agentId: existingAgent.id,
        },
        { status: 409 }
      );
    }

    // Generate basic instructions for the agent
    const baseInstructions = `You are a personal digital assistant for the Air Force Sustainment Center. Your user works in ${
      department || "operations"
    } with a role in ${organizationalRole || "general operations"}. ${
      specialFocus ? `They focus on: ${specialFocus.join(", ")}.` : ""
    } Provide helpful, accurate, and professional assistance tailored to their role and responsibilities.`;

    const jobId = uuidv4();

    // Create job record in DynamoDB
    await AgentService.createAgentJob({
      id: jobId,
      userId,
      agentType: "personal",
      status: "PENDING",
      progress: 0,
      currentStep: "Creating your personal digital twin",
      createdAt: new Date().toISOString(),
    });

    // Trigger Lambda function for agent creation
    const lambdaResult = await LambdaInvocationService.invokeAgentCreation({
      jobId,
      userId,
      agentName,
      agentType: "personal",
      instructions: baseInstructions,
      organizationalRole,
      description: agentDescription,
    });

    if (!lambdaResult.success) {
      // Update job with failure
      await AgentService.updateAgentJob(jobId, {
        status: "FAILED",
        error: lambdaResult.error,
        progress: 0,
      });

      return NextResponse.json(
        {
          message: "Failed to create personal agent",
          error: lambdaResult.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Personal agent creation started",
      jobId,
      estimatedDuration: "12-15 minutes",
      lambdaInvoked: true,
    });
  } catch (error) {
    console.error("Error creating personal agent:", error);
    return NextResponse.json(
      {
        message: "Failed to create personal agent",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
