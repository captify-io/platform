import { NextRequest, NextResponse } from "next/server";

const ACTION_NETWORK_API_KEY = process.env.ACTION_NETWORK_API_KEY;

/**
 * VeriPicks Picks API
 * Fetches picks data from Action Network API
 */
export async function GET(request: NextRequest) {
  try {
    console.log(`[PICKS API] Request received: ${request.method}`);
    console.log(
      `[PICKS API] Environment check: ACTION_NETWORK_API_KEY=${!!ACTION_NETWORK_API_KEY}`
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

    // Extract parameters from URL
    const url = new URL(request.url);
    const bookIdsParam = url.searchParams.get("bookIds");
    const dateParam = url.searchParams.get("date");

    // Default bookIds to 15 if not provided
    const bookIds = bookIdsParam || "15";

    // Default date to today in YYYYMMDD format if not provided
    const defaultDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const date = dateParam || defaultDate;

    const apiUrl = `https://api.actionnetwork.com/mobile/v1/scoreboard/picks/lite/all?bookIds=${bookIds}&date=${date}`;

    console.log(`[PICKS API] Fetching data from: ${apiUrl}`);
    console.log(`[PICKS API] Parameters - bookIds: ${bookIds}, date: ${date}`);

    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "VeriPicks/1.0",
        Accept: "application/json",
        Authorization: `Bearer ${ACTION_NETWORK_API_KEY}`,
      },
    });

    console.log(
      `[PICKS API] Response status: ${response.status} ${response.statusText}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PICKS API] Error response:`, errorText);
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

    console.log(`[PICKS API] Success! Data received:`);
    console.log(JSON.stringify(data, null, 2));

    return NextResponse.json({
      success: true,
      parameters: {
        bookIds,
        date,
        apiUrl,
      },
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[PICKS API] Error:", error);
    console.error(
      "[PICKS API] Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return NextResponse.json(
      {
        success: false,
        error: "Picks API operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request); // Allow both GET and POST for consistency
}
