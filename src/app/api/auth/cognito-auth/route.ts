import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const loginHint = searchParams.get("login_hint");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Build Cognito authorization URL with login_hint
  const cognitoAuthUrl = new URL(
    `${process.env.NEXT_PUBLIC_COGNITO_ISSUER}/oauth2/authorize`
  );

  const params = {
    client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    response_type: "code",
    scope: "openid profile email",
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/cognito`,
    state:
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15), // Generate state for CSRF protection
  };

  // Add login_hint if provided
  if (loginHint) {
    Object.assign(params, { login_hint: loginHint });
  }

  Object.entries(params).forEach(([key, value]) => {
    cognitoAuthUrl.searchParams.append(key, value);
  });

  // Store state and callback URL in session/cookie for validation
  const response = NextResponse.redirect(cognitoAuthUrl.toString());
  response.cookies.set("cognito_state", params.state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
  });
  response.cookies.set("cognito_callback", callbackUrl, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
  });

  return response;
}
