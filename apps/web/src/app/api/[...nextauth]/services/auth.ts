import NextAuth from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";
import type { AuthOptions } from "next-auth";

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    idToken?: string;
    accessToken?: string;
  }
}

// Auth configuration for NextAuth
export const authOptions: AuthOptions = {
  providers: [
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: `https://cognito-idp.us-east-1.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
      authorization: {
        url: "https://account.anautics.ai/login",
        params: {
          scope: "openid email profile",
          response_type: "code",
        },
      },
      token: {
        url: `https://cognito-idp.us-east-1.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/oauth2/token`,
      },
      userinfo: {
        url: `https://cognito-idp.us-east-1.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/oauth2/userInfo`,
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Add AWS credentials to session
      if (token.idToken) {
        session.idToken = token.idToken as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;

      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;

      // Default redirect to home page
      return baseUrl;
    },
  },
  // Remove custom pages to use NextAuth defaults that redirect to provider
  // pages: {
  //   signIn: "/auth/signin",
  //   error: "/auth/error",
  // },
  // Fix URL configuration for dynamic ports
  ...(process.env.NEXTAUTH_URL && {
    url: process.env.NEXTAUTH_URL,
  }),
  debug: process.env.NODE_ENV === "development",
};

// Create NextAuth handlers for all HTTP methods
const authHandler = NextAuth(authOptions);

// Wrapper to make NextAuth compatible with our RouteHandler interface
async function nextAuthWrapper(request: Request, context?: any) {
  // NextAuth expects the route context with params
  // If context is provided (from our routing system), use it
  if (context && context.params) {
    return authHandler(request, context);
  }

  // Fallback: try to extract nextauth params from URL
  const url = new URL(request.url);
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const authIndex = pathSegments.indexOf("auth");
  const nextauthParams =
    authIndex >= 0 ? pathSegments.slice(authIndex + 1) : [];

  const routeContext = {
    params: { nextauth: nextauthParams },
  };

  return authHandler(request, routeContext);
}

export const nextAuthHandlers = {
  GET: nextAuthWrapper,
  POST: nextAuthWrapper,
  PUT: nextAuthWrapper,
  DELETE: nextAuthWrapper,
  PATCH: nextAuthWrapper,
  HEAD: nextAuthWrapper,
  OPTIONS: nextAuthWrapper,
};
