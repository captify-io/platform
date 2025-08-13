import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { requireUserSession } from "@/lib/services/session";
import type { Session } from "next-auth";

// Three-tier AWS credential fallback
async function getDynamoDBClient(_session: Session) {
  return new DynamoDBClient({
    region: process.env.REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await requireUserSession(request);
    const client = await getDynamoDBClient(session);

    const { threadId } = await params;
    const { pinned } = await request.json();

    if (typeof pinned !== "boolean") {
      return NextResponse.json(
        { error: "pinned must be a boolean" },
        { status: 400 }
      );
    }

    // Update the thread's pinned status
    await client.send(
      new UpdateItemCommand({
        TableName: "captify-chat-threads",
        Key: marshall({
          app_id: "console",
          thread_id: threadId,
        }),
        UpdateExpression: "SET pinned = :pinned, updated_at = :updatedAt",
        ConditionExpression: "user_id = :userId",
        ExpressionAttributeValues: marshall({
          ":pinned": pinned,
          ":updatedAt": new Date().toISOString(),
          ":userId": session.user_id,
        }),
      })
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error updating thread pin status:", error);
    return NextResponse.json(
      { error: "Failed to update thread pin status" },
      { status: 500 }
    );
  }
}
