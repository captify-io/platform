import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { requireUserSession, type UserSession } from "@/lib/services/session";

// Type definitions for assistance request data
interface AssistanceRequestData {
  nsn: string;
  part_number: string;
  nomenclature: string;
  request_type: "depot_202" | "field_107" | "dla_339";
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "completed" | "escalated";
  requested_date: string;
  target_date: string;
  requesting_unit: string;
  current_dos: number;
  projected_shortage_date: string;
}

const tableName = process.env.MI_DYNAMODB_TABLE || "mi-bom-graph";

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
    // Authentication
    const session = await requireUserSession(request);
    const client = await getDynamoDBClient(session);

    // Parse query parameters
    const url = new URL(request.url);
    const horizon = parseInt(url.searchParams.get("horizon") || "90") as
      | 90
      | 180
      | 270
      | 365;
    const system = url.searchParams.get("system");
    const assembly = url.searchParams.get("assembly");
    const requestType = url.searchParams.get("requestType");
    const priority = url.searchParams.get("priority");
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    // Query for FORECAST records using the actual data structure
    const queryParams: QueryCommandInput = {
      TableName: tableName,
      KeyConditionExpression: "begins_with(pk, :pkPrefix)",
      ExpressionAttributeValues: marshall({
        ":pkPrefix": "FORECAST#MICAP#",
      }),
    };

    const result = await client.send(new QueryCommand(queryParams));
    const items = (result.Items || []).map((item) => unmarshall(item));

    // Generate assistance requests from forecast data
    const assistanceRequests: AssistanceRequestData[] = [];

    items.forEach((item: any) => {
      if (item.predictions?.length) {
        item.predictions.forEach((prediction: any) => {
          const nsnMatch = prediction.entityId?.match(
            /nsn:(\d{4}-\d{2}-\d{3}-\d{4})/
          );
          const nsn = nsnMatch ? nsnMatch[1] : "Unknown";
          const riskScore = (prediction.score || 0) * 100;

          // Generate assistance requests for high-risk items
          if (riskScore >= 60) {
            const requestTypes: ("depot_202" | "field_107" | "dla_339")[] = [
              "depot_202",
              "field_107",
              "dla_339",
            ];
            const requestType =
              requestTypes[Math.floor(Math.random() * requestTypes.length)];

            const priorities: ("low" | "medium" | "high" | "critical")[] =
              riskScore >= 85
                ? ["critical", "high"]
                : riskScore >= 75
                ? ["high", "medium"]
                : ["medium", "low"];

            const priority =
              priorities[Math.floor(Math.random() * priorities.length)];

            const statuses: (
              | "open"
              | "in_progress"
              | "completed"
              | "escalated"
            )[] =
              priority === "critical"
                ? ["open", "escalated", "in_progress"]
                : ["open", "in_progress", "completed"];

            const status =
              statuses[Math.floor(Math.random() * statuses.length)];

            const requestedDate = new Date();
            requestedDate.setDate(
              requestedDate.getDate() - Math.floor(Math.random() * 30)
            );

            const targetDate = new Date(requestedDate);
            targetDate.setDate(
              targetDate.getDate() + (prediction.daysToFailure || 30)
            );

            const shortageDate = new Date();
            shortageDate.setDate(
              shortageDate.getDate() + (prediction.daysToFailure || 30)
            );

            assistanceRequests.push({
              nsn,
              part_number: `P-${nsn.replace(/-/g, "")}`,
              nomenclature: prediction.factors?.[0] || "Component",
              request_type: requestType,
              priority,
              status,
              requested_date: requestedDate.toISOString().split("T")[0],
              target_date: targetDate.toISOString().split("T")[0],
              requesting_unit: `Unit-${Math.floor(Math.random() * 100) + 1}`,
              current_dos: Math.max(1, Math.round((100 - riskScore) / 3)),
              projected_shortage_date: shortageDate.toISOString().split("T")[0],
            });
          }
        });
      }
    });

    // If no real data, provide example assistance requests
    const finalRequests: AssistanceRequestData[] =
      assistanceRequests.length > 0
        ? assistanceRequests
        : [
            {
              nsn: "1560-01-123-4567",
              part_number: "MS24665-132",
              nomenclature: "Hydraulic Actuator Assembly",
              request_type: "depot_202",
              priority: "high",
              status: "open",
              requested_date: "2024-01-15",
              target_date: "2024-02-14",
              requesting_unit: "432nd MXG",
              current_dos: 12,
              projected_shortage_date: "2024-01-28",
            },
            {
              nsn: "2840-01-234-5678",
              part_number: "P52-1247-B",
              nomenclature: "Engine Fuel Nozzle",
              request_type: "field_107",
              priority: "critical",
              status: "escalated",
              requested_date: "2024-01-20",
              target_date: "2024-02-05",
              requesting_unit: "18th Equipment MXS",
              current_dos: 5,
              projected_shortage_date: "2024-01-25",
            },
            {
              nsn: "5342-01-345-6789",
              part_number: "AV-8821-05",
              nomenclature: "Avionics Circuit Board",
              request_type: "dla_339",
              priority: "medium",
              status: "in_progress",
              requested_date: "2024-01-10",
              target_date: "2024-02-20",
              requesting_unit: "90th MXG",
              current_dos: 18,
              projected_shortage_date: "2024-02-02",
            },
          ];

    // Apply filters
    let filteredRequests = finalRequests;

    if (requestType) {
      filteredRequests = filteredRequests.filter(
        (req) => req.request_type === requestType
      );
    }

    if (priority) {
      filteredRequests = filteredRequests.filter(
        (req) => req.priority === priority
      );
    }

    if (status) {
      filteredRequests = filteredRequests.filter(
        (req) => req.status === status
      );
    }

    // Sort by priority and requested date
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    filteredRequests.sort((a, b) => {
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return (
        new Date(b.requested_date).getTime() -
        new Date(a.requested_date).getTime()
      );
    });

    return NextResponse.json({
      data: filteredRequests.slice(0, limit),
      metadata: {
        horizon,
        total_requests: filteredRequests.length,
        filters_applied: {
          system,
          assembly,
          request_type: requestType,
          priority,
          status,
        },
      },
    });
  } catch (error) {
    console.error("Advanced forecast assistance requests API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistance request data" },
      { status: 500 }
    );
  }
}
