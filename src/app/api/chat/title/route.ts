import { NextResponse } from "next/server";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import crypto from "crypto";

export async function POST(req: Request) {
  const { sessionId, firstMessage } = await req.json();
  const title = (firstMessage || "New chat")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  const table = process.env.DDB_CHAT_TABLE as string;
  if (!table)
    return NextResponse.json(
      { ok: false, error: "MISSING_TABLE" },
      { status: 500 }
    );

  const id = crypto.createHash("sha1").update(sessionId).digest("hex");
  const now = new Date().toISOString();
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
  });
  await client.send(
    new PutItemCommand({
      TableName: table,
      Item: {
        id: { S: id },
        sessionId: { S: sessionId },
        title: { S: title || "New chat" },
        createdAt: { S: now },
        updatedAt: { S: now },
      },
    })
  );

  return NextResponse.json({ ok: true, id, title });
}
