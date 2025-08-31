/**
 * @captify/core/services - Server-side exports
 *
 * Contains all server-side functionality including AWS services,
 * database operations, and other backend-only code.
 */

import { dynamo } from "./dynamo";
import { execute as debugExecute } from "./debug";

// Service registry for server-side usage
export const services = {
  use: (serviceName: string) => {
    switch (serviceName) {
      case "dynamo":
        return dynamo;
      case "debug":
        return { execute: debugExecute };
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  },

  // Direct access to services
  dynamo,
  debug: { execute: debugExecute },
};

// Export individual services for direct import
export { dynamo } from "./dynamo";
export { execute as debugExecute } from "./debug";

// Export types
export type { AwsCredentials, ApiUserSession } from "../types";
