import { NextResponse } from "next/server";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

export async function GET() {
  const table = process.env.DDB_CHAT_TABLE as string;
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
  });
  const res = await client.send(
    new ScanCommand({ TableName: table, Limit: 50 })
  );
  const items = (res.Items || []).map((i) => ({
    id: i.id?.S || "",
    sessionId: i.sessionId?.S || "",
    title: i.title?.S || "Untitled",
    createdAt: i.createdAt?.S || "",
    updatedAt: i.updatedAt?.S || "",
  }));
  return NextResponse.json({ items });
}
