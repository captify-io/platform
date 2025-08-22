// Session management for Captify SDK
import type { UserSession } from "../types";

/**
 * Store user session in memory/localStorage
 */
export function storeSession(session: UserSession): void {
  if (typeof window !== "undefined") {
    // Client-side storage
    localStorage.setItem("captify-session", JSON.stringify(session));
  }
}

/**
 * Retrieve user session from memory/localStorage
 */
export function getStoredSession(): UserSession | null {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("captify-session");
    if (stored) {
      try {
        return JSON.parse(stored) as UserSession;
      } catch (error) {
        localStorage.removeItem("captify-session");
      }
    }
  }
  return null;
}

/**
 * Clear stored user session
 */
export function clearStoredSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("captify-session");
  }
}

/**
 * Check if session is valid/not expired
 */
export function isSessionValid(session: UserSession): boolean {
  // Placeholder implementation - will add JWT expiration checking
  return !!session.userId && !!session.email;
}
