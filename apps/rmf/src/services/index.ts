/**
 * @captify/rmf/services - Server-side exports
 *
 * Contains all server-side functionality for Resource Management Framework
 * including resource tracking, supply chain analysis, and other RMF-specific services.
 */

import { rmfService } from "./rmf-service";

// RMF-specific service implementations
const rmfDebug = {
  execute: async (params: any) => {
    // RMF-specific debug implementation
    return {
      success: true,
      message: "RMF Debug service executed successfully",
      data: { service: "rmf", params },
    };
  },
};

// Service registry for server-side usage
export const services = {
  use: (serviceName: string) => {
    switch (serviceName) {
      case "debug":
        return rmfDebug;
      case "rmf":
        return rmfService;
      default:
        throw new Error(`Unknown RMF service: ${serviceName}`);
    }
  },

  // Direct access to services
  debug: rmfDebug,
  rmf: rmfService,
};

// Export individual services for direct import
export { rmfDebug as debug, rmfService };

// Export types
export type { AwsCredentials, ApiUserSession } from "@captify/core/types";
