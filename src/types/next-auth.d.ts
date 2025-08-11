declare module "next-auth" {
  interface Session {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    sub?: string;
    name?: string;
    email?: string;
    picture?: string;
  }
}
