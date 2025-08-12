import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  QueryCommand,
  QueryCommandInput,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { requireUserSession, type UserSession } from "@/lib/services/session";
import { generateThreadId } from "@/lib/id-utils";

// Three-tier AWS credential fallback
async function getDynamoDBClient(session: UserSession) {
  // For now, use static credentials - TODO: implement full three-tier system
  return new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    // Primary authentication gate - for now make this more lenient for testing
    let session;
    try {
      session = await requireUserSession(request);
    } catch (error) {
      console.warn("Authentication failed in /api/chat/history:", error);
      // Return empty threads list for unauthenticated users
      return NextResponse.json({
        threads: [],
        nextCursor: undefined,
      });
    }

    // Get DynamoDB client with three-tier fallback
    const client = await getDynamoDBClient(session);

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    // const agentId = searchParams.get("agentId"); // TODO: Implement agent filtering
    // const filter = searchParams.get("filter"); // TODO: Implement text filtering
    const limit = parseInt(searchParams.get("limit") || "20");

    // Query threads for this user from captify-chat-threads table
    const queryParams: QueryCommandInput = {
      TableName: "captify-chat-threads",
      IndexName: "UserThreadIndex",
      KeyConditionExpression: "user_id = :userId",
      ExpressionAttributeValues: marshall({
        ":userId": session.user_id,
        ":appId": "console", // Filter for console app threads
      }),
      FilterExpression: "app_id = :appId",
      ScanIndexForward: false, // Sort by updated_at descending
      Limit: limit,
    };

    // Add cursor for pagination
    if (cursor) {
      queryParams.ExclusiveStartKey = JSON.parse(
        Buffer.from(cursor, "base64").toString()
      );
    }

    const result = await client.send(new QueryCommand(queryParams));

    const threads = (result.Items || []).map((item) => {
      const thread = unmarshall(item);
      return {
        id: thread.thread_id,
        agentId: thread.agent_id,
        title: thread.title,
        createdAt: thread.created_at,
        updatedAt: thread.updated_at,
        messageCount: thread.message_count || 0,
        pinned: thread.pinned || false,
        datasources: thread.datasources || [],
      };
    });

    // Generate next cursor if there are more items
    const nextCursor = result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString("base64")
      : undefined;

    return NextResponse.json({
      threads,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Primary authentication gate
    const session = await requireUserSession(request);

    // Get DynamoDB client with three-tier fallback
    const client = await getDynamoDBClient(session);

    const { agentId } = await request.json();

    if (!agentId) {
      return NextResponse.json(
        { error: "agentId is required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const threadId = generateThreadId();

    const newThread = {
      app_id: "console",
      thread_id: threadId,
      user_id: session.user_id,
      agent_id: agentId,
      title: "New Chat",
      created_at: now,
      updated_at: now,
      message_count: 0,
      pinned: false,
      datasources: [],
    };

    await client.send(
      new PutItemCommand({
        TableName: "captify-chat-threads",
        Item: marshall(newThread),
      })
    );

    return NextResponse.json({
      id: threadId,
      agentId,
      title: "New Chat",
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
      pinned: false,
      datasources: [],
    });
  } catch (error) {
    console.error("Error creating thread:", error);
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 }
    );
  }
}
