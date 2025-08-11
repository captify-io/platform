/**
 * POST /api/agents/create-async - Start async agent creation with Lambda
 * GET /api/agents/create-async?jobId={id} - Check creation status
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { AgentService } from "@/lib/services/agent-service";
import { LambdaInvocationService } from "@/lib/services/lambda-invocation";
import { ProgressService } from "@/lib/services/progress-service";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      agentName,
      agentType = "personal",
      instructions,
      organizationalRole,
      description,
    } = body;

    // Validate required fields
    if (!agentName || !instructions) {
      return NextResponse.json(
        { message: "Missing required fields: agentName, instructions" },
        { status: 400 }
      );
    }

    const userId = session.user.email;
    const jobId = uuidv4();

    // Create job record in DynamoDB
    await AgentService.createAgentJob({
      id: jobId,
      userId,
      agentType,
      status: "PENDING",
      progress: 0,
      currentStep: "Initializing agent creation",
      createdAt: new Date().toISOString(),
    });

    // Trigger Lambda function
    const lambdaResult = await LambdaInvocationService.invokeAgentCreation({
      jobId,
      userId,
      agentName,
      agentType,
      instructions,
      organizationalRole,
      description,
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
          message: "Failed to start agent creation",
          error: lambdaResult.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      jobId,
      message: "Agent creation started",
      estimatedDuration: "12-15 minutes",
      lambdaInvoked: true,
      executionId: lambdaResult.executionId,
    });
  } catch (error) {
    console.error("Error starting agent creation:", error);
    return NextResponse.json(
      {
        message: "Failed to start agent creation",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/agents/create-async?jobId={id} - Check creation progress
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { message: "Missing jobId parameter" },
        { status: 400 }
      );
    }

    const progressData = await ProgressService.getJobProgress(jobId);

    if (!progressData.job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    // Verify user owns this job
    if (progressData.job.userId !== session.user.email) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      status: progressData.job.status,
      progress: progressData.job.progress,
      currentStep: progressData.job.currentStep,
      estimatedTimeRemaining: progressData.estimatedTimeRemaining,
      tasks: progressData.tasks,
      agentId: progressData.job.agentId,
      aliasId: progressData.job.aliasId,
      knowledgeBaseId: progressData.job.knowledgeBaseId,
      error: progressData.job.error,
      createdAt: progressData.job.createdAt,
      completedAt: progressData.job.completedAt,
    });
  } catch (error) {
    console.error("Error checking agent creation progress:", error);
    return NextResponse.json(
      {
        message: "Failed to check progress",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
