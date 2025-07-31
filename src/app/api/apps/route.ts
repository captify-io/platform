import { NextRequest, NextResponse } from "next/server";
import { demoApplications } from "@/apps/applications-loader";

export async function GET(request: NextRequest) {
  try {
    // Transform applications to legacy format for backward compatibility
    const legacyApps = demoApplications.map((app) => ({
      alias: app.metadata.alias,
      name: app.metadata.name,
      agentId: app.aiAgent.agentId,
      description: app.metadata.description,
      category: app.metadata.category,
      status: app.metadata.status,
      tags: app.metadata.tags,
      usage: app.usage,
    }));

    return NextResponse.json(legacyApps);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // In a real implementation, this would create a new application
    // For demo purposes, we'll just return a success response
    console.log("Creating application:", body);

    return NextResponse.json(
      { message: "Application created successfully", id: "new-app-id" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating application:", error);
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}
