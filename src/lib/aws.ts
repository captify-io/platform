import {
  CognitoIdentityProviderClient,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

// Initialize AWS clients
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const stsClient = new STSClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

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
