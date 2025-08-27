/**
 * Signin With Hint Handler
 * Generates signin URLs with login hints from various sources
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email: bodyEmail, callbackUrl = "/" } = await request.json();

    // Try to get email from request body, headers, or cookie session
    let email = bodyEmail;

    // If no email in body, check headers (from API client)
    if (!email) {
      email = request.headers.get("X-User-Email");
    }

    // If still no email, try to get from saved email session
    if (!email) {
      try {
        const cookieHeader = request.headers.get("cookie") || "";
        const savedEmailCookie = cookieHeader
          .split(";")
          .find((c) => c.trim().startsWith("saved-email="));

        if (savedEmailCookie) {
          const cookieValue = savedEmailCookie.split("=")[1];
          if (cookieValue) {
            const decodedValue = decodeURIComponent(cookieValue);
            try {
              const sessionData = JSON.parse(decodedValue);
              email = sessionData.email;
            } catch {
              // If JSON parsing fails, treat as plain email
              email = decodedValue;
            }
          }
        }
      } catch (cookieError) {
        console.debug("Could not read saved email from cookie:", cookieError);
      }
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log("Using email for login_hint:", email);

    // Generate NextAuth signin URL
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    const signinUrl = new URL(`${baseUrl}/api/auth/signin/cognito`);
    signinUrl.searchParams.set("callbackUrl", callbackUrl);

    // Make a request to NextAuth to get the authorization URL
    const response = await fetch(signinUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        callbackUrl,
        csrfToken: "", // We'll handle CSRF separately
      }),
    });

    if (response.status === 302) {
      // NextAuth returned a redirect to the authorization URL
      const location = response.headers.get("location");
      if (location) {
        // Add login_hint to the authorization URL
        const authUrl = new URL(location);
        authUrl.searchParams.set("login_hint", email);

        return NextResponse.json({
          success: true,
          authUrl: authUrl.toString(),
        });
      }
    }

    // Fallback: construct the authorization URL manually
    const authUrl = new URL(`${process.env.NEXT_PUBLIC_COGNITO_ISSUER}/login`);
    authUrl.searchParams.set(
      "client_id",
      process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!
    );
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid profile email");
    authUrl.searchParams.set(
      "redirect_uri",
      `${baseUrl}/api/auth/callback/cognito`
    );
    authUrl.searchParams.set("login_hint", email);

    // Add state for CSRF protection
    const state =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    authUrl.searchParams.set("state", state);

    return NextResponse.json({
      success: true,
      authUrl: authUrl.toString(),
    });
  } catch (error) {
    console.error("Signin with hint error:", error);
    return NextResponse.json(
      { error: "Failed to generate signin URL" },
      { status: 500 }
    );
  }
}
