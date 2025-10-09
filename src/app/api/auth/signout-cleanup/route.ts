import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../lib/auth";
import { removeStoredTokens } from "../../../../lib/auth-store";

/**
 * API endpoint to clean up stored tokens during signout
 * Deletes the session tokens from DynamoDB
 */
export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth();

    if (session && (session as any).sessionId) {
      // Remove stored tokens from DynamoDB
      await removeStoredTokens((session as any).sessionId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Even if cleanup fails, return success to allow signout to proceed
    console.error("Token cleanup error:", error);
    return NextResponse.json({ success: true });
  }
}
