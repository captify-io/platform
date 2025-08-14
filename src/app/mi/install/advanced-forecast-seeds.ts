/**
 * Advanced Forecasting Mock Data Generator
 *
 * Generates comprehensive mock data for advanced forecasting features including:
 * - 150+ NSNs across B-52H systems with multi-horizon risk scores
 * - 12+ suppliers with realistic performance metrics
 * - 200+ assistance requests (202/107/339 types)
 * - BOM360 mappings with orphan flags
 * - Pre-calculated KPIs and chart data
 */

import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";

interface AdvancedForecastSeedData {
  parts: PartData[];
  suppliers: SupplierData[];
  assistanceRequests: AssistanceRequestData[];
  riskForecasts: RiskForecastData[];
  bomMappings: BomMappingData[];
  inventoryPosture: InventoryPostureData[];
  fleetRollups: FleetRollupData[];
  chartData: ChartData[];
}

interface PartData {
  nsn: string;
  part_number: string;
  nomenclature: string;
  assembly: string;
  weapon_system: string;
  wbs_level: number;
}

interface SupplierData {
  cage_code: string;
  supplier_name: string;
  otd_percent: number;
  otd_trend: "improving" | "stable" | "declining";
  pqdr_rate: number;
  lead_time_days: number;
  lead_time_variance: number;
}

interface AssistanceRequestData {
  request_id: string;
  type: "202" | "107" | "339";
  nsn: string;
  date: string;
  summary: string;
  status: "open" | "closed" | "pending";
  linked_supplier?: string;
}

interface RiskForecastData {
  nsn: string;
  horizon_days: 90 | 180 | 270 | 365;
  risk_score: number;
  confidence: number;
  score_breakdown: {
    dos_slope_weight: number;
    supplier_otd_weight: number;
    lead_time_variance_weight: number;
    assistance_req_weight: number;
    maintenance_weight: number;
  };
  projected_micap_days: number;
}

interface BomMappingData {
  nsn: string;
  is_bom_mapped: boolean;
  is_orphan: boolean;
  parent_assemblies: string[];
  child_parts: string[];
  alternate_parts: string[];
}

interface InventoryPostureData {
  nsn: string;
  days_of_supply: number;
  dos_slope: number;
  on_hand: number;
  due_in: number;
  due_in_reliability: number;
}

interface FleetRollupData {
  scope: string; // 'fleet', 'system', 'assembly'
  scope_id: string;
  horizon_days: 90 | 180 | 270 | 365;
  total_parts_at_risk: number;
  projected_micap_days: number;
  avg_days_of_supply: number;
  avg_supplier_otd: number;
  total_open_assistance_requests: number;
  date: string;
}

interface ChartData {
  chart_type:
    | "risk_trend"
    | "dos_distribution"
    | "assistance_request_trend"
    | "supplier_performance_trend";
  scope: string;
  horizon_days: 90 | 180 | 270 | 365;
  data_points: any[];
}

export class AdvancedForecastSeedGenerator {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(docClient: DynamoDBDocumentClient, tableName: string) {
    this.docClient = docClient;
    this.tableName = tableName;
  }

  /**
   * Generate all advanced forecasting seed data
   */
  async generateSeedData(): Promise<AdvancedForecastSeedData> {
    console.log("🌱 Generating advanced forecasting seed data...");

    const parts = this.generateParts();
    const suppliers = this.generateSuppliers();
    const assistanceRequests = this.generateAssistanceRequests(
      parts,
      suppliers
    );
    const riskForecasts = this.generateRiskForecasts(parts);
    const bomMappings = this.generateBomMappings(parts);
    const inventoryPosture = this.generateInventoryPosture(parts);
    const fleetRollups = this.generateFleetRollups(parts, riskForecasts);
    const chartData = this.generateChartData(
      parts,
      riskForecasts,
      assistanceRequests
    );

    return {
      parts,
      suppliers,
      assistanceRequests,
      riskForecasts,
      bomMappings,
      inventoryPosture,
      fleetRollups,
      chartData,
    };
  }

  /**
   * Generate 150+ realistic B-52H parts across 4-level hierarchy
   */
  private generateParts(): PartData[] {
    const parts: PartData[] = [];

    // B-52H Systems and assemblies
    const systems = [
      {
        name: "Propulsion System",
        prefix: "2840",
        assemblies: ["TF33 Engine", "Fuel System", "Engine Controls"],
      },
      {
        name: "Flight Controls",
        prefix: "1680",
        assemblies: ["Primary Controls", "Secondary Controls", "Hydraulics"],
      },
      {
        name: "Avionics",
        prefix: "5895",
        assemblies: ["Navigation", "Communications", "Radar"],
      },
      {
        name: "Electrical",
        prefix: "6110",
        assemblies: ["Power Generation", "Distribution", "Emergency Power"],
      },
      {
        name: "Environmental",
        prefix: "1660",
        assemblies: ["Air Conditioning", "Pressurization", "Oxygen"],
      },
      {
        name: "Landing Gear",
        prefix: "1620",
        assemblies: ["Main Gear", "Nose Gear", "Brakes"],
      },
    ];

    let nsnCounter = 1;

    systems.forEach((system) => {
      system.assemblies.forEach((assembly) => {
        // Generate 8-12 parts per assembly
        const partsCount = 8 + Math.floor(Math.random() * 5);

        for (let i = 0; i < partsCount; i++) {
          const nsn = `${system.prefix}-00-${String(nsnCounter).padStart(
            6,
            "0"
          )}`;
          const partNumber = `${system.prefix.substring(0, 2)}-${String(
            nsnCounter
          ).padStart(4, "0")}-${String(i + 1).padStart(2, "0")}`;

          parts.push({
            nsn,
            part_number: partNumber,
            nomenclature: this.generatePartNomenclature(assembly, i),
            assembly,
            weapon_system: "B-52H",
            wbs_level: 4,
          });

          nsnCounter++;
        }
      });
    });

    console.log(`✅ Generated ${parts.length} parts across B-52H systems`);
    return parts;
  }

  /**
   * Generate realistic part nomenclatures
   */
  private generatePartNomenclature(assembly: string, index: number): string {
    const components = {
      "TF33 Engine": [
        "Combustion Module",
        "Turbine Blade",
        "Fuel Nozzle",
        "Oil Pump",
        "Bearing Assembly",
      ],
      "Fuel System": [
        "Fuel Pump",
        "Filter Element",
        "Valve Assembly",
        "Fuel Line",
        "Tank Assembly",
      ],
      "Engine Controls": [
        "Control Unit",
        "Sensor",
        "Actuator",
        "Wiring Harness",
        "Switch",
      ],
      "Primary Controls": [
        "Control Surface",
        "Actuator",
        "Cable Assembly",
        "Linkage",
        "Bearing",
      ],
      "Secondary Controls": [
        "Trim Tab",
        "Balance Weight",
        "Hinge",
        "Lock Mechanism",
        "Spring",
      ],
      Hydraulics: ["Pump", "Filter", "Accumulator", "Valve", "Cylinder"],
      Navigation: [
        "GPS Unit",
        "INS Module",
        "Display Unit",
        "Antenna",
        "Cable",
      ],
      Communications: [
        "Radio",
        "Antenna",
        "Amplifier",
        "Speaker",
        "Microphone",
      ],
      Radar: ["Transmitter", "Receiver", "Antenna", "Processor", "Display"],
      "Power Generation": [
        "Generator",
        "Regulator",
        "Brush",
        "Slip Ring",
        "Housing",
      ],
      Distribution: [
        "Circuit Breaker",
        "Bus Bar",
        "Wire Bundle",
        "Connector",
        "Junction Box",
      ],
      "Emergency Power": ["Battery", "Inverter", "Switch", "Relay", "Fuse"],
      "Air Conditioning": [
        "Compressor",
        "Evaporator",
        "Condenser",
        "Fan",
        "Thermostat",
      ],
      Pressurization: [
        "Pressure Valve",
        "Sensor",
        "Controller",
        "Seal",
        "Duct",
      ],
      Oxygen: ["Oxygen Generator", "Mask", "Regulator", "Hose", "Valve"],
      "Main Gear": ["Strut", "Wheel", "Tire", "Brake Disc", "Hydraulic Line"],
      "Nose Gear": [
        "Strut",
        "Wheel",
        "Tire",
        "Steering Actuator",
        "Position Sensor",
      ],
      Brakes: [
        "Brake Assembly",
        "Hydraulic Pump",
        "Brake Line",
        "Anti-Skid Unit",
        "Pressure Switch",
      ],
    };

    const partTypes = components[assembly as keyof typeof components] || [
      "Component",
      "Assembly",
      "Part",
      "Unit",
      "Module",
    ];
    return partTypes[index % partTypes.length];
  }

