import NextAuth from "next-auth";
import Cognito from "next-auth/providers/cognito";
import type { NextAuthConfig, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import "../types/auth"; // Import type extensions

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

  return response.json();
}

// NextAuth configuration
export const authConfig: NextAuthConfig = {
  providers: [
    Cognito({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
      authorization: {
        params: {
          scope: "openid email profile aws.cognito.signin.user.admin",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user, trigger, session }) {
      // Initial sign in
      if (account && user) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 3600 * 1000;
        token.user = user;
        return token;
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to update it
      try {
        const refreshedTokens = await refreshCognitoTokens(
          token.refreshToken as string
        );

        return {
          ...token,
          accessToken: refreshedTokens.access_token,
          accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
          refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
        };
      } catch (error) {
        console.error("Error refreshing access token", error);
        return {
          ...token,
          error: "RefreshAccessTokenError",
        };
      }
    },
    async session({ session, token }) {
      if (token.error) {
        throw new Error("RefreshAccessTokenError");
      }

      session.accessToken = token.accessToken as string;

      // Preserve existing user info if available, otherwise try to extract from token
      if (session.user) {
        // Keep the existing user info - no change needed
      } else if (token.user) {
        session.user = token.user as any;
      } else if (token.accessToken) {
        // Last resort: extract from access token
        try {
          const payload = JSON.parse(
            Buffer.from(
              (token.accessToken as string).split(".")[1],
              "base64"
            ).toString()
          );
          session.user = {
            id: payload.sub,
            email:
              payload.email ||
              payload.username ||
              `${payload.username}@cognito.local`,
            name:
              payload.name ||
              payload.given_name ||
              payload.email ||
              payload.username ||
              "User",
            image: payload.picture,
            emailVerified: null,
          };
        } catch (error) {
          console.error("Error decoding JWT:", error);
          session.user = {
            id: "unknown",
            email: "user@cognito.local",
            name: "Cognito User",
            emailVerified: null,
          };
        }
      }

      return session;
    },
    async signIn({ user, account, profile }) {
      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    signOut: "/auth/signout",
  },
  debug: process.env.NODE_ENV === "development",
  trustHost: true,
};

// Export the auth handlers with explicit types to avoid inference issues
const authResult = NextAuth(authConfig);
export const handlers = authResult.handlers;
export const auth = authResult.auth;

// Type the problematic exports explicitly
export const signIn: typeof authResult.signIn = authResult.signIn;
export const signOut: typeof authResult.signOut = authResult.signOut;

// Server-side session utility
export async function getServerSession() {
  try {
    return await auth();
  } catch (error) {
    console.error("Error getting server session:", error);
    return null;
  }
}
