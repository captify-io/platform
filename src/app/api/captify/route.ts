import { NextRequest } from "next/server";
import { getAwsCredentialsFromIdentityPool } from "../lib/credentials";
import { auth, refreshAccessToken } from "../../../lib/auth";
import { getStoredTokens, storeTokensSecurely } from "../../../lib/auth-store";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);

  const headers = {
    "Content-Type": "application/json",
  };

  try {

    // Get request body
    const body = await request.json();
    const externalApp = request.headers.get("x-app");

    // Debug logging
    const fs = require('fs');
    fs.appendFileSync('/tmp/api-requests.log', `[${new Date().toISOString()}] Request: service=${body.service}, operation=${body.operation}\n`);

    // Log full body for streamMessage operations
    if (body.operation === 'streamMessage') {
      fs.appendFileSync('/tmp/stream-requests.log', `[${new Date().toISOString()}] StreamMessage Body: ${JSON.stringify(body, null, 2)}\n`);
    }


    if (!body.service) {
      return new Response(
        JSON.stringify({
          error: "Service parameter is required",
          expectedFormat: "package.service (e.g., 'platform.dynamodb')",
          receivedRequest: { ...body, identityPoolId: body.identityPoolId ? "[REDACTED]" : undefined }
        }),
        {
          status: 400,
          headers,
        }
      );
    }

    // Parse service name
    // Supports:
    // - 'platform.dynamodb' -> packageName='platform', serviceName='dynamodb'
    // - 'ontology.widget' -> packageName='platform', serviceName='ontology', subService='widget'
    if (!body.service.includes('.')) {
      return new Response(
        JSON.stringify({
          error: "Service must be in format 'package.service' or 'namespace.service' (e.g., 'platform.dynamodb' or 'ontology.widget')",
          received: body.service,
          examples: ["platform.dynamodb", "ontology.widget"]
        }),
        {
          status: 400,
          headers,
        }
      );
    }

    const serviceParts = body.service.split('.');
    let packageName = serviceParts[0];
    let serviceName = serviceParts[1];
    let subService = serviceParts.length > 2 ? serviceParts.slice(2).join('.') : null;

    // Handle namespace services (e.g., 'ontology.widget', 'fabric.note')
    // These are core services that aren't prefixed with 'platform.'
    const coreNamespaces = ['ontology', 'fabric'];
    if (coreNamespaces.includes(packageName)) {
      // Treat as platform service with nested structure
      subService = serviceName;
      serviceName = packageName;
      packageName = 'platform';
    }

    try {
      let session;
      try {
        session = await auth();
      } catch (authError) {
        throw authError;
      }
      if (!session?.user) {
        return new Response(
          JSON.stringify({
            error: "Not authenticated. Please log in.",
            app: externalApp,
            suggestion: externalApp
              ? "External app must forward valid NextAuth session cookies or tokens"
              : "Please log in to the application"
          }),
          {
            status: 401,
            headers,
          }
        );
      }

      // Check for token refresh error
      if ((session as any).error === "RefreshAccessTokenError") {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Token refresh failed",
            code: "TOKEN_REFRESH_ERROR",
            message: "Your session has expired. Please sign in again.",
          }),
          {
            status: 401,
            headers,
          }
        );
      }

      // Get tokens from DynamoDB storage using sessionId
      const sessionId = (session as any).sessionId;

      if (!sessionId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Session ID not found",
            code: "NO_SESSION_ID",
            message: "Your session is invalid. Please sign in again.",
          }),
          {
            status: 401,
            headers,
          }
        );
      }

      // Retrieve stored tokens from DynamoDB
      let storedTokens = await getStoredTokens(sessionId);

      if (!storedTokens) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Stored tokens not found",
            code: "NO_STORED_TOKENS",
            message: "Your session tokens have expired. Please sign in again.",
          }),
          {
            status: 401,
            headers,
          }
        );
      }

      // Check if tokens are expired or close to expiring
      const now = Date.now() / 1000;
      const refreshBuffer = 600; // 10 minutes buffer for API calls (less than JWT callback's 30 min)

      if (storedTokens.expiresAt <= now + refreshBuffer && storedTokens.refreshToken) {
        // Tokens are expired or about to expire, refresh them
        try {
          const refreshedTokens = await refreshAccessToken(storedTokens.refreshToken);

          // Update stored tokens
          const newExpiresAt = Math.floor(Date.now() / 1000) + (refreshedTokens.expires_in || 3600);
          await storeTokensSecurely(sessionId, {
            accessToken: refreshedTokens.access_token,
            idToken: refreshedTokens.id_token,
            refreshToken: refreshedTokens.refresh_token || storedTokens.refreshToken,
            expiresAt: newExpiresAt,
          });

          // Get the refreshed tokens
          storedTokens = await getStoredTokens(sessionId);
          if (!storedTokens) {
            throw new Error("Failed to retrieve refreshed tokens");
          }
        } catch (refreshError) {
          // Token refresh failed, return 401
          return new Response(
            JSON.stringify({
              success: false,
              error: "Token refresh failed",
              code: "TOKEN_REFRESH_FAILED",
              message: "Your session has expired. Please sign in again.",
            }),
            {
              status: 401,
              headers,
            }
          );
        }
      }

      const idToken = storedTokens.idToken;
      const accessToken = storedTokens.accessToken;

      // Get AWS credentials for the service
      let credentials;

      try {
        // Use Identity Pool from request body if provided, otherwise use default
        // Always default to COGNITO_IDENTITY_POOL_ID if no identityPoolId is provided
        const identityPoolId = body.identityPoolId || process.env.COGNITO_IDENTITY_POOL_ID;
        // Force refresh when switching to default pool to avoid cached credentials from other pools
        const forceRefresh = body.forceRefresh === true || !body.identityPoolId;


        // Create session object with tokens for credential exchange
        const sessionWithTokens = {
          ...session,
          idToken: idToken,
          accessToken: accessToken,
        };

        credentials = await getAwsCredentialsFromIdentityPool(
          sessionWithTokens,
          identityPoolId,
          forceRefresh
        );
      } catch (credentialError: any) {

        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to get AWS credentials",
            details: credentialError.message,
            app: externalApp,
            identityPoolUsed: body.identityPoolId || process.env.COGNITO_IDENTITY_POOL_ID,
          }),
          {
            status: 401,
            headers,
          }
        );
      }

      // Get service handler - ALWAYS from @captify-io/core
      let serviceHandler;
      let actualServiceName = serviceName;

      try {
        // Validate package name is 'platform' (all services are platform.*)
        if (packageName !== "platform") {
          throw new Error(`Only 'platform' services are supported. Received: '${packageName}'`);
        }

        // Note: platform.agent is the unified service that handles all agent operations
        // No auto-detection needed - serviceName is used directly

        // IMPORTANT: All services ALWAYS come from @captify-io/core
        // The packageName is just for validation, not for dynamic imports
        const serviceModule = await import("@captify-io/core/services");

        if (!serviceModule?.services) {
          throw new Error("@captify-io/core/services does not export 'services'");
        }

        if (typeof serviceModule.services.use !== "function") {
          throw new Error("@captify-io/core services.use is not a function");
        }

        // Get the service handler (e.g., 'dynamodb', 's3', 'cognito', 'assistant', 'agent', 'ontology')
        serviceHandler = serviceModule.services.use(actualServiceName);

        if (!serviceHandler) {
          throw new Error(
            `Service '${actualServiceName}' not found in @captify-io/core services. ` +
            `Available services are managed by @captify-io/core.`
          );
        }

        // Handle nested services (e.g., ontology.widget)
        if (subService) {
          // Navigate to nested service (e.g., serviceHandler.widget for 'ontology.widget')
          const nestedHandler = (serviceHandler as any)[subService];
          if (!nestedHandler) {
            throw new Error(
              `Nested service '${subService}' not found in '${actualServiceName}'. ` +
              `Full service path: ${body.service}`
            );
          }

          if (typeof nestedHandler.execute === "function") {
            serviceHandler = nestedHandler;
          } else if (typeof nestedHandler === "object" && nestedHandler.execute) {
            // Nested object with execute method
            serviceHandler = nestedHandler;
          } else {
            throw new Error(
              `Nested service '${actualServiceName}.${subService}' does not have an execute method`
            );
          }
        }

        if (typeof serviceHandler.execute !== "function") {
          throw new Error(
            `Service '${actualServiceName}' from @captify-io/core does not have an execute method`
          );
        }

      } catch (importError) {

        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to load service ${actualServiceName} from @captify-io/core`,
            details:
              importError instanceof Error
                ? importError.message
                : "Unknown import error",
            app: externalApp,
            requestedService: body.service,
            actualService: actualServiceName,
            packageName: packageName, // Include for debugging
          }),
          {
            status: 404,
            headers,
          }
        );
      }

      // Create a session object for the service with all auth fields
      const apiSession = {
        user: {
          id: session.user?.id || '',
          userId: session.user?.id || '',
          email: session.user?.email,
          name: session.user?.name,
          groups: (session as any).groups,
          isAdmin: (session as any).groups?.includes('Admins'),
          tenantId: (session.user as any)?.tenantId,
          // Security attributes from Cognito
          organizationId: (session as any).organizationId,
          clearanceLevel: (session as any).clearanceLevel || 'UNCLASSIFIED',
          markings: (session as any).markings || [],
          sciCompartments: (session as any).sciCompartments || [],
          needToKnow: (session as any).needToKnow || false,
          employeeId: (session as any).employeeId,
        },
        idToken: idToken, // From DynamoDB storage
        accessToken: accessToken, // From DynamoDB storage
        groups: (session as any).groups,
        isAdmin: (session as any).groups?.includes('Admins'),
        // Security context at session level
        organizationId: (session as any).organizationId,
        clearanceLevel: (session as any).clearanceLevel || 'UNCLASSIFIED',
        markings: (session as any).markings || [],
        sciCompartments: (session as any).sciCompartments || [],
        needToKnow: (session as any).needToKnow || false,
      };

      // Pass both request and credentials to the service
      // Add schema to the request body
      // AI SDK sends id and messages at root level - keep them there
      const processedBody = {
        ...body,
        schema: process.env.SCHEMA || "captify",
      };

      const result = await serviceHandler.execute(
        processedBody,
        credentials,
        apiSession
      );

      // Handle streaming response (AI SDK returns Response directly for streamMessage)
      if (result instanceof Response) {
        console.log('[API] Returning direct stream Response');
        return result;
      }

      // Normal JSON response
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers,
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to execute service ${serviceName}`,
          details: error instanceof Error ? error.message : "Unknown error",
          app: externalApp,
          service: body.service,
        }),
        {
          status: 500,
          headers,
        }
      );
    }
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error",
      requestId,
    }), {
      status: 500,
      headers,
    });
  }
}
