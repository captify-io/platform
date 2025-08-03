import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Set a short-lived cookie with the login hint for NextAuth to use
    const response = NextResponse.json({ success: true });

    response.cookies.set("login_hint", email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes - just enough for the auth flow
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Set login hint error:", error);
    return NextResponse.json(
      { error: "Failed to set login hint" },
      { status: 500 }
    );
  }
}
