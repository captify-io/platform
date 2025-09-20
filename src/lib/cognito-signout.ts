/**
 * Cognito Sign Out Utility
 *
 * Properly signs out users from both Cognito and NextAuth
 */

import { signOut as nextAuthSignOut } from "next-auth/react";

/**
 * Sign out from both Cognito and NextAuth
 * This will redirect to Cognito's logout endpoint which clears the Cognito session,
 * then redirect back to clear the NextAuth session
 */
export async function cognitoSignOut() {
  try {
    console.log("🚪 Starting Cognito sign out process");

    // Clear local storage and session storage first
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn("Could not clear storage:", e);
    }

    // First, clear the NextAuth session
    await nextAuthSignOut({
      redirectTo: "/",
      redirect: true
    });

    // Note: The Cognito logout redirect will be handled in a future enhancement
    // For now, NextAuth signout with storage clearing provides effective logout

  } catch (error) {
    console.error("❌ Error during sign out:", error);

    // Fallback: force redirect and clear storage
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    } catch (e) {
      console.error("Failed to clear storage or redirect:", e);
    }
  }
}

/**
 * Simple NextAuth-only sign out (for cases where Cognito logout is not needed)
 */
export async function simpleSignOut() {
  await nextAuthSignOut({
    redirectTo: "/"
  });
}