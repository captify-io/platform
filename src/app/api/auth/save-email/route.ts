import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format per NIST guidelines
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Create a secure session with the email
    const response = NextResponse.json({
      success: true,
      message: "Email saved to session",
      email: email,
    });

    // Set long-lived, httpOnly cookie with email for authentication flow
    // Since CAC handles authentication security, email can persist longer for UX
    const oneYear = 365 * 24 * 60 * 60; // 1 year in seconds

    response.cookies.set("auth_email", email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: oneYear, // Long-lived since it's just email, not auth data
      path: "/",
    });

    // Set timestamp for reference (but don't expire based on it)
    response.cookies.set("auth_email_timestamp", Date.now().toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: oneYear, // Match email cookie duration
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Save email error:", error);
    return NextResponse.json(
      { error: "Failed to save email" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Retrieve email from long-lived session
    const email = request.cookies.get("auth_email")?.value;
    const timestamp = request.cookies.get("auth_email_timestamp")?.value;

    if (!email) {
      return NextResponse.json({ email: null });
    }

    // Return email without expiration check since it's long-lived
    // Timestamp is kept for reference but not used for expiration
    return NextResponse.json({
      email,
      savedAt: timestamp ? new Date(parseInt(timestamp)).toISOString() : null,
    });
  } catch (error) {
    console.error("Get email error:", error);
    return NextResponse.json({ email: null });
  }
}

export async function DELETE() {
  try {
    // Clear the saved email cookies
    const response = NextResponse.json({
      success: true,
      message: "Email cleared from session",
    });

    // Delete both cookies
    response.cookies.delete("auth_email");
    response.cookies.delete("auth_email_timestamp");

    return response;
  } catch (error) {
    console.error("Clear email error:", error);
    return NextResponse.json(
      { error: "Failed to clear email" },
      { status: 500 }
    );
  }
}
