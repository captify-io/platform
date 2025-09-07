/**
 * @captify/mi/services - Server-side exports
 *
 * Contains all server-side functionality for Materiel Insights including
 * aircraft lifecycle management, BOM analysis, and other MI-specific services.
 */

import { debugExecute } from "@captify/admin/services";

// MI-specific service implementations
const miDebug = {
  execute: async (params: any) => {
    // MI-specific debug implementation
    return {
      success: true,
      message: "MI Debug service executed successfully",
      data: { service: "mi", params },
    };
  },
};

// Service registry for server-side usage
export const services = {
  use: (serviceName: string) => {
    switch (serviceName) {
      case "debug":
        return miDebug;
      default:
        throw new Error(`Unknown MI service: ${serviceName}`);
    }
  },

  // Direct access to services
  debug: miDebug,
};

// Export individual services for direct import
export { miDebug as debug };

// Export types
export type { AwsCredentials, ApiUserSession } from "@captify/core/types";
