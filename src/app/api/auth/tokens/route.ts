import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserTokens } from "@/lib/token-store";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokens = getUserTokens(session.user.id);

    if (!tokens) {
      return NextResponse.json({ error: "No tokens found" }, { status: 404 });
    }

    // Return tokens (be careful with refresh token in production)
    return NextResponse.json({
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
      expiresAt: tokens.expiresAt,
      // Don't return refresh token unless absolutely necessary
    });
  } catch (error) {
    console.error("Error retrieving tokens:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
