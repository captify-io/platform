/**
 * Session Validation Service
 *
 * Provides utilities to validate and ensure both Cognito User Pool tokens
 * and Identity Pool credentials are available and valid.
 */

import { getSession } from "next-auth/react";
import {
  awsCredentialManager,
  type CachedAwsCredentials,
} from "./aws-credential-manager";

interface ExtendedSession {
  accessToken?: string;
  idToken?: string;
  expiresAt?: number;
  user?: {
    email?: string;
    name?: string;
  };
}

export interface SessionValidationResult {
  isValid: boolean;
  hasUserPoolTokens: boolean;
  hasIdentityPoolTokens: boolean;
  session?: ExtendedSession;
  awsCredentials?: CachedAwsCredentials;
  error?: string;
}

/**
 * Comprehensive session validation that checks both User Pool and Identity Pool tokens
 */
export async function validateCompleteSession(): Promise<SessionValidationResult> {
  try {
    // 1. Check NextAuth session (User Pool tokens)
    const session = (await getSession()) as ExtendedSession | null;

    if (!session) {
      return {
        isValid: false,
        hasUserPoolTokens: false,
        hasIdentityPoolTokens: false,
        error: "No active session found",
      };
    }

    // Check if User Pool tokens are present and not expired
    const hasUserPoolTokens = !!(session.accessToken && session.idToken);
    const isSessionExpired = session.expiresAt
      ? Date.now() / 1000 > session.expiresAt
      : false;

    if (!hasUserPoolTokens || isSessionExpired) {
      return {
        isValid: false,
        hasUserPoolTokens: false,
        hasIdentityPoolTokens: false,
        session,
        error: isSessionExpired
          ? "Session expired"
          : "Missing User Pool tokens",
      };
    }

    // 2. Check/ensure Identity Pool credentials
    let awsCredentials: CachedAwsCredentials | null = null;
    let hasIdentityPoolTokens = false;

    if (session.user?.email && session.idToken) {
      try {
        awsCredentials = await awsCredentialManager.getCredentialsForUser(
          session.user.email,
          session.idToken,
          false // Don't force refresh by default
        );
        hasIdentityPoolTokens = !!awsCredentials;
      } catch (error) {
        console.error(
          "Failed to get/validate Identity Pool credentials:",
          error
        );
        hasIdentityPoolTokens = false;
      }
    }

    const isValid = hasUserPoolTokens && hasIdentityPoolTokens;

    return {
      isValid,
      hasUserPoolTokens,
      hasIdentityPoolTokens,
      session,
      awsCredentials: awsCredentials || undefined,
      error: !isValid ? "Missing or invalid Identity Pool tokens" : undefined,
    };
  } catch (error) {
    console.error("Error during session validation:", error);
    return {
      isValid: false,
      hasUserPoolTokens: false,
      hasIdentityPoolTokens: false,
      error: `Session validation failed: ${error}`,
    };
  }
}

/**
 * Ensure Identity Pool tokens are available for a user session
 * This function will attempt to get/refresh Identity Pool credentials
 */
export async function ensureIdentityPoolTokens(
  userEmail: string,
  idToken: string,
  forceRefresh: boolean = false
): Promise<CachedAwsCredentials | null> {
  try {
    console.log(`🔐 Ensuring Identity Pool tokens for user: ${userEmail}`);

    const credentials = await awsCredentialManager.getCredentialsForUser(
      userEmail,
      idToken,
      forceRefresh
    );

    if (credentials) {
      console.log("✅ Identity Pool tokens are available and valid");
      return credentials;
    } else {
      console.error("❌ Failed to obtain Identity Pool tokens");
      return null;
    }
  } catch (error) {
    console.error("❌ Error ensuring Identity Pool tokens:", error);
    return null;
  }
}

/**
 * Quick check to see if the current session has all required tokens
 */
export async function hasCompleteSession(): Promise<boolean> {
  const result = await validateCompleteSession();
  return result.isValid;
}

/**
 * Get AWS credentials for the current session, ensuring they are valid
 */
export async function getSessionAwsCredentials(): Promise<CachedAwsCredentials | null> {
  const result = await validateCompleteSession();
  return result.awsCredentials || null;
}
