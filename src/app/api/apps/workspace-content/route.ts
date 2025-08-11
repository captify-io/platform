import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import {
  ApplicationWorkspaceContent,
  CreateWorkspaceContentRequest,
  UpdateWorkspaceContentRequest,
} from "@/types/database";
import { workspaceContentDb } from "@/lib/services/workspace-content-database";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const appId = searchParams.get("app_id");
    const menuItemId = searchParams.get("menu_item_id"); // Optional filter

    if (!appId) {
      return NextResponse.json(
        { error: "app_id parameter required" },
        { status: 400 }
      );
    }

    let workspaceContent;
    if (menuItemId) {
      // Filter by specific menu item
      workspaceContent =
        await workspaceContentDb.getWorkspaceContentByMenuItemId(
          appId,
          menuItemId
        );
    } else {
      // Get all content for the app
      workspaceContent = await workspaceContentDb.getWorkspaceContentByAppId(
        appId
      );
    }

    return NextResponse.json({
      workspace_content: workspaceContent,
      app_id: appId,
    });
  } catch (error) {
    console.error("Error fetching workspace content:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspace content" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body: CreateWorkspaceContentRequest = await request.json();

    const created = await workspaceContentDb.createWorkspaceContent(
      body,
      session.user.email
    );

    return NextResponse.json(created);
  } catch (error) {
    console.error("Error creating workspace content:", error);
    return NextResponse.json(
      { error: "Failed to create workspace content" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const appId = searchParams.get("app_id");
    const contentId = searchParams.get("content_id");
    const updatedBy = searchParams.get("updated_by"); // "agent" or "user"

    if (!appId || !contentId) {
      return NextResponse.json(
        {
          error: "app_id and content_id parameters required",
        },
        { status: 400 }
      );
    }

    const updates: UpdateWorkspaceContentRequest = await request.json();

    const updateData: Partial<ApplicationWorkspaceContent> = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // If updated by agent, track that information
    if (updatedBy === "agent") {
      updateData.last_agent_update = new Date().toISOString();
      updateData.agent_update_reason = updates.agent_update_reason;
      updateData.created_by = `agent:${session.user.email}`; // Track agent updates
    }

    const updatedContent = await workspaceContentDb.updateWorkspaceContent(
      appId,
      contentId,
      updateData,
      session.user.email
    );

    return NextResponse.json(updatedContent);
  } catch (error) {
    console.error("Error updating workspace content:", error);
    return NextResponse.json(
      { error: "Failed to update workspace content" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const appId = searchParams.get("app_id");
    const contentId = searchParams.get("content_id");

    if (!appId || !contentId) {
      return NextResponse.json(
        {
          error: "app_id and content_id parameters required",
        },
        { status: 400 }
      );
    }

    await workspaceContentDb.deleteWorkspaceContent(appId, contentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workspace content:", error);
    return NextResponse.json(
      { error: "Failed to delete workspace content" },
      { status: 500 }
    );
  }
}
