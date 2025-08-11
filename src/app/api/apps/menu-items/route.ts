import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { CreateMenuItemRequest, UpdateMenuItemRequest } from "@/types/database";
import { menuItemDb } from "@/lib/services/menu-item-database";

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

    if (!appId) {
      return NextResponse.json(
        { error: "app_id parameter required" },
        { status: 400 }
      );
    }

    const menuItems = await menuItemDb.getMenuItemsByAppId(appId);

    return NextResponse.json({
      menu_items: menuItems,
      app_id: appId,
    });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu items" },
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

    const body: CreateMenuItemRequest = await request.json();

    const created = await menuItemDb.createMenuItem(body, session.user.email);

    return NextResponse.json(created);
  } catch (error) {
    console.error("Error creating menu item:", error);
    return NextResponse.json(
      { error: "Failed to create menu item" },
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
    const menuItemId = searchParams.get("menu_item_id");

    if (!appId || !menuItemId) {
      return NextResponse.json(
        {
          error: "app_id and menu_item_id parameters required",
        },
        { status: 400 }
      );
    }

    const updates: UpdateMenuItemRequest = await request.json();

    const updatedMenuItem = await menuItemDb.updateMenuItem(
      appId,
      menuItemId,
      updates
    );

    return NextResponse.json(updatedMenuItem);
  } catch (error) {
    console.error("Error updating menu item:", error);
    return NextResponse.json(
      { error: "Failed to update menu item" },
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
    const menuItemId = searchParams.get("menu_item_id");

    if (!appId || !menuItemId) {
      return NextResponse.json(
        {
          error: "app_id and menu_item_id parameters required",
        },
        { status: 400 }
      );
    }

    await menuItemDb.deleteMenuItem(appId, menuItemId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    );
  }
}
