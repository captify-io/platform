/**
 * @captify/pmbook/services - Server-side exports
 *
 * Contains all server-side functionality for the program management and business operations package.
 */

import { execute as contractExecute } from "./contract";
import { execute as intelligenceExecute } from "./intelligence";
import { execute as performanceExecute } from "./performance";
import { execute as serviceExecute } from "./service";
import { execute as strategicExecute } from "./strategic";
import { execute as workExecute } from "./work";

import { contractService } from "./contract";
import { intelligenceService } from "./intelligence";
import { performanceService } from "./performance";
import { serviceMarketplaceService } from "./service";
import { strategicService } from "./strategic";
import { workService } from "./work";

// Service registry for server-side usage
export const services = {
  use: (serviceName: string) => {
    switch (serviceName) {
      case "contract":
        return contractService;
      case "intelligence":
        return intelligenceService;
      case "performance":
        return performanceService;
      case "serviceMarketplace":
        return serviceMarketplaceService;
      case "strategic":
        return strategicService;
      case "work":
        return workService;
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  },

  // Direct access to services
  contract: contractService,
  intelligence: intelligenceService,
  performance: performanceService,
  serviceMarketplace: serviceMarketplaceService,
  strategic: strategicService,
  work: workService,
};

// Export individual services for direct import
export { contractService } from "./contract";
export { intelligenceService } from "./intelligence";
export { performanceService } from "./performance";
export { serviceMarketplaceService } from "./service";
export { strategicService } from "./strategic";
export { workService } from "./work";

// Export execute functions
export { execute as contractExecute } from "./contract";
export { execute as intelligenceExecute } from "./intelligence";
export { execute as performanceExecute } from "./performance";
export { execute as serviceExecute } from "./service";
export { execute as strategicExecute } from "./strategic";
export { execute as workExecute } from "./work";

// Export types
export type * from "../types";