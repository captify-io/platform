/**
 * @captify/core - Main package export
 *
 * Exports separate app, services, types, and manifest for consumers
 */

// core/src/index.ts  (RSC-safe root)
export type * from "./types";

// Export auth utilities
export * from "./lib/auth";

// Export CaptifyProvider
export { CaptifyProvider, useCaptify } from "./components/CaptifyProvider";
