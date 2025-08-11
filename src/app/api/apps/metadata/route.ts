import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "@/lib/services/session";
import { applicationsService } from "@/lib/services/database";

export async function GET(request: NextRequest) {
  try {
    await requireUserSession();
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get("app_id");

    if (!appId) {
      return NextResponse.json(
        { error: "app_id parameter is required" },
        { status: 400 }
      );
    }

    // Try to fetch from database first
    try {
      const appMetadata = await applicationsService.getApplicationMetadata(
        appId
      );

      if (appMetadata) {
        return NextResponse.json(appMetadata);
      }
    } catch (dbError) {
      console.warn("Database lookup failed, trying fallback:", dbError);
    }

    // Fallback for legacy Material Insights app during migration
    if (appId === "516127c7-9205-49ab-97bb-25bc36b66978") {
      return NextResponse.json({
        id: appId,
        title: "Material Insights",
        description: "B-52 Fleet Analytics and Predictive Maintenance",
        name: "material-insights",
        slug: "material-insights",
        category: "analytics",
        status: "active",
        version: "1.0.0",
        capabilities: ["analytics", "forecasting", "reporting"],
        tags: ["b52", "maintenance", "analytics"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Application not found
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching application metadata:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
