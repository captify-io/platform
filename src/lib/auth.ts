import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";

/**
 * Refresh the access token using the refresh token
 * @param refreshToken - The refresh token from Cognito
 * @returns The new tokens
 */
async function refreshAccessToken(refreshToken: string) {
  try {
    // Check if we have a refresh token
    if (!refreshToken) {
      // Log error without using console.error on server
      if (typeof window !== "undefined") {
        console.error("No refresh token available");
      }
      throw new Error("No refresh token available");
    }

    // Check if environment variables are set
    if (
      !process.env.COGNITO_ISSUER ||
      !process.env.COGNITO_CLIENT_ID ||
      !process.env.COGNITO_CLIENT_SECRET
    ) {
      // Server-side logging allowed here as this is configuration error
      // But still check to avoid client-side errors
      if (typeof window !== "undefined") {
        console.error("Missing Cognito environment variables");
      }
      throw new Error("Missing Cognito configuration");
    }

    const url = `${process.env.COGNITO_ISSUER}/oauth2/token`;

    // Debug logging only in development
    if (process.env.NODE_ENV === "development") {
      console.log("🔄 Attempting to refresh token at:", url);
    }

    const response = await fetch(url, {
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

    const responseText = await response.text();

    // Try to parse as JSON
    let refreshedTokens;
    try {
      refreshedTokens = JSON.parse(responseText);
    } catch (parseError) {
      // Log error without using console.error on server
      if (typeof window !== "undefined") {
        console.error("Failed to parse refresh response:", responseText);
      }
      throw new Error(`Invalid response from token endpoint: ${responseText}`);
    }

    if (!response.ok) {
      // Log error without using console.error on server
      if (typeof window !== "undefined") {
        console.error("Token refresh failed:", {
          status: response.status,
          statusText: response.statusText,
          error: refreshedTokens.error,
          error_description: refreshedTokens.error_description,
        });
      }
      throw new Error(
        refreshedTokens.error_description ||
          refreshedTokens.error ||
          "Token refresh failed"
      );
    }

    // Validate the response has required fields
    if (!refreshedTokens.access_token) {
      // Log error without using console.error on server
      if (typeof window !== "undefined") {
        console.error("No access token in refresh response:", refreshedTokens);
      }
      throw new Error("Invalid token refresh response - missing access_token");
    }

    return {
      access_token: refreshedTokens.access_token,
      id_token: refreshedTokens.id_token,
      expires_in: refreshedTokens.expires_in ?? 3600, // Default to 1 hour
      refresh_token: refreshedTokens.refresh_token,
    };
  } catch (error) {
    // Log error without using console.error on server
    if (typeof window !== "undefined") {
      console.error("Error refreshing access token:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
    throw error;
  }
}

const authConfig: NextAuthConfig = {
  debug: process.env.NEXTAUTH_DEBUG === "true",
  logger: {
    error(error: Error, ...metadata: any[]) {
      console.error(`[NextAuth Error]`, error, ...metadata);
    },
    warn(code) {
      console.warn(`[NextAuth Warning] ${code}`);
    },
    debug(code, metadata) {
      console.log(`[NextAuth Debug] ${code}:`, metadata);
    },
  },
  providers: [
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: process.env.COGNITO_ISSUER,
      checks: ["pkce", "state"],
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "openid email profile",
          response_type: "code",
          response_mode: "query",
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
  pages: {
    error: "/auth/error",
    signOut: "/",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow sign in for Cognito provider
      if (account?.provider === "cognito") {
        return true;
      }
      return false;
    },
    async jwt({ token, account, profile }) {
      // Initial sign in
      if (account && profile) {
        // Debug logging only in development
        if (process.env.NODE_ENV === "development") {
          console.log("JWT Callback - Initial sign in", { account, profile });
        }
        return {
          ...token,
          sub: profile.sub,
          accessToken: account.access_token,
          idToken: account.id_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          username: profile.preferred_username || profile.email,
          groups: (profile as any)["cognito:groups"] || [],
        };
      }

      // Return previous token if the access token has not expired yet
      // Check 5 minutes before expiry to ensure smooth refresh
      const refreshBuffer = parseInt(process.env.COGNITO_TOKEN_REFRESH_BUFFER || "300") * 1000; // Default 5 minutes
      const currentTime = Date.now();
      const expiryTime = (token.expiresAt as number) * 1000;
      const timeUntilExpiry = expiryTime - currentTime;

      if (process.env.NODE_ENV === "development") {
        console.log("🕐 Token expiry check:", {
          currentTime: new Date(currentTime).toISOString(),
          expiryTime: new Date(expiryTime).toISOString(),
          timeUntilExpiry: Math.round(timeUntilExpiry / 1000) + " seconds",
          refreshBuffer: Math.round(refreshBuffer / 1000) + " seconds",
          needsRefresh: timeUntilExpiry < refreshBuffer
        });
      }

      if (timeUntilExpiry > refreshBuffer) {
        return token;
      }

      // Access token has expired or is about to expire, refresh it
      // Debug logging only in development
      if (process.env.NODE_ENV === "development") {
        console.log("Token expired or expiring soon, refreshing...");
      }

      // Check if we have a refresh token
      if (!token.refreshToken) {
        // Log error without using console.error on server
        if (typeof window !== "undefined") {
          console.error("No refresh token available in JWT token");
        }
        return { ...token, error: "RefreshAccessTokenError" };
      }

      // Refresh the access token using the refresh token
      try {
        const refreshedTokens = await refreshAccessToken(
          token.refreshToken as string
        );

        // Debug logging only in development
        if (process.env.NODE_ENV === "development") {
          console.log("Token refreshed successfully");
        }

        return {
          ...token,
          accessToken: refreshedTokens.access_token,
          idToken: refreshedTokens.id_token,
          refreshToken: refreshedTokens.refresh_token || token.refreshToken, // Use new refresh token if provided
          expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
        };
      } catch (error) {
        // Log error without using console.error on server
        if (typeof window !== "undefined") {
          console.error("Failed to refresh access token:", {
            error: error instanceof Error ? error.message : error,
            hasRefreshToken: !!token.refreshToken,
            tokenExpiry: token.expiresAt
              ? new Date((token.expiresAt as number) * 1000).toISOString()
              : "unknown",
          });
        }
        // Return the old token and let the session expire
        // The user will be redirected to sign in
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },
    async session({ session, token }) {
      // Send properties to the client
      // Debug logging only in development
      if (process.env.NODE_ENV === "development") {
        console.log("Session Callback", { token });
      }

      // Check for token refresh error
      if ((token as any).error === "RefreshAccessTokenError") {
        // Log error without using console.error on server
        if (typeof window !== "undefined") {
          console.error(
            "Session has a refresh error, user needs to re-authenticate"
          );
        }
        // Return a session with an error flag
        return {
          ...session,
          error: "RefreshAccessTokenError",
        };
      }

      session.user = {
        ...session.user,
        id: token.sub!,
      };
      (session as any).username = token.username;
      (session as any).accessToken = token.accessToken;
      (session as any).idToken = token.idToken;
      (session as any).expiresAt = token.expiresAt;
      (session as any).groups = token.groups || [];

      // Set captifyStatus based on groups
      const groups = (token.groups as string[]) || [];
      if (groups.includes("Admins") || groups.includes("Administrators")) {
        (session as any).captifyStatus = "approved";
      } else {
        (session as any).captifyStatus = "pending";
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle redirect after sign in
      // Debug logging only in development
      if (process.env.NODE_ENV === "development") {
        console.log("Redirect callback", { url, baseUrl });
      }
      // Always redirect to home after sign in
      return baseUrl;
    },
    async signOut({ url, baseUrl }) {
      // Handle Cognito logout URL if needed
      if (process.env.COGNITO_DOMAIN) {
        const cognitoLogoutUrl = `${process.env.COGNITO_DOMAIN}/logout?client_id=${process.env.COGNITO_CLIENT_ID}&logout_uri=${encodeURIComponent(baseUrl)}`;
        if (process.env.NODE_ENV === "development") {
          console.log("Cognito logout URL:", cognitoLogoutUrl);
        }
        return cognitoLogoutUrl;
      }
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60, // 1 hour - matches session maxAge
      },
    },
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 900, // 15 minutes
      },
    },
    state: {
      name: "next-auth.state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 900, // 15 minutes
      },
    },
  },
};

const authResult = NextAuth(authConfig);
export const handlers = authResult.handlers;
export const auth = authResult.auth;
export const signIn: typeof authResult.signIn = authResult.signIn;
export const signOut = authResult.signOut;
