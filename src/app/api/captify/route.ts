import { NextRequest } from "next/server";
import { getAwsCredentialsFromIdentityPool } from "../lib/credentials";
import { auth } from "../../../lib/auth";

export async function GET(request: NextRequest) {
  return handleRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return handleRequest(request, "POST");
}

async function handleRequest(request: NextRequest, method: string) {
  try {
    // Only POST requests are supported for service calls
    if (method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get request body
    const body = await request.json();

    // Log the incoming request

    // Check for x-app header or app in body
    const appFromHeader = request.headers.get("x-app");
    const app = appFromHeader || body.app || "core";

    if (!body.service) {
      return new Response(
        JSON.stringify({ error: "Service parameter is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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
        // Use Identity Pool from request body if provided, otherwise use default
        // Default to COGNITO_IDENTITY_POOL_ID if app is 'core' or identityPoolId is not provided
        let identityPoolId = body.identityPoolId;
        const forceRefresh = body.forceRefresh === true;

        if (identityPoolId && app !== "core") {
          // Check if this is the base/admin identity pool
          if (identityPoolId === process.env.COGNITO_IDENTITY_POOL_ID) {
          } else {
          }
        } else {
          identityPoolId = process.env.COGNITO_IDENTITY_POOL_ID;
        }

        credentials = await getAwsCredentialsFromIdentityPool(
          session,
          identityPoolId,
          forceRefresh
        );
      } catch (credentialError: any) {

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

      // Get service handler - conditional import based on app

      let serviceHandler;
      let serviceModule;
      try {
        // Conditional import: use local services for core/undefined, external packages for others
        if (app === "core" || app === undefined) {
          serviceModule = await import("../../../services");
        } else {
          serviceModule = await import(`@captify-io/${app}/services`);
        }

        if (!serviceModule.services) {
          throw new Error(
            `No services export found in @captify-io/${app}/services`
          );
        }


        if (typeof serviceModule.services.use !== "function") {
          throw new Error(
            `services.use is not a function in @captify-io/${app}/services`
          );
        }

        // Get the service handler
        serviceHandler = serviceModule.services.use(body.service);

        if (!serviceHandler) {
          throw new Error(
            `Service '${body.service}' not found in @captify-io/${app} package`
          );
        }

        if (typeof serviceHandler.execute !== "function") {
          throw new Error(
            `Service '${body.service}' does not have an execute method`
          );
        }

      } catch (importError) {

        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to load service ${body.service} from @captify-io/${app}`,
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

      // Pass both request and credentials to the service
      // Add schema and app to the request body
      const processedBody = {
        ...body,
        schema: process.env.SCHEMA || "captify",
        app: app,
      };

      // Create a session object for the service with all auth fields
      const apiSession = {
        user: {
          id: (session.user as any)?.id || (session as any)?.user?.id,
          userId: (session.user as any)?.id || (session as any)?.user?.id,
          email: session.user?.email,
          name: session.user?.name,
          groups: (session.user as any)?.groups || (session as any)?.groups,
          isAdmin: (session.user as any)?.isAdmin || (session as any)?.isAdmin,
        },
        idToken: idToken,
        groups: (session as any)?.groups,
        isAdmin: (session as any)?.isAdmin,
      };

      const result = await serviceHandler.execute(
        processedBody,
        credentials,
        apiSession
      );
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to execute service ${body.service}`,
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
