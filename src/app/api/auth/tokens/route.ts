import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../lib/auth";
import { getStoredTokens } from "../../../../lib/auth-store";

/**
 * API route to retrieve Cognito tokens for external apps
 * POST /api/auth/tokens
 */
export async function POST(request: NextRequest) {
  try {
    // Get session from NextAuth
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the session ID from the session
    const sessionId = (session as any).sessionId;

    if (!sessionId) {
      return NextResponse.json({ error: "No session ID found" }, { status: 400 });
    }

    // Retrieve stored tokens
    const tokens = await getStoredTokens(sessionId);

    if (!tokens) {
      return NextResponse.json({ error: "Tokens not found" }, { status: 404 });
    }

    // Check if tokens are expired
    if (tokens.expiresAt < Date.now() / 1000) {
      return NextResponse.json({ error: "Tokens expired" }, { status: 401 });
    }

    // Return tokens (be careful about what you expose)
    return NextResponse.json({
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
      expiresAt: tokens.expiresAt,
      // Don't expose refresh token in API response for security
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET method to check token availability (lightweight)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ hasTokens: false });
    }

    const sessionId = (session as any).sessionId;

    if (!sessionId) {
      return NextResponse.json({ hasTokens: false });
    }

    const tokens = await getStoredTokens(sessionId);

    return NextResponse.json({
      hasTokens: !!tokens,
      isExpired: tokens ? tokens.expiresAt < Date.now() / 1000 : true
    });

  } catch (error) {
    return NextResponse.json({ hasTokens: false });
  }
}