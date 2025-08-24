import { NextRequest, NextResponse } from "next/server";

const ACTION_NETWORK_API_KEY = process.env.ACTION_NETWORK_API_KEY;

/**
 * VeriPicks Experts API
 * Fetches expert data from Action Network API
 */
export async function GET(request: NextRequest) {
  try {
    console.log(`[EXPERTS API] Request received: ${request.method}`);
    console.log(
      `[EXPERTS API] Environment check: ACTION_NETWORK_API_KEY=${!!ACTION_NETWORK_API_KEY}`
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

    // You can extend this with different expert endpoints as needed
    const url = new URL(request.url);
    const endpoint = url.searchParams.get("endpoint") || "experts";

    // Example expert endpoints - adjust based on Action Network API documentation
    const expertEndpoints = {
      experts: "https://api.actionnetwork.com/web/v2/experts",
      picks: "https://api.actionnetwork.com/web/v2/experts/picks",
      rankings: "https://api.actionnetwork.com/web/v2/experts/rankings",
    };

    const apiUrl =
      expertEndpoints[endpoint as keyof typeof expertEndpoints] ||
      expertEndpoints.experts;

    console.log(`[EXPERTS API] Fetching data from: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "VeriPicks/1.0",
        Accept: "application/json",
        Authorization: `Bearer ${ACTION_NETWORK_API_KEY}`,
      },
    });

    console.log(
      `[EXPERTS API] Response status: ${response.status} ${response.statusText}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[EXPERTS API] Error response:`, errorText);
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

    console.log(`[EXPERTS API] Success! Data received:`);
    console.log(JSON.stringify(data, null, 2));

    return NextResponse.json({
      success: true,
      endpoint,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[EXPERTS API] Error:", error);
    console.error(
      "[EXPERTS API] Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return NextResponse.json(
      {
        success: false,
        error: "Experts API operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request); // Allow both GET and POST for consistency
}
