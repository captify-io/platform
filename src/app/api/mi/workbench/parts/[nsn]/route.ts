import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "@/lib/services/session";
import type { WorkbenchPart } from "@/app/mi/services/workbench-api-client";

interface Props {
  params: Promise<{
    nsn: string;
  }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    console.log("🔧 MI Workbench Part Details API - GET request");

    // Authentication
    const session = await requireUserSession(request);

    const { nsn } = await params;
    console.log("📊 Requested NSN:", nsn);

    // Mock part detail data (in real implementation, this would come from database)
    const mockParts: { [key: string]: WorkbenchPart } = {
      "1560-01-123-4567": {
        nsn: "1560-01-123-4567",
        partNumber: "HA-12345",
        nomenclature: "Hydraulic Actuator Assembly",
        system: "B-52H",
        assembly: "Flight Controls",
        riskScore: 95,
        missionCritical: true,
        currentStatus: "At Risk",
        lastMaintenance: "2024-12-01",
        linkedIssues: ["ISSUE#WB001"],
        linkedDecisions: ["DECISION#001"],
        supplier: {
          cage: "123ABC",
          name: "Aerospace Hydraulics Inc",
          performance: 72
        },
        stockPosture: {
          onHand: 2,
          dueIn: 5,
          daysOfSupply: 15
        }
      },
      "2840-01-234-5678": {
        nsn: "2840-01-234-5678",
        partNumber: "FN-67890",
        nomenclature: "Engine Fuel Nozzle",
        system: "B-52H",
        assembly: "Propulsion",
        riskScore: 78,
        missionCritical: true,
        currentStatus: "Under Review",
        lastMaintenance: "2024-11-15",
        linkedIssues: ["ISSUE#WB002"],
        linkedDecisions: ["DECISION#002"],
        supplier: {
          cage: "456DEF",
          name: "Turbine Solutions LLC",
          performance: 85
        },
        stockPosture: {
          onHand: 8,
          dueIn: 12,
          daysOfSupply: 45
        }
      },
      "5342-01-345-6789": {
        nsn: "5342-01-345-6789",
        partNumber: "CB-54321",
        nomenclature: "Avionics Circuit Board",
        system: "B-52H",
        assembly: "Avionics",
        riskScore: 65,
        missionCritical: false,
        currentStatus: "Qualifying",
        lastMaintenance: "2024-10-20",
        linkedIssues: ["ISSUE#WB003"],
        linkedDecisions: ["DECISION#003"],
        supplier: {
          cage: "789GHI",
          name: "Digital Avionics Corp",
          performance: 90
        },
        stockPosture: {
          onHand: 15,
          dueIn: 8,
          daysOfSupply: 120
        }
      }
    };

    const part = mockParts[nsn];

    if (!part) {
      return NextResponse.json(
        { error: "Part not found" },
        { status: 404 }
      );
    }

    console.log(`✅ Returning part details for NSN: ${nsn}`);

    return NextResponse.json(part);
  } catch (error) {
    console.error("❌ MI Workbench Part Details API error:", error);

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
