import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import {
  deleteApplication,
  updateApplication,
  applicationDb,
} from "@/lib/services/application-database";

export async function GET(
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

    console.log(`🔍 GET /api/apps/${appId} - fetching application data`);

    try {
      // Determine if appId is a UUID or a slug
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          appId
        );

      let application = null;

      if (isUUID) {
        // Search by ID if it looks like a UUID
        application = await applicationDb.getApplicationById(appId);
      } else {
        // Search by slug if it's not a UUID
        console.log(`🔍 Searching by slug: ${appId}`);
        const applications = await applicationDb.listApplications({
          org_id: "default-org",
          limit: 100,
        });
        application = applications.applications.find(
          (app) => app.slug === appId
        );
      }

      if (application) {
        console.log(
          `✅ Found application in database: ${application.id} (slug: ${application.slug})`
        );
        return NextResponse.json({
          success: true,
          data: {
            id: application.id, // Use the actual ID from database (e.g., "mi-app-001")
            slug: application.slug || application.app_id,
            name:
              application.metadata?.name ||
              application.name ||
              application.app_id,
            description:
              application.metadata?.description || application.description,
            version: application.metadata?.version,
            agentId: application.agentId,
            agentAliasId: application.agentAliasId,
            category: application.metadata?.category || application.category,
            status: application.status,
            icon: application.metadata?.icon,
            color: application.metadata?.color,
            tags: application.metadata?.tags || application.tags,
            menu: application.menu, // Include menu from database
          },
        });
      }
    } catch (dbError) {
      console.error(`❌ Database lookup failed for ${appId}:`, dbError);
    }

    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("❌ Error fetching application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
