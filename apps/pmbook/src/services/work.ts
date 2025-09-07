import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
// Simple type definitions for service pattern
interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  region: string;
}

interface ApiUserSession {
  user?: any;
}

import type { WorkItem, WorkSession } from "../types/work";

interface WorkServiceRequest {
  service: string;
  operation: string;
  data?: any;
  schema?: string;
  app?: string;
}

export async function execute(
  request: WorkServiceRequest,
  credentials?: AwsCredentials,
  session?: ApiUserSession
): Promise<any> {
  if (!credentials) {
    return { success: false, error: "AWS credentials required" };
  }

  const client = new DynamoDBClient({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });

  const docClient = DynamoDBDocumentClient.from(client);
  const schema = request.schema || "captify";

  try {
    switch (request.operation) {
      case "getUserWorkQueue": {
        const { userId } = request.data || {};
        if (!userId) {
          return { success: false, error: "User ID required" };
        }

        const response = await docClient.send(new QueryCommand({
          TableName: `${schema}-pmbook-WorkItem`,
          IndexName: "assignee-index",
          KeyConditionExpression: "assignee = :userId",
          FilterExpression: "#status IN (:open, :inProgress)",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":userId": userId,
            ":open": "open",
            ":inProgress": "in-progress",
          },
        }));

        const items = response.Items || [];
        return { 
          success: true, 
          data: items.sort((a: any, b: any) => (b.valueScore || 0) - (a.valueScore || 0))
        };
      }

      case "startWork": {
        const { userId, workItemId } = request.data || {};
        if (!userId || !workItemId) {
          return { success: false, error: "User ID and work item ID required" };
        }

        const session = {
          startTime: new Date().toISOString(),
          userId,
          active: true,
        };

        await docClient.send(new UpdateCommand({
          TableName: `${schema}-pmbook-WorkItem`,
          Key: { id: workItemId },
          UpdateExpression: "SET #status = :inProgress, sessions = list_append(if_not_exists(sessions, :empty), :session), currentSession = :session",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":inProgress": "in-progress",
            ":empty": [],
            ":session": [session],
          },
        }));

        return { success: true, data: { sessionStarted: session.startTime } };
      }

      case "completeWork": {
        const { workItemId, outcome } = request.data || {};
        if (!workItemId) {
          return { success: false, error: "Work item ID required" };
        }

        const completedAt = new Date().toISOString();
        
        await docClient.send(new UpdateCommand({
          TableName: `${schema}-pmbook-WorkItem`,
          Key: { id: workItemId },
          UpdateExpression: "SET #status = :completed, completedAt = :completedAt, outcome = :outcome, currentSession = :null",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":completed": "completed",
            ":completedAt": completedAt,
            ":outcome": outcome || {},
            ":null": null,
          },
        }));

        return { success: true, data: { completed: true, completedAt } };
      }

      case "getTeamUtilization": {
        const { teamId, period = "week" } = request.data || {};
        if (!teamId) {
          return { success: false, error: "Team ID required" };
        }

        const response = await docClient.send(new QueryCommand({
          TableName: `${schema}-pmbook-WorkItem`,
          IndexName: "team-index",
          KeyConditionExpression: "#team = :teamId",
          ExpressionAttributeNames: {
            "#team": "team",
          },
          ExpressionAttributeValues: {
            ":teamId": teamId,
          },
        }));

        const items = response.Items || [];
        
        return {
          success: true,
          data: {
            totalHours: items.reduce((sum: number, item: any) => sum + (item.actualHours || 0), 0),
            billableHours: items.filter((i: any) => i.billable).reduce((sum: number, item: any) => sum + (item.actualHours || 0), 0),
            valueDelivered: items.reduce((sum: number, item: any) => sum + (item.valueDelivered || 0), 0),
            itemsCompleted: items.filter((i: any) => i.status === 'completed').length,
          },
        };
      }

      default:
        return {
          success: false,
          error: `Unknown operation: ${request.operation}`,
        };
    }
  } catch (error) {
    console.error(`Error in workService.${request.operation}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export const workService = {
  execute,
};