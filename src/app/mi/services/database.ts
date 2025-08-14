/**
 * Material Insights (MI) Database Service
 *
 * Updated to use static ACCESS_KEY credentials for workbench operations
 */

import {
  DynamoDBClient,
  QueryCommand,
  QueryCommandInput,
  GetItemCommand,
  GetItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import type { UserSession } from "@/lib/services/session";
import type { WorkbenchIssue } from "@/types/mi";

// Hardcoded table name
const tableName = "mi-bom-graph";

/**
 * Get DynamoDB client with static credentials (for workbench operations)
 */
async function getDynamoDBClient(
  session: UserSession
): Promise<DynamoDBClient> {
  // For now, use static credentials - TODO: implement full three-tier system
  return new DynamoDBClient({
    region: process.env.REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
  });
}

/**
 * Forecast Database Operations
 */
export class ForecastDatabase {
  static async getForecastData(
    session: UserSession,
    params: {
      scope: string;
      id: string;
      model: string;
      asof: string;
    }
  ) {
    const docClient = await getDynamoDBClient(session);

    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: marshall({
        ":pk": `FORECAST#MICAP#${params.scope}:${params.id}`,
        ":sk": `${params.asof}#model:${params.model}`,
      }),
      ScanIndexForward: false,
      Limit: 1,
    });

    const result = await docClient.send(command);
    return result.Items?.[0] ? unmarshall(result.Items[0]) : null;
  }
}

/**
 * BOM Database Operations
 */
export class BOMDatabase {
  static async getRootNode(session: UserSession, nodeId: string) {
    const docClient = await getDynamoDBClient(session);

    // Ensure nodeId has NODE# prefix
    const pk = nodeId.startsWith("NODE#") ? nodeId : `NODE#${nodeId}`;

    const command = new GetItemCommand({
      TableName: tableName,
      Key: marshall({
        pk: pk,
        sk: "META",
      }),
    });

    const result = await docClient.send(command);
    return result.Item ? unmarshall(result.Item) : null;
  }

  static async getChildren(session: UserSession, parentId: string) {
    const docClient = await getDynamoDBClient(session);

    // Ensure parentId has NODE# prefix
    const pk = parentId.startsWith("NODE#") ? parentId : `NODE#${parentId}`;

    const command = new QueryCommand({
      TableName: tableName,
      IndexName: "GSI1",
      KeyConditionExpression:
        "gsi1pk = :parentId AND begins_with(gsi1sk, :childPrefix)",
      ExpressionAttributeValues: marshall({
        ":parentId": pk,
        ":childPrefix": "CHILD#",
      }),
    });

    const result = await docClient.send(command);
    return result.Items ? result.Items.map(item => unmarshall(item)) : [];
  }

  static async getSuppliers(session: UserSession, nodeId: string) {
    const docClient = await getDynamoDBClient(session);

    // Ensure nodeId has NODE# prefix
    const pk = nodeId.startsWith("NODE#") ? nodeId : `NODE#${nodeId}`;

    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: marshall({
        ":pk": pk,
        ":sk": "SUPPLY#",
      }),
    });

    const result = await docClient.send(command);
    return result.Items ? result.Items.map(item => unmarshall(item)) : [];
  }
}

/**
 * Workbench Database Operations
 */
export class WorkbenchDatabase {
  static async getIssues(
    session: UserSession,
    filters: {
      status?: string;
      priority?: string;
      assignee?: string;
    } = {}
  ) {
    const docClient = await getDynamoDBClient(session);

    // Test database connectivity first
    try {
      const testCommand = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: marshall({
          ":pk": "TEST#CONNECTION",
        }),
        Limit: 1,
      });
      
