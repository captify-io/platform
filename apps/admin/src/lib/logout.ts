/**
 * Logout utilities for Captify platform
 */

import { signOut } from "next-auth/react";

/**
 * Handle Cognito logout - signs user out of NextAuth session
 * and redirects to signout page
 */
export async function handleCognitoLogout(): Promise<void> {
  try {
    // Use NextAuth signOut to clear session and redirect
    await signOut({
      callbackUrl: "/auth/signout", // Redirect to custom signout page
      redirect: true,
    });
  } catch (error) {
    console.error("Error during logout:", error);
    // Fallback: redirect manually if signOut fails
    window.location.href = "/auth/signout";
  }
}

/**
 * Handle silent logout without redirect (for programmatic use)
 */
export async function handleSilentLogout(): Promise<void> {
  try {
    await signOut({
      redirect: false,
    });
  } catch (error) {
    console.error("Error during silent logout:", error);
  }
}
