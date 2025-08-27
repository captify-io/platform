// src/app/api/[...nextauth]/route.ts
import { authManifest, apiManifest } from "@captify/api";
import {
  getManifest,
  findMatchingRoute,
  getDebugInfo,
} from "../../../lib/controller";

console.log(`🌐 [...nextauth]/route.ts loaded at ${new Date().toISOString()}`);

interface MatchResult {
  handler: (req: Request, context?: any) => Promise<Response>;
  params: Record<string, string>;
  isNextAuth?: boolean;
}

function normalizePath(path: string): string {
  return path.replace(/\/+$/, "") || "/";
}

/**
 * Special handling for NextAuth routes
 */
function handleNextAuthRoute(
  pathname: string,
  method: string
): MatchResult | null {
  // Check if this is a NextAuth route pattern
  if (pathname.startsWith("/api/auth/")) {
    // Extract the nextauth parameter (everything after /api/auth/)
    const nextauthPath = pathname.replace("/api/auth/", "");
    const nextauthParams = nextauthPath.split("/").filter(Boolean);

    console.log(
      `🔐 NextAuth route detected: ${pathname}, params: ${nextauthParams}`
    );

    // Find the NextAuth handler in API manifests
    const manifests = [authManifest, apiManifest];
    for (const manifest of manifests) {
      for (const route of manifest.routes) {
        if (route.path === "/api/auth/[...nextauth]") {
          const handler = route.handlers[method as keyof typeof route.handlers];
          if (handler) {
            return {
              handler: (req: Request, context?: any) => {
                // Create the context that NextAuth expects
                const nextAuthContext = {
                  params: { nextauth: nextauthParams },
                };
                return handler(req, nextAuthContext);
              },
              params: { nextauth: nextauthParams.join("/") },
              isNextAuth: true,
            };
          }
        }
      }
    }
  }
  return null;
}

/**
 * Finds a matching handler + extracts params using the dynamic controller
 */
async function findHandler(
  method: string,
  pathname: string
): Promise<MatchResult | null> {
  console.log(`🔍 Searching for handler: ${method} ${pathname}`);

  // First, check if this is a NextAuth route
  const nextAuthResult = handleNextAuthRoute(pathname, method);
  if (nextAuthResult) {
    return nextAuthResult;
  }

  // Use the core controller to find matching routes from all installed packages
  const routeMatch = await findMatchingRoute(pathname, method);

  if (routeMatch) {
    console.log(
      `✅ Found handler for ${method} ${pathname} in ${routeMatch.manifest}`
    );
    return {
      handler: (req: Request, context?: any) =>
        routeMatch.handler(req, routeMatch.params),
      params: routeMatch.params,
    };
  }

  console.log(`❌ No handler found for ${method} ${pathname}`);
  return null;
}

async function runHandler(method: string, req: Request) {
  console.log(`🚀 [...nextauth]/route.ts ${method} called`);
  console.log(`📍 URL: ${req.url}`);

  const { pathname } = new URL(req.url);
  const result = await findHandler(method, pathname);

  if (!result) {
    // Get debug info for error response
    const debugInfo = await getDebugInfo();

    return new Response(
      JSON.stringify({
        error: "Not found",
        path: pathname,
        method,
        debug: {
          availableManifests: debugInfo.manifests,
          availableRoutes: debugInfo.routes.map((r) => r.path),
          apiRoutes: [authManifest, apiManifest].flatMap((m) =>
            m.routes.map((r) => r.path)
          ),
        },
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  console.log(`⚡ Executing handler for ${pathname}`);

  try {
    // For NextAuth routes, pass the context with params
    if (result.isNextAuth) {
      return await result.handler(req, {
        params: { nextauth: result.params.nextauth.split("/") },
      });
    }

    // For other routes, call without context
    return await result.handler(req);
  } catch (error) {
    console.error(`💥 Error in handler:`, error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Export all HTTP methods
export async function GET(req: Request) {
  return runHandler("GET", req);
}

export async function POST(req: Request) {
  return runHandler("POST", req);
}

export async function PUT(req: Request) {
  return runHandler("PUT", req);
}

export async function DELETE(req: Request) {
  return runHandler("DELETE", req);
}

export async function PATCH(req: Request) {
  return runHandler("PATCH", req);
}

export async function HEAD(req: Request) {
  return runHandler("HEAD", req);
}

export async function OPTIONS(req: Request) {
  return runHandler("OPTIONS", req);
}
