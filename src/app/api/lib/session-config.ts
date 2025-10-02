/**
 * Session Configuration Helper
 * Centralized configuration for session durations and token management
 */

export interface SessionConfig {
  nextAuthDuration: number; // NextAuth session duration in seconds
  nextAuthUpdateAge: number; // When to refresh NextAuth session
  cognitoTokenDuration: number; // Cognito User Pool token duration
  identityPoolDuration: number; // Identity Pool credential duration
  refreshBuffer: number; // Buffer time before token expiry to refresh
  cacheBuffer: number; // Buffer time for credential cache expiry
}

/**
 * Get session configuration from environment variables with sensible defaults
 */
export function getSessionConfig(): SessionConfig {
  // Default to 1 hour for all durations
  const defaultDuration = 3600; // 1 hour
  const defaultRefreshBuffer = 300; // 5 minutes
  const defaultCacheBuffer = 600; // 10 minutes

  const nextAuthDuration = parseInt(
    process.env.NEXTAUTH_SESSION_DURATION || defaultDuration.toString()
  );
  const cognitoTokenDuration = parseInt(
    process.env.COGNITO_USER_POOL_SESSION_DURATION || defaultDuration.toString()
  );
  const identityPoolDuration = parseInt(
    process.env.COGNITO_IDENTITY_POOL_SESSION_DURATION ||
      defaultDuration.toString()
  );
  const refreshBuffer = parseInt(
    process.env.COGNITO_TOKEN_REFRESH_BUFFER || defaultRefreshBuffer.toString()
  );

  // Validation
  if (nextAuthDuration < 300) {
    // NEXTAUTH_SESSION_DURATION is very short (< 5 minutes)
  }

  if (refreshBuffer >= nextAuthDuration) {
    // COGNITO_TOKEN_REFRESH_BUFFER is >= NEXTAUTH_SESSION_DURATION
  }

  return {
    nextAuthDuration,
    nextAuthUpdateAge: nextAuthDuration - refreshBuffer,
    cognitoTokenDuration,
    identityPoolDuration,
    refreshBuffer,
    cacheBuffer: defaultCacheBuffer,
  };
}

/**
 * Get identity pool ID for a specific app
 */
export function getAppIdentityPoolId(app: string): string | undefined {
  const envVar = `COGNITO_IDENTITY_POOL_${app.toUpperCase()}`;
  return process.env[envVar] || process.env.COGNITO_IDENTITY_POOL_ID;
}

/**
 * Log current session configuration (useful for debugging)
 */
export function logSessionConfig(): void {
  // Session config logging removed for production
}