  /**
   * Generate 20-30 suppliers with realistic performance metrics and supply chain health indicators
   */
  private generateSuppliers(): SupplierData[] {
    const suppliers: SupplierData[] = [
      // Tier 1 Prime Contractors (Excellent Performance)
      {
        cage_code: "1A2B3",
        supplier_name: "Boeing Defense",
        otd_percent: 94.5,
        otd_trend: "stable",
        pqdr_rate: 0.02,
        lead_time_days: 45,
        lead_time_variance: 8,
      },
      {
        cage_code: "7G8H9",
        supplier_name: "Honeywell Aerospace",
        otd_percent: 96.8,
        otd_trend: "improving",
        pqdr_rate: 0.01,
        lead_time_days: 38,
        lead_time_variance: 5,
      },
      {
        cage_code: "3N6Q1",
        supplier_name: "Raytheon Technologies",
        otd_percent: 95.1,
        otd_trend: "stable",
        pqdr_rate: 0.02,
        lead_time_days: 41,
        lead_time_variance: 6,
      },
      {
        cage_code: "1X4Z8",
        supplier_name: "Textron Aviation",
        otd_percent: 94.9,
        otd_trend: "stable",
        pqdr_rate: 0.02,
        lead_time_days: 43,
        lead_time_variance: 7,
      },
      {
        cage_code: "6R8T5",
        supplier_name: "Lockheed Martin",
        otd_percent: 92.4,
        otd_trend: "improving",
        pqdr_rate: 0.03,
        lead_time_days: 52,
        lead_time_variance: 11,
      },

      // Tier 2 Suppliers (Good to Moderate Performance)
      {
        cage_code: "4D5E6",
        supplier_name: "Pratt & Whitney",
        otd_percent: 91.2,
        otd_trend: "declining",
        pqdr_rate: 0.03,
        lead_time_days: 62,
        lead_time_variance: 15,
      },
      {
        cage_code: "2C4F7",
        supplier_name: "Collins Aerospace",
        otd_percent: 89.3,
        otd_trend: "stable",
        pqdr_rate: 0.04,
        lead_time_days: 55,
        lead_time_variance: 12,
      },
      {
        cage_code: "5H7K2",
        supplier_name: "Northrop Grumman",
        otd_percent: 93.7,
        otd_trend: "improving",
        pqdr_rate: 0.02,
        lead_time_days: 48,
        lead_time_variance: 9,
      },
      {
        cage_code: "5B7D3",
        supplier_name: "Parker Hannifin",
        otd_percent: 91.8,
        otd_trend: "improving",
        pqdr_rate: 0.03,
        lead_time_days: 39,
        lead_time_variance: 8,
      },
      {
        cage_code: "2E6G9",
        supplier_name: "Safran Aerospace",
        otd_percent: 90.5,
        otd_trend: "stable",
        pqdr_rate: 0.04,
        lead_time_days: 58,
        lead_time_variance: 13,
      },

      // Tier 3 Suppliers (Challenged Performance - Risk Indicators)
      {
        cage_code: "8M9P4",
        supplier_name: "General Electric",
        otd_percent: 88.9,
        otd_trend: "declining",
        pqdr_rate: 0.05,
        lead_time_days: 71,
        lead_time_variance: 18,
      },
      {
        cage_code: "9U2W7",
        supplier_name: "BAE Systems",
        otd_percent: 87.6,
        otd_trend: "declining",
        pqdr_rate: 0.06,
        lead_time_days: 68,
        lead_time_variance: 16,
      },
      {
        cage_code: "4K8L5",
        supplier_name: "Curtiss-Wright",
        otd_percent: 86.2,
        otd_trend: "declining",
        pqdr_rate: 0.07,
        lead_time_days: 74,
        lead_time_variance: 20,
      },
      {
        cage_code: "7M2N9",
        supplier_name: "Moog Inc",
        otd_percent: 88.4,
        otd_trend: "stable",
        pqdr_rate: 0.05,
        lead_time_days: 66,
        lead_time_variance: 14,
      },

      // Small to Medium Suppliers (Varied Performance)
      {
        cage_code: "3P6R1",
        supplier_name: "Eaton Corporation",
        otd_percent: 92.1,
        otd_trend: "stable",
        pqdr_rate: 0.03,
        lead_time_days: 47,
        lead_time_variance: 10,
      },
      {
        cage_code: "5S8T4",
        supplier_name: "TE Connectivity",
        otd_percent: 89.7,
        otd_trend: "improving",
        pqdr_rate: 0.04,
        lead_time_days: 53,
        lead_time_variance: 12,
      },
      {
        cage_code: "2U7V0",
        supplier_name: "Amphenol Aerospace",
        otd_percent: 91.3,
        otd_trend: "stable",
        pqdr_rate: 0.03,
        lead_time_days: 44,
        lead_time_variance: 9,
      },
      {
        cage_code: "6W1X3",
        supplier_name: "ITT Aerospace",
        otd_percent: 87.9,
        otd_trend: "declining",
        pqdr_rate: 0.06,
        lead_time_days: 69,
        lead_time_variance: 17,
      },
      {
        cage_code: "4Y9Z2",
        supplier_name: "Woodward Inc",
        otd_percent: 90.8,
        otd_trend: "improving",
        pqdr_rate: 0.04,
        lead_time_days: 51,
        lead_time_variance: 11,
      },
      {
        cage_code: "8A5B6",
        supplier_name: "Meggitt PLC",
        otd_percent: 88.6,
        otd_trend: "stable",
        pqdr_rate: 0.05,
        lead_time_days: 59,
        lead_time_variance: 13,
      },

      // Niche/Specialty Suppliers (Mixed Performance - Some Critical Dependencies)
      {
        cage_code: "1C7D2",
        supplier_name: "Aerospace Bearing Co",
        otd_percent: 85.4,
        otd_trend: "declining",
        pqdr_rate: 0.08,
        lead_time_days: 82,
        lead_time_variance: 25,
      },
      {
        cage_code: "9E3F8",
        supplier_name: "Specialty Metals Corp",
        otd_percent: 83.7,
        otd_trend: "declining",
        pqdr_rate: 0.09,
        lead_time_days: 95,
        lead_time_variance: 30,
      },
      {
        cage_code: "4G0H1",
        supplier_name: "Precision Castparts",
        otd_percent: 86.9,
        otd_trend: "stable",
        pqdr_rate: 0.07,
        lead_time_days: 78,
        lead_time_variance: 22,
      },
      {
        cage_code: "7I5J4",
        supplier_name: "Advanced Composites",
        otd_percent: 84.2,
        otd_trend: "declining",
        pqdr_rate: 0.1,
        lead_time_days: 87,
        lead_time_variance: 28,
      },
      {
        cage_code: "2K8L6",
        supplier_name: "Hydraulic Systems LLC",
        otd_percent: 87.1,
        otd_trend: "improving",
        pqdr_rate: 0.06,
        lead_time_days: 72,
        lead_time_variance: 19,
      },

      // International/Offshore Suppliers (Higher Lead Times, Variable Quality)
      {
        cage_code: "5M1N7",
        supplier_name: "European Aero Defence",
        otd_percent: 82.5,
        otd_trend: "declining",
        pqdr_rate: 0.11,
        lead_time_days: 105,
        lead_time_variance: 35,
      },
      {
        cage_code: "3O9P4",
        supplier_name: "Asia Pacific Components",
        otd_percent: 81.3,
        otd_trend: "stable",
        pqdr_rate: 0.12,
        lead_time_days: 120,
        lead_time_variance: 40,
      },
      {
        cage_code: "6Q2R5",
        supplier_name: "Global Defense Systems",
        otd_percent: 79.8,
        otd_trend: "declining",
        pqdr_rate: 0.14,
        lead_time_days: 135,
        lead_time_variance: 45,
      },
      {
        cage_code: "8S4T1",
        supplier_name: "International Aerospace Ltd",
        otd_percent: 80.6,
        otd_trend: "improving",
        pqdr_rate: 0.13,
        lead_time_days: 115,
        lead_time_variance: 38,
      },
    ];

    console.log(
      `✅ Generated ${suppliers.length} suppliers with varied performance profiles`
    );
    return suppliers;
  }

