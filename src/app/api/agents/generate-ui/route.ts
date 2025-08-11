import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { applicationId, agentConfig, userId } = await request.json();

    if (!applicationId || !agentConfig) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // For demo purposes, we'll generate a mock response
    // In production, you would invoke the actual Bedrock agent
    const mockResponse = generateMockUIComponents(applicationId);

    return NextResponse.json({
      success: true,
      components: mockResponse.components,
      layout: mockResponse.layout,
      theme: mockResponse.theme,
      metadata: {
        generatedAt: new Date().toISOString(),
        applicationId,
        agentModel: agentConfig.foundationModel,
        userId,
      },
    });
  } catch (error) {
    console.error("Error generating UI components:", error);
    return NextResponse.json(
      { error: "Failed to generate UI components" },
      { status: 500 }
    );
  }
}

function generateMockUIComponents(applicationId: string) {
  // Mock UI generation based on application type
  interface ComponentConfig {
    components: {
      type: string;
      title: string;
      widgets?: Array<{
        title: string;
        value: string;
        description: string;
      }>;
      chartType?: string;
      columns?: string[];
      sampleData?: Record<string, unknown>[];
      metadata?: {
        priority: string;
        category: string;
      };
    }[];
    layout: {
      style: string;
      columns: number;
      sections: string[];
    };
    theme: {
      primaryColor: string;
      style: string;
    };
  }

  const componentMap: Record<string, ComponentConfig> = {
    "materiel-insights": {
      components: [
        {
          type: "dashboard",
          title: "Supply Chain Analytics",
          widgets: [
            {
              title: "Inventory Value",
              value: "$2.4M",
              description: "Total inventory worth",
            },
            {
              title: "Stock Alerts",
              value: "23",
              description: "Items below threshold",
            },
            {
              title: "Supplier Rating",
              value: "4.2/5",
              description: "Average supplier score",
            },
            {
              title: "Cost Savings",
              value: "12%",
              description: "vs last quarter",
            },
          ],
          metadata: { priority: "high", category: "analytics" },
        },
        {
          type: "chart",
          title: "Cost Analysis by Category",
          chartType: "bar",
          metadata: { priority: "medium", category: "analytics" },
        },
        {
          type: "table",
          title: "Critical Parts Inventory",
          columns: [
            "Part Number",
            "Description",
            "Current Stock",
            "Min Level",
            "Supplier",
          ],
          sampleData: [
            {
              "Part Number": "P001-445",
              Description: "Engine Component A",
              "Current Stock": "12",
              "Min Level": "15",
              Supplier: "Aerospace Corp",
            },
            {
              "Part Number": "P002-778",
              Description: "Hydraulic Pump",
              "Current Stock": "8",
              "Min Level": "10",
              Supplier: "FluidTech Inc",
            },
          ],
          metadata: { priority: "high", category: "operations" },
        },
      ],
      layout: { style: "grid", columns: 2, sections: ["metrics", "analysis"] },
      theme: { primaryColor: "green", style: "detailed" },
    },
    dataops: {
      components: [
        {
          type: "dashboard",
          title: "Data Pipeline Status",
          widgets: [
            {
              title: "Active Pipelines",
              value: "24",
              description: "Currently running",
            },
            {
              title: "Data Quality Score",
              value: "96%",
              description: "Overall data health",
            },
            {
              title: "Processing Rate",
              value: "1.2TB/hr",
              description: "Current throughput",
            },
            {
              title: "Failed Jobs",
              value: "2",
              description: "Requiring attention",
            },
          ],
          metadata: { priority: "high", category: "monitoring" },
        },
        {
          type: "chart",
          title: "Data Volume Over Time",
          chartType: "line",
          metadata: { priority: "medium", category: "analytics" },
        },
      ],
      layout: { style: "flex", columns: 2, sections: ["status", "trends"] },
      theme: { primaryColor: "purple", style: "minimal" },
    },
  };

  return (
    componentMap[applicationId] || {
      components: [
        {
          type: "dashboard",
          title: "Application Dashboard",
          widgets: [
            {
              title: "Status",
              value: "Active",
              description: "System operational",
            },
            { title: "Users", value: "156", description: "Active users" },
          ],
          metadata: { priority: "medium", category: "general" },
        },
      ],
      layout: { style: "grid", columns: 2, sections: ["overview"] },
      theme: { primaryColor: "blue", style: "modern" },
    }
  );
}
