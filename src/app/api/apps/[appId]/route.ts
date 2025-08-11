import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import {
  deleteApplication,
  updateApplication,
} from "@/lib/services/application-database";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { appId } = resolvedParams;
    if (!appId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    // Only allow admin users to update applications
    const userEmail = session.user.email;
    const isAdmin =
      userEmail.includes("@anautics.") || userEmail.includes("@tinker.af.mil");

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Insufficient permissions. Admin access required." },
        { status: 403 }
      );
    }

    // Parse the request body
    const updateData = await request.json();

    // Update the application
    const updatedApplication = await updateApplication(appId, updateData);

    return NextResponse.json(
      {
        message: "Application updated successfully",
        application: updatedApplication,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update application",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { appId } = resolvedParams;
    if (!appId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    // Only allow admin users to delete applications
    const userEmail = session.user.email;
    const isAdmin =
      userEmail.includes("@anautics.") || userEmail.includes("@tinker.af.mil");

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Insufficient permissions. Admin access required." },
        { status: 403 }
      );
    }

    await deleteApplication(appId);

    return NextResponse.json(
      { message: "Application deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting application:", error);
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    );
  }
}
