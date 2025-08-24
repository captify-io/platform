import { NextRequest, NextResponse } from "next/server";

const ACTION_NETWORK_API_KEY = process.env.ACTION_NETWORK_API_KEY;

/**
 * VeriPicks Following API
 * Fetches following data from Action Network API
 */
export async function GET(request: NextRequest) {
  try {
    console.log(`[FOLLOWING API] Request received: ${request.method}`);
    console.log(
      `[FOLLOWING API] Environment check: ACTION_NETWORK_API_KEY=${!!ACTION_NETWORK_API_KEY}`
    );

    if (!ACTION_NETWORK_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "ACTION_NETWORK_API_KEY not found in environment variables",
        },
        { status: 500 }
      );
    }

    const url = "https://api.actionnetwork.com/mobile/v1/me/following";

    console.log(`[FOLLOWING API] Fetching data from: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "VeriPicks/1.0",
        Accept: "application/json",
        Authorization: `Bearer ${ACTION_NETWORK_API_KEY}`,
      },
    });

    console.log(
      `[FOLLOWING API] Response status: ${response.status} ${response.statusText}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[FOLLOWING API] Error response:`, errorText);
      return NextResponse.json(
        {
          success: false,
          error: `Action Network API error: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    console.log(`[FOLLOWING API] Success! Data received:`);
    console.log(JSON.stringify(data, null, 2));

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[FOLLOWING API] Error:", error);
    console.error(
      "[FOLLOWING API] Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return NextResponse.json(
      {
        success: false,
        error: "Following API operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request); // Allow both GET and POST for consistency
}
