import { NextRequest, NextResponse } from "next/server";
import { applicationDb } from "@/lib/services/application-database";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";

// GET /api/apps/favorites - Get user's favorite applications
export async function GET(request: NextRequest) {
  try {
    console.log("⭐ GET /api/apps/favorites - fetching user favorites");

    const headerUserId = request.headers.get("x-user-id");
    const session = await getServerSession(authOptions);
    console.log("🔍 Session debug:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userKeys: session?.user ? Object.keys(session.user) : [],
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      headerUserId,
      allHeaders: Object.fromEntries(request.headers.entries()),
      fullUser: session?.user,
    });

    const userId = headerUserId || session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    console.log("🔍 Fetching favorites for user:", userId);

    // Get user's favorite applications from DynamoDB
    const favorites = await applicationDb.getUserFavorites(userId);

    console.log("✅ Retrieved favorites:", {
      userId,
      favoriteCount: favorites.length,
      favorites: favorites.map((app) => ({
        id: app.id, // Use UUID
        name: app.metadata?.name,
      })),
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("💥 Error in GET /api/apps/favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

// POST /api/apps/favorites - Add application to favorites
export async function POST(request: NextRequest) {
  try {
    console.log("⭐ POST /api/apps/favorites - adding favorite");

    // Try to get user ID from header first (from client-side API calls)
    const headerUserId = request.headers.get("X-User-ID");

    // Fallback to session for direct server calls
    const session = await getServerSession(authOptions);
    const userId = headerUserId || session?.user?.id; // Use UUID consistently

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { app_id } = await request.json();
    if (!app_id) {
      return NextResponse.json(
        { error: "app_id is required" },
        { status: 400 }
      );
    }
    console.log("🔍 Adding favorite:", { userId, app_id });

    // Update user state to mark as favorite
    await applicationDb.updateUserApplicationState(
      userId,
      app_id,
      {
        favorite: true,
        last_accessed: new Date().toISOString(),
      },
      "default-org"
    ); // Pass org_id explicitly

    console.log("✅ Added to favorites:", { userId, app_id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("💥 Error in POST /api/apps/favorites:", error);
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 }
    );
  }
}

// DELETE /api/apps/favorites - Remove application from favorites
export async function DELETE(request: NextRequest) {
  try {
    console.log("⭐ DELETE /api/apps/favorites - removing favorite");

    // Try to get user ID from header first (from client-side API calls)
    const headerUserId = request.headers.get("X-User-ID");

    // Fallback to session for direct server calls
    const session = await getServerSession(authOptions);
    const userId = headerUserId || session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { app_id } = await request.json();
    if (!app_id) {
      return NextResponse.json(
        { error: "app_id is required" },
        { status: 400 }
      );
    }
    console.log("🔍 Removing favorite:", { userId, app_id });

    // Update user state to mark as not favorite
    await applicationDb.updateUserApplicationState(
      userId,
      app_id,
      {
        favorite: false,
        last_accessed: new Date().toISOString(),
      },
      "default-org"
    ); // Pass org_id explicitly

    console.log("✅ Removed from favorites:", { userId, app_id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("💥 Error in DELETE /api/apps/favorites:", error);
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}
