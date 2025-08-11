import { NextRequest, NextResponse } from "next/server";
import { requireUserSession, hasPermission } from "@/lib/services/session";
import { runMigration } from "@/lib/services/migration";

/**
 * Run database migration to import demo applications
 * Requires admin permissions
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireUserSession(request);

    // Only admin users can run migrations
    if (!hasPermission(session, "manage_organization")) {
      return NextResponse.json(
        { error: "Insufficient permissions to run migration" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { org_id } = body;

    // Run the migration
    const result = await runMigration(org_id || session.org_id);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        details: result.details,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          details: result.details,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error running migration:", error);

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to run migration" },
      { status: 500 }
    );
  }
}

/**
 * Check migration status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireUserSession(request);

    // Only admin users can check migration status
    if (!hasPermission(session, "manage_organization")) {
      return NextResponse.json(
        { error: "Insufficient permissions to check migration status" },
        { status: 403 }
      );
    }

    // Return basic status info
    return NextResponse.json({
      available: true,
      message: "Migration endpoint is available",
      requires_admin: true,
    });
  } catch (error) {
    console.error("Error checking migration status:", error);

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to check migration status" },
      { status: 500 }
    );
  }
}
