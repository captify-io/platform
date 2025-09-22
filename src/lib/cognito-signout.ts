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

    // Check if we have Cognito configuration for logout
    const cognitoIssuer = process.env.NEXT_PUBLIC_COGNITO_ISSUER;
    const cognitoClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const currentUrl = typeof window !== "undefined" ? window.location.origin : "";

    if (cognitoIssuer && cognitoClientId && currentUrl) {
      // Construct Cognito logout URL
      const logoutUrl = new URL(`${cognitoIssuer}/logout`);
      logoutUrl.searchParams.append("client_id", cognitoClientId);
      logoutUrl.searchParams.append("logout_uri", `${currentUrl}/auth/signout`);
      logoutUrl.searchParams.append("response_type", "code");

      console.log("🔄 Redirecting to Cognito logout:", logoutUrl.toString());

      // Sign out of NextAuth first, then redirect to Cognito logout
      await nextAuthSignOut({
        redirectTo: logoutUrl.toString(),
        redirect: true
      });
    } else {
      console.warn("⚠️ Cognito logout URL not available, using NextAuth-only signout");

      // Fallback to NextAuth-only signout
      await nextAuthSignOut({
        redirectTo: "/",
        redirect: true
      });
    }

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