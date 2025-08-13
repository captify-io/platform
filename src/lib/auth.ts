import NextAuth from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

interface ExtendedToken {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
  error?: string;
  // AWS Identity Pool credentials
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsSessionToken?: string;
  awsIdentityId?: string;
  awsExpiresAt?: number;
}

interface AuthAccount {
  access_token?: string;
  id_token?: string;
  refresh_token?: string;
  expires_at?: number;
  providerAccountId?: string;
  provider?: string;
  type?: string;
}

interface AuthProfile {
  name?: string;
  email?: string;
  picture?: string;
}

interface ExtendedSession {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  user?: {
    id?: string;
    email?: string;
    name?: string;
    picture?: string;
    image?: string;
  };
  // AWS Identity Pool credentials
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsSessionToken?: string;
  awsIdentityId?: string;
  awsExpiresAt?: number;
}

interface AuthUser {
  id?: string;
  email?: string;
  name?: string;
}

/**
 * Refresh an expired access token using the refresh token
 */
async function refreshAccessToken(
  token: ExtendedToken
): Promise<ExtendedToken> {
  try {
    console.log("🔄 Attempting to refresh access token...");

    const url = `${process.env.NEXT_PUBLIC_COGNITO_ISSUER}/oauth2/token`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
        client_secret: process.env.COGNITO_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken!,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error("❌ Token refresh failed:", refreshedTokens);
      throw refreshedTokens;
    }

    console.log("✅ Token refresh successful");

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      idToken: refreshedTokens.id_token,
      expiresAt: Math.floor(
        Date.now() / 1000 + (refreshedTokens.expires_in || 3600)
      ),
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Keep existing if not provided
    };
  } catch (error) {
    console.error("❌ Error refreshing access token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - NextAuth v4 compatibility issue
const authOptions = {
  debug: true, // Enable debug logging
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  providers: [
    CognitoProvider({
      id: "cognito",
      clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: process.env.NEXT_PUBLIC_COGNITO_ISSUER!,
      wellKnown: `https://cognito-idp.${
        process.env.REGION || "us-east-1"
      }.amazonaws.com/${
        process.env.COGNITO_USER_POOL_ID
      }/.well-known/openid-configuration`,
      authorization: {
        url: `${process.env.NEXT_PUBLIC_COGNITO_ISSUER}/oauth2/authorize`,
        params: {
          scope: "openid profile email",
          response_type: "code",
          client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
          redirect_uri: `${
            process.env.NEXTAUTH_URL || "https://www.anautics.ai"
          }/api/auth/callback/cognito`,
        },
      },
      token: `${process.env.NEXT_PUBLIC_COGNITO_ISSUER}/oauth2/token`,
      checks: ["pkce", "state", "nonce"],
      profile(profile) {
        console.log("Cognito Profile Callback:", profile);
        return {
          id: profile.sub,
          name: profile.name ?? profile.email,
          email: profile.email,
          image: profile.picture ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({
      token,
      account,
      profile,
    }: {
      token: ExtendedToken;
      account: AuthAccount | null;
      profile: AuthProfile | undefined;
    }) {
      console.log("JWT callback:", {
        token: token?.sub,
        account: account?.provider,
        tokenExpiry: token?.expiresAt
          ? new Date(token.expiresAt * 1000).toISOString()
          : "unknown",
      });

      console.log("=== JWT Callback Debug ===");
      console.log("Token object:", {
        sub: token?.sub,
        email: token?.email,
        name: token?.name,
        hasAccessToken: !!token?.accessToken,
        hasRefreshToken: !!token?.refreshToken,
      });
      console.log("Account:", {
        provider: account?.provider,
        type: account?.type,
        access_token: account?.access_token ? "present" : "missing",
        id_token: account?.id_token ? "present" : "missing",
        refresh_token: account?.refresh_token ? "present" : "missing",
        expires_at: account?.expires_at,
        providerAccountId: account?.providerAccountId,
      });
      console.log("Profile:", profile);
      console.log("=== End JWT Callback ===");

      // Initial sign in - store tokens from account
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.sub = account.providerAccountId; // Store the Cognito UUID
        console.log("✅ Initial login - storing fresh tokens");
        console.log("Account data:", {
          provider: account.provider,
          type: account.type,
          hasAccessToken: !!account.access_token,
          hasIdToken: !!account.id_token,
          expiresAt: account.expires_at
            ? new Date(account.expires_at * 1000).toISOString()
            : "unknown",
          sub: account.providerAccountId, // Log the UUID being stored
        });

        // Get AWS Identity Pool credentials on initial sign-in
        if (account.id_token) {
          try {
            console.log(
              "🔧 Getting AWS Identity Pool credentials for initial session..."
            );

            const REGION = process.env.REGION || "us-east-1";
            const IDENTITY_POOL_ID = process.env.COGNITO_IDENTITY_POOL_ID!;
            const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;

            const credentialsProvider = fromCognitoIdentityPool({
              clientConfig: { region: REGION },
              identityPoolId: IDENTITY_POOL_ID,
              logins: {
                [`cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`]:
                  account.id_token,
              },
            });

            const awsCredentials = await credentialsProvider();

            if (
              awsCredentials.accessKeyId &&
              awsCredentials.secretAccessKey &&
              awsCredentials.sessionToken
            ) {
              token.awsAccessKeyId = awsCredentials.accessKeyId;
              token.awsSecretAccessKey = awsCredentials.secretAccessKey;
              token.awsSessionToken = awsCredentials.sessionToken;
              token.awsIdentityId = "auto-generated"; // The provider handles this internally
              token.awsExpiresAt = Date.now() + 55 * 60 * 1000; // 55 minutes from now

              console.log(
                "🎉 AWS Identity Pool credentials obtained and stored in session"
              );
            } else {
              console.warn("⚠️ Incomplete AWS credentials received");
            }
          } catch (error) {
            console.error(
              "❌ Failed to get AWS Identity Pool credentials during sign-in:",
              error
            );
            // Continue without AWS credentials - don't block the sign-in process
          }
        }
      }

      // Update profile information
      if (profile) {
        token.name = profile.name;
        token.email = profile.email;
        token.picture = profile.picture;
      }

      // Check if token is expired and needs refresh
      if (token.expiresAt && token.refreshToken) {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = token.expiresAt - now;
        const expiryDate = new Date(token.expiresAt * 1000);
        const currentDate = new Date(now * 1000);

        console.log(`� TOKEN EXPIRATION CHECK:`);
        console.log(`   Current time: ${currentDate.toISOString()} (${now})`);
        console.log(
          `   Token expires: ${expiryDate.toISOString()} (${token.expiresAt})`
        );
        console.log(`   Time until expiry: ${timeUntilExpiry} seconds`);
        console.log(
          `   Status: ${
            timeUntilExpiry <= 0
              ? "🔴 EXPIRED"
              : timeUntilExpiry < 300
              ? "🟡 EXPIRING SOON"
              : "🟢 VALID"
          }`
        );

        // Check if token is already expired
        if (timeUntilExpiry <= 0) {
          console.error(
            `❌ TOKEN ALREADY EXPIRED! Expired ${Math.abs(
              timeUntilExpiry
            )} seconds ago`
          );
          console.error("🚨 FORCING TOKEN REFRESH FOR EXPIRED TOKEN");

          const refreshedToken = await refreshAccessToken(token);

          if (refreshedToken.error) {
            console.error(
              "❌ Token refresh failed for expired token, invalidating session"
            );
            return { ...token, error: "RefreshAccessTokenError" };
          }

          console.log("✅ Successfully refreshed expired token");
          return refreshedToken;
        }

        // Refresh if token expires in less than 5 minutes (300 seconds)
        if (timeUntilExpiry < 300) {
          console.log(
            "⚠️ Token expiring soon, attempting proactive refresh..."
          );
          const refreshedToken = await refreshAccessToken(token);

          if (refreshedToken.error) {
            console.error(
              "❌ Proactive token refresh failed, invalidating session"
            );
            return { ...token, error: "RefreshAccessTokenError" };
          }

          console.log("✅ Proactive token refresh successful");
          return refreshedToken;
        }
      }

      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: ExtendedToken;
    }) {
      console.log("Session callback:", {
        user: session?.user?.email,
        hasToken: !!token,
        hasError: !!token.error,
        tokenSub: token?.sub,
        sessionUserId: session?.user?.id,
      });

      // If token refresh failed, force re-authentication
      if (token.error) {
        console.error("❌ Session invalidated due to token refresh failure");
        throw new Error("Token refresh failed - re-authentication required");
      }

      // Add token data to session
      session.accessToken = token.accessToken;
      session.idToken = token.idToken;
      session.refreshToken = token.refreshToken;
      session.expiresAt = token.expiresAt;

      // Add AWS Identity Pool credentials to session
      session.awsAccessKeyId = token.awsAccessKeyId;
      session.awsSecretAccessKey = token.awsSecretAccessKey;
      session.awsSessionToken = token.awsSessionToken;
      session.awsIdentityId = token.awsIdentityId;
      session.awsExpiresAt = token.awsExpiresAt;

      // Update user data
      if (session.user) {
        session.user.id = token.sub;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;

        console.log("✅ Updated session.user:", {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        });
      }

      return session;
    },
    async signIn({
      account,
      profile,
    }: {
      account: AuthAccount | null;
      profile: AuthProfile | undefined;
    }) {
      console.log("SignIn Callback Invoked", { account, profile });
      if (!account || !profile) return false;
      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  events: {
    async signIn({
      user,
      account,
      profile, // eslint-disable-line @typescript-eslint/no-unused-vars
      isNewUser,
    }: {
      user: AuthUser;
      account: AuthAccount | null;
      profile: AuthProfile | undefined;
      isNewUser?: boolean;
    }) {
      if (process.env.NODE_ENV === "development") {
        console.log("Sign-in successful", {
          userId: user.id,
          provider: account?.provider,
          isNewUser,
        });
      }
    },
  },
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - NextAuth v4 compatibility issue
export default NextAuth(authOptions);

/**
 * Server-side utility to get the current session with extended properties
 */
export async function getExtendedServerSession() {
  const { getServerSession } = await import("next-auth/next");
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - NextAuth v4 compatibility issue with authOptions typing
  return getServerSession(authOptions) as Promise<ExtendedSession | null>;
}

/**
 * Server-side utility to validate session and ensure Identity Pool tokens
 */
export async function validateServerSession(): Promise<{
  isValid: boolean;
  session: ExtendedSession | null;
  hasIdentityPoolTokens: boolean;
  error?: string;
}> {
  try {
    const session = await getExtendedServerSession();

    if (!session) {
      return {
        isValid: false,
        session: null,
        hasIdentityPoolTokens: false,
        error: "No active session",
      };
    }

    // Check if basic tokens are present
    const hasBasicTokens = !!(session.accessToken && session.idToken);
    if (!hasBasicTokens) {
      return {
        isValid: false,
        session,
        hasIdentityPoolTokens: false,
        error: "Missing required tokens",
      };
    }

    // For server-side validation, we just check if we have what we need to get Identity Pool tokens
    // The actual Identity Pool token validation/refresh should be done client-side or on-demand
    const canGetIdentityPoolTokens = !!(session.user?.email && session.idToken);

    return {
      isValid: hasBasicTokens,
      session,
      hasIdentityPoolTokens: canGetIdentityPoolTokens, // This indicates potential, not actual tokens
      error: canGetIdentityPoolTokens
        ? undefined
        : "Missing data for Identity Pool token generation",
    };
  } catch (error) {
    return {
      isValid: false,
      session: null,
      hasIdentityPoolTokens: false,
      error: `Session validation failed: ${error}`,
    };
  }
}

// Export the auth options for use in API routes
export { authOptions };
