import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || "us-east-1",
});

export interface CognitoUser {
  username: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  idToken: string;
}

export class CognitoAuth {
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = process.env.COGNITO_CLIENT_ID!;
    this.clientSecret = process.env.COGNITO_CLIENT_SECRET!;
  }

  private async calculateSecretHash(username: string): Promise<string> {
    const crypto = await import("crypto");
    const hmac = crypto.createHmac("sha256", this.clientSecret);
    hmac.update(username + this.clientId);
    return hmac.digest("base64");
  }

  async signIn(username: string, password: string): Promise<CognitoUser> {
    try {
      const secretHash = await this.calculateSecretHash(username);

      const command = new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
          SECRET_HASH: secretHash,
        },
      });

      const response = await cognitoClient.send(command);

      if (response.ChallengeName) {
        throw new Error(`Challenge required: ${response.ChallengeName}`);
      }

      if (!response.AuthenticationResult) {
        throw new Error("Authentication failed");
      }

      const { AccessToken, RefreshToken, IdToken } =
        response.AuthenticationResult;

      if (!AccessToken || !RefreshToken || !IdToken) {
        throw new Error("Missing tokens in response");
      }

      // Get user details
      const userCommand = new GetUserCommand({
        AccessToken,
      });

      const userResponse = await cognitoClient.send(userCommand);
      const email =
        userResponse.UserAttributes?.find((attr) => attr.Name === "email")
          ?.Value || "";

      return {
        username: userResponse.Username!,
        email,
        accessToken: AccessToken,
        refreshToken: RefreshToken,
        idToken: IdToken,
      };
    } catch (error) {
      console.error("Cognito sign-in error:", error);
      throw error;
    }
  }

  async refreshTokens(
    refreshToken: string,
    username: string
  ): Promise<CognitoUser> {
    try {
      const secretHash = await this.calculateSecretHash(username);

      const command = new InitiateAuthCommand({
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId: this.clientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
          SECRET_HASH: secretHash,
        },
      });

      const response = await cognitoClient.send(command);

      if (!response.AuthenticationResult) {
        throw new Error("Token refresh failed");
      }

      const { AccessToken, IdToken } = response.AuthenticationResult;

      if (!AccessToken || !IdToken) {
        throw new Error("Missing tokens in refresh response");
      }

      // Get user details
      const userCommand = new GetUserCommand({
        AccessToken,
      });

      const userResponse = await cognitoClient.send(userCommand);
      const email =
        userResponse.UserAttributes?.find((attr) => attr.Name === "email")
          ?.Value || "";

      return {
        username: userResponse.Username!,
        email,
        accessToken: AccessToken,
        refreshToken, // Keep the same refresh token
        idToken: IdToken,
      };
    } catch (error) {
      console.error("Token refresh error:", error);
      throw error;
    }
  }

  async getUser(accessToken: string): Promise<any> {
    try {
      const command = new GetUserCommand({
        AccessToken: accessToken,
      });

      const response = await cognitoClient.send(command);
      return response;
    } catch (error) {
      console.error("Get user error:", error);
      throw error;
    }
  }
}

export const cognitoAuth = new CognitoAuth();
