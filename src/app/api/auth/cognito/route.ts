import { NextRequest, NextResponse } from "next/server";
import { cognitoAuth } from "@/lib/cognito";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await cognitoAuth.signIn(email, password);

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
      },
      tokens: {
        accessToken: user.accessToken,
        refreshToken: user.refreshToken,
        idToken: user.idToken,
      },
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
