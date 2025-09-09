import { NextRequest } from "next/server";
import { serviceRegistry } from "../../lib/service-registry";

/**
 * Discovery endpoint for available packages and services
 * GET /api/captify/discover - List all registered packages
 * GET /api/captify/discover?package=core - List services in a specific package
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const packageName = url.searchParams.get("package");

    if (packageName) {
      // Get services for a specific package
      try {
        const servicesModule = await import(
          `@captify-io/${packageName}/services`
        );

        // Extract available service names
        const services = servicesModule.services;
        const availableServices: string[] = [];

        // Try to get service names from the module
        // This is a bit hacky but works for our pattern
        if (services && typeof services.use === "function") {
          // Common service names to check
          const commonServices = [
            "dynamo",
            "debug",
            "applicationAccess",
            packageName, // Package-specific service
          ];

          for (const serviceName of commonServices) {
            try {
              const handler = services.use(serviceName);
              if (handler && handler.execute) {
                availableServices.push(serviceName);
              }
            } catch {
              // Service doesn't exist
            }
          }
        }

        return new Response(
          JSON.stringify({
            package: `@captify-io/${packageName}`,
            services: availableServices,
            registered: serviceRegistry.isPackageRegistered(packageName),
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: `Package @captify-io/${packageName} not found`,
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // List all registered packages
    const packages = serviceRegistry.getRegisteredPackages();

    return new Response(
      JSON.stringify({
        packages: packages.map((p) => `@captify-io/${p}`),
        total: packages.length,
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
