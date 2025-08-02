import { NextRequest, NextResponse } from "next/server";
import { getApplicationByAlias } from "@/apps/applications-loader";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ alias: string }> }
) {
  try {
    const { alias } = await params;
    const application = getApplicationByAlias(alias);

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ alias: string }> }
) {
  try {
    const { alias } = await params;
    const body = await request.json();

    // In a real implementation, this would update the application
    // For demo purposes, we'll just return a success response
    console.log("Updating application:", alias, body);

    return NextResponse.json({ message: "Application updated successfully" });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}
