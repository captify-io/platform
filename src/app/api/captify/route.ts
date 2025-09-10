import { NextRequest } from "next/server";
import { getAwsCredentialsFromIdentityPool } from "../lib/credentials";
import { auth } from "../../../auth";

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
    console.log("[API Route] ===== INCOMING REQUEST =====");
    console.log("[API Route] Service:", body.service);
    console.log("[API Route] Operation:", body.operation);
    console.log(
      "[API Route] Identity Pool in payload:",
      body.identityPoolId || "none"
    );

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
      console.log("got the session", session);
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
            console.log(
              `🔐 [API Route] Base Identity Pool requested: ${identityPoolId}`
            );
          } else {
            console.log(
              `📦 [API Route] Custom Identity Pool requested: ${identityPoolId}`
            );
          }
        } else {
          identityPoolId = process.env.COGNITO_IDENTITY_POOL_ID;
          console.log(
            `👤 [API Route] Using default Identity Pool for app '${app}': ${identityPoolId}`
          );
        }

        console.log(
          `[API Route] Final Identity Pool being passed to credentials: ${identityPoolId}`
        );
        console.log("[API Route] ===== GETTING CREDENTIALS =====");
        credentials = await getAwsCredentialsFromIdentityPool(
          session,
          identityPoolId,
          forceRefresh
        );
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

      // Get service handler - simplified direct import
      console.log("[API Route] ===== SERVICE LOADING =====");
      console.log(
        `[API Route] Loading service '${body.service}' from app '${app}'`
      );
      console.log(`[API Route] This will import: @captify-io/${app}/services`);

      let serviceHandler;
      try {
        // Dynamically import the module
        console.log(`[API Route] Importing @captify-io/${app}/services`);
        const serviceModule = await import(`@captify-io/${app}/services`);
        console.log("[API Route] Service module imported successfully");
        console.log(
          "[API Route] Service module has 'services' property:",
          "services" in serviceModule
        );

        if (!serviceModule.services) {
          throw new Error(
            `No services export found in @captify-io/${app}/services`
          );
        }

        console.log(
          "[API Route] Services object type:",
          typeof serviceModule.services
        );
        console.log(
          "[API Route] Services has 'use' method:",
          typeof serviceModule.services.use === "function"
        );

        if (typeof serviceModule.services.use !== "function") {
          throw new Error(
            `services.use is not a function in @captify-io/${app}/services`
          );
        }

        // Get the service handler
        console.log(`[API Route] Calling services.use('${body.service}')`);
        serviceHandler = serviceModule.services.use(body.service);
        console.log(
          "[API Route] Service handler result:",
          serviceHandler ? "found" : "not found"
        );

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

        console.log("[API Route] ✅ Service handler loaded successfully");
      } catch (importError) {
        console.error("[API Route] ❌ Service loading error:", importError);
        console.error(
          "[API Route] Error name:",
          importError instanceof Error ? importError.name : typeof importError
        );
        console.error(
          "[API Route] Error message:",
          importError instanceof Error
            ? importError.message
            : String(importError)
        );

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
