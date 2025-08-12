import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { applicationDb } from "@/lib/services/application-database";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 DEBUG: Checking applications in DynamoDB...");

    // Try to list all applications
    const result = await applicationDb.listApplications({
      org_id: "default-org",
      limit: 100,
    });

    console.log("📊 Found applications in database:", {
      count: result.applications.length,
      applications: result.applications.map((app) => ({
        id: app.id,
        app_id: app.app_id,
        slug: app.slug,
        name: app.name || app.metadata?.name,
        organization_id: app.organization_id,
      })),
    });

    return NextResponse.json({
      success: true,
      count: result.applications.length,
      applications: result.applications.map((app) => ({
        id: app.id,
        app_id: app.app_id,
        slug: app.slug,
        name: app.name || app.metadata?.name,
        description: app.description || app.metadata?.description,
        agentId: app.agentId,
        category: app.category || app.metadata?.category,
        status: app.status,
        organization_id: app.organization_id,
        created_at: app.created_at,
      })),
    });
  } catch (error) {
    console.error("❌ Error checking database:", error);
    return NextResponse.json(
      {
        error: "Failed to check database",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
