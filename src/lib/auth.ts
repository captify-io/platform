import NextAuth from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";

interface ExtendedToken {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
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
}

interface AuthUser {
  id?: string;
  email?: string;
  name?: string;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - NextAuth v4 compatibility issue
export default NextAuth({
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
      wellKnown: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/openid-configuration`,
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
      });
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.sub = account.providerAccountId;
        console.log("Account data:", {
          provider: account.provider,
          type: account.type,
          hasAccessToken: !!account.access_token,
          hasIdToken: !!account.id_token,
        });
      }

      if (profile) {
        token.name = profile.name;
        token.email = profile.email;
        token.picture = profile.picture;
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
      });
      // Add token data to session
      session.accessToken = token.accessToken;
      session.idToken = token.idToken;
      session.refreshToken = token.refreshToken;
      session.expiresAt = token.expiresAt;

      // Update user data
      if (session.user) {
        session.user.id = token.sub;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
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
});
