import { NextRequest } from "next/server";

/**
 * Discovery endpoint for available packages and services
 * GET /api/captify/discover - List all registered packages
 * GET /api/captify/discover?package=core - List services in a specific package
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const packageName = url.searchParams.get("package");

    if (packageName === "core") {
      // Static list of core services
      return new Response(
        JSON.stringify({
          package: "@captify-io/core",
          services: ["dynamo", "dynamodb", "cognito", "s3", "debug", "agent"],
          registered: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else if (packageName) {
      // For non-core packages, return empty for now
      return new Response(
        JSON.stringify({
          package: `@captify-io/${packageName}`,
          services: [],
          registered: false,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // List available packages
    return new Response(
      JSON.stringify({
        packages: ["@captify-io/core"],
        total: 1,
        description:
          "Use ?package=<name> to discover services in a specific package",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
