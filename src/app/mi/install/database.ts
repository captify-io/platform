import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  BOMNode,
  BOMEdge,
  AlternateGroup,
  WorkbenchIssue,
  ForecastData,
  SupplierLink,
} from "@/types/mi";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const docClient = DynamoDBDocumentClient.from(client);

export class MIGraphService {
  private tableName: string;

  constructor(tableName: string = "mi-bom-graph") {
    this.tableName = tableName;
  }

  // Node Operations
  async getNode(nodeId: string): Promise<BOMNode | null> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: {
          pk: nodeId,
          sk: "META",
        },
      });

      const result = await docClient.send(command);
      return (result.Item as BOMNode) || null;
    } catch (error) {
      console.error("Error getting node:", error);
      throw error;
    }
  }

  async createNode(
    node: Omit<BOMNode, "created_at" | "updated_at">
  ): Promise<BOMNode> {
    try {
      const now = new Date().toISOString();
      const fullNode: BOMNode = {
        ...node,
        created_at: now,
        updated_at: now,
      };

      const command = new PutCommand({
        TableName: this.tableName,
        Item: fullNode,
      });

      await docClient.send(command);
      return fullNode;
    } catch (error) {
      console.error("Error creating node:", error);
      throw error;
    }
  }

  // BOM Hierarchy Operations
  async getNodeChildren(nodeId: string, depth: number = 1): Promise<BOMNode[]> {
    try {
      const children: BOMNode[] = [];

      // Get direct children first
      const edgesCommand = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk_prefix)",
        ExpressionAttributeValues: {
          ":pk": nodeId,
          ":sk_prefix": "EDGE#HAS_PART#",
        },
      });

      const edgesResult = await docClient.send(edgesCommand);
      const edges = edgesResult.Items as BOMEdge[];

      // Get child node details
      for (const edge of edges) {
        const childNode = await this.getNode(edge.childId);
        if (childNode) {
          children.push(childNode);

          // Recursively get deeper levels if depth > 1
          if (depth > 1) {
            const grandChildren = await this.getNodeChildren(
              edge.childId,
              depth - 1
            );
            children.push(...grandChildren);
          }
        }
      }

      return children;
    } catch (error) {
      console.error("Error getting node children:", error);
      throw error;
    }
  }

  async getNodeParents(nodeId: string): Promise<BOMNode[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: "GSI1",
        KeyConditionExpression:
          "gsi1pk = :gsi1pk AND begins_with(gsi1sk, :gsi1sk_prefix)",
        ExpressionAttributeValues: {
          ":gsi1pk": nodeId,
          ":gsi1sk_prefix": "PARENT#",
        },
      });

      const result = await docClient.send(command);
      const parentEdges = result.Items as BOMEdge[];

      const parents: BOMNode[] = [];
      for (const edge of parentEdges) {
        const parentNode = await this.getNode(edge.parentId);
        if (parentNode) {
          parents.push(parentNode);
        }
      }

      return parents;
    } catch (error) {
      console.error("Error getting node parents:", error);
      throw error;
    }
  }

  // Alternate and Supersession Operations
  async getAlternates(nodeId: string): Promise<AlternateGroup[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: "GSI1",
        KeyConditionExpression:
          "gsi1pk = :gsi1pk AND begins_with(gsi1sk, :gsi1sk_prefix)",
        ExpressionAttributeValues: {
          ":gsi1pk": nodeId,
          ":gsi1sk_prefix": "ALTGROUP#",
        },
      });

      const result = await docClient.send(command);
      return result.Items as AlternateGroup[];
    } catch (error) {
      console.error("Error getting alternates:", error);
      throw error;
    }
  }

  async getSupersession(
    nodeId: string
  ): Promise<{ old?: BOMNode; new?: BOMNode }> {
    try {
      // Check if this node supersedes another (this is the new part)
      const backwardCommand = new QueryCommand({
        TableName: this.tableName,
        IndexName: "GSI1",
        KeyConditionExpression:
          "gsi1pk = :gsi1pk AND begins_with(gsi1sk, :gsi1sk_prefix)",
        ExpressionAttributeValues: {
          ":gsi1pk": nodeId,
          ":gsi1sk_prefix": "SUPER#BACK#",
        },
      });

      // Check if this node is superseded by another (this is the old part)
      const forwardCommand = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk_prefix)",
        ExpressionAttributeValues: {
          ":pk": nodeId,
          ":sk_prefix": "SUPERSESSION#",
        },
      });

      const [backwardResult, forwardResult] = await Promise.all([
        docClient.send(backwardCommand),
        docClient.send(forwardCommand),
      ]);

      const result: { old?: BOMNode; new?: BOMNode } = {};

      if (backwardResult.Items && backwardResult.Items.length > 0) {
        const supersession = backwardResult.Items[0];
        const oldNode = await this.getNode(supersession.oldId);
        if (oldNode) result.old = oldNode;
      }

      if (forwardResult.Items && forwardResult.Items.length > 0) {
        const supersession = forwardResult.Items[0];
        const newNode = await this.getNode(supersession.newId);
        if (newNode) result.new = newNode;
      }

      return result;
    } catch (error) {
      console.error("Error getting supersession:", error);
      throw error;
    }
  }

  // Supplier Operations
  async getSuppliers(nodeId: string): Promise<SupplierLink[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk_prefix)",
        ExpressionAttributeValues: {
          ":pk": nodeId,
          ":sk_prefix": "SUPPLY#SUPPLIER#",
        },
      });

      const result = await docClient.send(command);
      return result.Items as SupplierLink[];
    } catch (error) {
      console.error("Error getting suppliers:", error);
      throw error;
    }
  }

  // Forecast Operations
  async getForecast(
    scope: "tail" | "system",
    id: string
  ): Promise<ForecastData | null> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const command = new GetCommand({
        TableName: this.tableName,
        Key: {
          pk: `FORECAST#MICAP#${scope}:${id}`,
          sk: `${today}#model:v1.3`,
        },
      });

      const result = await docClient.send(command);
      return (result.Item as ForecastData) || null;
    } catch (error) {
      console.error("Error getting forecast:", error);
      throw error;
    }
  }

  async createForecast(forecast: ForecastData): Promise<ForecastData> {
    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: forecast,
      });

      await docClient.send(command);
      return forecast;
    } catch (error) {
      console.error("Error creating forecast:", error);
      throw error;
    }
  }

  // Workbench Operations
  async getIssues(status?: string): Promise<WorkbenchIssue[]> {
    try {
      let command;

      if (status) {
        command = new QueryCommand({
          TableName: this.tableName,
          IndexName: "GSI4",
          KeyConditionExpression: "gsi4pk = :gsi4pk",
          ExpressionAttributeValues: {
            ":gsi4pk": `ISSUE#status:${status}`,
          },
        });
      } else {
        command = new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: "begins_with(pk, :pk_prefix) AND sk = :sk",
          ExpressionAttributeValues: {
            ":pk_prefix": "ISSUE#",
            ":sk": "META",
          },
        });
      }

      const result = await docClient.send(command);
      return result.Items as WorkbenchIssue[];
    } catch (error) {
      console.error("Error getting issues:", error);
      throw error;
    }
  }

  async createIssue(
    issue: Omit<WorkbenchIssue, "created_at" | "updated_at">
  ): Promise<WorkbenchIssue> {
    try {
      const now = new Date().toISOString();
      const fullIssue: WorkbenchIssue = {
        ...issue,
        created_at: now,
        updated_at: now,
      };

      // Create the main issue record
      const issueCommand = new PutCommand({
        TableName: this.tableName,
        Item: fullIssue,
      });

      // Create GSI4 index entry for status-based queries
      const indexCommand = new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `INDEX#ISSUE#${issue.pk.split("#")[1]}`,
          sk: `STATUS#${issue.status}`,
          type: "INDEX",
          gsi4pk: `ISSUE#status:${issue.status}`,
          gsi4sk: `${now}#${issue.pk.split("#")[1]}`,
          issueId: issue.pk,
          status: issue.status,
          criticality: issue.criticality,
        },
      });

      await Promise.all([
        docClient.send(issueCommand),
        docClient.send(indexCommand),
      ]);

      return fullIssue;
    } catch (error) {
      console.error("Error creating issue:", error);
      throw error;
    }
  }

  // Utility Methods
  async batchWrite(items: Record<string, unknown>[]): Promise<void> {
    try {
      const chunks = this.chunkArray(items, 25); // DynamoDB batch limit

      for (const chunk of chunks) {
        const command = new BatchWriteCommand({
          RequestItems: {
            [this.tableName]: chunk.map((item) => ({
              PutRequest: { Item: item },
            })),
          },
        });

        await docClient.send(command);
      }
    } catch (error) {
      console.error("Error in batch write:", error);
      throw error;
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Search and Filter Operations
  async searchNodes(query: string): Promise<BOMNode[]> {
    try {
      // For demo purposes, we'll do a simple scan with filter
      // In production, this would use OpenSearch or similar
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "begins_with(pk, :pk_prefix) AND sk = :sk",
        FilterExpression: "contains(#name, :query)",
        ExpressionAttributeNames: {
          "#name": "name",
        },
        ExpressionAttributeValues: {
          ":pk_prefix": "NODE#",
          ":sk": "META",
          ":query": query,
        },
      });

      const result = await docClient.send(command);
      return result.Items as BOMNode[];
    } catch (error) {
      console.error("Error searching nodes:", error);
      throw error;
    }
  }

  // Health Check
  async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    message: string;
  }> {
    try {
      // Simple table scan to verify connectivity
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: {
          ":pk": "HEALTH#CHECK",
        },
        Limit: 1,
      });

      await docClient.send(command);
      return { status: "healthy", message: "DynamoDB connection successful" };
    } catch (error) {
      console.error("Health check failed:", error);
      return {
        status: "unhealthy",
        message: `DynamoDB error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }
}

// Export singleton instance
export const miGraphService = new MIGraphService();
