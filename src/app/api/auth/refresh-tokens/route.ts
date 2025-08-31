import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

// Token refresh function - same as in auth.ts
async function refreshCognitoTokens(refreshToken: string) {
  const tokenUrl = `https://account.anautics.ai/oauth2/token`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.COGNITO_CLIENT_ID!,
      client_secret: process.env.COGNITO_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Token refresh failed:", response.status, errorText);
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  const tokens = await response.json();
  console.log("✅ Successfully refreshed tokens");

  return {
    access_token: tokens.access_token,
    id_token: tokens.id_token,
    refresh_token: tokens.refresh_token || refreshToken,
    expires_in: tokens.expires_in || 3600,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const refreshToken = (session as any).refreshToken;
    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token available" },
        { status: 400 }
      );
    }

    console.log("🔄 Manual token refresh requested");

    // Refresh the tokens
    const refreshedTokens = await refreshCognitoTokens(refreshToken);

    // Calculate new expiration
    const now = Math.floor(Date.now() / 1000);
    const newExpiresAt = now + refreshedTokens.expires_in;

    return NextResponse.json({
      success: true,
      message: "Tokens refreshed successfully",
      tokenInfo: {
        expiresAt: new Date(newExpiresAt * 1000).toISOString(),
        expiresIn: refreshedTokens.expires_in,
      },
    });
  } catch (error: any) {
    console.error("❌ Manual token refresh failed:", error);
    return NextResponse.json(
      {
        error: error.message || "Token refresh failed",
      },
      { status: 500 }
    );
  }
}
