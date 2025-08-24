/**
 * API Route: Cognito Identity Pool Operations
 *
 * Server-side API for getting AWS credentials from Cognito Identity Pool.
 * This is necessary because client-side code cannot access environment variables.
 */

import { NextRequest, NextResponse } from "next/server";
import { fromCognitoIdentityPool } from "@captify/api";

interface CognitoCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  identityId: string;
  expiresAt: number;
}

// Environment variables
const REGION = process.env.REGION || "us-east-1";
const IDENTITY_POOL_ID = process.env.COGNITO_IDENTITY_POOL_ID!;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;

export async function POST(request: NextRequest) {
  try {
    console.log("🔐 Cognito Identity API called");

    // Get the ID token from the request headers (set by api-client)
    const idToken = request.headers.get("X-ID-Token");
    const userEmail = request.headers.get("X-User-Email");

    if (!idToken) {
      return NextResponse.json(
        {
          success: false,
          error: "No ID token provided in headers",
        },
        { status: 401 }
      );
    }

    if (!userEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "No user email provided in headers",
        },
        { status: 401 }
      );
    }

    // Validate environment variables
    if (!IDENTITY_POOL_ID || !USER_POOL_ID) {
      console.error("Missing required environment variables:", {
        hasIdentityPoolId: !!IDENTITY_POOL_ID,
        hasUserPoolId: !!USER_POOL_ID,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error",
        },
        { status: 500 }
      );
    }

    const { forceRefresh = false } = await request.json();

    console.log("🔧 Getting Cognito Identity credentials:", {
      userEmail: userEmail,
      region: REGION,
      identityPoolId: IDENTITY_POOL_ID,
      userPoolId: USER_POOL_ID,
      forceRefresh,
      hasIdToken: !!idToken,
    });

    try {
      // Use the simplified AWS SDK credential provider
      const credentialsProvider = fromCognitoIdentityPool({
        clientConfig: { region: REGION },
        identityPoolId: IDENTITY_POOL_ID,
        logins: {
          [`cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`]: idToken,
        },
      });

      console.log("🔑 Getting AWS credentials using credential provider...");

      // Get the credentials
      const awsCredentials = await credentialsProvider();

      if (
        !awsCredentials.accessKeyId ||
        !awsCredentials.secretAccessKey ||
        !awsCredentials.sessionToken
      ) {
        throw new Error("Incomplete credentials received from AWS");
      }

      // Calculate expiration (Cognito credentials typically expire in 1 hour)
      const expiresAt = Date.now() + 55 * 60 * 1000; // 55 minutes from now (safe buffer)

      const result: CognitoCredentials = {
        accessKeyId: awsCredentials.accessKeyId,
        secretAccessKey: awsCredentials.secretAccessKey,
        sessionToken: awsCredentials.sessionToken!,
        identityId: "auto-generated", // The provider handles this internally
        expiresAt,
      };

      console.log("🎉 AWS credentials obtained successfully:", {
        identityId: result.identityId,
        hasAccessKey: !!result.accessKeyId,
        hasSecretKey: !!result.secretAccessKey,
        hasSessionToken: !!result.sessionToken,
        expiresAt: new Date(result.expiresAt).toISOString(),
      });

      return NextResponse.json({
        success: true,
        credentials: result,
      });
    } catch (cognitoError) {
      console.error("❌ Cognito Identity operation failed:", cognitoError);
      return NextResponse.json(
        {
          success: false,
          error: `Cognito Identity operation failed: ${cognitoError}`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Cognito Identity API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Health check endpoint
  return NextResponse.json({
    success: true,
    service: "Cognito Identity API",
    region: REGION,
    hasIdentityPoolId: !!IDENTITY_POOL_ID,
    hasUserPoolId: !!USER_POOL_ID,
  });
}
