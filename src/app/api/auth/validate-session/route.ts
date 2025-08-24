/**
 * API Route: Session Validation
 *
 * Validates the current user session using @captify/api
 */

import { NextResponse } from "next/server";
import { getUserSession, requireUserSession } from "@captify/api";

export async function GET() {
  try {
    console.log("🔍 Session validation API called");

    // Get user session using @captify/api
    const session = await getUserSession();

    if (!session) {
      return NextResponse.json({
        success: true,
        isValid: false,
        hasUserPoolTokens: false,
        hasIdentityPoolTokens: false,
        user: null,
        error: "No valid session found",
      });
    }

    return NextResponse.json({
      success: true,
      isValid: true,
      hasUserPoolTokens: !!session.email,
      hasIdentityPoolTokens: !!session.orgId,
      user: { email: session.email, userId: session.userId },
      orgId: session.orgId,
      error: null,
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

export async function POST() {
  try {
    console.log("🔧 Session validation with requirements API called");

    // Require a valid session (throws if invalid)
    const session = await requireUserSession();

    return NextResponse.json({
      success: true,
      isValid: true,
      user: { email: session.email, userId: session.userId },
      orgId: session.orgId,
      permissions: session.permissions,
    });
  } catch (error) {
    console.error("❌ Required session validation API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Valid session required",
      },
      { status: 401 }
    );
  }
}
