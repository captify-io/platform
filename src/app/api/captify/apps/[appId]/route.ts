import { NextRequest, NextResponse } from "next/server";

// Mock app configurations - in production this would come from database
const APP_CONFIGS = {
  veripicks: {
    name: "VeriPicks",
    menu: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "BarChart3",
      },
      {
        id: "games",
        label: "Games",
        icon: "Calendar",
      },
      {
        id: "analytics",
        label: "Analytics",
        icon: "TrendingUp",
      },
    ],
    config: {
      layout: {
        sidebarPosition: "left",
        theme: "default",
        hideSidebar: false,
      },
    },
  },
  mi: {
    name: "Market Intelligence",
    menu: [
      {
        id: "advanced-forecast",
        label: "Advanced Forecast",
        icon: "TrendingUp",
      },
      {
        id: "workbench",
        label: "Workbench",
        icon: "Wrench",
      },
    ],
    config: {
      layout: {
        sidebarPosition: "left",
        theme: "default",
        hideSidebar: false,
      },
    },
  },
  console: {
    name: "Console",
    menu: [
      {
        id: "overview",
        label: "Overview",
        icon: "Home",
      },
      {
        id: "users",
        label: "Users",
        icon: "Users",
      },
      {
        id: "settings",
        label: "Settings",
        icon: "Settings",
      },
    ],
    config: {
      layout: {
        sidebarPosition: "left",
        theme: "default",
        hideSidebar: false,
      },
    },
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const { appId } = await params;

    const appConfig = APP_CONFIGS[appId as keyof typeof APP_CONFIGS];

    if (!appConfig) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(appConfig);
  } catch (error) {
    console.error("Error fetching app config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
