/**
 * @captify/core - Shared components, types, and utilities
 */

// Export all types
export * from "./types";

// Export auth
export * from "./auth";

// Export lib utilities
export * from "./lib/api";

// Export hooks
export * from "./hooks/use-mobile";
export * from "./hooks/useApplicationAccess";
export * from "./hooks/useFavorites";
export * from "./hooks/useUser";

// Export CaptifyProvider for convenience
export { CaptifyProvider } from "./components/providers/CaptifyProvider";
