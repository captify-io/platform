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
