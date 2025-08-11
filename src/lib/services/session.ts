/**
 * Session utilities for user identification and authorization
 * Integrates with NextAuth.js to provide user context for database operations
 */

import { getServerSession } from "next-auth/next";
import { NextRequest } from "next/server";
import authOptions from "@/lib/auth";
import { organizationService } from "./organization";

export interface UserSession {
  user_id: string;
  email: string;
  name?: string;
  org_id: string;
  roles: string[];
  is_admin: boolean;
  idToken?: string;
  awsSessionToken?: string;
  awsExpiresAt?: number;
}

/**
 * Get user session from API route context
 */
export async function getUserSession(
  request?: NextRequest
): Promise<UserSession | null> {
  try {
    // First, try to get session from NextAuth
    const session = await getServerSession(authOptions);

    console.log("🔍 Raw session object:", JSON.stringify(session, null, 2));

    if (!session?.user?.email) {
      console.log("❌ No session or user email found");
      return null;
    }

    // Extract organization ID from email domain or use default
    const org_id = await extractOrgId(session.user.email);

    // Extract user ID (use email as unique identifier)
    const user_id = session.user.email;

    // Determine user roles (this could be enhanced with proper RBAC)
    const roles = determineUserRoles(session.user.email);

    // Try to get ID token from multiple sources
    let idToken: string | undefined;

    // 1. Check if it's already in the session (from session callback)
    idToken = (session as { idToken?: string }).idToken;

    // 2. If not in session, check request headers (from ApiClient)
    if (!idToken && request) {
      idToken = request.headers.get("X-ID-Token") || undefined;
      console.log("🔍 ID token from X-ID-Token header:", !!idToken);
    }

    // 3. Check other possible header variations
    if (!idToken && request) {
      idToken =
        request.headers.get("Authorization")?.replace("Bearer ", "") ||
        undefined;
      console.log("🔍 ID token from Authorization header:", !!idToken);
    }

    console.log(
      "🔍 Final idToken source:",
      idToken
        ? idToken === (session as any).idToken // eslint-disable-line @typescript-eslint/no-explicit-any
          ? "session"
          : "headers"
        : "none"
    );

    // Validate token expiration if we have an idToken
    if (idToken) {
      try {
        // Check if session has expiration info
        const sessionExpiry = (session as any).expiresAt; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (sessionExpiry) {
          const now = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = sessionExpiry - now;
          const expiryDate = new Date(sessionExpiry * 1000);
          const currentDate = new Date(now * 1000);

          console.log(`� SESSION TOKEN VALIDATION:`);
          console.log(`   User: ${session.user.email}`);
          console.log(`   Current time: ${currentDate.toISOString()} (${now})`);
          console.log(
            `   Session expires: ${expiryDate.toISOString()} (${sessionExpiry})`
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

          if (timeUntilExpiry <= 0) {
            console.error(
              `🚨 SESSION TOKEN EXPIRED! Expired ${Math.abs(
                timeUntilExpiry
              )} seconds ago`
            );
            console.error(
              "❌ Session token has expired, forcing re-authentication"
            );
            throw new Error("Session expired - re-authentication required");
          }

          if (timeUntilExpiry < 300) {
            console.warn(
              `⚠️ Session token expiring in ${timeUntilExpiry} seconds - should refresh soon`
            );
          }
        } else {
          console.warn(
            "⚠️ No expiration info found in session - cannot validate token expiry"
          );
        }
      } catch (error) {
        console.error("❌ Token validation failed:", error);
        throw error;
      }
    }

    // Try to get AWS session token from headers
    let awsSessionToken: string | undefined;
    let awsExpiresAt: number | undefined;

    if (request) {
      awsSessionToken = request.headers.get("X-AWS-Session-Token") || undefined;
      const expiresAtHeader = request.headers.get("X-AWS-Expires-At");
      if (expiresAtHeader) {
        awsExpiresAt = parseInt(expiresAtHeader, 10);
      }
      console.log("🔍 AWS session token from headers:", !!awsSessionToken);
    }

    // Also check if AWS credentials are in the session itself
    console.log(
      "🔍 Session service - checking for AWS credentials in session:",
      {
        hasAwsSessionToken: !!(session as any).awsSessionToken, // eslint-disable-line @typescript-eslint/no-explicit-any
        hasAwsExpiresAt: !!(session as any).awsExpiresAt, // eslint-disable-line @typescript-eslint/no-explicit-any
        awsExpiresAt: (session as any).awsExpiresAt, // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    );

    interface SessionWithAws {
      awsSessionToken?: string;
      awsExpiresAt?: number;
    }

    if (!awsSessionToken && (session as SessionWithAws).awsSessionToken) {
      awsSessionToken = (session as SessionWithAws).awsSessionToken;
      awsExpiresAt = (session as SessionWithAws).awsExpiresAt;
      console.log("🔍 AWS session token from session:", !!awsSessionToken);
    }

    const userSession = {
      user_id,
      email: session.user.email,
      name: session.user.name || undefined,
      org_id,
      roles,
      is_admin: roles.includes("admin"),
      idToken,
      awsSessionToken,
      awsExpiresAt,
    };

    console.log(
      "🔍 Final user session - idToken present:",
      !!userSession.idToken
    );

    return userSession;
  } catch (error) {
    console.error("Error getting user session:", error);
    return null;
  }
}

/**
 * Require authenticated user session (throws if not found)
 */
export async function requireUserSession(
  request?: NextRequest
): Promise<UserSession> {
  const session = await getUserSession(request);

  if (!session) {
    throw new Error("Authentication required");
  }

  return session;
}

/**
 * Check if user has required permission
 */
export function hasPermission(
  session: UserSession,
  permission: string
): boolean {
  // Admin users have all permissions
  if (session.is_admin) {
    return true;
  }

  // Map permissions to roles
  const permissionRoleMap: Record<string, string[]> = {
    create_application: ["admin", "creator", "developer"],
    edit_application: ["admin", "creator", "developer"],
    delete_application: ["admin"],
    view_all_applications: ["admin", "manager"],
    manage_organization: ["admin"],
  };

  const requiredRoles = permissionRoleMap[permission] || [];
  return requiredRoles.some((role) => session.roles.includes(role));
}

/**
 * Extract organization ID from email domain
 */
async function extractOrgId(email: string): Promise<string> {
  const domain = email.split("@")[1];

  try {
    // Try to find organization by domain
    const org = await organizationService.getOrganizationByDomain(domain);
    if (org) {
      return org.org_id;
    }

    // Fallback to default organization
    const defaultOrg = await organizationService.getDefaultOrganization();
    return defaultOrg?.org_id || "default-org";
  } catch (error) {
    console.error("Failed to get organization from domain:", error);
    return "default-org";
  }
}

/**
 * Determine user roles based on email or other criteria
 */
function determineUserRoles(email: string): string[] {
  const localPart = email.split("@")[0];

  const roles: string[] = ["user"]; // Everyone gets user role

  // Admin users (could be moved to database/configuration)
  const adminEmails = [
    "admin@anautics.com",
    "admin@titan.ai",
    "admin@captify.io",
  ];

  if (adminEmails.includes(email)) {
    roles.push("admin");
  }

  // Developer role based on email patterns
  if (localPart.includes("dev") || localPart.includes("engineer")) {
    roles.push("developer");
  }

  // Manager role based on email patterns
  if (localPart.includes("manager") || localPart.includes("director")) {
    roles.push("manager");
  }

  // Creator role (can create applications)
  if (
    roles.includes("admin") ||
    roles.includes("developer") ||
    roles.includes("manager")
  ) {
    roles.push("creator");
  }

  return roles;
}

/**
 * Validate organization access
 */
export function validateOrgAccess(
  session: UserSession,
  org_id: string
): boolean {
  // Users can only access their own organization unless they're admin
  return session.org_id === org_id || session.is_admin;
}

/**
 * Get user's accessible organization IDs
 */
export function getAccessibleOrgs(session: UserSession): string[] {
  if (session.is_admin) {
    // Admins can access all organizations (could be limited by configuration)
    return ["*"]; // Wildcard for all orgs
  }

  return [session.org_id];
}

/**
 * Convert NextAuth session to UserSession for client-side use
 */
export function getSessionContext(
  session: { user?: { email?: string; name?: string } } | null
): UserSession {
  if (!session?.user?.email) {
    throw new Error("No valid session found");
  }

  const email = session.user.email;
  const org_id = email.split("@")[1] || "default";

  return {
    user_id: email,
    email: email,
    name: session.user.name,
    org_id: org_id,
    roles: [], // Client-side sessions don't have role information
    is_admin: false, // Client-side sessions don't have admin information
  };
}
