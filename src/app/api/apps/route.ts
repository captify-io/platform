import { NextRequest, NextResponse } from "next/server";
import { applicationDb } from "@/lib/services/application-database";
import { organizationService } from "@/lib/services/organization";
import { requireUserSession } from "@/lib/services/session";

export async function GET(request: NextRequest) {
  try {
    console.log("📱 GET /api/apps - fetching applications");

    // Get user session for authentication
    const session = await requireUserSession(request);
    if (!session?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    // Get organization ID from the default organization
    const defaultOrg = await organizationService.getDefaultOrganization();
    const org_id = defaultOrg?.org_id || "default-org"; // Fallback for safety

    const categoryParam = searchParams.get("category");
    const statusParam = searchParams.get("status");
    const search = searchParams.get("search") || undefined;
    const template_only = searchParams.get("template_only") === "true";
    const user_id = searchParams.get("user_id") || undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 50;
    const last_key = searchParams.get("last_key") || undefined;

    // Validate and convert types
    const category = categoryParam || undefined;
    const status =
      statusParam && ["active", "draft", "archived"].includes(statusParam)
        ? (statusParam as "active" | "draft" | "archived")
        : undefined;

    console.log("🔍 Query parameters:", {
      org_id,
      category,
      status,
      search,
      template_only,
      user_id,
      limit,
      last_key,
      user: session.email,
    });

    // Build query for DynamoDB
    const query = {
      org_id,
      category,
      status,
      search,
      template_only,
      user_id,
      limit,
      last_key,
    };

    // Fetch applications from DynamoDB
    const result = await applicationDb.listApplications(query);

    const response = {
      applications: result.applications,
      last_key: result.last_key,
      total_count: result.total_count || 0,
    };

    console.log("✅ Returning applications response:", {
      applicationCount: response.applications.length,
      hasLastKey: !!response.last_key,
      total: response.total_count,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("💥 Error in GET /api/apps:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
