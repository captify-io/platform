/**
 * Unified Captify API Route Handler
 * Handles all Captify API requests through a single endpoint
 * Supports both new unified API and legacy resource-based routing
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession, CaptifyApi, createCaptifyApi } from "@captify/api";
import type { ApiRequest } from "@captify/api";
import type { UserSession } from "@captify/core";

// Initialize the main API orchestrator for legacy support
const captifyApi = new CaptifyApi();

export async function POST(request: NextRequest) {
  try {
    // Get session from NextAuth
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { resource, operation, data, service, tableName, params } = body;

    // Check if this is a new unified API request (direct service call)
    if (service || (resource === "dynamodb" && tableName)) {
      // Use the new unified API
      const unifiedApi = createCaptifyApi(request);

      if (service === "dynamodb" || resource === "dynamodb") {
        const table = tableName || data?.table;
        if (!table) {
          return NextResponse.json(
            {
              success: false,
              error: "Table name is required for DynamoDB operations",
            },
            { status: 400 }
          );
        }

        let result;
        switch (operation) {
          case "scan":
            result = await unifiedApi.dynamodb.scan(table, params || data);
            break;
          case "query":
            result = await unifiedApi.dynamodb.query(table, params || data);
            break;
          case "getItem":
          case "get":
            result = await unifiedApi.dynamodb.get(
              table,
              data?.key || params?.key
            );
            break;
          case "putItem":
          case "put":
            result = await unifiedApi.dynamodb.put(
              table,
              data?.item || params?.item
            );
            break;
          case "updateItem":
          case "update":
            result = await unifiedApi.dynamodb.update(
              table,
              data?.key || params?.key,
              params || data
            );
            break;
          case "deleteItem":
          case "delete":
            result = await unifiedApi.dynamodb.delete(
              table,
              data?.key || params?.key
            );
            break;
          default:
            return NextResponse.json(
              {
                success: false,
                error: `Unsupported DynamoDB operation: ${operation}`,
              },
              { status: 400 }
            );
        }

        return NextResponse.json(result);
      }
    }

    // Legacy resource-based routing for backward compatibility
    if (!resource) {
      return NextResponse.json(
        {
          success: false,
          error: "Resource is required",
        },
        { status: 400 }
      );
    }

    // Extract headers for additional context
    const idToken = request.headers.get("X-ID-Token");
    const awsSessionToken = request.headers.get("X-AWS-Session-Token");
    const userEmail = request.headers.get("X-User-Email");
    const appId = request.headers.get("X-App-Id");

    // Build the user session for the API request
    const userSession: UserSession = {
      userId:
        (session.user as { id?: string })?.id || session.user.email?.split("@")[0] || "",
      email: session.user.email || userEmail || "",
      idToken: idToken || "",
      awsSessionToken: awsSessionToken || "",
      orgId: "", // TODO: Get from session or headers
      appId: appId || undefined,
    };

    // Build the API request
    const apiRequest: ApiRequest = {
      resource,
      operation,
      data,
      userSession,
    };

    // Route the request through CaptifyApi
    const response = await captifyApi.request(apiRequest);

    // Return the response with appropriate HTTP status
    const status = response.success ? 200 : 400;
    return NextResponse.json(response, { status });
  } catch (error) {
    console.error("Captify API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: `API request failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        metadata: {
          requestId: `error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: "CaptifyApiRoute",
        },
      },
      { status: 500 }
    );
  }
}

// Export other HTTP methods if needed
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "GET method not supported. Use POST with operation details.",
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: "PUT method not supported. Use POST with operation details.",
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: "DELETE method not supported. Use POST with operation details.",
    },
    { status: 405 }
  );
}
