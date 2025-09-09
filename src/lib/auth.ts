/**
 * Server-side auth configuration
 * This file should be used for all server-side auth imports
 * DO NOT import auth from @captify-io/core directly in server components
 */

// Import from the specific auth module, not the main export
import { auth, handlers, signIn, signOut } from "@captify-io/core/auth";

// Re-export for server-side use
export { auth, handlers, signIn, signOut };

// Type exports for convenience
export type { Session } from "next-auth";