/**
 * NIST 5.0 Compliance Security Audit API
 * Implements DE.CM-01 (Continuous Monitoring)
 */

import { NextRequest, NextResponse } from "next/server";

interface SecurityEvent {
  timestamp: number;
  event: string;
  userId: string;
  sessionId?: string;
  details?: any;
  source: string;
}

export async function POST(request: NextRequest) {
  try {
    const event: SecurityEvent = await request.json();

    // Add client IP and user agent
    const auditEntry = {
      ...event,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    };

    // Log to console (in production, send to centralized logging)
    console.log("SECURITY_AUDIT:", JSON.stringify(auditEntry));

    // Store in database for compliance reporting
    // await storeSecurityEvent(auditEntry);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Security audit logging failed:", error);
    return NextResponse.json(
      { error: "Failed to log security event" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    // In production, retrieve from database
    const auditLog = [
      {
        timestamp: Date.now(),
        event: "AUDIT_LOG_REQUESTED",
        userId,
        source: "SecurityAPI",
      },
    ];

    return NextResponse.json(auditLog);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to retrieve audit log" },
      { status: 500 }
    );
  }
}

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const clientIP = request.headers.get("x-client-ip");

  return forwardedFor?.split(",")[0] || realIP || clientIP || "unknown";
}
