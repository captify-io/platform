import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";
import { storeTokensSecurely, getStoredTokens, removeStoredTokens } from "./auth-store";

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
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "development" ? ".localhost" : ".captify.io",
        maxAge: 8 * 60 * 60, // 8 hours for security
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.callback-url"
        : "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "development" ? ".localhost" : ".captify.io",
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.csrf-token"
        : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "development" ? ".localhost" : ".captify.io",
      }
    }
  },
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
      return false;
    },
    async jwt({ token, account, profile }): Promise<any> {
      // Initial sign in - store tokens in JWT
      if (account && profile) {
        // Validate that we have the required tokens
        if (!account.access_token || !account.id_token) {
          throw new Error("Missing required Cognito tokens");
        }

        // Store only essential data in JWT (large tokens stored server-side)
        const groups = (profile as any)["cognito:groups"] || [];
        const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2)}`;

        // Store large Cognito tokens server-side (implement this next)
        await storeTokensSecurely(sessionId, {
          accessToken: account.access_token,
          idToken: account.id_token,
          refreshToken: account.refresh_token || "",
          expiresAt: account.expires_at || 0,
        });

        // Minimal JWT payload to prevent 431 errors
        return {
          ...token,
          sub: profile.sub,
          email: profile.email,
          username: profile.preferred_username || profile.email,
          groups: groups.slice(0, 5), // Limit groups to prevent bloat
          captifyStatus: groups.some(
            (group: string | string[]) =>
              group.includes("CACProvider") ||
              group.includes("captify-authorized")
          )
            ? "approved"
            : "pending",
          sessionId: sessionId, // Reference to server-side stored tokens
          issuedAt: Math.floor(Date.now() / 1000),
        };
      }

      // Check if stored tokens exist and are valid
      if (token.sessionId) {
        const storedTokens = await getStoredTokens(token.sessionId as string);

        // If no stored tokens found, session is invalid
        if (!storedTokens) {
          return {
            ...token,
            error: "RefreshAccessTokenError",
          };
        }

        // Check if tokens are still valid with buffer time for proactive refresh
        const now = Date.now() / 1000;
        const refreshBuffer = 900; // 15 minutes before expiry (increased from 5)

        if (storedTokens.expiresAt > now + refreshBuffer) {
          // Tokens are still valid and not near expiry
          return token;
        }

        // Tokens are expired or close to expiring, try to refresh them
        if (storedTokens.refreshToken) {
          try {
            const refreshedTokens = await refreshAccessToken(storedTokens.refreshToken);

            // Update stored tokens with refreshed values
            const newExpiresAt = Math.floor(Date.now() / 1000) + (refreshedTokens.expires_in || 3600);
            await storeTokensSecurely(token.sessionId as string, {
              accessToken: refreshedTokens.access_token,
              idToken: refreshedTokens.id_token,
              refreshToken: refreshedTokens.refresh_token || storedTokens.refreshToken,
              expiresAt: newExpiresAt,
            });

            return token; // JWT payload stays the same, only server-side tokens updated
          } catch (error) {
            // Clean up invalid tokens
            await removeStoredTokens(token.sessionId as string);
            return {
              ...token,
              error: "RefreshAccessTokenError",
            };
          }
        } else {
          // No refresh token available
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

      // Secure: Only support new DynamoDB format - no fallbacks
      return {
        ...session,
        username: token.username,
        groups: token.groups,
        captifyStatus: token.captifyStatus,
        sessionId: token.sessionId, // Reference to server-side tokens
        user: {
          ...session.user,
          id: token.sub!,
          email: token.email,
        },
      };
    },
    async redirect({ url, baseUrl }) {
      // Get trusted domains from environment or use defaults
      const envDomains = process.env.NEXTAUTH_TRUSTED_DOMAINS || '';
      const configuredDomains = envDomains.split(',').map(d => d.trim()).filter(Boolean);

      // Default trusted domains (always allowed)
      const defaultDomains = [
        'localhost', // Any port on localhost
        '.captify.io', // All subdomains of captify.io
      ];

      const trustedDomains = [...defaultDomains, ...configuredDomains];

      try {
        const parsedUrl = new URL(url, baseUrl);
        const baseUrlParsed = new URL(baseUrl);

        // If url is just the baseUrl (same origin, same path "/" or empty), redirect to home
        // This handles the case where callback cookie persists but no explicit callback was set
        if (
          parsedUrl.origin === baseUrlParsed.origin &&
          (parsedUrl.pathname === '/' || parsedUrl.pathname === '')
        ) {
          return baseUrl;
        }

        // Check if hostname matches any trusted domain
        const isTrusted = trustedDomains.some(domain => {
          if (domain.startsWith('.')) {
            // Subdomain wildcard: check if hostname ends with domain
            return parsedUrl.hostname === domain.slice(1) || parsedUrl.hostname.endsWith(domain);
          } else {
            // Exact match
            return parsedUrl.hostname === domain;
          }
        });

        if (isTrusted) {
          return url;
        }
      } catch (error) {
        // Invalid URL, fall back to baseUrl
      }

      // Default: redirect to baseUrl (home page)
      return baseUrl;
    },
  },
  events: {
    async signOut(message) {
      // Clean up stored tokens when user signs out
      if ('token' in message && message.token?.sessionId) {
        try {
          await removeStoredTokens(message.token.sessionId as string);
        } catch (error) {
          // Silently handle cleanup errors
        }
      }
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
