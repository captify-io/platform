/**
 * Server-side auth exports
 * Local auth functionality
 */

export { auth, handlers, signIn, signOut } from "./lib/auth";
export type { Session } from "next-auth";
