import { NextRequest, NextResponse } from "next/server";
import { WorkbenchDatabase } from "@/app/mi/services/database";
import { requireUserSession } from "@/lib/services/session";
import type { WorkbenchDecision } from "@/app/mi/services/workbench-api-client";

export async function GET(request: NextRequest) {
  try {
    console.log("🎯 MI Workbench Decisions API - GET request");

    // Authentication
    const session = await requireUserSession(request);

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const issueId = searchParams.get("issueId");
    const status = searchParams.get("status");
    const approver = searchParams.get("approver");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    console.log("📊 Query parameters:", {
      issueId,
      status,
      approver,
      startDate,
      endDate,
    });

    // Mock decision data (in real implementation, this would come from database)
    const mockDecisions: WorkbenchDecision[] = [
      {
        id: "DECISION#001",
        issueId: "ISSUE#WB001",
        title: "Hydraulic Actuator Replacement Strategy",
        description: "Decision on replacement timeline and supplier selection for B-52H hydraulic actuators",
        decision: "Implement phased replacement with dual-sourcing strategy",
        rationale: "Reduces risk through supplier diversity while maintaining mission readiness",
        impact: "Reduces MICAP risk by 35% over 12 months, improves mission availability by 8%",
        alternatives: [
          "Single-source immediate replacement",
          "Defer replacement until next maintenance cycle",
          "Implement predictive maintenance only"
        ],
        risks: [
          "Initial higher cost due to dual sourcing",
          "Training requirements for maintenance crews",
          "Supply chain coordination complexity"
        ],
        implementationPlan: "Phase 1: Establish contracts (30 days), Phase 2: Begin replacements (60 days), Phase 3: Full deployment (180 days)",
        approvedBy: "Col. Sarah Johnson",
        approvedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: "Approved",
        linkedParts: ["NSN-1560-01-123-4567"],
        financialImpact: 500000,
        timeline: "180 days"
      },
      {
        id: "DECISION#002",
        issueId: "ISSUE#WB002",
        title: "Engine Fuel Nozzle Validation Protocol",
        description: "Approval of field testing protocol for new fuel nozzle design",
        decision: "Approve limited field testing on 3 aircraft for 6 months",
        rationale: "Controlled testing minimizes risk while providing real-world validation data",
        impact: "Validates solution effectiveness with minimal operational risk",
        alternatives: [
          "Lab testing only",
          "Full fleet deployment",
          "Extended ground testing"
        ],
        risks: [
          "Potential performance degradation during test period",
          "Limited sample size for statistical validation",
          "Resource allocation for monitoring"
        ],
        implementationPlan: "Select test aircraft (14 days), Install nozzles (30 days), Monitor performance (180 days)",
        approvedBy: "Maj. Gen. Robert Chen",
        approvedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: "Implemented",
        linkedParts: ["NSN-2840-01-234-5678"],
        financialImpact: 75000,
        timeline: "224 days"
      },
      {
        id: "DECISION#003",
        issueId: "ISSUE#WB003",
        title: "Avionics Circuit Board Qualification",
        description: "Approval of qualification testing for new avionics circuit board design",
        decision: "Proceed with full qualification testing and certification",
        rationale: "New design addresses obsolescence issues and improves reliability",
        impact: "Eliminates obsolescence risk and reduces failure rate by 60%",
        alternatives: [
          "Continue with current design",
          "Seek alternative suppliers",
          "Develop in-house solution"
        ],
        risks: [
          "Qualification timeline may extend beyond current inventory depletion",
          "New design performance uncertainty",
          "Integration challenges with existing systems"
        ],
        implementationPlan: "Environmental testing (60 days), System integration (90 days), Flight testing (120 days)",
        approvedBy: "Dr. Lisa Park",
        approvedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: "Draft",
        linkedParts: ["NSN-5342-01-345-6789"],
        financialImpact: 200000,
        timeline: "270 days"
      }
    ];

    // Apply filters
    let filteredDecisions = mockDecisions;

    if (issueId) {
      filteredDecisions = filteredDecisions.filter(d => d.issueId === issueId);
    }

    if (status) {
      filteredDecisions = filteredDecisions.filter(d => d.status === status);
    }

    if (approver) {
      filteredDecisions = filteredDecisions.filter(d => 
        d.approvedBy.toLowerCase().includes(approver.toLowerCase())
      );
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filteredDecisions = filteredDecisions.filter(d => {
        const approvedDate = new Date(d.approvedDate);
        return approvedDate >= start && approvedDate <= end;
      });
    }

    console.log(`✅ Returning ${filteredDecisions.length} decisions`);

    return NextResponse.json(filteredDecisions);
  } catch (error) {
    console.error("❌ MI Workbench Decisions API error:", error);

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
