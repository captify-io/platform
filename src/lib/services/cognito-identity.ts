/**
 * Client-side Cognito Identity Service
 *
 * Uses API routes to get AWS credentials from Cognito Identity Pool
 * since client-side code cannot access environment variables.
 */

import { apiClient } from "@/lib/api-client";

export interface CognitoCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  identityId: string;
  expiresAt: number;
}

export class CognitoIdentityService {
  async getCredentialsForUser(
    userEmail: string,
    idToken: string,
    forceRefresh: boolean = false
  ): Promise<CognitoCredentials> {
    try {
      console.log("� Getting Cognito Identity credentials via API...");

      const response = await apiClient.post<{
        success: boolean;
        credentials?: CognitoCredentials;
        error?: string;
      }>(
        "/api/auth/cognito-identity",
        {
          forceRefresh,
        },
        {
          headers: {
            "X-User-Email": userEmail,
            "X-ID-Token": idToken,
          },
        }
      );

      if (!response.ok || !response.data) {
        throw new Error(response.error || "API request failed");
      }

      const apiData = response.data;

      if (!apiData.success || !apiData.credentials) {
        throw new Error(apiData.error || "Failed to get credentials from API");
      }

      console.log("✅ Cognito Identity credentials obtained via API:", {
        identityId: apiData.credentials.identityId,
        expiresAt: new Date(apiData.credentials.expiresAt).toISOString(),
      });

      return apiData.credentials;
    } catch (error) {
      console.error("❌ Error getting Cognito credentials via API:", error);
      throw new Error(`Failed to get Cognito credentials: ${error}`);
    }
  }

  generateSessionId(identityId: string, workspaceId?: string): string {
    const baseSessionId = `session-${identityId}`;
    return workspaceId ? `${baseSessionId}-${workspaceId}` : baseSessionId;
  }

  /**
   * Health check for the Cognito Identity service
   */
  async healthCheck(): Promise<{
    success: boolean;
    service: string;
    error?: string;
  }> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        service: string;
        error?: string;
      }>("/api/auth/cognito-identity");

      if (!response.ok || !response.data) {
        return {
          success: false,
          service: "Cognito Identity API",
          error: response.error || "Health check failed",
        };
      }

      return response.data;
    } catch (error) {
      return {
        success: false,
        service: "Cognito Identity API",
        error: `Health check failed: ${error}`,
      };
    }
  }
}
