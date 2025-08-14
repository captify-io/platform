import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  ScanCommand,
  ScanCommandInput,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { requireUserSession, type UserSession } from "@/lib/services/session";

interface SupplierData {
  cage_code: string;
  supplier_name: string;
  otd_percent: number;
  otd_trend: "improving" | "stable" | "declining";
  lead_time_days: number;
  quality_score: number;
  risk_parts_count: number;
  total_parts_count: number;
}

const tableName = process.env.MI_DYNAMODB_TABLE || "mi-bom-graph";

// Three-tier AWS credential fallback
async function getDynamoDBClient(session: UserSession) {
  const region = process.env.REGION || process.env.AWS_REGION || "us-east-1";
  const accessKeyId = process.env.ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  // If we have explicit credentials (local development), use them
  if (accessKeyId && secretAccessKey) {
    return new DynamoDBClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  // Otherwise, use default credential provider (Amplify/IAM roles)
  return new DynamoDBClient({
    region,
  });
}

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await requireUserSession(request);
    const client = await getDynamoDBClient(session);

    // Parse query parameters
    const url = new URL(request.url);
    const riskThreshold = parseFloat(
      url.searchParams.get("risk_threshold") || "0.7"
    );
    const sortBy = url.searchParams.get("sort_by") || "otd_percent";
    const sortOrder = url.searchParams.get("sort_order") || "desc";

    // Scan for RISK_FORECAST records to get parts data
    const scanParams: ScanCommandInput = {
      TableName: tableName,
      FilterExpression: "begins_with(pk, :pkPrefix)",
      ExpressionAttributeValues: marshall({
        ":pkPrefix": "RISK_FORECAST#",
      }),
    };

    const result = await client.send(new ScanCommand(scanParams));
    const items = (result.Items || []).map((item) => unmarshall(item));

    // Generate supplier data with risk analysis
    const suppliers = generateSuppliersWithRiskData(items, riskThreshold);

    // Sort suppliers
    suppliers.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      
      switch (sortBy) {
        case 'cage_code':
          aVal = a.cage_code;
          bVal = b.cage_code;
          break;
        case 'supplier_name':
          aVal = a.supplier_name;
          bVal = b.supplier_name;
          break;
        case 'otd_percent':
          aVal = a.otd_percent;
          bVal = b.otd_percent;
          break;
        case 'lead_time_days':
          aVal = a.lead_time_days;
          bVal = b.lead_time_days;
          break;
        case 'quality_score':
          aVal = a.quality_score;
          bVal = b.quality_score;
          break;
        case 'risk_parts_count':
          aVal = a.risk_parts_count;
          bVal = b.risk_parts_count;
          break;
        case 'total_parts_count':
          aVal = a.total_parts_count;
          bVal = b.total_parts_count;
          break;
        default:
          aVal = a.otd_percent;
          bVal = b.otd_percent;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        if (sortOrder === "asc") {
          return aVal.localeCompare(bVal);
        } else {
          return bVal.localeCompare(aVal);
        }
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        if (sortOrder === "asc") {
          return aVal - bVal;
        } else {
          return bVal - aVal;
        }
      }
      
      return 0;
    });

    return NextResponse.json({
      suppliers,
      metadata: {
        total_suppliers: suppliers.length,
        risk_threshold: riskThreshold,
        sort_by: sortBy,
        sort_order: sortOrder,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Advanced forecast suppliers API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch supplier data" },
      { status: 500 }
    );
  }
}

function generateSuppliersWithRiskData(
  forecastItems: Array<Record<string, unknown>>,
  riskThreshold: number
): SupplierData[] {
  const suppliersData = [
    {
      cage_code: "77068",
      name: "Pratt & Whitney",
      base_otd: 87,
      base_lead_time: 45,
    },
    {
      cage_code: "07482",
      name: "General Electric",
      base_otd: 92,
      base_lead_time: 38,
    },
    { cage_code: "81205", name: "Boeing", base_otd: 89, base_lead_time: 52 },
    {
      cage_code: "98897",
      name: "Lockheed Martin",
      base_otd: 91,
      base_lead_time: 41,
    },
    {
      cage_code: "96214",
      name: "Raytheon Technologies",
      base_otd: 85,
      base_lead_time: 48,
    },
    { cage_code: "54X10", name: "Honeywell", base_otd: 88, base_lead_time: 44 },
    {
      cage_code: "15280",
      name: "Rolls-Royce",
      base_otd: 86,
      base_lead_time: 55,
    },
    { cage_code: "83298", name: "Safran", base_otd: 90, base_lead_time: 42 },
  ];

  return suppliersData.map((supplier) => {
    // Simulate parts distribution for this supplier
    const totalParts = Math.round(
      forecastItems.length * (0.08 + Math.random() * 0.15)
    );
    const riskParts = forecastItems.filter((item) => {
      const riskScore = item.risk_score as number | undefined;
      return (riskScore || 0) >= riskThreshold;
    }).length;
    const supplierRiskParts = Math.round(
      riskParts * (0.05 + Math.random() * 0.2)
    );

    // Calculate performance metrics with some variance
    const variance = (Math.random() - 0.5) * 0.1;
    const otdPercent = Math.max(
      70,
      Math.min(100, supplier.base_otd + variance * 10)
    );
    const leadTimeDays = Math.max(
      20,
      Math.round(supplier.base_lead_time + variance * 15)
    );

    // Quality score influenced by OTD and risk parts ratio
    const riskRatio = totalParts > 0 ? supplierRiskParts / totalParts : 0;
    const qualityScore = Math.max(
      1,
      Math.min(5, (otdPercent / 100) * 5 * (1 - riskRatio * 0.3))
    );

    // Determine trend based on performance
    let otdTrend: "improving" | "stable" | "declining";
    if (otdPercent > supplier.base_otd + 2) {
      otdTrend = "improving";
    } else if (otdPercent < supplier.base_otd - 2) {
      otdTrend = "declining";
    } else {
      otdTrend = "stable";
    }

    return {
      cage_code: supplier.cage_code,
      supplier_name: supplier.name,
      otd_percent: Math.round(otdPercent * 100) / 100,
      otd_trend: otdTrend,
      lead_time_days: leadTimeDays,
      quality_score: Math.round(qualityScore * 100) / 100,
      risk_parts_count: supplierRiskParts,
      total_parts_count: totalParts,
    };
  });
}
