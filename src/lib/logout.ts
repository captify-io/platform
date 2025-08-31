import { signOut } from "next-auth/react";

export const handleCognitoLogout = async () => {
  try {
    console.log("🔄 Starting logout process...");

    // Use NextAuth signOut with redirect to dedicated signout page
    await signOut({
      callbackUrl: "/auth/signout", // Redirect to signout success page
      redirect: true, // Force redirect to ensure session is cleared
    });
  } catch (error) {
    console.error("Logout error:", error);
    // Fallback: redirect directly to signout page
    window.location.href = "/auth/signout";
  }
};
