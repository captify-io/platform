import { NextRequest } from "next/server";
import { getAwsCredentialsFromIdentityPool } from "../lib/credentials";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  return handleRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return handleRequest(request, "POST");
}

async function handleRequest(request: NextRequest, method: string) {
  try {
    // Check for x-app header
    const appFromHeader = request.headers.get("x-app");

    // If no x-app header, return error
    if (!appFromHeader) {
      return new Response(
        JSON.stringify({ error: "x-app header is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // For POST requests with service calls
    if (method === "POST") {
      const body = await request.json();

      if (!body.service) {
        return new Response(
          JSON.stringify({ error: "Service parameter is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Get app from header
      const app = appFromHeader;

      try {
        // Get session from NextAuth
        const session = await auth();

        if (!session?.user) {
          return new Response(
            JSON.stringify({ error: "Not authenticated. Please log in." }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Check if session has required tokens
        const idToken = (session as any).idToken;
        if (!idToken) {
          return new Response(
            JSON.stringify({
              error: "No ID token found in session. Please log in again.",
            }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Get AWS credentials for the service
        let credentials;

        try {
          credentials = await getAwsCredentialsFromIdentityPool(session);
        } catch (credentialError: any) {
          console.error(
            "❌ Failed to get AWS credentials:",
            credentialError.message
          );

          return new Response(
            JSON.stringify({
              success: false,
              error: "Failed to get AWS credentials",
              details: credentialError.message,
            }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Dynamically import the specific service from @captify/{app}
        let serviceHandler;
        try {
          // Direct import of specific known packages to avoid webpack bundling issues
          let servicesModule;
          switch (app) {
            case "core":
              servicesModule = await import("@captify/core/services");
              break;
            default:
              throw new Error(`Package ${app} not supported yet`);
          }

          serviceHandler = servicesModule.services?.use(body.service);

          if (!serviceHandler) {
            throw new Error(
              `Service ${body.service} not found in ${app} package`
            );
          }
        } catch (importError) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Failed to load service ${body.service} from @captify/${app}`,
              details:
                importError instanceof Error
                  ? importError.message
                  : "Unknown import error",
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        if (!serviceHandler.execute) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Service ${body.service} does not have an execute function`,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Pass both request and credentials to the service
        // Add schema and app to the request body
        const processedBody = {
          ...body,
          schema: process.env.SCHEMA || "captify",
          app: app,
        };

        const result = await serviceHandler.execute(processedBody, credentials);
        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 400,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to load @captify/${app} service ${body.service}`,
            details: error instanceof Error ? error.message : "Unknown error",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Return 404 for unhandled routes
    return new Response(
      JSON.stringify({
        error: `Route not found: ${method} /api/captify`,
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
