import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "@/lib/services/session";
import type { WorkbenchSummary } from "@/app/mi/services/workbench-api-client";

export async function GET(request: NextRequest) {
  try {
    console.log("📊 MI Workbench Summary API - GET request");

    // Authentication
    const session = await requireUserSession(request);

    // Mock summary data (in real implementation, this would come from database analytics)
    const mockSummary: WorkbenchSummary = {
      totalIssues: 5,
      openIssues: 4,
      criticalIssues: 1,
      pendingDecisions: 2,
      implementedSolutions: 1,
      statusDistribution: [
        { status: "Analyze", count: 1, percentage: 20 },
        { status: "Validate Solution", count: 1, percentage: 20 },
        { status: "Qualify", count: 1, percentage: 20 },
        { status: "Field", count: 1, percentage: 20 },
        { status: "Monitor", count: 1, percentage: 20 }
      ],
      priorityDistribution: [
        { priority: "Critical", count: 1, percentage: 20 },
        { priority: "High", count: 1, percentage: 20 },
        { priority: "Medium", count: 2, percentage: 40 },
        { priority: "Low", count: 1, percentage: 20 }
      ],
      trendData: [
        { month: "Oct 2024", issues: 3, decisions: 1, implementations: 0 },
        { month: "Nov 2024", issues: 4, decisions: 2, implementations: 1 },
        { month: "Dec 2024", issues: 5, decisions: 3, implementations: 1 },
        { month: "Jan 2025", issues: 5, decisions: 3, implementations: 2 },
        { month: "Feb 2025", issues: 6, decisions: 4, implementations: 2 },
        { month: "Mar 2025", issues: 5, decisions: 4, implementations: 3 }
      ]
    };

    console.log("✅ Returning workbench summary");

    return NextResponse.json(mockSummary);
  } catch (error) {
    console.error("❌ MI Workbench Summary API error:", error);

    if (error instanceof Error) {
      if (error.message.includes("No active session")) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
