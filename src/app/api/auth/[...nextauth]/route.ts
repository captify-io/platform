import NextAuth from "next-auth/next";
import CognitoProvider from "next-auth/providers/cognito";
import { NextRequest } from "next/server";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

// Debug logging for environment variables
console.log("Environment debug:", {
  hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
  nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length,
  nodeEnv: process.env.NODE_ENV,
  nextAuthUrl: process.env.NEXTAUTH_URL,
  cognitoClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
  cognitoIssuer: process.env.NEXT_PUBLIC_COGNITO_ISSUER,
  cognitoClientSecret: !!process.env.COGNITO_CLIENT_SECRET,
  allEnvKeys: Object.keys(process.env).filter(
    (key) => key.includes("NEXTAUTH") || key.includes("COGNITO")
  ),
});

// Validate critical environment variables
if (!process.env.NEXT_PUBLIC_COGNITO_ISSUER) {
  console.error("CRITICAL: NEXT_PUBLIC_COGNITO_ISSUER is not set!");
}
if (!process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID) {
  console.error("CRITICAL: NEXT_PUBLIC_COGNITO_CLIENT_ID is not set!");
}
if (!process.env.COGNITO_CLIENT_SECRET) {
  console.error("CRITICAL: COGNITO_CLIENT_SECRET is not set!");
}