  /**
   * Generate 250+ assistance requests across 202/107/339 types, properly linked to parts and suppliers
   */
  private generateAssistanceRequests(
    parts: PartData[],
    suppliers: SupplierData[]
  ): AssistanceRequestData[] {
    const requests: AssistanceRequestData[] = [];
    const types: ("202" | "107" | "339")[] = ["202", "107", "339"];
    const statuses: ("open" | "closed" | "pending")[] = [
      "open",
      "closed",
      "pending",
    ];

    // Generate requests over the last 12 months, concentrating on higher-risk parts
    const now = new Date();

    // Focus more requests on engine and flight-critical parts (higher failure rates)
    const criticalParts = parts.filter(
      (p) =>
        p.assembly.includes("Engine") ||
        p.assembly.includes("Controls") ||
        p.assembly.includes("Hydraulics")
    );

    const moderateRiskParts = parts.filter(
      (p) =>
        p.assembly.includes("Avionics") ||
        p.assembly.includes("Navigation") ||
        p.assembly.includes("Electrical")
    );

    const lowRiskParts = parts.filter(
      (p) => !criticalParts.includes(p) && !moderateRiskParts.includes(p)
    );

    // Generate more requests for critical parts (60%), moderate for medium risk (30%), few for low risk (10%)
    const requestDistribution = [
      { parts: criticalParts, count: 150, riskLevel: "critical" },
      { parts: moderateRiskParts, count: 75, riskLevel: "moderate" },
      { parts: lowRiskParts, count: 25, riskLevel: "low" },
    ];

    let requestCounter = 1;

    requestDistribution.forEach(({ parts: partGroup, count, riskLevel }) => {
      for (let i = 0; i < count; i++) {
        const part = partGroup[Math.floor(Math.random() * partGroup.length)];
        const type = types[Math.floor(Math.random() * types.length)];

        // Status distribution based on risk level
        let status: "open" | "closed" | "pending";
        if (riskLevel === "critical") {
          // Critical parts have more open requests (supply chain stress)
          const statusRand = Math.random();
          if (statusRand < 0.4) status = "open";
          else if (statusRand < 0.7) status = "pending";
          else status = "closed";
        } else if (riskLevel === "moderate") {
          const statusRand = Math.random();
          if (statusRand < 0.25) status = "open";
          else if (statusRand < 0.5) status = "pending";
          else status = "closed";
        } else {
          // Low risk parts have mostly closed requests
          const statusRand = Math.random();
          if (statusRand < 0.1) status = "open";
          else if (statusRand < 0.2) status = "pending";
          else status = "closed";
        }

        // Generate dates over the last 12 months, with recent bias for open requests
        let daysAgo: number;
        if (status === "open") {
          daysAgo = Math.floor(Math.random() * 90); // Open requests from last 3 months
        } else if (status === "pending") {
          daysAgo = Math.floor(Math.random() * 180); // Pending from last 6 months
        } else {
          daysAgo = Math.floor(Math.random() * 365); // Closed from full year
        }

        const requestDate = new Date(
          now.getTime() - daysAgo * 24 * 60 * 60 * 1000
        );

        // Link to supplier based on part and request type
        let linkedSupplier: string | undefined;
        if (type === "202" || type === "339") {
          // Depot and DLA requests often involve supplier issues
          // Link to suppliers with poorer performance for critical parts
          if (riskLevel === "critical") {
            const problemSuppliers = suppliers.filter(
              (s) => s.otd_percent < 90 || s.otd_trend === "declining"
            );
            linkedSupplier =
              problemSuppliers[
                Math.floor(Math.random() * problemSuppliers.length)
              ]?.cage_code;
          } else {
            // Random supplier for non-critical
            linkedSupplier =
              suppliers[Math.floor(Math.random() * suppliers.length)].cage_code;
          }
        }

        requests.push({
          request_id: `${type}-${String(requestCounter).padStart(6, "0")}`,
          type,
          nsn: part.nsn,
          date: requestDate.toISOString().split("T")[0],
          summary: this.generateRequestSummary(
            type,
            part.nomenclature,
            riskLevel
          ),
          status,
          linked_supplier: linkedSupplier,
        });

        requestCounter++;
      }
    });

    console.log(
      `✅ Generated ${requests.length} assistance requests with realistic distribution:`
    );
    console.log(
      `   - Critical parts: ${
        requests.filter((r) => criticalParts.some((p) => p.nsn === r.nsn))
          .length
      } requests`
    );
    console.log(
      `   - Open requests: ${
        requests.filter((r) => r.status === "open").length
      }`
    );
    console.log(
      `   - Supplier-linked: ${
        requests.filter((r) => r.linked_supplier).length
      }`
    );

    return requests;
  }

  /**
   * Generate assistance request summaries with risk-aware context
   */
  private generateRequestSummary(
    type: string,
    nomenclature: string,
    riskLevel?: string
  ): string {
    const baseSummaries = {
      "202": [
        `Depot repair needed for ${nomenclature}`,
        `Overhaul required - ${nomenclature}`,
        `Technical assistance for ${nomenclature} failure`,
      ],
      "107": [
        `Field maintenance support - ${nomenclature}`,
        `Installation guidance needed for ${nomenclature}`,
        `Troubleshooting ${nomenclature} issue`,
      ],
      "339": [
        `DLA stock request for ${nomenclature}`,
        `Supply chain issue - ${nomenclature}`,
        `Procurement assistance needed - ${nomenclature}`,
      ],
    };

    // Add urgency indicators for critical parts
    const urgentModifiers =
      riskLevel === "critical"
        ? ["URGENT: ", "PRIORITY: ", "CRITICAL: "]
        : [""];

    const options = baseSummaries[type as keyof typeof baseSummaries];
    const urgencyModifier =
      urgentModifiers[Math.floor(Math.random() * urgentModifiers.length)];
    const baseSummary = options[Math.floor(Math.random() * options.length)];

    return urgencyModifier + baseSummary;
  }

