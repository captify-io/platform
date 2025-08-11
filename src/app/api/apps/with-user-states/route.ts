import { NextRequest, NextResponse } from "next/server";
import { applicationDb } from "@/lib/services/application-database";
import { organizationService } from "@/lib/services/organization";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log(
      "📱 GET /api/apps/with-user-states - fetching applications with user states"
    );

    // Get user session for authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
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
      limit,
      last_key,
      user: session.user.email,
    });

    // Build query for DynamoDB
    const query = {
      org_id,
      category,
      status,
      search,
      template_only,
      limit,
      last_key,
    };

    // Fetch applications from DynamoDB
    const applicationsResult = await applicationDb.listApplications(query);

    // Fetch user states for these applications
    const userStates = [];
    for (const app of applicationsResult.applications) {
      try {
        const userState = await applicationDb.getUserApplicationState(
          session.user.email!,
          app.id, // Use UUID instead of slug
          org_id // Pass org_id for new key structure
        );
        if (userState) {
          userStates.push(userState);
        }
      } catch (error) {
        console.warn(`Failed to get user state for app ${app.id}:`, error);
        // Continue without user state for this app
      }
    }

    const response = {
      applications: applicationsResult.applications,
      userStates,
      lastKey: applicationsResult.last_key,
      hasMore: !!applicationsResult.last_key,
      total: applicationsResult.total_count || 0,
    };

    console.log("✅ Returning applications response:", {
      applicationCount: response.applications.length,
      userStateCount: response.userStates.length,
      hasMore: response.hasMore,
      total: response.total,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("💥 Error in GET /api/apps/with-user-states:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
