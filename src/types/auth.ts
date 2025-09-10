import type { DefaultSession, Session } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      groups?: string[];
      isAdmin?: boolean;
    } & DefaultSession["user"];
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    awsTokenExpiresAt?: number;
    groups?: string[];
    isAdmin?: boolean;
    captifyStatus?: string | null;
    error?: string;
  }

  interface JWT {
    sub?: string;
    email?: string;
    name?: string;
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    awsTokenExpiresAt?: number;
    accessTokenExpires?: number;
    groups?: string[];
    isAdmin?: boolean;
    captifyStatus?: string | null;
    error?: string;
  }
}

/**
 * Helper to check if user has admin privileges
 */
export function isUserAdmin(session: Session | null): boolean {
  if (!session) return false;
  
  // Check session-level isAdmin flag
  if ((session as any).isAdmin) return true;
  
  // Check user-level isAdmin flag
  if ((session.user as any)?.isAdmin) return true;
  
  // Check if user is in Admins group
  if ((session as any).groups?.includes('Admins')) return true;
  if ((session.user as any)?.groups?.includes('Admins')) return true;
  
  return false;
}

/**
 * Helper to get user's groups
 */
export function getUserGroups(session: Session | null): string[] {
  if (!session) return [];
  
  // Prefer user-level groups
  const userGroups = (session.user as any)?.groups;
  if (userGroups && userGroups.length > 0) {
    return userGroups;
  }
  
  // Fall back to session-level groups
  const sessionGroups = (session as any).groups;
  if (sessionGroups && sessionGroups.length > 0) {
    return sessionGroups;
  }
  
  return [];
}