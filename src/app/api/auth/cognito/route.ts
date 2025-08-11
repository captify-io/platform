import { NextRequest, NextResponse } from "next/server";
import { cognitoAuth } from "@/lib/cognito";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

interface CognitoCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  identityId: string;
  expiresAt: number;
}

// Environment variables
const REGION = process.env.AWS_REGION || "us-east-1";
const IDENTITY_POOL_ID = process.env.COGNITO_IDENTITY_POOL_ID!;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    console.log("🔐 Cognito User Pool authentication for:", email);
    const user = await cognitoAuth.signIn(email, password);

    console.log(
      "✅ User Pool authentication successful, getting Identity Pool credentials..."
    );

    // Get AWS Identity Pool credentials using the ID token
    let awsCredentials: CognitoCredentials | null = null;

    if (user.idToken && IDENTITY_POOL_ID && USER_POOL_ID) {
      try {
        console.log("🔧 Getting AWS Identity Pool credentials:", {
          region: REGION,
          identityPoolId: IDENTITY_POOL_ID,
          userPoolId: USER_POOL_ID,
          hasIdToken: !!user.idToken,
        });

        // Use the simplified AWS SDK credential provider
        const credentialsProvider = fromCognitoIdentityPool({
          clientConfig: { region: REGION },
          identityPoolId: IDENTITY_POOL_ID,
          logins: {
            [`cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`]:
              user.idToken,
          },
        });

        console.log("🔑 Getting AWS credentials using credential provider...");
        const credentials = await credentialsProvider();

        if (
          !credentials.accessKeyId ||
          !credentials.secretAccessKey ||
          !credentials.sessionToken
        ) {
          throw new Error("Incomplete credentials received from AWS");
        }

        // Calculate expiration (Cognito credentials typically expire in 1 hour)
        const expiresAt = Date.now() + 55 * 60 * 1000; // 55 minutes from now (safe buffer)

        awsCredentials = {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken!,
          identityId: "auto-generated", // The provider handles this internally
          expiresAt,
        };

        console.log("🎉 AWS Identity Pool credentials obtained successfully:", {
          identityId: awsCredentials.identityId,
          hasAccessKey: !!awsCredentials.accessKeyId,
          hasSecretKey: !!awsCredentials.secretAccessKey,
          hasSessionToken: !!awsCredentials.sessionToken,
          expiresAt: new Date(awsCredentials.expiresAt).toISOString(),
        });
      } catch (awsError) {
        console.error(
          "❌ Failed to get AWS Identity Pool credentials:",
          awsError
        );
        // Continue without AWS credentials - don't fail the whole request
      }
    } else {
      console.warn(
        "⚠️ Skipping AWS credentials - missing required configuration"
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        email: email,
      },
      tokens: {
        accessToken: user.accessToken,
        refreshToken: user.refreshToken,
        idToken: user.idToken,
      },
      awsCredentials: awsCredentials || undefined,
    });
  } catch (error: unknown) {
    console.error("Direct Cognito sign-in error:", error);

    let errorMessage = "Authentication failed";
    let statusCode = 401;

    if (error instanceof Error) {
      if (error.name === "NotAuthorizedException") {
        errorMessage = "Invalid username or password";
      } else if (error.name === "UserNotConfirmedException") {
        errorMessage = "User account is not confirmed";
      } else if (error.name === "UserNotFoundException") {
        errorMessage = "User not found";
      } else if (error.name === "TooManyRequestsException") {
        errorMessage = "Too many requests. Please try again later";
        statusCode = 429;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

export async function GET() {
  // Health check endpoint
  return NextResponse.json({
    success: true,
    service: "Cognito Authentication API",
    region: REGION,
    hasIdentityPoolId: !!IDENTITY_POOL_ID,
    hasUserPoolId: !!USER_POOL_ID,
    features: {
      userPoolAuth: true,
      identityPoolCredentials: !!(IDENTITY_POOL_ID && USER_POOL_ID),
    },
  });
}
