/**
 * AWS Credential Management for Captify Platform
 *
 * Handles caching and refreshing of AWS credentials obtained from Cognito Identity Pool
 */

import { CognitoIdentityService } from "./cognito-identity";

export interface CachedAwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  identityId: string;
  expiresAt: number; // Unix timestamp
}

export interface TokenAndCredentials {
  idToken: string;
  awsCredentials: CachedAwsCredentials;
}

class AwsCredentialManager {
  private credentialsCache = new Map<string, CachedAwsCredentials>();
  private cognitoService = new CognitoIdentityService();

  /**
   * Get AWS credentials for a user, using cache when possible
   */
  async getCredentialsForUser(
    userEmail: string,
    idToken: string,
    forceRefresh: boolean = false
  ): Promise<CachedAwsCredentials> {
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh) {
      const cached = this.credentialsCache.get(userEmail);
      if (cached && this.isCredentialValid(cached)) {
        console.log(`✅ Using cached AWS credentials for ${userEmail}`);
        return cached;
      }
    }

    // Cache miss, expired, or force refresh - get fresh credentials
    console.log(
      `🔄 Refreshing AWS credentials for ${userEmail}${
        forceRefresh ? " (forced)" : ""
      }`
    );
    try {
      const credentials = await this.cognitoService.getCredentialsForUser(
        userEmail,
        idToken,
        forceRefresh
      );

      // Cache with expiry based on what the API returned (or 45-minute default)
      const cached: CachedAwsCredentials = {
        ...credentials,
        expiresAt: credentials.expiresAt || Date.now() + 45 * 60 * 1000, // Use API expiry or 45 minutes
      };

      this.credentialsCache.set(userEmail, cached);
      console.log(`✅ Cached fresh AWS credentials for ${userEmail}`);

      return cached;
    } catch (error) {
      console.error(
        `❌ Failed to get AWS credentials for ${userEmail}:`,
        error
      );

      // Remove invalid cache entry
      this.credentialsCache.delete(userEmail);

      throw error;
    }
  }

  /**
   * Check if credentials are still valid (not expired)
   */
  private isCredentialValid(credentials: CachedAwsCredentials): boolean {
    return Date.now() < credentials.expiresAt;
  }

  /**
   * Manually invalidate credentials for a user (e.g., on logout)
   */
  invalidateCredentials(userEmail: string): void {
    this.credentialsCache.delete(userEmail);
    console.log(`🗑️ Invalidated AWS credentials for ${userEmail}`);
  }

  /**
   * Clean up expired credentials from cache
   */
  /**
   * Clear cached credentials for a specific user
   */
  async clearUserCredentials(userEmail: string): Promise<void> {
    if (this.credentialsCache.has(userEmail)) {
      this.credentialsCache.delete(userEmail);
      console.log(`🧹 Cleared cached credentials for user: ${userEmail}`);
    }
  }

  /**
   * Clear all cached credentials
   */
  clearAllCredentials(): void {
    const count = this.credentialsCache.size;
    this.credentialsCache.clear();
    console.log(`🧹 Cleared all cached credentials (${count} entries)`);
  }

  /**
   * Clean up expired credentials from cache
   */
  cleanupExpiredCredentials(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [userEmail, credentials] of this.credentialsCache.entries()) {
      if (now >= credentials.expiresAt) {
        this.credentialsCache.delete(userEmail);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired credential entries`);
    }
  }
}

// Singleton instance
export const awsCredentialManager = new AwsCredentialManager();

// Cleanup expired credentials every 10 minutes
if (typeof window === "undefined") {
  // Server-side only
  setInterval(() => {
    awsCredentialManager.cleanupExpiredCredentials();
  }, 10 * 60 * 1000);
}
