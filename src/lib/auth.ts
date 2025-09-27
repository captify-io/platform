import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";

// Validate required environment variables
const requiredEnvVars = {
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
  COGNITO_CLIENT_SECRET: process.env.COGNITO_CLIENT_SECRET,
  COGNITO_ISSUER: process.env.COGNITO_ISSUER,
  COGNITO_WELLKNOWN: process.env.COGNITO_WELLKNOWN,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

const authConfig: NextAuthConfig = {
  debug: process.env.NEXTAUTH_DEBUG === "true",
  providers: [
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: process.env.COGNITO_ISSUER!,
      wellKnown: `${process.env.COGNITO_ISSUER}/.well-known/openid-configuration`,
      checks: ["nonce", "state", "pkce"],
      client: {
        id_token_signed_response_alg: "RS256",
        response_types: ["code"],
      },
      authorization: {
        params: {
          response_type: "code",
          scope: "openid email profile",
          nonce: true,
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
    signOut: "/signout",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow sign in for Cognito provider
      if (account?.provider === "cognito") {
        return true;
      }
      console.error("[Cognito Callback] Unknown provider:", account?.provider);
      return false;
    },
    async jwt({ token, account, profile }): Promise<any> {
      // Initial sign in - store tokens in JWT
      if (account && profile) {
        // Validate that we have the required tokens
        if (!account.access_token || !account.id_token) {
          console.error(
            "[Cognito Callback] Missing required tokens from account:",
            {
              hasAccessToken: !!account.access_token,
              hasIdToken: !!account.id_token,
              hasRefreshToken: !!account.refresh_token,
            }
          );
          throw new Error("Missing required Cognito tokens");
        }

        // Store tokens in JWT token (NextAuth will handle encryption)
        const groups = (profile as any)["cognito:groups"] || [];

        return {
          ...token,
          sub: profile.sub, // Ensure we keep the Cognito User Pool sub
          accessToken: account.access_token,
          idToken: account.id_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          username: profile.preferred_username || profile.email,
          groups: groups,
          captifyStatus: groups.some(
            (group: string | string[]) =>
              group.includes("CACProvider") ||
              group.includes("captify-authorized")
          )
            ? "approved"
            : "pending",
        };
      }

      // Return existing token if not expired
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        return token;
      }

      // Token has expired, try to refresh it
      if (token.refreshToken) {
        try {
          const refreshedTokens = await refreshAccessToken(
            token.refreshToken as string
          );

          return {
            ...token,
            accessToken: refreshedTokens.access_token,
            idToken: refreshedTokens.id_token,
            refreshToken: refreshedTokens.refresh_token || token.refreshToken,
            expiresAt:
              Math.floor(Date.now() / 1000) +
              (refreshedTokens.expires_in || 3600),
          };
        } catch (error) {
          console.error("Error refreshing access token:", error);
          // Return token with error flag
          return {
            ...token,
            error: "RefreshAccessTokenError",
          };
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Check for token refresh error
      if (token.error === "RefreshAccessTokenError") {
        return {
          ...session,
          error: "RefreshAccessTokenError",
        };
      }

      // Add custom properties to session
      return {
        ...session,
        accessToken: token.accessToken,
        idToken: token.idToken,
        username: token.username,
        groups: token.groups,
        captifyStatus: token.captifyStatus,
        user: {
          ...session.user,
          id: token.sub!,
        },
      };
    },
    async redirect({ url, baseUrl }) {
      // Handle redirect after sign in
      return baseUrl;
    },
  },
};

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(refreshToken: string) {
  try {
    // Get token endpoint from well-known configuration
    const wellKnownResponse = await fetch(
      `${process.env.COGNITO_ISSUER}/.well-known/openid-configuration`
    );
    const wellKnown = await wellKnownResponse.json();
    const tokenEndpoint = wellKnown.token_endpoint;

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.COGNITO_CLIENT_ID}:${process.env.COGNITO_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.COGNITO_CLIENT_ID!,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw new Error(
        refreshedTokens.error_description ||
          refreshedTokens.error ||
          "Token refresh failed"
      );
    }

    // Validate the response has required fields
    if (!refreshedTokens.access_token) {
      throw new Error("Invalid token refresh response - missing access_token");
    }

    return {
      access_token: refreshedTokens.access_token,
      id_token: refreshedTokens.id_token,
      expires_in: refreshedTokens.expires_in ?? 3600, // Default to 1 hour
      refresh_token: refreshedTokens.refresh_token,
    };
  } catch (error) {
    throw error;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
export const getServerSession = auth;

// Export the config for external apps to use
export { authConfig };
