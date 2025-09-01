import NextAuth from "next-auth";
import Cognito from "next-auth/providers/cognito";
import type { NextAuthConfig } from "next-auth";
import { getSessionConfig } from "./lib/session-config";

// Get session configuration
const sessionConfig = getSessionConfig();

// Token refresh function using Cognito OAuth endpoint
async function refreshCognitoTokens(refreshToken: string) {
  const tokenUrl = `https://account.anautics.ai/oauth2/token`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.COGNITO_CLIENT_ID!,
      client_secret: process.env.COGNITO_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Token refresh failed:", response.status, errorText);
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  const tokens = await response.json();
  console.log("✅ Successfully refreshed tokens");

  return {
    access_token: tokens.access_token,
    id_token: tokens.id_token,
    refresh_token: tokens.refresh_token || refreshToken, // Use new refresh token if provided
    expires_in: tokens.expires_in || 3600, // Default to 1 hour if not provided
  };
}

// Auth configuration
export const authConfig = {
  session: {
    strategy: "jwt",
    maxAge: sessionConfig.nextAuthDuration,
    updateAge: sessionConfig.nextAuthUpdateAge,
  },
  providers: [
    Cognito({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: `https://cognito-idp.us-east-1.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
      authorization: {
        url: "https://account.anautics.ai/login",
        params: {
          scope: "openid email profile", // Cognito issues refresh tokens by default, no offline_access needed
          response_type: "code",
        },
      },
      checks: ["nonce", "pkce", "state"],
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, trigger }) {
      // Initial sign-in: store all tokens with proper expiration
      if (account && profile) {
        console.log("🔐 Initial sign-in, storing tokens");
        console.log("📋 Account tokens received:", {
          access_token: account.access_token
            ? `Present (${account.access_token.substring(0, 20)}...)`
            : "Missing",
          id_token: account.id_token
            ? `Present (${account.id_token.substring(0, 20)}...)`
            : "Missing",
          refresh_token: account.refresh_token
            ? `Present (${account.refresh_token.substring(0, 20)}...)`
            : "Missing",
          expires_in: account.expires_in,
          token_type: account.token_type,
          scope: account.scope,
        });

        const now = Math.floor(Date.now() / 1000);
        const expiresIn = account.expires_in || 3600; // Default to 1 hour

        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.refreshToken = account.refresh_token;
        token.sub = profile.sub || undefined;
        token.email = profile.email || undefined;
        token.name = profile.name || undefined;
        token.awsTokenExpiresAt = now + expiresIn; // Track AWS token expiration separately

        console.log(
          `🕐 AWS tokens will expire at: ${new Date(
            (now + expiresIn) * 1000
          ).toISOString()}`
        );

        if (!account.refresh_token) {
          console.warn(
            "⚠️  No refresh token received - check Cognito User Pool settings"
          );
          console.log(
            "📝 Note: Cognito should provide refresh tokens by default"
          );
        } else {
          console.log("✅ Refresh token received successfully");
        }

        return token;
      }

      // Check if this is a session call (when /api/auth/session is accessed)
      // or if AWS tokens need refresh (refresh 5 minutes before expiry)
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = (token.awsTokenExpiresAt as number) - now;
      const shouldRefresh = timeUntilExpiry <= 300; // Refresh if expiring within 5 minutes

      if (shouldRefresh && token.refreshToken) {
        try {
          console.log(
            `🔄 AWS tokens expire in ${timeUntilExpiry} seconds, refreshing...`
          );
          const refreshedTokens = await refreshCognitoTokens(
            token.refreshToken as string
          );

          const newExpiresAt = now + refreshedTokens.expires_in;

          console.log(
            `✅ AWS tokens refreshed, new expiry: ${new Date(
              newExpiresAt * 1000
            ).toISOString()}`
          );

          return {
            ...token,
            accessToken: refreshedTokens.access_token,
            idToken: refreshedTokens.id_token,
            refreshToken: refreshedTokens.refresh_token,
            awsTokenExpiresAt: newExpiresAt,
          };
        } catch (error) {
          console.error("❌ AWS token refresh failed:", error);
          // Return token with error flag, which will trigger logout
          return { ...token, error: "RefreshTokenError" };
        }
      }

      // Token is still valid, return as-is
      return token;
    },
    async session({ session, token }) {
      // If there's a refresh error, force logout
      if (token.error === "RefreshTokenError") {
        throw new Error("Token refresh failed. Please log in again.");
      }

      if (token.idToken) {
        (session as any).idToken = token.idToken as string;
        (session as any).accessToken = token.accessToken as string;
        (session as any).refreshToken = token.refreshToken as string;
        (session as any).awsTokenExpiresAt = token.awsTokenExpiresAt; // AWS token expiration for quick checking
      }

      if (session.user && token) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        (session.user as any).id = token.sub as string;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to home after authentication
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl; // Default to home page
    },
  },
  debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// For backward compatibility, export authOptions-like object
export const authOptions = authConfig;
