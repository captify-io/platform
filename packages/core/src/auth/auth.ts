// Authentication utilities for Captify SDK
import type { UserSession } from "../types";
import { createApiClient } from "../api/utils";

/**
 * Validate user session token
 */
export async function validateSession(idToken: string): Promise<boolean> {
  try {
    const client = createApiClient();

    // Use the API client to validate the JWT token
    const response = await client.post({
      resource: "auth",
      operation: "validate",
      data: { idToken },
    });

    return response.success && response.data?.valid === true;
  } catch (error) {
    console.error("Session validation error:", error);
    return false;
  }
}

/**
 * Get AWS credentials from Cognito Identity Pool
 */
export async function getAwsCredentials(
  idToken: string,
  identityPoolId: string
): Promise<{
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
} | null> {
  try {
    const client = createApiClient();

    // Use the API client to get AWS credentials
    const response = await client.post({
      resource: "auth",
      operation: "getAwsCredentials",
      data: {
        idToken,
        identityPoolId,
      },
    });

    if (response.success && response.data?.credentials) {
      return {
        accessKeyId: response.data.credentials.AccessKeyId,
        secretAccessKey: response.data.credentials.SecretKey,
        sessionToken: response.data.credentials.SessionToken,
      };
    }

    return null;
  } catch (error) {
    console.error("AWS credentials error:", error);
    return null;
  }
}

/**
 * Refresh user session
 */
export async function refreshSession(
  session: UserSession
): Promise<UserSession | null> {
  try {
    const client = createApiClient({ session });

    // Use the API client to refresh the session
    const response = await client.post({
      resource: "auth",
      operation: "refresh",
      data: {
        idToken: session.idToken,
      },
    });

    if (response.success && response.data?.session) {
      return {
        ...session,
        ...response.data.session,
        // Update timestamps
        lastRefresh: new Date().toISOString(),
      };
    }

    return null;
  } catch (error) {
    console.error("Session refresh error:", error);
    return null;
  }
}