  /**
   * Generate risk forecasts for all parts across all horizons with realistic distribution
   * Pattern: 5% critical (80-100), 15% medium (50-80), 80% low-risk (0-50)
   */
  private generateRiskForecasts(parts: PartData[]): RiskForecastData[] {
    const forecasts: RiskForecastData[] = [];
    const horizons: (90 | 180 | 270 | 365)[] = [90, 180, 270, 365];

    // Categorize parts by inherent risk level
    const criticalParts = this.selectCriticalParts(parts, 0.05); // 5%
    const mediumRiskParts = this.selectMediumRiskParts(
      parts,
      criticalParts,
      0.15
    ); // 15%
    const lowRiskParts = parts.filter(
      (p) => !criticalParts.includes(p) && !mediumRiskParts.includes(p)
    ); // Remaining 80%

    console.log(
      `📊 Risk distribution: ${criticalParts.length} critical, ${mediumRiskParts.length} medium, ${lowRiskParts.length} low-risk parts`
    );

    parts.forEach((part) => {
      let riskCategory: "critical" | "medium" | "low";
      let baseRiskRange: [number, number];

      if (criticalParts.includes(part)) {
        riskCategory = "critical";
        baseRiskRange = [75, 95]; // 75-95 base risk
      } else if (mediumRiskParts.includes(part)) {
        riskCategory = "medium";
        baseRiskRange = [45, 75]; // 45-75 base risk
      } else {
        riskCategory = "low";
        baseRiskRange = [5, 45]; // 5-45 base risk
      }

      horizons.forEach((horizon) => {
        const risk = this.calculateRealisticRisk(
          part,
          horizon,
          riskCategory,
          baseRiskRange
        );
        const confidence = this.calculateConfidence(
          part,
          horizon,
          riskCategory
        );

        forecasts.push({
          nsn: part.nsn,
          horizon_days: horizon,
          risk_score: Math.round(risk * 100) / 100,
          confidence: Math.round(confidence * 1000) / 1000,
          score_breakdown: this.generateScoreBreakdown(riskCategory),
          projected_micap_days: this.calculateMicapDays(risk, riskCategory),
        });
      });
    });

    console.log(
      `✅ Generated ${forecasts.length} risk forecasts with realistic distribution`
    );
    return forecasts;
  }

