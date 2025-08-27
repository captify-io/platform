/**
 * Client Information Handler
 * Provides IP address and client details for audit logging
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    const clientIP = request.headers.get("x-client-ip");
    const userAgent = request.headers.get("user-agent");

    const clientInfo = {
      ip: forwardedFor?.split(",")[0] || realIP || clientIP || "unknown",
      userAgent: userAgent || "unknown",
      timestamp: Date.now(),
      headers: {
        "x-forwarded-for": forwardedFor,
        "x-real-ip": realIP,
        "x-client-ip": clientIP,
      },
    };

    return NextResponse.json(clientInfo);
  } catch {
    return NextResponse.json(
      { error: "Failed to get client info" },
      { status: 500 }
    );
  }
}
