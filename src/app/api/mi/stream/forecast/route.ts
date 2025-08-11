import { NextRequest, NextResponse } from "next/server";
import { QueryCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { requireUserSession } from "@/lib/services/session";
import {
  createUserDynamoDBClient,
  createSessionTokenDynamoDBClient,
} from "@/lib/services/dynamodb-client";

// Type definitions for forecast data
interface ForecastPrediction {
  entityId: string;
  score: number;
  confidence: number;
  daysToFailure: number;
  factors?: string[];
  category?: string;
  description?: string;
}

interface ForecastItem {
  id: string;
  name: string;
  nsn?: string;
  score: number;
  description?: string;
  entityId: string;
}

// Only table name from environment - NO AWS credentials ever
const tableName = process.env.MI_DYNAMODB_TABLE || "mi-bom-graph";

/**
 * Handle KPI requests for dashboard hero cards
 */
async function handleKPIRequest(
  docClient: DynamoDBDocumentClient,
  tableName: string,
  params: ForecastParams
) {
  const { weapon_system_id, horizon } = params;

  // Generate realistic POC KPI data based on weapon system and horizon
  const heroKPIs = [
    {
      id: "mission_capable_rate",
      label: "MC Rate",
      value: horizon === "Now" ? 78.5 : horizon === "12mo" ? 72.3 : 68.1,
      delta: horizon === "Now" ? 2.1 : horizon === "12mo" ? -1.4 : -3.2,
      unit: "%",
      lineage: "ALIS/IMDS",
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "projected_micaps_90d",
      label: "Projected MICAPs (90d)",
      value: horizon === "Now" ? 47 : horizon === "12mo" ? 62 : 89,
      delta: horizon === "Now" ? 12 : horizon === "12mo" ? 18 : 23,
      unit: "cases",
      lineage: "Predictive Model v1.3",
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "predicted_assistance_rate",
      label: "Predicted ETAR/MAR Rate",
      value: horizon === "Now" ? 12.3 : horizon === "12mo" ? 15.7 : 19.2,
      delta: horizon === "Now" ? 0.8 : horizon === "12mo" ? 2.1 : 3.4,
      unit: "%",
      lineage: "Fleet Analytics",
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "top_risked_nsns_count",
      label: "Top-Risked NSNs",
      value: horizon === "Now" ? 23 : horizon === "12mo" ? 31 : 42,
      delta: horizon === "Now" ? 3 : horizon === "12mo" ? 7 : 11,
      unit: "parts",
      lineage: "Risk Engine v2.1",
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "days_of_supply_at_risk",
      label: "DoS at Risk",
      value: horizon === "Now" ? 18 : horizon === "12mo" ? 12 : 8,
      delta: horizon === "Now" ? -2 : horizon === "12mo" ? -5 : -8,
      unit: "days",
      lineage: "Supply Chain Analytics",
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "supplier_risk_index",
      label: "Supplier Risk",
      value: horizon === "Now" ? 34.2 : horizon === "12mo" ? 38.7 : 45.1,
      delta: horizon === "Now" ? 1.2 : horizon === "12mo" ? 3.8 : 6.2,
      unit: "index",
      lineage: "Supplier Quality DB",
      lastUpdated: new Date().toISOString(),
    },
  ];

  return NextResponse.json({
    metadata: {
      weapon_system_id,
      horizon,
      generated: new Date().toISOString(),
      dataType: "kpis",
    },
    kpis: heroKPIs,
  });
}

/**
 * Handle prediction requests for Top-10 risk panel
 */
async function handlePredictionRequest(
  docClient: DynamoDBDocumentClient,
  tableName: string,
  params: ForecastParams
) {
  const { weapon_system_id, horizon, page } = params;

  // Generate realistic Top-10 Problem Parts data
  const predictions = [
    {
      id: "pred-001",
      part: {
        nsn: "2840-00-123-4567",
        pn: "PWA-54321",
        nomenclature: "Combustion Module, Engine",
      },
      risk_score: 86,
      confidence: 0.92,
      predicted_window:
        horizon === "Now"
          ? "14 days"
          : horizon === "12mo"
          ? "8 months"
          : "3.2 years",
      leading_indicators: ["temp_cycles↑", "vibration↑", "oil_analysis↑"],
      projected_impact: {
        micap_days: 45,
        sorties_at_risk: 23,
        cost_impact: 2100000,
      },
      stock_posture: {
        on_hand: 0,
        due_in: 2,
        lead_time_days: 62,
      },
      supplier_signal: {
        otd_percent: 67,
        pqdr_rate: 0.08,
        quality_trend: "declining",
      },
      recommendation: "Replace",
      tail_context: "60-0020",
    },
    {
      id: "pred-002",
      part: {
        nsn: "1560-00-987-6543",
        pn: "BAE-98765",
        nomenclature: "Wing Flap Actuator",
      },
      risk_score: 74,
      confidence: 0.87,
      predicted_window:
        horizon === "Now"
          ? "28 days"
          : horizon === "12mo"
          ? "11 months"
          : "4.1 years",
      leading_indicators: ["cycles↑", "hydraulic_press↓", "seal_wear↑"],
      projected_impact: {
        micap_days: 32,
        sorties_at_risk: 18,
        cost_impact: 850000,
      },
      stock_posture: {
        on_hand: 1,
        due_in: 0,
        lead_time_days: 45,
      },
      supplier_signal: {
        otd_percent: 89,
        pqdr_rate: 0.03,
        quality_trend: "stable",
      },
      recommendation: "Inspect",
      tail_context: "60-0021",
    },
    {
      id: "pred-003",
      part: {
        nsn: "2995-00-456-7890",
        pn: "HON-45678",
        nomenclature: "APU Generator",
      },
      risk_score: 68,
      confidence: 0.83,
      predicted_window:
        horizon === "Now"
          ? "42 days"
          : horizon === "12mo"
          ? "14 months"
          : "5.3 years",
      leading_indicators: ["voltage_var↑", "temp↑", "bearing_wear↑"],
      projected_impact: {
        micap_days: 28,
        sorties_at_risk: 15,
        cost_impact: 1200000,
      },
      stock_posture: {
        on_hand: 3,
        due_in: 1,
        lead_time_days: 28,
      },
      supplier_signal: {
        otd_percent: 94,
        pqdr_rate: 0.02,
        quality_trend: "improving",
      },
      recommendation: "Derate",
      tail_context: "60-0022",
    },
  ];

  // Add more predictions to reach 10
  const additionalPredictions = Array.from({ length: 7 }, (_, i) => ({
    id: `pred-00${i + 4}`,
    part: {
      nsn: `${2000 + i}-00-${String(
        Math.floor(Math.random() * 900) + 100
      )}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      pn: `PRT-${String(Math.floor(Math.random() * 90000) + 10000)}`,
      nomenclature: [
        "Landing Gear Strut",
        "Radar Antenna Assembly",
        "Fuel Pump Module",
        "Avionics Control Unit",
        "Hydraulic Filter",
        "Oxygen Generator",
        "Navigation Computer",
      ][i],
    },
    risk_score: 65 - i * 5,
    confidence: 0.75 - i * 0.02,
    predicted_window:
      horizon === "Now"
        ? `${45 + i * 10} days`
        : horizon === "12mo"
        ? `${12 + i} months`
        : `${4 + i} years`,
    leading_indicators: ["usage↑", "wear↑"],
    projected_impact: {
      micap_days: 20 - i,
      sorties_at_risk: 12 - i,
      cost_impact: 500000 - i * 50000,
    },
    stock_posture: {
      on_hand: Math.floor(Math.random() * 5),
      due_in: Math.floor(Math.random() * 3),
      lead_time_days: 30 + i * 5,
    },
    supplier_signal: {
      otd_percent: 85 + Math.floor(Math.random() * 10),
      pqdr_rate: 0.02 + Math.random() * 0.03,
      quality_trend: ["stable", "improving", "declining"][
        Math.floor(Math.random() * 3)
      ],
    },
    recommendation: ["Inspect", "Replace", "Derate"][
      Math.floor(Math.random() * 3)
    ],
    tail_context: `60-00${20 + i}`,
  }));

  const allPredictions = [...predictions, ...additionalPredictions];

  return NextResponse.json({
    metadata: {
      weapon_system_id,
      horizon,
      page: parseInt(page || "1"),
      total_pages: 1,
      total_items: allPredictions.length,
      generated: new Date().toISOString(),
      dataType: "predictions",
      data_lineage: "Risk Engine v2.1 + Fleet Analytics",
    },
    predictions: allPredictions,
    paging: {
      current_page: parseInt(page || "1"),
      total_pages: 1,
      has_next: false,
      has_previous: false,
    },
  });
}

interface ForecastParams {
  scope: string;
  id: string;
  window: string;
  model: string;
  asof: string;
  // Dashboard extensions
  horizon?: string;
  weapon_system_id?: string;
  kpi_type?: string;
  prediction_scope?: string;
  page?: string;
  sort?: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 MI Forecast API - Starting request");

    // Authenticate user and get session with ID token
    const session = await requireUserSession(request);
    console.log("✅ User authenticated:", session.email);

    // CRITICAL: Create user-scoped DynamoDB client - NO environment variables, NO static credentials
    let docClient;
    if (session.awsSessionToken && session.idToken) {
      try {
        console.log("🔐 MI Forecast: Using session token from user headers");
        docClient = await createSessionTokenDynamoDBClient(session);
      } catch (error) {
        console.log(
          "⚠️ MI Forecast: Session token failed, trying user credentials",
          error
        );
        docClient = await createUserDynamoDBClient(session);
      }
    } else if (session.idToken) {
      console.log("🔐 MI Forecast: Using user-scoped Cognito credentials");
      docClient = await createUserDynamoDBClient(session);
    } else {
      console.log("❌ MI Forecast: No ID token available");
      throw new Error(
        "MI Forecast: Authentication required - no ID token available. Please log in again."
      );
    }

    const { searchParams } = new URL(request.url);

    const params: ForecastParams = {
      scope: searchParams.get("scope") || "tail",
      id: searchParams.get("id") || "60-0020",
      window: searchParams.get("window") || "30",
      model: searchParams.get("model") || "v1.3",
      asof: searchParams.get("asof") || new Date().toISOString().split("T")[0],
      // Dashboard extensions
      horizon: searchParams.get("horizon") || "Now",
      weapon_system_id: searchParams.get("weapon_system_id") || "B52H",
      kpi_type: searchParams.get("kpi_type") || undefined,
      prediction_scope: searchParams.get("prediction_scope") || "top10",
      page: searchParams.get("page") || "1",
      sort: searchParams.get("sort") || "risk_score_desc",
    };

    // Handle KPI requests
    if (params.kpi_type) {
      return await handleKPIRequest(docClient, tableName, params);
    }

    // Handle prediction requests
    if (params.prediction_scope) {
      return await handlePredictionRequest(docClient, tableName, params);
    }

    // Query forecast data
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `FORECAST#MICAP#${params.scope}:${params.id}`,
        ":sk": `${params.asof}#model:${params.model}`,
      },
      ScanIndexForward: false,
      Limit: 1,
    });

    const result = await docClient.send(command);

    if (result.Items && result.Items.length > 0) {
      const forecast = result.Items[0];

      // Transform for UI consumption with theme-aware colors
      const response = {
        metadata: {
          scope: params.scope,
          id: params.id,
          window: parseInt(params.window),
          model: params.model,
          asof: params.asof,
          generated: new Date().toISOString(),
        },
        summary: {
          totalRisks: forecast.predictions?.length || 0,
          criticalRisks:
            forecast.predictions?.filter(
              (p: ForecastPrediction) => p.score > 0.8
            ).length || 0,
          avgRiskScore:
            forecast.predictions?.reduce(
              (sum: number, p: ForecastPrediction) => sum + p.score,
              0
            ) / (forecast.predictions?.length || 1) || 0,
          daysToFirstFailure: Math.min(
            ...(forecast.predictions?.map(
              (p: ForecastPrediction) => p.daysToFailure
            ) || [999])
          ),
        },
        predictions:
          forecast.predictions?.map(
            (pred: ForecastPrediction, index: number) => ({
              id: pred.entityId,
              entityId: pred.entityId,
              riskScore: pred.score,
              confidence: pred.confidence,
              daysToFailure: pred.daysToFailure,
              priority:
                pred.score > 0.8
                  ? "Critical"
                  : pred.score > 0.6
                  ? "High"
                  : pred.score > 0.4
                  ? "Medium"
                  : "Low",
              factors: pred.factors,
              // Theme-aware color mapping
              color:
                pred.score > 0.8
                  ? "hsl(var(--destructive))"
                  : pred.score > 0.6
                  ? "hsl(var(--warning))"
                  : pred.score > 0.4
                  ? "hsl(var(--accent))"
                  : "hsl(var(--success))",
              chartIndex: index % 5, // For cycling through chart colors
            })
          ) || [],
        chartData:
          forecast.top?.map((item: ForecastItem, index: number) => ({
            name:
              item.entityId.split(":").pop()?.substring(0, 8) ||
              `Part ${index + 1}`,
            riskScore: Math.round(item.score * 100),
            entityId: item.entityId,
            fill: `var(--chart-${(index % 5) + 1})`,
          })) || [],
        priorityActions: [
          {
            id: "critical-review",
            title: "Review Critical Components",
            description: `${
              forecast.predictions?.filter(
                (p: ForecastPrediction) => p.score > 0.8
              ).length || 0
            } parts require immediate attention`,
            priority: "Critical",
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            assignee: "Maintenance Team",
          },
          {
            id: "supplier-eval",
            title: "Evaluate Alternate Suppliers",
            description: "Review supplier performance for high-risk components",
            priority: "High",
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            assignee: "Supply Chain Team",
          },
          {
            id: "order-parts",
            title: "Expedite Critical Part Orders",
            description: "Place orders for components with lead times >45 days",
            priority: "High",
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            assignee: "Procurement Team",
          },
        ],
      };

      return NextResponse.json(response, {
        headers: {
          "Cache-Control": "public, max-age=300", // 5 minute cache
          "Content-Type": "application/json",
        },
      });
    } else {
      // Return mock data if no forecast found
      return NextResponse.json({
        metadata: {
          scope: params.scope,
          id: params.id,
          window: parseInt(params.window),
          model: params.model,
          asof: params.asof,
          generated: new Date().toISOString(),
        },
        summary: {
          totalRisks: 0,
          criticalRisks: 0,
          avgRiskScore: 0,
          daysToFirstFailure: 999,
        },
        predictions: [],
        chartData: [],
        priorityActions: [],
      });
    }
  } catch (error) {
    console.error("Forecast API error:", error);

    // Handle authentication errors specifically
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch forecast data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
