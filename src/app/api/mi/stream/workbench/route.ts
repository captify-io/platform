import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { requireUserSession, type UserSession } from "@/lib/services/session";
import { WorkbenchDatabase } from "@/app/mi/services/database";
import { getChartColor } from "@/app/mi/lib/config";
import type { WorkbenchParams } from "@/app/mi/types";
import type { WorkbenchIssue } from "@/types/mi";

const tableName = "mi-bom-graph";

// Three-tier AWS credential fallback
async function getDynamoDBClient(session: UserSession) {
  // For now, use static credentials - TODO: implement full three-tier system
  return new DynamoDBClient({
    region: process.env.REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 MI Workbench API - Starting request");

    // Debug: Log all headers
    console.log("🔍 Request headers:");
    for (const [key, value] of request.headers.entries()) {
      if (
        key.toLowerCase().includes("auth") ||
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("aws")
      ) {
        console.log(`   ${key}: ${value ? "present" : "missing"}`);
      }
    }

    // Authenticate user and get session with ID token
    const session = await requireUserSession(request);
    console.log("✅ User authenticated:", session.email);
    console.log("🔍 Session idToken present:", !!session.idToken);
    console.log(
      "🔍 Session awsSessionToken present:",
      !!session.awsSessionToken
    );
    console.log(
      "🔍 Session awsExpiresAt:",
      session.awsExpiresAt
        ? new Date(session.awsExpiresAt).toISOString()
        : "not set"
    );

    const { searchParams } = new URL(request.url);

    const params: WorkbenchParams = {
      status: searchParams.get("status") || undefined,
      priority: searchParams.get("priority") || undefined,
      assignee: searchParams.get("assignee") || undefined,
    };

    console.log("🔍 Workbench params:", params);

    // Get issues using the database service
    const issues = await WorkbenchDatabase.getIssues(session, params);
    console.log("📊 Issues found:", issues.length);

    // Transform for UI with theme-aware styling
    const workbenchData = {
      metadata: {
        filters: params,
        totalIssues: issues.length,
        filteredIssues: issues.length,
        generated: new Date().toISOString(),
      },
      summary: {
        byStatus: {
          Analyze: issues.filter(
            (i) => (i as WorkbenchIssue).status === "Analyze"
          ).length,
          "Validate Solution": issues.filter(
            (i) => (i as WorkbenchIssue).status === "Validate Solution"
          ).length,
          Qualify: issues.filter(
            (i) => (i as WorkbenchIssue).status === "Qualify"
          ).length,
          Field: issues.filter((i) => (i as WorkbenchIssue).status === "Field")
            .length,
          Monitor: issues.filter(
            (i) => (i as WorkbenchIssue).status === "Monitor"
          ).length,
        },
        byPriority: {
          Critical: issues.filter(
            (i) => (i as WorkbenchIssue).criticality === "Critical"
          ).length,
          High: issues.filter(
            (i) => (i as WorkbenchIssue).criticality === "High"
          ).length,
          Medium: issues.filter(
            (i) => (i as WorkbenchIssue).criticality === "Medium"
          ).length,
          Low: issues.filter((i) => (i as WorkbenchIssue).criticality === "Low")
            .length,
        },
      },
      issues: issues.map((issue, index: number) => ({
        id: issue.pk,
        title: issue.title,
        status: issue.status,
        priority: issue.criticality || (issue as any).priority, // eslint-disable-line @typescript-eslint/no-explicit-any
        riskScore:
          "riskScore" in issue && typeof issue.riskScore === "number"
            ? issue.riskScore
            : Math.random() * 100, // Mock data for now
        missionImpact: issue.risk?.missionImpact || Math.random() * 100, // Mock data for now
        aiRecommendation:
          (issue as any).aiRecommendation || "No recommendation available", // eslint-disable-line @typescript-eslint/no-explicit-any
        links: issue.links || [],
        taskCount: Math.floor(Math.random() * 10) + 1,
        completedTasks: Math.floor(Math.random() * 5),
        priorityColor: getChartColor(index),
        chartColor: getChartColor(index),
      })),
      chartData: {
        statusDistribution: [
          {
            name: "Analyze",
            value: issues.filter(
              (i) => (i as WorkbenchIssue).status === "Analyze"
            ).length,
            fill: getChartColor(0),
          },
          {
            name: "Validate Solution",
            value: issues.filter(
              (i) => (i as WorkbenchIssue).status === "Validate Solution"
            ).length,
            fill: getChartColor(1),
          },
          {
            name: "Qualify",
            value: issues.filter(
              (i) => (i as WorkbenchIssue).status === "Qualify"
            ).length,
            fill: getChartColor(2),
          },
          {
            name: "Field",
            value: issues.filter(
              (i) => (i as WorkbenchIssue).status === "Field"
            ).length,
            fill: getChartColor(3),
          },
          {
            name: "Monitor",
            value: issues.filter(
              (i) => (i as WorkbenchIssue).status === "Monitor"
            ).length,
            fill: getChartColor(4),
          },
        ],
        priorityTrend: [
          {
            name: "Critical",
            count: issues.filter(
              (i) => (i as WorkbenchIssue).criticality === "Critical"
            ).length,
            fill: "#dc2626",
          },
          {
            name: "High",
            count: issues.filter(
              (i) => (i as WorkbenchIssue).criticality === "High"
            ).length,
            fill: "#ea580c",
          },
          {
            name: "Medium",
            count: issues.filter(
              (i) => (i as WorkbenchIssue).criticality === "Medium"
            ).length,
            fill: "#ca8a04",
          },
          {
            name: "Low",
            count: issues.filter(
              (i) => (i as WorkbenchIssue).criticality === "Low"
            ).length,
            fill: "#16a34a",
          },
        ],
      },
      priorityActions: [
        {
          id: "critical-issues",
          title: `Review Critical Issues`,
          description: `${
            issues.filter(
              (i) => (i as WorkbenchIssue).criticality === "Critical"
            ).length
          } critical issues require immediate attention`,
          priority: "Critical",
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0], // Tomorrow
          assignee: "Team Lead",
        },
        {
          id: "overdue-items",
          title: "Address Overdue Items",
          description: "Focus on items past their due dates",
          priority: "High",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0], // Next week
          assignee: "Project Manager",
        },
        {
          id: "analyze-queue",
          title: "Process Analysis Queue",
          description: `${
            issues.filter((i) => (i as WorkbenchIssue).status === "Analyze")
              .length
          } items waiting for analysis`,
          priority: "Medium",
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0], // Two weeks
          assignee: "Analyst",
        },
      ],
    };

    console.log(
      "✅ Workbench data prepared with",
      workbenchData.issues.length,
      "issues"
    );

    return NextResponse.json(workbenchData);
  } catch (error) {
    console.error("❌ MI Workbench API error:", error);

    if (error instanceof Error) {
      // Check for authentication/authorization errors
      if (error.message.includes("No active session")) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      if (
        error.message.includes("credentials") ||
        error.message.includes("Credentials")
      ) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 403 }
        );
      }

      // Check for DynamoDB access errors
      if (
        error.message.includes("AccessDenied") ||
        error.message.includes("UnauthorizedOperation")
      ) {
        return NextResponse.json(
          { error: "Access denied to database" },
          { status: 403 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
