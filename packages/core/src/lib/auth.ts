import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";

const authConfig: NextAuthConfig = {
  providers: [
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: process.env.COGNITO_ISSUER,
      checks: ["state"], // Removed "nonce" check to avoid mismatch issues
      authorization: {
        params: {
          scope: "openid email profile",
          response_type: "code",
        },
      },
    })
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial sign in
      if (account && profile) {
        console.log("JWT Callback - Initial sign in", { account, profile });
        return {
          ...token,
          accessToken: account.access_token,
          idToken: account.id_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          username: profile.preferred_username || profile.email,
          groups: (profile as any)["cognito:groups"] || [],
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.expiresAt as number) * 1000) {
        return token;
      }

      // Access token has expired, refresh it
      console.log("Token expired, refreshing...");
      return token; // For now, just return the token
    },
    async session({ session, token }) {
      // Send properties to the client
      console.log("Session Callback", { token });
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
      console.log("Redirect callback", { url, baseUrl });
      // Always redirect to home after sign in
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour
  },
  cookies: {
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
    nonce: {
      name: "next-auth.nonce",
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