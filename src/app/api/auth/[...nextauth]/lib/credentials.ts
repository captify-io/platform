import { auth } from "@/auth";
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
}

let credentialsCache: CachedCredentials | null = null;

export function clearCredentialsCache() {
  console.log("🗑️ Manually clearing AWS credentials cache");
  credentialsCache = null;
}

export function getCredentialsStatus(): {
  exists: boolean;
  expired: boolean;
  expiresAt?: string;
  timeUntilExpiry?: number;
} {
  if (!credentialsCache) {
    return { exists: false, expired: false };
  }

  const now = new Date();
  const expired = credentialsCache.expiration <= now;
  const timeUntilExpiry = credentialsCache.expiration.getTime() - now.getTime();

  return {
    exists: true,
    expired,
    expiresAt: credentialsCache.expiration.toISOString(),
    timeUntilExpiry: Math.max(0, timeUntilExpiry),
  };
}

export async function getAwsCredentialsFromIdentityPool(
  identityPoolId?: string
): Promise<CachedCredentials> {
  // Step 1: Get NextAuth session (just to get the ID token)
  const session = await auth();
  if (!session) {
    throw new Error("No authenticated session found. Please log in.");
  }

  if ((session as any).error === "RefreshTokenError") {
    throw new Error(
      "Your session has expired and token refresh failed. Please log in again."
    );
  }

  const idToken = (session as any).idToken;
  if (!idToken) {
    throw new Error("No identity token found in session. Please log in again.");
  }

  // Check token expiration and provide detailed debugging
  const awsTokenExpiresAt = (session as any).awsTokenExpiresAt;
  if (awsTokenExpiresAt) {
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = awsTokenExpiresAt - now;
    console.log(
      `🕐 AWS tokens expire in ${timeUntilExpiry} seconds (${new Date(
        awsTokenExpiresAt * 1000
      ).toISOString()})`
    );

    if (timeUntilExpiry <= 0) {
      console.error(
        `❌ AWS tokens expired ${Math.abs(timeUntilExpiry)} seconds ago`
      );
      throw new Error(
        "Your AWS tokens have expired. Please refresh the page to get new tokens."
      );
    }

    if (timeUntilExpiry <= 300) {
      console.warn(
        `⚠️  AWS tokens expire in ${timeUntilExpiry} seconds - they should auto-refresh on next session call`
      );
    }
  } else {
    console.warn("⚠️  No AWS token expiration info available");
  }

  // Step 2: Check if AWS credentials exist and are still valid
  const now = new Date();

  if (credentialsCache) {
    if (credentialsCache.expiration > now) {
      console.log("✅ Using cached AWS credentials");
      return credentialsCache;
    } else {
      console.log("⏰ AWS credentials have expired, refreshing...");
      credentialsCache = null;
    }
  }

  // Step 3: Create fresh AWS credentials using the ID token
  console.log("🔄 Getting fresh AWS credentials from Identity Pool");

  const region = process.env.AWS_REGION || "us-east-1";
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const poolId = identityPoolId || process.env.COGNITO_IDENTITY_POOL_ID;

  if (!poolId || !userPoolId) {
    throw new Error("Missing Cognito configuration");
  }

  try {
    const cognitoIdentity = new CognitoIdentityClient({ region });

    console.log("🔑 Getting fresh AWS credentials from Identity Pool");

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

    console.log(`✅ Got Identity ID: ${identityResponse.IdentityId}`);

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
    console.log(
      `✅ AWS credentials expire at: ${awsCredentialsExpiry?.toISOString()}`
    );

    // Use AWS expiration or fallback to 1 hour
    const credentialExpiration =
      awsCredentialsExpiry || new Date(Date.now() + 3600 * 1000);

    // Cache the credentials
    credentialsCache = {
      accessKeyId: credentialsResponse.Credentials.AccessKeyId!,
      secretAccessKey: credentialsResponse.Credentials.SecretKey!,
      sessionToken: credentialsResponse.Credentials.SessionToken!,
      region,
      expiration: credentialExpiration,
    };

    console.log(
      `💾 Cached AWS credentials until: ${credentialsCache.expiration.toISOString()}`
    );

    return credentialsCache;
  } catch (error: any) {
    // Clear cache on error
    credentialsCache = null;

    console.error("❌ AWS credentials error:", error);

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

    throw new Error(`Failed to get AWS credentials: ${error.message}`);
  }
}
