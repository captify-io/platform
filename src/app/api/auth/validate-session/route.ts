/**
 * API Route: Session Validation
 *
 * Validates the current user session and ensures both User Pool and Identity Pool tokens are valid.
 * If Identity Pool tokens are missing, it attempts to retrieve them.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import {
  validateCompleteSession,
  ensureIdentityPoolTokens,
} from "@/lib/services/session-validator";

interface ExtendedSession {
  accessToken?: string;
  idToken?: string;
  expiresAt?: number;
  user?: {
    email?: string;
    name?: string;
  };
}

export async function GET() {
  try {
    console.log("🔍 Session validation API called");

    // Validate the complete session
    const validationResult = await validateCompleteSession();

    return NextResponse.json({
      success: true,
      isValid: validationResult.isValid,
      hasUserPoolTokens: validationResult.hasUserPoolTokens,
      hasIdentityPoolTokens: validationResult.hasIdentityPoolTokens,
      user: validationResult.session?.user || null,
      expiresAt: validationResult.session?.expiresAt,
      error: validationResult.error || null,
    });
  } catch (error) {
    console.error("❌ Session validation API error:", error);
    return NextResponse.json(
      {
        success: false,
        isValid: false,
        hasUserPoolTokens: false,
        hasIdentityPoolTokens: false,
        error: "Session validation failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔧 Session token refresh API called");

    const { forceRefresh = false } = await request.json();

    // Get current server session
    const session = (await getServerSession()) as ExtendedSession | null;

    if (!session || !session.user?.email || !session.idToken) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid session or missing required tokens",
        },
        { status: 401 }
      );
    }

    // Ensure/refresh Identity Pool tokens
    const credentials = await ensureIdentityPoolTokens(
      session.user.email,
      session.idToken,
      forceRefresh
    );

    if (!credentials) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to obtain Identity Pool credentials",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      hasIdentityPoolTokens: true,
      identityId: credentials.identityId,
      expiresAt: credentials.expiresAt,
    });
  } catch (error) {
    console.error("❌ Session token refresh API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Token refresh failed",
      },
      { status: 500 }
    );
  }
}
