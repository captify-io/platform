import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  UpdateItemCommand,
  ReturnValue,
} from "@aws-sdk/client-dynamodb";
import { requireUserSession } from "@/lib/services/session";
import type { Session } from "next-auth";

// Three-tier AWS credential fallback
async function getDynamoDBClient(_session: Session) {
  return new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await requireUserSession(req);

    const {
      threadId,
      firstMessage,
      applicationId = "console",
    } = await req.json();

    if (!threadId) {
      return NextResponse.json(
        { ok: false, error: "MISSING_THREAD_ID" },
        { status: 400 }
      );
    }

    // Generate title from first message
    const title = (firstMessage || "New chat")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60);

    const dynamoClient = await getDynamoDBClient(session);

    // Update the thread title
    const updateParams = {
      TableName: "captify-chat-threads",
      Key: {
        app_id: { S: applicationId },
        thread_id: { S: threadId },
      },
      UpdateExpression: "SET title = :title, updated_at = :updated_at",
      ExpressionAttributeValues: {
        ":title": { S: title },
        ":updated_at": { S: new Date().toISOString() },
        ":userId": { S: session.user_id },
      },
      ConditionExpression: "user_id = :userId",
      ReturnValues: ReturnValue.ALL_NEW,
    };

    const result = await dynamoClient.send(new UpdateItemCommand(updateParams));

    return NextResponse.json({
      ok: true,
      threadId,
      title,
      updatedThread: result.Attributes,
    });
  } catch (error) {
    console.error("Error updating thread title:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Authenticate user
    const session = await requireUserSession(req);

    const { threadId, title } = await req.json();

    if (!threadId) {
      return NextResponse.json(
        { ok: false, error: "MISSING_THREAD_ID" },
        { status: 400 }
      );
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: "MISSING_TITLE" },
        { status: 400 }
      );
    }

    // Sanitize and truncate title
    const sanitizedTitle = title.replace(/\s+/g, " ").trim().slice(0, 60);

    const dynamoClient = await getDynamoDBClient(session);

    // Update the thread title
    const updateParams = {
      TableName: "captify-chat-threads",
      Key: {
        app_id: { S: "console" },
        thread_id: { S: threadId },
      },
      UpdateExpression: "SET title = :title, updated_at = :updated_at",
      ExpressionAttributeValues: {
        ":title": { S: sanitizedTitle },
        ":updated_at": { S: new Date().toISOString() },
        ":userId": { S: session.user_id },
      },
      ConditionExpression: "user_id = :userId",
      ReturnValues: ReturnValue.ALL_NEW,
    };

    const result = await dynamoClient.send(new UpdateItemCommand(updateParams));

    return NextResponse.json({
      ok: true,
      threadId,
      title: sanitizedTitle,
      updatedThread: result.Attributes,
    });
  } catch (error) {
    console.error("Error updating thread title:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