  /**
   * Select critical parts based on system importance and historical failure patterns
   */
  private selectCriticalParts(
    parts: PartData[],
    percentage: number
  ): PartData[] {
    const criticalCount = Math.floor(parts.length * percentage);

    // Prioritize engine, flight controls, and hydraulics
    const criticalSystemParts = parts.filter(
      (p) =>
        p.assembly.includes("TF33 Engine") ||
        p.assembly.includes("Primary Controls") ||
        p.assembly.includes("Hydraulics") ||
        p.nomenclature.includes("Combustion") ||
        p.nomenclature.includes("Control Surface") ||
        p.nomenclature.includes("Pump")
    );

    // Shuffle and take the required count
    const shuffled = criticalSystemParts.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(criticalCount, shuffled.length));
  }

  /**
   * Select medium risk parts from remaining systems
   */
  private selectMediumRiskParts(
    parts: PartData[],
    criticalParts: PartData[],
    percentage: number
  ): PartData[] {
    const mediumCount = Math.floor(parts.length * percentage);

    const availableParts = parts.filter((p) => !criticalParts.includes(p));

    // Prioritize avionics, electrical, and secondary systems
    const mediumSystemParts = availableParts.filter(
      (p) =>
        p.assembly.includes("Avionics") ||
        p.assembly.includes("Electrical") ||
        p.assembly.includes("Secondary Controls") ||
        p.assembly.includes("Navigation") ||
        p.assembly.includes("Environmental")
    );

    const shuffled = mediumSystemParts.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(mediumCount, shuffled.length));
  }

  /**
   * Calculate realistic risk with horizon-based progression
   */
  private calculateRealisticRisk(
    part: PartData,
    horizon: number,
    category: "critical" | "medium" | "low",
    baseRange: [number, number]
  ): number {
    const [minRisk, maxRisk] = baseRange;
    let baseRisk = minRisk + Math.random() * (maxRisk - minRisk);

    // Risk typically increases with horizon, but not linearly
    const horizonMultiplier = this.getHorizonMultiplier(horizon, category);
    let adjustedRisk = baseRisk * horizonMultiplier;

    // Add some part-specific variation based on assembly type
    const assemblyVariation = this.getAssemblyRiskVariation(part.assembly);
    adjustedRisk += assemblyVariation;

    // Ensure realistic bounds
    if (category === "critical") {
      adjustedRisk = Math.min(98, Math.max(70, adjustedRisk));
    } else if (category === "medium") {
      adjustedRisk = Math.min(80, Math.max(40, adjustedRisk));
    } else {
      adjustedRisk = Math.min(55, Math.max(3, adjustedRisk));
    }

    return adjustedRisk;
  }

  /**
   * Get horizon-based risk multiplier
   */
  private getHorizonMultiplier(
    horizon: number,
    category: "critical" | "medium" | "low"
  ): number {
    const baseMultipliers = {
      90: 1.0,
      180: 1.15,
      270: 1.25,
      365: 1.35,
    };

    let multiplier = baseMultipliers[horizon as keyof typeof baseMultipliers];

    // Critical parts have more aggressive horizon scaling
    if (category === "critical") {
      multiplier += ((horizon - 90) / 365) * 0.3;
    } else if (category === "low") {
      multiplier += ((horizon - 90) / 365) * 0.1; // Low risk parts scale slowly
    }

    return multiplier;
  }

  /**
   * Get assembly-specific risk variation
   */
  private getAssemblyRiskVariation(assembly: string): number {
    const variations: Record<string, number> = {
      "TF33 Engine": 10,
      "Primary Controls": 8,
      Hydraulics: 6,
      Avionics: 3,
      Navigation: 2,
      Electrical: 1,
      Environmental: -2,
      "Landing Gear": -1,
    };

    for (const [key, variation] of Object.entries(variations)) {
      if (assembly.includes(key)) {
        return variation + (Math.random() - 0.5) * 5;
      }
    }

    return (Math.random() - 0.5) * 3; // Default small variation
  }

  /**
   * Calculate confidence based on data recency and part criticality
   */
  private calculateConfidence(
    part: PartData,
    horizon: number,
    category: "critical" | "medium" | "low"
  ): number {
    let baseConfidence = 0.85; // 85% base confidence

    // Critical parts have more monitoring data = higher confidence
    if (category === "critical") {
      baseConfidence = 0.9;
    } else if (category === "low") {
      baseConfidence = 0.75; // Less historical data for low-risk parts
    }

    // Confidence decreases with longer horizons
    const horizonPenalty = ((horizon - 90) / 365) * 0.2; // Up to 20% penalty at 365 days
    baseConfidence -= horizonPenalty;

    // Add some realistic variation
    baseConfidence += (Math.random() - 0.5) * 0.1;

    return Math.max(0.5, Math.min(0.99, baseConfidence));
  }

  /**
   * Generate score breakdown based on category
   */
  private generateScoreBreakdown(category: "critical" | "medium" | "low"): {
    dos_slope_weight: number;
    supplier_otd_weight: number;
    lead_time_variance_weight: number;
    assistance_req_weight: number;
    maintenance_weight: number;
  } {
    if (category === "critical") {
      return {
        dos_slope_weight: 0.35 + Math.random() * 0.15, // High inventory impact
        supplier_otd_weight: 0.25 + Math.random() * 0.1,
        lead_time_variance_weight: 0.2 + Math.random() * 0.1,
        assistance_req_weight: 0.15 + Math.random() * 0.1,
        maintenance_weight: 0.05 + Math.random() * 0.1,
      };
    } else if (category === "medium") {
      return {
        dos_slope_weight: 0.25 + Math.random() * 0.15,
        supplier_otd_weight: 0.3 + Math.random() * 0.1,
        lead_time_variance_weight: 0.2 + Math.random() * 0.1,
        assistance_req_weight: 0.15 + Math.random() * 0.1,
        maintenance_weight: 0.1 + Math.random() * 0.1,
      };
    } else {
      return {
        dos_slope_weight: 0.2 + Math.random() * 0.15,
        supplier_otd_weight: 0.35 + Math.random() * 0.15, // Low-risk = mostly supplier driven
        lead_time_variance_weight: 0.25 + Math.random() * 0.1,
        assistance_req_weight: 0.1 + Math.random() * 0.1,
        maintenance_weight: 0.1 + Math.random() * 0.1,
      };
    }
  }

  /**
   * Calculate MICAP days based on risk and category
   */
  private calculateMicapDays(
    risk: number,
    category: "critical" | "medium" | "low"
  ): number {
    let baseMicap = risk * 0.4; // Base relationship

    if (category === "critical") {
      baseMicap *= 1.5; // Critical parts have higher mission impact
    } else if (category === "low") {
      baseMicap *= 0.5; // Low-risk parts have lower impact
    }

    return Math.round(Math.max(0, baseMicap + Math.random() * 5));
  }

  /**
   * Calculate base risk for a part based on its characteristics
   */
  private calculateBaseRisk(part: PartData): number {
    let baseRisk = 30; // Default moderate risk

    // Engine parts tend to be higher risk
    if (
      part.assembly.includes("Engine") ||
      part.assembly.includes("Propulsion")
    ) {
      baseRisk += 25;
    }

    // Flight-critical systems
    if (
      part.assembly.includes("Controls") ||
      part.assembly.includes("Hydraulics")
    ) {
      baseRisk += 20;
    }

    // Electronic systems can be supply-constrained
    if (
      part.assembly.includes("Avionics") ||
      part.assembly.includes("Navigation")
    ) {
      baseRisk += 15;
    }

    // Add some randomness
    baseRisk += (Math.random() - 0.5) * 30;

    return Math.max(5, Math.min(95, baseRisk));
  }

  /**
   * Generate BOM360 mappings with maximum mapping coverage and structured hierarchy
   */
  private generateBomMappings(parts: PartData[]): BomMappingData[] {
    const mappings: BomMappingData[] = [];

    // Group parts by assembly for structured BOM relationships
    const partsByAssembly = parts.reduce((acc, part) => {
      if (!acc[part.assembly]) acc[part.assembly] = [];
      acc[part.assembly].push(part);
      return acc;
    }, {} as Record<string, PartData[]>);

    parts.forEach((part) => {
      // Only 5% of parts are orphans (maximize BOM mapping as requested)
      const isOrphan = Math.random() < 0.05;
      const isMapped = !isOrphan;

      // Generate realistic parent-child relationships
      const parentAssemblies = this.generateParentAssemblies(part);
      const childParts = isMapped
        ? this.generateChildParts(part, partsByAssembly)
        : [];
      const alternateParts = isMapped
        ? this.generateAlternateParts(part, parts)
        : [];

      mappings.push({
        nsn: part.nsn,
        is_bom_mapped: isMapped,
        is_orphan: isOrphan,
        parent_assemblies: parentAssemblies,
        child_parts: childParts,
        alternate_parts: alternateParts,
      });
    });

    const orphanCount = mappings.filter((m) => m.is_orphan).length;
    const mappedCount = mappings.filter((m) => m.is_bom_mapped).length;

    console.log(
      `✅ Generated BOM360 mappings: ${mappedCount} mapped (${(
        (mappedCount / parts.length) *
        100
      ).toFixed(1)}%), ${orphanCount} orphan parts`
    );
    return mappings;
  }

  /**
   * Generate structured parent assemblies for proper BOM hierarchy
   */
  private generateParentAssemblies(part: PartData): string[] {
    const parents = [part.assembly];

    // Add system-level parent based on assembly
    const systemMappings: Record<string, string> = {
      "TF33 Engine": "Propulsion System",
      "Fuel System": "Propulsion System",
      "Engine Controls": "Propulsion System",
      "Primary Controls": "Flight Controls",
      "Secondary Controls": "Flight Controls",
      Hydraulics: "Flight Controls",
      Navigation: "Avionics",
      Communications: "Avionics",
      Radar: "Avionics",
      "Power Generation": "Electrical",
      Distribution: "Electrical",
      "Emergency Power": "Electrical",
      "Air Conditioning": "Environmental",
      Pressurization: "Environmental",
      Oxygen: "Environmental",
      "Main Gear": "Landing Gear",
      "Nose Gear": "Landing Gear",
      Brakes: "Landing Gear",
    };

    const systemParent = systemMappings[part.assembly];
    if (systemParent && !parents.includes(systemParent)) {
      parents.push(systemParent);
    }

    // Add aircraft-level parent
    if (!parents.includes("B-52H Aircraft")) {
      parents.push("B-52H Aircraft");
    }

    return parents;
  }

  /**
   * Generate child parts for assemblies using structured BOM relationships
   */
  private generateChildParts(
    parent: PartData,
    partsByAssembly: Record<string, PartData[]>
  ): string[] {
    const sameAssemblyParts = partsByAssembly[parent.assembly] || [];
    const childCandidates = sameAssemblyParts.filter(
      (p) => p.nsn !== parent.nsn
    );

    // 30% chance of having child parts, with 1-3 children
    if (Math.random() < 0.3 && childCandidates.length > 0) {
      const childCount = Math.min(3, Math.floor(Math.random() * 3) + 1);
      return childCandidates.slice(0, childCount).map((p) => p.nsn);
    }

    return [];
  }

  /**
   * Generate alternate parts
   */
  private generateAlternateParts(
    part: PartData,
    allParts: PartData[]
  ): string[] {
    const sameTypeParts = allParts.filter(
      (p) => p.nomenclature === part.nomenclature && p.nsn !== part.nsn
    );
    const alternateCount = Math.min(2, sameTypeParts.length);
    return sameTypeParts.slice(0, alternateCount).map((p) => p.nsn);
  }

  /**
   * Generate inventory posture data
   */
  private generateInventoryPosture(parts: PartData[]): InventoryPostureData[] {
    const postures: InventoryPostureData[] = [];

    parts.forEach((part) => {
      const onHand = Math.floor(Math.random() * 50) + 5;
      const averageUsage = Math.floor(Math.random() * 3) + 1;
      const daysOfSupply = Math.round(onHand / averageUsage);

      postures.push({
        nsn: part.nsn,
        days_of_supply: daysOfSupply,
        dos_slope: (Math.random() - 0.7) * 5, // Slight negative bias (inventory declining)
        on_hand: onHand,
        due_in: Math.floor(Math.random() * 20),
        due_in_reliability: 0.6 + Math.random() * 0.4, // 60-100% reliability
      });
    });

    console.log(`✅ Generated inventory posture for ${postures.length} parts`);
    return postures;
  }

  /**
   * Generate pre-calculated fleet rollups with supply chain context and trend data
   */
  private generateFleetRollups(
    parts: PartData[],
    forecasts: RiskForecastData[]
  ): FleetRollupData[] {
    const rollups: FleetRollupData[] = [];
    const horizons: (90 | 180 | 270 | 365)[] = [90, 180, 270, 365];

    // Define hierarchical scopes with supply chain context
    const scopes = [
      { scope: "fleet", scope_id: "B-52H-Fleet", partFilter: () => true },
      {
        scope: "system",
        scope_id: "Propulsion System",
        partFilter: (p: PartData) =>
          p.assembly.includes("Engine") || p.assembly.includes("Fuel"),
      },
      {
        scope: "system",
        scope_id: "Flight Controls",
        partFilter: (p: PartData) =>
          p.assembly.includes("Controls") || p.assembly.includes("Hydraulics"),
      },
      {
        scope: "system",
        scope_id: "Avionics",
        partFilter: (p: PartData) =>
          p.assembly.includes("Navigation") ||
          p.assembly.includes("Communications") ||
          p.assembly.includes("Radar"),
      },
      {
        scope: "system",
        scope_id: "Electrical",
        partFilter: (p: PartData) =>
          p.assembly.includes("Power") ||
          p.assembly.includes("Distribution") ||
          p.assembly.includes("Emergency"),
      },
      {
        scope: "assembly",
        scope_id: "TF33 Engine",
        partFilter: (p: PartData) => p.assembly === "TF33 Engine",
      },
      {
        scope: "assembly",
        scope_id: "Primary Controls",
        partFilter: (p: PartData) => p.assembly === "Primary Controls",
      },
      {
        scope: "assembly",
        scope_id: "Navigation",
        partFilter: (p: PartData) => p.assembly === "Navigation",
      },
    ];

    // Generate rollups for current date and 12 months of history
    const currentDate = new Date();

    scopes.forEach(({ scope, scope_id, partFilter }) => {
      const scopeParts = parts.filter(partFilter);

      horizons.forEach((horizon) => {
        const relevantForecasts = forecasts.filter(
          (f) =>
            f.horizon_days === horizon &&
            scopeParts.some((p) => p.nsn === f.nsn)
        );

        // Generate 12 months of historical trend data
        for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
          const historicalDate = new Date(currentDate);
          historicalDate.setMonth(historicalDate.getMonth() - monthsAgo);

          const rollup = this.calculateSupplyChainRollup(
            scope_id,
            horizon,
            relevantForecasts,
            scopeParts,
            monthsAgo,
            historicalDate
          );

          rollups.push({
            scope,
            scope_id,
            horizon_days: horizon,
            ...rollup,
            date: historicalDate.toISOString().split("T")[0],
          });
        }
      });
    });

    console.log(
      `✅ Generated ${rollups.length} fleet rollup records with 12 months of trend data`
    );
    return rollups;
  }

  /**
   * Calculate supply chain-aware rollup metrics with realistic trends
   */
  private calculateSupplyChainRollup(
    scopeId: string,
    horizon: number,
    forecasts: RiskForecastData[],
    scopeParts: PartData[],
    monthsAgo: number,
    date: Date
  ): Omit<FleetRollupData, "scope" | "scope_id" | "horizon_days" | "date"> {
    const isCurrentMonth = monthsAgo === 0;

    // Calculate parts at risk (score > 70)
    const highRiskForecasts = forecasts.filter((f) => f.risk_score > 70);
    let partsAtRisk = highRiskForecasts.length;

    // Add historical trend (improving/degrading over time)
    if (!isCurrentMonth) {
      const trendFactor = this.getSupplyChainTrendFactor(scopeId, monthsAgo);
      partsAtRisk = Math.round(partsAtRisk * trendFactor);
    }

    // Calculate MICAP days with supply chain context
    const avgMicapDays =
      forecasts.length > 0
        ? Math.round(
            forecasts.reduce((sum, f) => sum + f.projected_micap_days, 0) /
              forecasts.length
          )
        : 0;

    // Days of supply - varies by system type and season
    const baseDaysOfSupply = this.getBaseDaysOfSupply(scopeId);
    const seasonalVariation = this.getSeasonalVariation(date);
    const daysOfSupply = Math.round(
      baseDaysOfSupply + seasonalVariation + (Math.random() - 0.5) * 5
    );

    // Supplier OTD - aggregate performance with trends
    const baseSupplierOTD = this.getBaseSupplierOTD(scopeId);
    const supplierTrend = this.getSupplierTrendFactor(monthsAgo);
    const supplierOTD =
      Math.round(
        (baseSupplierOTD * supplierTrend + Math.random() * 2 - 1) * 10
      ) / 10;

    // Assistance requests - based on system complexity and historical patterns
    const baseAssistanceRequests = this.getBaseAssistanceRequests(scopeId);
    const assistanceVariation = Math.floor(Math.random() * 8) - 4; // ±4 variation
    const assistanceRequests = Math.max(
      0,
      baseAssistanceRequests + assistanceVariation
    );

    return {
      total_parts_at_risk: Math.max(0, partsAtRisk),
      projected_micap_days: Math.max(0, avgMicapDays),
      avg_days_of_supply: Math.max(10, daysOfSupply),
      avg_supplier_otd: Math.max(75, Math.min(99, supplierOTD)),
      total_open_assistance_requests: assistanceRequests,
    };
  }

  /**
   * Get supply chain trend factor based on scope and time
   */
  private getSupplyChainTrendFactor(
    scopeId: string,
    monthsAgo: number
  ): number {
    // Different systems have different trend patterns
    const trendPatterns: Record<string, "improving" | "stable" | "degrading"> =
      {
        "B-52H-Fleet": "stable",
        "Propulsion System": "degrading", // Engine parts under supply pressure
        "Flight Controls": "improving", // Recent supplier improvements
        Avionics: "degrading", // Semiconductor shortages
        Electrical: "stable",
        "TF33 Engine": "degrading",
        "Primary Controls": "improving",
        Navigation: "degrading",
      };

    const pattern = trendPatterns[scopeId] || "stable";
    const timeDecay = monthsAgo / 12; // 0 = current, 1 = 12 months ago

    switch (pattern) {
      case "improving":
        return 1 + timeDecay * 0.3; // Was 30% worse 12 months ago
      case "degrading":
        return 1 - timeDecay * 0.2; // Was 20% better 12 months ago
      case "stable":
      default:
        return 1 + (Math.random() - 0.5) * 0.1; // ±5% variation
    }
  }

  /**
   * Get base days of supply by system type
   */
  private getBaseDaysOfSupply(scopeId: string): number {
    const baseLevels: Record<string, number> = {
      "B-52H-Fleet": 45,
      "Propulsion System": 30, // Engine parts have lower stock levels
      "Flight Controls": 50,
      Avionics: 35, // Electronics have supply chain challenges
      Electrical: 55,
      "TF33 Engine": 25,
      "Primary Controls": 48,
      Navigation: 32,
    };

    return baseLevels[scopeId] || 40;
  }

  /**
   * Get seasonal variation for days of supply
   */
  private getSeasonalVariation(date: Date): number {
    const month = date.getMonth(); // 0-11

    // Higher consumption in summer (training season) and winter (harsh conditions)
    if (month >= 5 && month <= 7) return -5; // Summer: higher usage
    if (month >= 11 || month <= 1) return -3; // Winter: higher usage
    return 2; // Spring/Fall: lower usage
  }

  /**
   * Get base supplier OTD by system complexity
   */
  private getBaseSupplierOTD(scopeId: string): number {
    const baseOTD: Record<string, number> = {
      "B-52H-Fleet": 91.5,
      "Propulsion System": 88.5, // Engine suppliers under pressure
      "Flight Controls": 93.2, // Mature supply base
      Avionics: 87.8, // Electronics supply challenges
      Electrical: 92.1,
      "TF33 Engine": 86.5,
      "Primary Controls": 94.1,
      Navigation: 85.9,
    };

    return baseOTD[scopeId] || 90.0;
  }

  /**
   * Get supplier trend factor over time
   */
  private getSupplierTrendFactor(monthsAgo: number): number {
    // General supplier performance has been declining due to supply chain stress
    const monthlyDecline = 0.002; // 0.2% per month decline
    return Math.max(0.85, 1 - monthsAgo * monthlyDecline);
  }

  /**
   * Get base assistance requests by system complexity
   */
  private getBaseAssistanceRequests(scopeId: string): number {
    const baseRequests: Record<string, number> = {
      "B-52H-Fleet": 25,
      "Propulsion System": 12, // High complexity, more issues
      "Flight Controls": 8,
      Avionics: 10, // Rapid tech changes
      Electrical: 6,
      "TF33 Engine": 8,
      "Primary Controls": 5,
      Navigation: 7,
    };

    return baseRequests[scopeId] || 5;
  }

  /**
   * Generate pre-built chart data with realistic supply chain trends
   */
  private generateChartData(
    parts: PartData[],
    forecasts: RiskForecastData[],
    requests: AssistanceRequestData[]
  ): ChartData[] {
    const chartData: ChartData[] = [];
    const horizons: (90 | 180 | 270 | 365)[] = [90, 180, 270, 365];

    // Risk trend chart data (12 months of historical trends with supply chain context)
    horizons.forEach((horizon) => {
      const trendData = [];
      const currentDate = new Date();

      for (let month = 11; month >= 0; month--) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - month);

        const relevantForecasts = forecasts.filter(
          (f) => f.horizon_days === horizon
        );
        let avgRisk =
          relevantForecasts.reduce((sum, f) => sum + f.risk_score, 0) /
          relevantForecasts.length;

        // Apply supply chain trend factors
        const trendFactor = this.getRiskTrendFactor(month, horizon);
        avgRisk *= trendFactor;

        // Calculate parts at risk with trend
        const basePartsAtRisk = relevantForecasts.filter(
          (f) => f.risk_score > 70
        ).length;
        const partsAtRisk = Math.round(basePartsAtRisk * trendFactor);

        trendData.push({
          month: date.toISOString().substr(0, 7), // YYYY-MM
          avg_risk_score:
            Math.round(Math.max(0, Math.min(100, avgRisk)) * 100) / 100,
          parts_at_risk: Math.max(0, partsAtRisk),
          supply_chain_stress: this.calculateSupplyChainStress(month),
          confidence: this.calculateTrendConfidence(month),
        });
      }

      chartData.push({
        chart_type: "risk_trend",
        scope: "fleet",
        horizon_days: horizon,
        data_points: trendData,
      });
    });

    // Days of Supply distribution with realistic supply chain patterns
    horizons.forEach((horizon) => {
      const bins = [
        { range: "0-10", count: 0, risk_level: "critical" },
        { range: "11-20", count: 0, risk_level: "high" },
        { range: "21-30", count: 0, risk_level: "medium" },
        { range: "31-45", count: 0, risk_level: "moderate" },
        { range: "46-60", count: 0, risk_level: "low" },
        { range: "60+", count: 0, risk_level: "very_low" },
      ];

      parts.forEach((part) => {
        // DoS varies by part criticality and supply chain challenges
        let dos = this.calculateRealisticDoS(part);

        // Adjust for horizon (longer horizons = more uncertainty)
        dos += (Math.random() - 0.5) * (horizon / 90) * 10;
        dos = Math.max(0, dos);

        if (dos <= 10) bins[0].count++;
        else if (dos <= 20) bins[1].count++;
        else if (dos <= 30) bins[2].count++;
        else if (dos <= 45) bins[3].count++;
        else if (dos <= 60) bins[4].count++;
        else bins[5].count++;
      });

      chartData.push({
        chart_type: "dos_distribution",
        scope: "fleet",
        horizon_days: horizon,
        data_points: bins,
      });
    });

    // Assistance request trends with realistic patterns by type
    const requestTrends = [];
    for (let month = 11; month >= 0; month--) {
      const date = new Date();
      date.setMonth(date.getMonth() - month);
      const monthStr = date.toISOString().substr(0, 7);

      // Get actual requests for this month
      const monthRequests = requests.filter((r) => r.date.startsWith(monthStr));

      // Add seasonal and trend patterns
      const seasonalFactor = this.getSeasonalRequestFactor(date.getMonth());
      const trendFactor = this.getRequestTrendFactor(month);

      const baseDepot = monthRequests.filter((r) => r.type === "202").length;
      const baseField = monthRequests.filter((r) => r.type === "107").length;
      const baseDLA = monthRequests.filter((r) => r.type === "339").length;

      requestTrends.push({
        month: monthStr,
        depot_202: Math.round(baseDepot * seasonalFactor * trendFactor),
        field_107: Math.round(baseField * seasonalFactor * trendFactor),
        dla_339: Math.round(baseDLA * seasonalFactor * trendFactor),
        total_requests: Math.round(
          (baseDepot + baseField + baseDLA) * seasonalFactor * trendFactor
        ),
        urgency_score: this.calculateRequestUrgency(month),
      });
    }

    chartData.push({
      chart_type: "assistance_request_trend",
      scope: "fleet",
      horizon_days: 90, // Default horizon for assistance requests
      data_points: requestTrends,
    });

    // Supplier performance trend chart
    const supplierTrends = [];
    for (let month = 11; month >= 0; month--) {
      const date = new Date();
      date.setMonth(date.getMonth() - month);
      const monthStr = date.toISOString().substr(0, 7);

      supplierTrends.push({
        month: monthStr,
        avg_otd_percent: this.calculateHistoricalOTD(month),
        avg_pqdr_rate: this.calculateHistoricalPQDR(month),
        avg_lead_time: this.calculateHistoricalLeadTime(month),
        supply_chain_index: this.calculateSupplyChainIndex(month),
      });
    }

    chartData.push({
      chart_type: "supplier_performance_trend",
      scope: "fleet",
      horizon_days: 90,
      data_points: supplierTrends,
    });

    console.log(
      `✅ Generated ${chartData.length} comprehensive chart datasets with supply chain trends`
    );
    return chartData;
  }

  private getRiskTrendFactor(monthsAgo: number, horizon: number): number {
    // Risk has been generally increasing due to supply chain stress
    const baseIncrease = 1 + (monthsAgo / 12) * 0.15; // 15% worse 12 months ago

    // Longer horizons have more volatility
    const volatility = (horizon / 365) * 0.1;

    return baseIncrease + (Math.random() - 0.5) * volatility;
  }

  private calculateSupplyChainStress(monthsAgo: number): number {
    // Supply chain stress peaked 6-8 months ago, improving recently
    const stressCurve = Math.exp(-Math.pow(monthsAgo - 7, 2) / 8);
    return Math.round((50 + stressCurve * 40) * 10) / 10; // 50-90 scale
  }

  private calculateTrendConfidence(monthsAgo: number): number {
    // Confidence decreases with historical data age
    return Math.max(0.6, 0.95 - (monthsAgo / 12) * 0.35);
  }

  private calculateRealisticDoS(part: PartData): number {
    let baseDos = 40; // Default 40 days

    // Critical systems have lower stock levels
    if (part.assembly.includes("Engine")) baseDos = 25;
    else if (part.assembly.includes("Controls")) baseDos = 35;
    else if (part.assembly.includes("Avionics"))
      baseDos = 30; // Electronics shortage
    else if (part.assembly.includes("Electrical")) baseDos = 45;
    else if (part.assembly.includes("Environmental")) baseDos = 50;

    return baseDos + (Math.random() - 0.5) * 20; // ±10 days variation
  }

  private getSeasonalRequestFactor(month: number): number {
    // Higher requests during training seasons and harsh weather
    if (month >= 5 && month <= 7) return 1.2; // Summer training
    if (month >= 11 || month <= 1) return 1.15; // Winter conditions
    return 0.9; // Spring/Fall are calmer
  }

  private getRequestTrendFactor(monthsAgo: number): number {
    // Requests have been increasing due to aging fleet and supply issues
    return 1 + (monthsAgo / 12) * 0.25; // 25% more requests 12 months ago
  }

  private calculateRequestUrgency(monthsAgo: number): number {
    // Urgency has been increasing with supply chain stress
    const baseUrgency = 60 - monthsAgo * 2; // Increasing urgency
    return Math.max(40, Math.min(85, baseUrgency + Math.random() * 10));
  }

  private calculateHistoricalOTD(monthsAgo: number): number {
    // OTD has been declining due to supply chain pressures
    const baseOTD = 92 - monthsAgo * 0.5; // 0.5% decline per month
    return (
      Math.round(
        Math.max(85, Math.min(98, baseOTD + (Math.random() - 0.5) * 3)) * 10
      ) / 10
    );
  }

  private calculateHistoricalPQDR(monthsAgo: number): number {
    // PQDR rates have been increasing (quality under pressure)
    const basePQDR = 0.035 + monthsAgo * 0.002; // Increasing defect rate
    return (
      Math.round(
        Math.max(
          0.01,
          Math.min(0.08, basePQDR + (Math.random() - 0.5) * 0.01)
        ) * 1000
      ) / 1000
    );
  }

  private calculateHistoricalLeadTime(monthsAgo: number): number {
    // Lead times have been increasing
    const baseLeadTime = 55 + monthsAgo * 1.5; // 1.5 days increase per month
    return Math.round(
      Math.max(35, Math.min(85, baseLeadTime + (Math.random() - 0.5) * 10))
    );
  }

  private calculateSupplyChainIndex(monthsAgo: number): number {
    // Overall supply chain health index (0-100, higher is better)
    const baseIndex = 75 - monthsAgo * 1.2; // Declining health
    return Math.round(
      Math.max(50, Math.min(90, baseIndex + (Math.random() - 0.5) * 5))
    );
  }

  /**
   * Write all seed data to DynamoDB
   */
  async writeSeedData(seedData: AdvancedForecastSeedData): Promise<void> {
    console.log("💾 Writing advanced forecasting seed data to DynamoDB...");

    const items: Array<{ PutRequest: { Item: Record<string, any> } }> = [];

    // Write parts as NODE records
    seedData.parts.forEach((part) => {
      items.push({
        PutRequest: {
          Item: {
            pk: `NODE#${part.nsn}`,
            sk: "META",
            entity_type: "NODE",
            nsn: part.nsn,
            part_number: part.part_number,
            nomenclature: part.nomenclature,
            assembly: part.assembly,
            weapon_system: part.weapon_system,
            wbs_level: part.wbs_level,
            created_at: new Date().toISOString(),
            data_lineage: "advanced_forecast_seed",
          },
        },
      });
    });

    // Write suppliers
    seedData.suppliers.forEach((supplier) => {
      items.push({
        PutRequest: {
          Item: {
            pk: `SUPPLIER#${supplier.cage_code}`,
            sk: "META",
            entity_type: "SUPPLIER",
            supplier_cage: supplier.cage_code,
            supplier_name: supplier.supplier_name,
            supplier_otd_percent: supplier.otd_percent,
            otd_trend: supplier.otd_trend,
            pqdr_rate: supplier.pqdr_rate,
            lead_time_days: supplier.lead_time_days,
            lead_time_variance: supplier.lead_time_variance,
            created_at: new Date().toISOString(),
            gsi3pk: "SUPPLIER_PERF",
            gsi3sk: `${supplier.otd_percent}#${supplier.cage_code}`,
            data_lineage: "advanced_forecast_seed",
          },
        },
      });
    });

    // Write risk forecasts
    seedData.riskForecasts.forEach((forecast) => {
      items.push({
        PutRequest: {
          Item: {
            pk: `RISK_FORECAST#${forecast.nsn}#${forecast.horizon_days}`,
            sk: new Date().toISOString(),
            entity_type: "RISK_FORECAST",
            nsn: forecast.nsn,
            horizon_days: forecast.horizon_days,
            risk_score: forecast.risk_score,
            confidence: forecast.confidence,
            score_breakdown: forecast.score_breakdown,
            projected_micap_days: forecast.projected_micap_days,
            gsi2pk: `HORIZON_${forecast.horizon_days}`,
            gsi2sk: `${String(100 - forecast.risk_score).padStart(6, "0")}#${
              forecast.nsn
            }`, // For desc sort
            created_at: new Date().toISOString(),
            data_lineage: "advanced_forecast_seed",
          },
        },
      });
    });

    // Write assistance requests
    seedData.assistanceRequests.forEach((request) => {
      items.push({
        PutRequest: {
          Item: {
            pk: `ASSISTANCE_REQ#${request.type}#${request.nsn}`,
            sk: request.date,
            entity_type: "ASSISTANCE_REQ",
            request_id: request.request_id,
            assistance_req_type: request.type,
            nsn: request.nsn,
            date: request.date,
            summary: request.summary,
            status: request.status,
            linked_supplier: request.linked_supplier,
            gsi1pk: `ASSISTANCE_${request.type}`,
            gsi1sk: `${request.date}#${request.nsn}`,
            created_at: new Date().toISOString(),
            data_lineage: "advanced_forecast_seed",
          },
        },
      });
    });

    // Write BOM mappings
    seedData.bomMappings.forEach((mapping) => {
      items.push({
        PutRequest: {
          Item: {
            pk: `BOM_MAPPING#${mapping.nsn}`,
            sk: "META",
            entity_type: "BOM_MAPPING",
            nsn: mapping.nsn,
            is_bom_mapped: mapping.is_bom_mapped,
            is_orphan: mapping.is_orphan,
            parent_assemblies: mapping.parent_assemblies,
            child_parts: mapping.child_parts,
            alternate_parts: mapping.alternate_parts,
            gsi1pk: mapping.is_orphan ? "ORPHAN_PARTS" : "MAPPED_PARTS",
            gsi1sk: mapping.nsn,
            created_at: new Date().toISOString(),
            data_lineage: "advanced_forecast_seed",
          },
        },
      });
    });

    // Write inventory posture
    seedData.inventoryPosture.forEach((posture) => {
      items.push({
        PutRequest: {
          Item: {
            pk: `INVENTORY_POSTURE#${posture.nsn}`,
            sk: new Date().toISOString().split("T")[0], // Daily snapshots
            entity_type: "INVENTORY_POSTURE",
            nsn: posture.nsn,
            days_of_supply: posture.days_of_supply,
            dos_slope: posture.dos_slope,
            on_hand: posture.on_hand,
            due_in: posture.due_in,
            due_in_reliability: posture.due_in_reliability,
            created_at: new Date().toISOString(),
            data_lineage: "advanced_forecast_seed",
          },
        },
      });
    });

    // Write fleet rollups
    seedData.fleetRollups.forEach((rollup) => {
      items.push({
        PutRequest: {
          Item: {
            pk: `FLEET_ROLLUP#${rollup.scope}#${rollup.scope_id}`,
            sk: `${rollup.horizon_days}#${rollup.date}`,
            entity_type: "FLEET_ROLLUP",
            scope: rollup.scope,
            scope_id: rollup.scope_id,
            horizon_days: rollup.horizon_days,
            total_parts_at_risk: rollup.total_parts_at_risk,
            projected_micap_days: rollup.projected_micap_days,
            avg_days_of_supply: rollup.avg_days_of_supply,
            avg_supplier_otd: rollup.avg_supplier_otd,
            total_open_assistance_requests:
              rollup.total_open_assistance_requests,
            date: rollup.date,
            created_at: new Date().toISOString(),
            data_lineage: "advanced_forecast_seed",
          },
        },
      });
    });

    // Write chart data
    seedData.chartData.forEach((chart) => {
      items.push({
        PutRequest: {
          Item: {
            pk: `CHART_DATA#${chart.chart_type}#${chart.scope}`,
            sk: `${chart.horizon_days}`,
            entity_type: "CHART_DATA",
            chart_type: chart.chart_type,
            scope: chart.scope,
            horizon_days: chart.horizon_days,
            data_points: chart.data_points,
            created_at: new Date().toISOString(),
            data_lineage: "advanced_forecast_seed",
          },
        },
      });
    });

    // Write in batches of 25 (DynamoDB limit)
    const batches = [];
    for (let i = 0; i < items.length; i += 25) {
      batches.push(items.slice(i, i + 25));
    }

    console.log(
      `📦 Writing ${items.length} items in ${batches.length} batches...`
    );

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      const command = new BatchWriteCommand({
        RequestItems: {
          [this.tableName]: batch,
        },
      });

      try {
        await this.docClient.send(command);
        console.log(`✅ Batch ${i + 1}/${batches.length} written successfully`);
      } catch (error) {
        console.error(`❌ Failed to write batch ${i + 1}:`, error);
        throw error;
      }

      // Small delay to avoid throttling
      if (i < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log("🎉 Advanced forecasting seed data written successfully!");
  }

  /**
   * Generate and write all seed data
   */
  async generateAndWriteAll(): Promise<void> {
    const seedData = await this.generateSeedData();
    await this.writeSeedData(seedData);
  }
}
