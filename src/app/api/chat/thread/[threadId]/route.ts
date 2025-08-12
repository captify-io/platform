import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  DeleteItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await requireUserSession(request);
    const client = await getDynamoDBClient(session);

    const { threadId } = await params;

    // First, verify that the thread exists and belongs to the user
    const threadQuery = new QueryCommand({
      TableName: "captify-chat-threads",
      KeyConditionExpression: "app_id = :appId AND thread_id = :threadId",
      FilterExpression: "user_id = :userId",
      ExpressionAttributeValues: marshall({
        ":appId": "console",
        ":threadId": threadId,
        ":userId": session.user_id,
      }),
      Limit: 1,
    });

    const threadResult = await client.send(threadQuery);
    if (!threadResult.Items || threadResult.Items.length === 0) {
      return NextResponse.json(
        { error: "Thread not found or access denied" },
        { status: 404 }
      );
    }

    // Fetch messages for this thread
    const messagesQuery = new QueryCommand({
      TableName: "captify-chat-messages",
      KeyConditionExpression: "thread_id = :threadId",
      ExpressionAttributeValues: marshall({
        ":threadId": threadId,
      }),
      ScanIndexForward: true, // Sort by timestamp ascending
    });

    const messagesResult = await client.send(messagesQuery);
    const messages =
      messagesResult.Items?.map((item) => {
        const message = unmarshall(item);
        return {
          id: message.message_id,
          role: message.role,
          content: message.content,
          createdAt: message.created_at,
          toolInvocations: message.tool_runs || [],
          // Transform DynamoDB format to match ChatMessage interface
        };
      }) || [];

    return NextResponse.json({
      ok: true,
      threadId,
      messages,
    });
  } catch (error) {
    console.error("Error fetching thread messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch thread messages" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await requireUserSession(request);
    const client = await getDynamoDBClient(session);

    const { threadId } = await params;

    // Delete the thread (only if user owns it)
    await client.send(
      new DeleteItemCommand({
        TableName: "captify-chat-threads",
        Key: marshall({
          app_id: "console",
          thread_id: threadId,
        }),
        ConditionExpression: "user_id = :userId",
        ExpressionAttributeValues: marshall({
          ":userId": session.user_id,
        }),
      })
    );

    // TODO: Also delete associated messages from captify-chat-messages
    // This would require a scan/query to find all messages for this thread

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting thread:", error);
    return NextResponse.json(
      { error: "Failed to delete thread" },
      { status: 500 }
    );
  }
}
