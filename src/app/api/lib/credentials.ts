import {
  CognitoIdentityClient,
  GetCredentialsForIdentityCommand,
  GetIdCommand,
} from "@aws-sdk/client-cognito-identity";
import { getSessionConfig } from "./session-config";

// Get session configuration
const sessionConfig = getSessionConfig();

interface CachedCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  region: string;
  expiration: Date;
  identityPoolId: string; // Track which pool these credentials are for
}

// Cache credentials by identity pool ID
const credentialsCacheMap = new Map<string, CachedCredentials>();

export function clearCredentialsCache(poolId?: string) {
  if (poolId) {
    credentialsCacheMap.delete(poolId);
  } else {
    credentialsCacheMap.clear();
  }
}

export function getCredentialsStatus(poolId?: string): {
  exists: boolean;
  expired: boolean;
  expiresAt?: string;
  timeUntilExpiry?: number;
  poolId?: string;
} {
  // If poolId provided, check that specific cache
  const cache = poolId
    ? credentialsCacheMap.get(poolId)
    : Array.from(credentialsCacheMap.values())[0]; // Get first cache if no poolId

  if (!cache) {
    return { exists: false, expired: false };
  }

  const now = new Date();
  const expired = cache.expiration <= now;
  const timeUntilExpiry = cache.expiration.getTime() - now.getTime();

  return {
    exists: true,
    expired,
    expiresAt: cache.expiration.toISOString(),
    timeUntilExpiry: Math.max(0, timeUntilExpiry),
    poolId: cache.identityPoolId,
  };
}

export async function getAwsCredentialsFromIdentityPool(
  session: any,
  identityPoolId?: string,
  forceRefresh: boolean = false
): Promise<CachedCredentials> {
  if (!session?.user) {
    throw new Error("No authenticated session found. Please log in.");
  }

  if (session.error === "RefreshTokenError") {
    throw new Error(
      "Your session has expired and token refresh failed. Please log in again."
    );
  }

  const idToken = session.idToken;
  if (!idToken) {
    throw new Error("No identity token found in session. Please log in again.");
  }

  // Check token expiration and provide detailed debugging
  const awsTokenExpiresAt = session.awsTokenExpiresAt;
  if (awsTokenExpiresAt) {
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = awsTokenExpiresAt - now;

    if (timeUntilExpiry <= 0) {
      throw new Error(
        "Your AWS tokens have expired. Please refresh the page to get new tokens."
      );
    }

    if (timeUntilExpiry <= 300) {
    }
  } else {
  }

  // Use the provided identity pool ID or fall back to environment
  const poolId = identityPoolId || process.env.COGNITO_IDENTITY_POOL_ID;

  if (!poolId) {
    throw new Error(
      `Missing Identity Pool ID. Provided: ${identityPoolId}, Environment: ${process.env.COGNITO_IDENTITY_POOL_ID}`
    );
  }

  // Step 2: Check if AWS credentials exist and are still valid for this pool
  const now = new Date();
  const cachedCredentials = credentialsCacheMap.get(poolId);

  // Force refresh if requested (e.g., for admin operations)
  if (forceRefresh) {
    credentialsCacheMap.delete(poolId);
  }

  if (cachedCredentials && !forceRefresh) {
    if (cachedCredentials.expiration > now) {
      return cachedCredentials;
    } else {
      credentialsCacheMap.delete(poolId);
    }
  }

  // Step 3: Create fresh AWS credentials using the ID token

  const region = process.env.AWS_REGION || "us-east-1";
  const userPoolId = process.env.COGNITO_USER_POOL_ID;


  if (!userPoolId) {
    throw new Error("Missing User Pool ID in environment configuration");
  }

  try {
    const cognitoIdentity = new CognitoIdentityClient({ region });


    // Get Identity ID from Cognito Identity Pool
    const getIdCommand = new GetIdCommand({
      IdentityPoolId: poolId,
      Logins: {
        [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: idToken,
      },
    });

    const identityResponse = await cognitoIdentity.send(getIdCommand);
    if (!identityResponse.IdentityId) {
      throw new Error("Failed to get Identity ID from Cognito Identity Pool");
    }


    // Log user groups for debugging role mapping
    if (session?.groups || session?.user?.groups) {
      const groups = session?.groups || session?.user?.groups || [];
    }

    // Get AWS credentials using the Identity ID
    const getCredentialsCommand = new GetCredentialsForIdentityCommand({
      IdentityId: identityResponse.IdentityId,
      Logins: {
        [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: idToken,
      },
    });

    const credentialsResponse = await cognitoIdentity.send(
      getCredentialsCommand
    );

    if (!credentialsResponse.Credentials) {
      throw new Error("Failed to get AWS credentials from Identity Pool");
    }

    // Use the AWS credential expiration directly
    const awsCredentialsExpiry = credentialsResponse.Credentials.Expiration;

    // Use AWS expiration or fallback to 1 hour
    const credentialExpiration =
      awsCredentialsExpiry || new Date(Date.now() + 3600 * 1000);

    // Cache the credentials for this specific pool
    const newCredentials: CachedCredentials = {
      accessKeyId: credentialsResponse.Credentials.AccessKeyId!,
      secretAccessKey: credentialsResponse.Credentials.SecretKey!,
      sessionToken: credentialsResponse.Credentials.SessionToken!,
      region,
      expiration: credentialExpiration,
      identityPoolId: poolId,
    };

    credentialsCacheMap.set(poolId, newCredentials);


    // Try to decode the session token to see what role was assumed
    try {
      const tokenParts = newCredentials.sessionToken.split(":");
      if (tokenParts.length > 4) {
        const roleInfo = tokenParts[4];
        if (
          roleInfo.includes("CaptifyAdmin") ||
          roleInfo.includes("Cognito_CaptifyAdmin")
        ) {
          // Using ADMIN role credentials
        } else if (roleInfo.includes("Captify_Default")) {
          // Using DEFAULT role credentials
        } else {
          // Using role: ${roleInfo}
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }

    return newCredentials;
  } catch (error: any) {
    // Clear cache for this pool on error
    credentialsCacheMap.delete(poolId);


    // Handle specific AWS errors
    if (
      error.name === "NotAuthorizedException" ||
      error.message?.includes("Token expired") ||
      error.message?.includes("Invalid login token") ||
      error.message?.includes("Access denied")
    ) {
      throw new Error(
        "Your session has expired. Please log in again to refresh your credentials."
      );
    }

    if (error.name === "ResourceNotFoundException") {
      throw new Error(
        `Identity Pool not found: ${poolId}. Please check your Cognito configuration.`
      );
    }

    if (error.name === "InvalidIdentityPoolConfigurationException") {
      throw new Error(
        `Invalid Identity Pool configuration for pool: ${poolId}. Check IAM roles assigned to this pool. Error: ${error.message}`
      );
    }

    throw new Error(
      `Failed to get AWS credentials from pool ${poolId}: ${error.message}`
    );
  }
}
