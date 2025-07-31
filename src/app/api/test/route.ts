import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Test API route working",
    timestamp: new Date().toISOString(),
    url: request.url,
  });
}
