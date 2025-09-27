// Core exports for platform usage
export * from "./components";
export * from "./lib";
export * from "./hooks";
export * from "./services";
export * from "./types";

// API client and utilities
export * from "./lib/api";
export * from "./lib/react-compat";
export { cn } from "./lib/utils";

// Re-export auth components and utilities for external apps
export {
  SignOnPage,
  useSession,
  CaptifyAuthProvider,
  captifySignIn,
  captifySignOut,
  type CaptifySession,
} from "./lib/auth-exports";
