import { NextRequest, NextResponse } from "next/server";

/**
 * Service Discovery API
 * GET /api/captify/discover
 * Returns available services, operations, and tables
 */
export async function GET(request: NextRequest) {
  try {
    const discoveryInfo = {
      services: {
        platform: ["dynamodb", "s3", "agent", "cognito", "aurora"],
      },
      operations: {
        dynamodb: ["scan", "query", "get", "put", "update", "delete"],
        s3: ["get", "put", "delete"],
        cognito: ["getUser", "updateUser", "deleteUser", "listUsers"],
        aurora: ["query", "execute"],
        agent: [
          "sendMessage",
          "streamMessage",
          "getThreads",
          "getThread",
          "createThread",
          "deleteThread",
          "updateThread",
          "getTokenUsage",
          "updateSettings",
          "uploadFile",
          "getFile",
        ],
      },
      tables: {
        core: ["App", "User", "UserState", "Tenant"],
      },
      schema: process.env.SCHEMA || "captify",
      version: "1.0.0",
      documentation: "/api-docs",
    };

    return NextResponse.json(discoveryInfo, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to retrieve service discovery information",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}