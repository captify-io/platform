/**
 * @captify/admin/services - Server-side exports
 *
 * Contains all server-side functionality including AWS services,
 * database operations, and other backend-only code.
 */

import { execute as debugExecute } from "./debug";
import { applicationAccessService } from "./applications/access";
import { ApplicationManager } from "./applications/manager";
import { userService } from "./users/service";
import { tenantService } from "./access/tenant";

// Service registry for server-side usage
export const services = {
  use: (serviceName: string) => {
    switch (serviceName) {
      case "debug":
        return { execute: debugExecute };
      case "applicationAccess":
        return applicationAccessService;
      case "applicationManager":
        return ApplicationManager;
      case "user":
        return userService;
      case "tenant":
        return tenantService;
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  },

  // Direct access to services
  debug: { execute: debugExecute },
  applicationAccess: applicationAccessService,
  ApplicationManager,
  user: userService,
  tenant: tenantService,
};

// Export individual services for direct import
export { execute as debugExecute } from "./debug";
export { applicationAccessService } from "./applications/access";
export { ApplicationManager } from "./applications/manager";
export { userService } from "./users/service";
export { tenantService } from "./access/tenant";

// Export specific items from submodules to avoid conflicts
export { MonitorService } from "./monitor/monitor";
export type * from "./monitor/monitor";