      await docClient.send(testCommand);
      console.log("✅ Database connection successful for WorkbenchDatabase");
    } catch (error) {
      console.log("⚠️ Database connection test completed (expected for mock data)");
      // Don't throw error for connection test, as we're using mock data
    }

    // Generate mock workbench issues based on forecast data patterns
    const mockIssues: WorkbenchIssue[] = [
      {
        pk: "ISSUE#WB001",
        sk: "META",
        type: "ISSUE",
        title: "B-52H Hydraulic System Analysis Required",
        status: "Analyze",
        criticality: "Critical",
        links: {
          nodes: ["NODE#1560-01-123-4567"],
          tails: ["TAIL#61-0001"],
          suppliers: ["SUPPLIER#123ABC"]
        },
        risk: {
          micap30d: 95,
          missionImpact: 90,
          financialImpact: 500000
        },
        streamIds: ["stream-hydraulics-001"],
        aiRecommendation: "Immediate analysis required for hydraulic actuator degradation patterns",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        pk: "ISSUE#WB002", 
        sk: "META",
        type: "ISSUE",
        title: "Engine Fuel Nozzle Validation Required",
        status: "Validate Solution",
        criticality: "High",
        links: {
          nodes: ["NODE#2840-01-234-5678"],
          tails: ["TAIL#61-0002"],
          suppliers: ["SUPPLIER#456DEF"]
        },
        risk: {
          micap30d: 75,
          missionImpact: 80,
          financialImpact: 300000
        },
        streamIds: ["stream-engine-002"],
        aiRecommendation: "Field validation needed for new fuel nozzle solution implementation",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        pk: "ISSUE#WB003",
        sk: "META", 
        type: "ISSUE",
        title: "Avionics Circuit Board Qualification",
        status: "Qualify",
        criticality: "Medium",
        links: {
          nodes: ["NODE#5342-01-345-6789"],
          tails: ["TAIL#61-0003"],
          suppliers: ["SUPPLIER#789GHI"]
        },
        risk: {
          micap30d: 60,
          missionImpact: 65,
          financialImpact: 150000
        },
        streamIds: ["stream-avionics-003"],
        aiRecommendation: "New circuit board design requires qualification testing before field deployment",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        pk: "ISSUE#WB004",
        sk: "META",
        type: "ISSUE", 
        title: "Landing Gear Component Field Testing",
        status: "Field",
        criticality: "Medium",
        links: {
          nodes: ["NODE#1620-01-456-7890"],
          tails: ["TAIL#61-0004"],
          suppliers: ["SUPPLIER#012JKL"]
        },
        risk: {
          micap30d: 45,
          missionImpact: 50,
          financialImpact: 75000
        },
        streamIds: ["stream-landing-004"],
        aiRecommendation: "Field testing of upgraded landing gear components in operational environment",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        pk: "ISSUE#WB005",
        sk: "META",
        type: "ISSUE",
        title: "Navigation System Performance Monitoring",
        status: "Monitor", 
        criticality: "Low",
        links: {
          nodes: ["NODE#5826-01-567-8901"],
          tails: ["TAIL#61-0005"],
          suppliers: ["SUPPLIER#345MNO"]
        },
        risk: {
          micap30d: 25,
          missionImpact: 30,
          financialImpact: 25000
        },
        streamIds: ["stream-navigation-005"],
        aiRecommendation: "Continuous monitoring of navigation system performance metrics and trends",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Apply filters
    let filteredIssues = mockIssues;

    if (filters.status) {
      filteredIssues = filteredIssues.filter(
        (item: WorkbenchIssue) => item.status === filters.status
      );
    }

    if (filters.priority) {
      filteredIssues = filteredIssues.filter(
        (item: WorkbenchIssue) => item.criticality === filters.priority
      );
    }

    if (filters.assignee) {
      // Filter by streamIds or AI recommendation since assignee field doesn't exist
      filteredIssues = filteredIssues.filter(
        (item: WorkbenchIssue) => 
          item.aiRecommendation?.toLowerCase().includes(filters.assignee?.toLowerCase() || "") ||
          item.streamIds.some(id => id.includes(filters.assignee || ""))
      );
    }

    console.log(`✅ WorkbenchDatabase.getIssues returning ${filteredIssues.length} issues`);
    return filteredIssues;
  }
}

/**
 * Generic MI Database Utilities
 */
export class MIDatabase {
  /**
   * Test database connectivity and permissions
   */
  static async testConnection(session: UserSession): Promise<boolean> {
    try {
      const docClient = await getDynamoDBClient(session);

      // Simple query to test access
      const command = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: marshall({
          ":pk": "TEST#CONNECTION",
        }),
        Limit: 1,
      });

      await docClient.send(command);
      return true;
    } catch (error) {
      console.error("Database connection test failed:", error);
      return false;
    }
  }

  /**
   * Get table statistics
   */
  static async getTableStats(session: UserSession) {
    try {
      const docClient = await getDynamoDBClient(session);

      // Use Query operations instead of Scan to match IAM permissions
      // Note: This is a simplified version that may not give exact counts
      // but will work with the current IAM policy

      console.log(
        "📊 Getting table stats using Query operations (IAM-compliant)"
      );

      // Try to get some sample data using Query operations
      const testQueries = [
        // Test for forecast data
        {
          KeyConditionExpression: "pk = :pk",
          ExpressionAttributeValues: marshall({ ":pk": "FORECAST#MICAP#test" }),
        },
        // Test for node data
        {
          KeyConditionExpression: "pk = :pk",
          ExpressionAttributeValues: marshall({ ":pk": "NODE#test" }),
        },
        // Test for issue data
        {
          KeyConditionExpression: "pk = :pk",
          ExpressionAttributeValues: marshall({ ":pk": "ISSUE#test" }),
        },
      ];

      const results = await Promise.allSettled(
        testQueries.map((query) =>
          docClient.send(
            new QueryCommand({
              TableName: tableName,
              ...query,
              Limit: 1,
            })
          )
        )
      );

      // Return simplified stats based on query success
      return {
        forecasts: results[0].status === "fulfilled" ? 1 : 0,
        nodes: results[1].status === "fulfilled" ? 1 : 0,
        issues: results[2].status === "fulfilled" ? 1 : 0,
        total: results.filter((r) => r.status === "fulfilled").length,
        note: "Simplified stats using Query operations (IAM-compliant)",
      };
    } catch (error) {
      console.error("Failed to get table stats:", error);
      return {
        forecasts: 0,
        nodes: 0,
        issues: 0,
        total: 0,
        note: "Stats unavailable due to IAM restrictions on Scan operations",
      };
    }
  }
}
