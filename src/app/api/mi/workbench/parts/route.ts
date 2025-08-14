import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "@/lib/services/session";
import type { WorkbenchPart } from "@/app/mi/services/workbench-api-client";

export async function GET(request: NextRequest) {
  try {
    console.log("🔧 MI Workbench Parts API - GET request");

    // Authentication
    const session = await requireUserSession(request);

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const nsn = searchParams.get("nsn");
    const system = searchParams.get("system");
    const assembly = searchParams.get("assembly");
    const riskThreshold = searchParams.get("riskThreshold");
    const missionCritical = searchParams.get("missionCritical");

    console.log("📊 Query parameters:", {
      nsn,
      system,
      assembly,
      riskThreshold,
      missionCritical,
    });

    // Mock parts data (in real implementation, this would come from database)
    const mockParts: WorkbenchPart[] = [
      {
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
      {
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
      {
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
      },
      {
        nsn: "1620-01-456-7890",
        partNumber: "LG-98765",
        nomenclature: "Landing Gear Actuator",
        system: "B-52H",
        assembly: "Landing Gear",
        riskScore: 50,
        missionCritical: false,
        currentStatus: "Normal",
        lastMaintenance: "2024-09-30",
        linkedIssues: ["ISSUE#WB004"],
        linkedDecisions: [],
        supplier: {
          cage: "012JKL",
          name: "Landing Systems Inc",
          performance: 88
        },
        stockPosture: {
          onHand: 25,
          dueIn: 10,
          daysOfSupply: 180
        }
      },
      {
        nsn: "5826-01-567-8901",
        partNumber: "NAV-13579",
        nomenclature: "Navigation Processing Unit",
        system: "B-52H",
        assembly: "Navigation",
        riskScore: 30,
        missionCritical: false,
        currentStatus: "Monitoring",
        lastMaintenance: "2024-08-15",
        linkedIssues: ["ISSUE#WB005"],
        linkedDecisions: [],
        supplier: {
          cage: "345MNO",
          name: "Navigation Tech Ltd",
          performance: 95
        },
        stockPosture: {
          onHand: 40,
          dueIn: 15,
          daysOfSupply: 365
        }
      }
    ];

    // Apply filters
    let filteredParts = mockParts;

    if (nsn) {
      filteredParts = filteredParts.filter(p => 
        p.nsn.toLowerCase().includes(nsn.toLowerCase()) ||
        p.partNumber.toLowerCase().includes(nsn.toLowerCase())
      );
    }

    if (system) {
      filteredParts = filteredParts.filter(p => 
        p.system.toLowerCase().includes(system.toLowerCase())
      );
    }

    if (assembly) {
      filteredParts = filteredParts.filter(p => 
        p.assembly.toLowerCase().includes(assembly.toLowerCase())
      );
    }

    if (riskThreshold) {
      const threshold = parseInt(riskThreshold);
      filteredParts = filteredParts.filter(p => p.riskScore >= threshold);
    }

    if (missionCritical !== null && missionCritical !== undefined) {
      const isCritical = missionCritical.toLowerCase() === 'true';
      filteredParts = filteredParts.filter(p => p.missionCritical === isCritical);
    }

    console.log(`✅ Returning ${filteredParts.length} parts`);

    return NextResponse.json(filteredParts);
  } catch (error) {
    console.error("❌ MI Workbench Parts API error:", error);

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