const authOptions = {
  debug: true,
  logger: {
    error(code: string, metadata: unknown) {
      console.error("NextAuth Error:", code, metadata);
    },
    warn(code: string) {
      console.warn("NextAuth Warning:", code);
    },
    debug(code: string, metadata: unknown) {
      console.log("NextAuth Debug:", code, metadata);
    },
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    "gDFt30aZNJQ21PRS2g47/3HJzcXSqyTJHgbRLGIiDzc=",
  session: {
    strategy: "jwt" as const,
    maxAge: 60 * 60 * 24, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  providers: [
    CognitoProvider({
      id: "cognito",
      name: "Cognito",
      clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: `${process.env.COGNITO_DOMAIN}/${process.env.COGNITO_USER_POOL_ID}`,
      wellKnown: `${process.env.COGNITO_DOMAIN}/${process.env.COGNITO_USER_POOL_ID}/.well-known/openid-configuration`,
      authorization: {
        url: `${process.env.NEXT_PUBLIC_COGNITO_ISSUER}/login`,
        params: {
          scope: "openid profile email",
          response_type: "code",
          client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
        },
      },
      token: `${process.env.COGNITO_DOMAIN}/${process.env.COGNITO_USER_POOL_ID}/oauth2/token`,
      userinfo: `${process.env.COGNITO_DOMAIN}/${process.env.COGNITO_USER_POOL_ID}/oauth2/userInfo`,
      checks: ["pkce", "state", "nonce"],
      profile(profile: Record<string, unknown>) {
        console.log("Cognito Profile Callback:", profile);
        return {
          id: profile.sub as string,
          name: (profile.name ?? profile.email) as string,
          email: profile.email as string,
          image: (profile.picture ?? null) as string | null,
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
      token: unknown;
      account: unknown;
      profile?: unknown;
    }) {
      const typedToken = token as Record<string, unknown>;
      const typedAccount = account as Record<string, unknown> | null;

      console.log("=== JWT Callback ===");
      console.log("Token:", {
        sub: typedToken?.sub,
        email: typedToken?.email,
        name: typedToken?.name,
      });
      console.log("Account:", {
        provider: typedAccount?.provider,
        type: typedAccount?.type,
        access_token: typedAccount?.access_token ? "present" : "missing",
        id_token: typedAccount?.id_token ? "present" : "missing",
        refresh_token: typedAccount?.refresh_token ? "present" : "missing",
        expires_at: typedAccount?.expires_at,
        token_type: typedAccount?.token_type,
        scope: typedAccount?.scope,
      });
      console.log("Profile:", profile);

      if (typedAccount) {
        typedToken.accessToken = typedAccount.access_token;
        typedToken.idToken = typedAccount.id_token;
        typedToken.refreshToken = typedAccount.refresh_token;
        typedToken.expiresAt = typedAccount.expires_at;
        typedToken.sub = typedAccount.providerAccountId;
        console.log("Account data stored in token");

        // Fetch AWS credentials when we have the initial tokens
        if (typedAccount.id_token) {
          try {
            console.log(
              "🔧 Attempting to fetch AWS credentials in JWT callback"
            );
            const credentials = await fromCognitoIdentityPool({
              clientConfig: { region: process.env.AWS_REGION },
              identityPoolId: process.env.COGNITO_IDENTITY_POOL_ID!,
              logins: {
                [`cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`]:
                  typedAccount.id_token as string,
              },
            })();

            typedToken.awsSessionToken = credentials.sessionToken;
            typedToken.awsExpiresAt = credentials.expiration?.getTime();

            console.log("✅ Successfully set AWS credentials in token", {
              hasSessionToken: !!typedToken.awsSessionToken,
              expiresAt: typedToken.awsExpiresAt,
            });
          } catch (error) {
            console.error("❌ Failed to fetch AWS credentials:", error);
          }
        }
      }

      if (profile) {
        const typedProfile = profile as Record<string, unknown>;
        typedToken.name = typedProfile.name;
        typedToken.email = typedProfile.email;
        typedToken.picture = typedProfile.picture;
        console.log("Profile data stored in token");
      }

      console.log("=== End JWT Callback ===");
      return typedToken;
    },
    async session({ session, token }: { session: unknown; token: unknown }) {
      const typedSession = session as Record<string, unknown> & {
        expires: string;
      };
      const typedToken = token as Record<string, unknown>;

      console.log("Session callback:", {
        user: (typedSession?.user as Record<string, unknown>)?.email,
        hasToken: !!typedToken,
      });

      // Add token data to session
      typedSession.accessToken = typedToken.accessToken;
      typedSession.idToken = typedToken.idToken;
      typedSession.refreshToken = typedToken.refreshToken;
      typedSession.expiresAt = typedToken.expiresAt;

      // Add AWS credentials to session
      typedSession.awsSessionToken = typedToken.awsSessionToken;
      typedSession.awsExpiresAt = typedToken.awsExpiresAt;

      // Update user data
      if (typedSession.user) {
        const user = typedSession.user as Record<string, unknown>;
        user.id = typedToken.sub;
        user.name = typedToken.name;
        user.email = typedToken.email;
        user.image = typedToken.picture;
      }

      return typedSession;
    },
    async signIn({
      account,
      profile,
    }: {
      account: unknown;
      profile?: unknown;
    }) {
      console.log("=== SignIn Callback ===");
      console.log("Account:", account);
      console.log("Profile:", profile);

      if (!account) {
        console.error("SignIn failed: No account provided");
        return false;
      }

      if (!profile) {
        console.error("SignIn failed: No profile provided");
        return false;
      }

      console.log("SignIn successful");
      console.log("=== End SignIn Callback ===");
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
    }: {
      user: unknown;
      account: unknown;
      isNewUser?: boolean;
    }) {
      if (process.env.NODE_ENV === "development") {
        // Log sign-in event for development debugging
        console.log("Sign-in event:", { user, account });
      }
    },
  },
};

async function handler(
  req: NextRequest,
  context: { params: Promise<Record<string, string | string[]>> }
) {
  // Extract the saved email from cookie
  const savedEmail = req.cookies.get("auth_email")?.value || "";

  // Update the authorization params with the saved email
  const dynamicAuthOptions = {
    ...authOptions,
    providers: [
      CognitoProvider({
        id: "cognito",
        name: "Cognito",
        clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
        clientSecret: process.env.COGNITO_CLIENT_SECRET!,
        issuer: `${process.env.COGNITO_DOMAIN}/${process.env.COGNITO_USER_POOL_ID}`,
        wellKnown: `${process.env.COGNITO_DOMAIN}/${process.env.COGNITO_USER_POOL_ID}/.well-known/openid-configuration`,
        authorization: {
          url: `${process.env.NEXT_PUBLIC_COGNITO_ISSUER}/login`,
          params: {
            scope: "openid profile email",
            response_type: "code",
            client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
            login_hint: savedEmail,
          },
        },
        token: `${process.env.COGNITO_DOMAIN}/${process.env.COGNITO_USER_POOL_ID}/oauth2/token`,
        userinfo: `${process.env.COGNITO_DOMAIN}/${process.env.COGNITO_USER_POOL_ID}/oauth2/userInfo`,
        checks: ["pkce", "state", "nonce"],
        profile(profile: Record<string, unknown>) {
          // Do not log in production
          return {
            id: profile.sub as string,
            name: (profile.name ?? profile.email) as string,
            email: profile.email as string,
            image: (profile.picture ?? null) as string | null,
          };
        },
      }),
    ],
  };

  return NextAuth(dynamicAuthOptions)(req, context);
}

export { handler as GET, handler as POST };
