import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const table = process.env.DDB_CHAT_TABLE as string;
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
  });
  const res = await client.send(
    new GetItemCommand({ TableName: table, Key: { id: { S: id } } })
  );
  const item = res.Item;
  if (!item) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  // TODO: If you persist messages, load and return them here. For now, just sessionId.
  return NextResponse.json({ sessionId: item.sessionId?.S, messages: [] });
}
