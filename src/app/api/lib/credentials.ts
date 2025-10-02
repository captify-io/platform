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
  identityPoolId: string,
  forceRefresh: boolean = false
): Promise<CachedCredentials> {
  // Validate required parameters
  if (!session?.user || !session.idToken) {
    throw new Error("Invalid session - authentication required");
  }

  if (!identityPoolId) {
    throw new Error("Identity Pool ID is required");
  }

  if (session.error === "RefreshTokenError") {
    throw new Error("Session expired - please log in again");
  }

  // Step 1: Check cache for valid credentials
  const now = new Date();
  const cachedCredentials = credentialsCacheMap.get(identityPoolId);

  if (!forceRefresh && cachedCredentials && cachedCredentials.expiration > now) {
    return cachedCredentials;
  }

  // Clear expired or force-refreshed credentials
  credentialsCacheMap.delete(identityPoolId);

  // Step 2: Get fresh credentials from AWS
  const region = process.env.AWS_REGION || "us-east-1";
  const userPoolId = process.env.COGNITO_USER_POOL_ID;

  if (!userPoolId) {
    throw new Error("Missing User Pool ID configuration");
  }

  try {
    const cognitoIdentity = new CognitoIdentityClient({ region });
    const loginKey = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;

    // Get Identity ID
    const identityResponse = await cognitoIdentity.send(new GetIdCommand({
      IdentityPoolId: identityPoolId,
      Logins: { [loginKey]: session.idToken },
    }));

    if (!identityResponse.IdentityId) {
      throw new Error("Failed to get Identity ID");
    }

    // Get AWS credentials
    const credentialsResponse = await cognitoIdentity.send(new GetCredentialsForIdentityCommand({
      IdentityId: identityResponse.IdentityId,
      Logins: { [loginKey]: session.idToken },
    }));

    if (!credentialsResponse.Credentials) {
      throw new Error("Failed to get AWS credentials");
    }

    // Step 3: Cache and return credentials
    const newCredentials: CachedCredentials = {
      accessKeyId: credentialsResponse.Credentials.AccessKeyId!,
      secretAccessKey: credentialsResponse.Credentials.SecretKey!,
      sessionToken: credentialsResponse.Credentials.SessionToken!,
      region,
      expiration: credentialsResponse.Credentials.Expiration || new Date(Date.now() + 3600 * 1000),
      identityPoolId,
    };

    credentialsCacheMap.set(identityPoolId, newCredentials);
    return newCredentials;

  } catch (error: any) {
    credentialsCacheMap.delete(identityPoolId);

    if (error.name === "NotAuthorizedException") {
      throw new Error("Session expired - please log in again");
    }

    if (error.name === "ResourceNotFoundException") {
      throw new Error(`Identity Pool not found: ${identityPoolId}`);
    }

    throw new Error(`Failed to get credentials: ${error.message}`);
  }
}
