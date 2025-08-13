import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import type { UserSession } from "./session";

/**
 * Creates a DynamoDB client using AWS session token from the user session
 */
export async function createSessionTokenDynamoDBClient(
  userSession: UserSession
): Promise<DynamoDBDocumentClient> {
  if (!userSession.awsSessionToken) {
    throw new Error("AWS session token required for DynamoDB access");
  }

  try {
    console.log("🔧 Creating DynamoDB client with session token");

    // Check if token is still valid
    if (userSession.awsExpiresAt) {
      const now = Date.now();
      if (userSession.awsExpiresAt <= now) {
        throw new Error("AWS session token has expired");
      }
    }

    // Create DynamoDB client using the session token from the session
    // This requires using the full credentials from the Identity Pool
    if (!userSession.idToken) {
      throw new Error("ID token required to get full AWS credentials");
    }

    const credentials = await fromCognitoIdentityPool({
      clientConfig: { region: process.env.REGION },
      identityPoolId: process.env.COGNITO_IDENTITY_POOL_ID!,
      logins: {
        [`cognito-idp.${process.env.REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`]:
          userSession.idToken,
      },
    })();

    const client = new DynamoDBClient({
      region: process.env.REGION || "us-east-1",
      credentials: {
        accessKeyId: credentials.accessKeyId!,
        secretAccessKey: credentials.secretAccessKey!,
        sessionToken: credentials.sessionToken!,
      },
    });

    return DynamoDBDocumentClient.from(client);
  } catch (error) {
    console.error("❌ Failed to create session token DynamoDB client:", error);
    throw new Error("Failed to initialize session token database access");
  }
}

/**
 * Creates a DynamoDB client with user-scoped credentials using session token if available
 */
export async function createUserDynamoDBClient(
  userSession: UserSession
): Promise<DynamoDBDocumentClient> {
  if (!userSession.idToken) {
    throw new Error("ID token required for user-scoped DynamoDB access");
  }

  try {
    console.log("🔄 Creating user-scoped DynamoDB client");
    console.log(
      "� UserSession has awsSessionToken:",
      !!userSession.awsSessionToken
    );
    console.log("🔍 UserSession has awsExpiresAt:", !!userSession.awsExpiresAt);

    // Use Cognito Identity Pool directly with the user's ID token
    const credentials = await fromCognitoIdentityPool({
      clientConfig: { region: process.env.REGION },
      identityPoolId: process.env.COGNITO_IDENTITY_POOL_ID!,
      logins: {
        [`cognito-idp.${process.env.REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`]:
          userSession.idToken,
      },
    })();

    const client = new DynamoDBClient({
      region: process.env.REGION || "us-east-1",
      credentials: {
        accessKeyId: credentials.accessKeyId!,
        secretAccessKey: credentials.secretAccessKey!,
        sessionToken: credentials.sessionToken!,
      },
    });

    return DynamoDBDocumentClient.from(client);
  } catch (error) {
    console.error("❌ Failed to create user DynamoDB client:", error);

    // Check if this is a token expiration error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("Token expired") ||
      errorMessage.includes("Invalid login token")
    ) {
      throw new Error("Authentication token expired - please log in again");
    }

    throw new Error("Failed to initialize user-scoped database access");
  }
}

/**
 * NOTE: Static credentials removed - MI platform cannot access DynamoDB with environment variables
 * All database access must use user-scoped credentials only
 */
