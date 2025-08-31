import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    idToken?: string;
    accessToken?: string;
    refreshToken?: string;
    awsTokenExpiresAt?: number;
  }

  interface User {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    idToken?: string;
    accessToken?: string;
    refreshToken?: string;
    awsTokenExpiresAt?: number;
    error?: string;
  }
}
