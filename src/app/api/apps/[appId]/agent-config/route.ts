import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { createAppApiHandler, getSharedTable } from "@/lib/api/handler";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const log = (message: string, data?: unknown) => {
    console.log(message, data || "");
    console.error(message, data || ""); // Also log to stderr to ensure visibility
  };

  log("🚀 Agent config API called - START");

  try {
    const resolvedParams = await params;
    const { appId } = resolvedParams;

    if (!appId) {
      log("❌ No app ID provided");
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    // Phase 2: Use new API handler pattern
    log("🔐 Creating API handler context...");
    const context = await createAppApiHandler(appId);

    log("✅ Session and config validated:", {
      userId: context.session?.user_id,
      appId: context.appConfig.id,
      appName: context.appConfig.name,
    });

    log("🔧 Environment check:", {
      awsRegion: process.env.AWS_REGION,
      hasAwsKeys: !!(
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ),
      bedrockAgentId: process.env.BEDROCK_AGENT_ID,
      bedrockAliasId: process.env.BEDROCK_AGENT_ALIAS_ID,
    });

    // Get applications table using shared table configuration
    const applicationsTable = getSharedTable(context, "applications");

    log("🔍 Fetching application from DynamoDB...", {
      table: applicationsTable,
      appId: appId,
    });

    // Initialize DynamoDB client
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    const docClient = DynamoDBDocumentClient.from(dynamoClient);

    let application;
    try {
      const command = new ScanCommand({
        TableName: applicationsTable,
        FilterExpression: "id = :appId",
        ExpressionAttributeValues: {
          ":appId": appId,
        },
      });

      const result = await docClient.send(command);
      application = result.Items?.[0];

      log("📥 DynamoDB query result:", {
        found: !!application,
        hasAiAgent: !!application?.ai_agent,
        applicationKeys: application ? Object.keys(application) : [],
      });

      if (!application) {
        log("❌ Application not found in DynamoDB");
        return NextResponse.json(
          context.helpers.createError("Application not found"),
          { status: context.helpers.httpStatus.NOT_FOUND }
        );
      }
    } catch (dbError) {
      log("💥 DynamoDB query error:", dbError);
      throw dbError;
    }

    log("🔍 Raw application data:", JSON.stringify(application, null, 2));
    log("🔍 AI Agent config:", JSON.stringify(application.ai_agent, null, 2));

    // Extract agent configuration with fallbacks
    const agentId =
      application.ai_agent?.bedrockAgentId ||
      context.appConfig.agentId ||
      process.env.BEDROCK_AGENT_ID;

    const agentAliasId =
      application.ai_agent?.bedrockAliasId ||
      context.appConfig.agentAliasId ||
      process.env.BEDROCK_AGENT_ALIAS_ID;

    log("⚙️ Agent config resolution:", {
      fromDatabase: !!application.ai_agent?.bedrockAgentId,
      fromAppConfig: !!context.appConfig.agentId,
      fromEnvironment: !!process.env.BEDROCK_AGENT_ID,
      finalAgentId: agentId,
      finalAgentAliasId: agentAliasId,
    });

    // Return using standardized response format
    log("📤 Returning agent config response");
    return NextResponse.json(
      context.helpers.createResponse({
        agentId,
        agentAliasId,
        agentConfig: application.ai_agent,
        appInfo: {
          id: context.appConfig.id,
          name: context.appConfig.name,
        },
      })
    );
  } catch (error) {
    log("❌ Error fetching application agent config:", error);
    log(
      "❌ Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
