import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Build the Cognito logout URL
    const cognitoIssuer = process.env.NEXT_PUBLIC_COGNITO_ISSUER;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    if (!cognitoIssuer || !clientId) {
      console.error("Missing Cognito configuration for logout");
      return NextResponse.json(
        { error: "Configuration error" },
        { status: 500 }
      );
    }

    // Extract the base domain from the issuer URL
    // NEXT_PUBLIC_COGNITO_ISSUER is typically like: https://cognito-idp.region.amazonaws.com/userPoolId
    // But for logout we need the Cognito domain like: https://account.anautics.ai
    // Let's construct it properly
    let cognitoDomain;

    if (cognitoIssuer.includes("account.anautics.ai")) {
      // Custom domain case
      cognitoDomain = "https://account.anautics.ai";
    } else {
      // Default AWS Cognito domain - extract from issuer
      const url = new URL(cognitoIssuer);
      cognitoDomain = `${url.protocol}//${url.hostname}`;
    }

    // Use NextAuth's signout endpoint as the logout URI - this ensures NextAuth session cleanup
    const logoutUri = `${baseUrl}/api/auth/signout`;

    // Construct the Cognito logout URL that redirects to NextAuth signout
    const cognitoLogoutUrl = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(
      logoutUri
    )}`;

    console.log("Cognito issuer:", cognitoIssuer);
    console.log("Extracted Cognito domain:", cognitoDomain);
    console.log("Generated Cognito logout URL:", cognitoLogoutUrl);

    return NextResponse.json({
      success: true,
      logoutUrl: cognitoLogoutUrl,
    });
  } catch (error) {
    console.error("Error creating logout URL:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
