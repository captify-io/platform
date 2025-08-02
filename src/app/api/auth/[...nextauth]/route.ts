import NextAuth from "next-auth/next";
import CognitoProvider from "next-auth/providers/cognito";

// Debug logging for NEXTAUTH_SECRET
console.log("Environment debug:", {
  hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
  nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length,
  nodeEnv: process.env.NODE_ENV,
  allEnvKeys: Object.keys(process.env).filter(key => key.includes('NEXTAUTH')),
});

const authOptions = {
  debug: true,
  secret: process.env.NEXTAUTH_SECRET || "gDFt30aZNJQ21PRS2g47/3HJzcXSqyTJHgbRLGIiDzc=",
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
      issuer: process.env.NEXT_PUBLIC_COGNITO_ISSUER!,
      wellKnown: `https://cognito-idp.us-east-1.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/openid-configuration`,
      authorization: {
        url: `${process.env.NEXT_PUBLIC_COGNITO_ISSUER}/oauth2/authorize`,
        params: {
          scope: "openid profile email",
          response_type: "code",
          client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/cognito`,
        },
      },
      token: `${process.env.NEXT_PUBLIC_COGNITO_ISSUER}/oauth2/token`,
      userinfo: `${process.env.NEXT_PUBLIC_COGNITO_ISSUER}/oauth2/userInfo`,
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
    async jwt({ token, account, profile }: {
      token: unknown;
      account: unknown;
      profile?: unknown;
    }) {
      const typedToken = token as Record<string, unknown>;
      const typedAccount = account as Record<string, unknown> | null;
      
      console.log("JWT callback:", {
        token: typedToken?.sub,
        account: typedAccount?.provider,
      });
      
      if (typedAccount) {
        typedToken.accessToken = typedAccount.access_token;
        typedToken.idToken = typedAccount.id_token;
        typedToken.refreshToken = typedAccount.refresh_token;
        typedToken.expiresAt = typedAccount.expires_at;
        typedToken.sub = typedAccount.providerAccountId;
        console.log("Account data:", {
          provider: typedAccount.provider,
          type: typedAccount.type,
          hasAccessToken: !!typedAccount.access_token,
          hasIdToken: !!typedAccount.id_token,
        });
      }

      if (profile) {
        const typedProfile = profile as Record<string, unknown>;
        typedToken.name = typedProfile.name;
        typedToken.email = typedProfile.email;
        typedToken.picture = typedProfile.picture;
      }

      return typedToken;
    },
    async session({ session, token }: {
      session: unknown;
      token: unknown;
    }) {
      const typedSession = session as Record<string, unknown> & { expires: string };
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
    async signIn({ account, profile }: {
      account: unknown;
      profile?: unknown;
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
    async signIn({ user, account, isNewUser }: {
      user: unknown;
      account: unknown;
      isNewUser?: boolean;
    }) {
      if (process.env.NODE_ENV === "development") {
        const typedUser = user as Record<string, unknown>;
        const typedAccount = account as Record<string, unknown> | null;
        console.log("Sign-in successful", {
          userId: typedUser.id,
          provider: typedAccount?.provider,
          isNewUser,
        });
      }
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
