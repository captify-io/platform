import { NextRequest, NextResponse } from "next/server";
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if user exists in Cognito (optional - you can skip this if you want to allow any email)
    try {
      const command = new ListUsersCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID, // You'll need to add this to your .env
        Filter: `email = "${email}"`,
        Limit: 1,
      });

      const response = await cognitoClient.send(command);

      if (!response.Users || response.Users.length === 0) {
        return NextResponse.json(
          {
            error:
              "Email not found. Please check your email address or contact support.",
          },
          { status: 404 }
        );
      }

      // User exists, email is valid
      return NextResponse.json({
        success: true,
        message: "Email validated successfully",
      });
    } catch (cognitoError: any) {
      // If we can't validate against Cognito, still allow the email through
      // This prevents errors from blocking legitimate users
      console.warn(
        "Cognito validation failed, allowing email through:",
        cognitoError.message
      );

      return NextResponse.json({
        success: true,
        message: "Email format validated",
      });
    }
  } catch (error: any) {
    console.error("Email validation error:", error);

    return NextResponse.json(
      { error: "Validation failed. Please try again." },
      { status: 500 }
    );
  }
}
