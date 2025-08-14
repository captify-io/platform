import {
  CognitoIdentityProviderClient,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

// Create AWS configuration that works in both local dev and Amplify production
function getAWSConfig() {
  const region = process.env.REGION || process.env.AWS_REGION || "us-east-1";
  const accessKeyId = process.env.ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  // If we have explicit credentials (local development), use them
  if (accessKeyId && secretAccessKey) {
    return {
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    };
  }

  // Otherwise, use default credential provider (Amplify/IAM roles)
  return {
    region,
  };
}

// Initialize AWS clients
const awsConfig = getAWSConfig();
const cognitoClient = new CognitoIdentityProviderClient(awsConfig);
const stsClient = new STSClient(awsConfig);

// Example utility functions for AWS operations
export async function getUserFromCognito(accessToken: string) {
  try {
    const command = new GetUserCommand({
      AccessToken: accessToken,
    });
    const response = await cognitoClient.send(command);
    return response;
  } catch (error) {
    console.error("Error getting user from Cognito:", error);
    throw error;
  }
}

export async function getCallerIdentity() {
  try {
    const command = new GetCallerIdentityCommand({});
    const response = await stsClient.send(command);
    return response;
  } catch (error) {
    console.error("Error getting caller identity:", error);
    throw error;
  }
}

// Export clients for use in other parts of the application
export { cognitoClient, stsClient };
