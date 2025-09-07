/**
 * ApplicationManager Service - Simplified
 * Manages application access with minimal complexity
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import type {
  App,
  UserApp,
  AppRole,
  AppAccessRequest,
  UserAccessProfile,
} from "../../types";

// Initialize DynamoDB client
const getAwsRegion = () => {
  if (typeof window !== 'undefined') {
    return "us-east-1";
  }
  try {
    return (globalThis as any).process?.env?.AWS_REGION || "us-east-1";
  } catch {
    return "us-east-1";
  }
};

const client = new DynamoDBClient({ region: getAwsRegion() });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_PREFIX = "captify";

export class ApplicationManager {
  private userId?: string;
  private isAdmin: boolean = false;

  constructor(userId?: string, isAdmin: boolean = false) {
    this.userId = userId;
    this.isAdmin = isAdmin;
  }

  /**
   * Get all installed applications
   */
  async getInstalledApps(): Promise<App[]> {
    const response = await docClient.send(
      new ScanCommand({
        TableName: `${TABLE_PREFIX}-core-App`,
        FilterExpression: "#status = :active",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":active": "active",
        },
      })
    );
    return (response.Items || []) as App[];
  }

  /**
   * Get apps accessible by a user
   */
  async getUserApps(userId: string): Promise<App[]> {
    // Get user's app mappings
    const userAppsResponse = await docClient.send(
      new QueryCommand({
        TableName: `${TABLE_PREFIX}-core-UserApp`,
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :userId",
        FilterExpression: "#status = :active",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":userId": userId,
          ":active": "active",
        },
      })
    );

    const userApps = (userAppsResponse.Items || []) as UserApp[];
    const appIds = [...new Set(userApps.map(ua => ua.appId))];

    // Fetch app details
    const apps: App[] = [];
    for (const appId of appIds) {
      const response = await docClient.send(
        new GetCommand({
          TableName: `${TABLE_PREFIX}-core-App`,
          Key: { id: appId },
        })
      );
      if (response.Item && response.Item.status === "active") {
        apps.push(response.Item as App);
      }
    }

    return apps;
  }

  /**
   * Request access to an application
   */
  async requestAppAccess(
    userId: string,
    appId: string,
    justification: string,
    requestedRole?: string
  ): Promise<AppAccessRequest> {
    const requestId = uuidv4();
    const now = new Date().toISOString();
    
    const request: AppAccessRequest = {
      id: requestId,
      slug: `req-${requestId.substring(0, 8)}`,
      name: `Access Request`,
      description: justification,
      userId,
      appId,
      requestedRole,
      justification,
      status: "pending",
      app: "core",
      order: Date.now().toString(),
      fields: {},
      ownerId: userId,
      createdAt: now,
      createdBy: userId,
      updatedAt: now,
      updatedBy: userId,
    };

    await docClient.send(
      new PutCommand({
        TableName: `${TABLE_PREFIX}-core-AppAccessRequest`,
        Item: request,
      })
    );

    return request;
  }

  /**
   * Get pending access requests (admin)
   */
  async getPendingRequests(appId?: string): Promise<AppAccessRequest[]> {
    if (!this.isAdmin) {
      throw new Error("Admin access required");
    }

    const params: any = {
      TableName: `${TABLE_PREFIX}-core-AppAccessRequest`,
      FilterExpression: "#status = :pending",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":pending": "pending",
      },
    };

    if (appId) {
      params.FilterExpression += " AND appId = :appId";
      params.ExpressionAttributeValues[":appId"] = appId;
    }

    const response = await docClient.send(new ScanCommand(params));
    return (response.Items || []) as AppAccessRequest[];
  }

  /**
   * Approve an access request (admin)
   */
  async approveAccessRequest(
    requestId: string,
    reviewerId: string,
    roleId: string,
    reviewNotes?: string
  ): Promise<void> {
    if (!this.isAdmin) {
      throw new Error("Admin access required");
    }

    // Get the request
    const requestResponse = await docClient.send(
      new GetCommand({
        TableName: `${TABLE_PREFIX}-core-AppAccessRequest`,
        Key: { id: requestId },
      })
    );

    const request = requestResponse.Item as AppAccessRequest;
    if (!request) {
      throw new Error("Request not found");
    }

    // Update request status
    await docClient.send(
      new UpdateCommand({
        TableName: `${TABLE_PREFIX}-core-AppAccessRequest`,
        Key: { id: requestId },
        UpdateExpression: "SET #status = :approved, reviewedBy = :reviewer, reviewNotes = :notes, updatedAt = :now, updatedBy = :reviewer",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":approved": "approved",
          ":reviewer": reviewerId,
          ":notes": reviewNotes || "",
          ":now": new Date().toISOString(),
        },
      })
    );

    // Grant access
    await this.grantAppAccess(
      request.userId,
      request.appId,
      roleId,
      reviewerId
    );
  }

  /**
   * Reject an access request (admin)
   */
  async rejectAccessRequest(
    requestId: string,
    reviewerId: string,
    reviewNotes: string
  ): Promise<void> {
    if (!this.isAdmin) {
      throw new Error("Admin access required");
    }

    await docClient.send(
      new UpdateCommand({
        TableName: `${TABLE_PREFIX}-core-AppAccessRequest`,
        Key: { id: requestId },
        UpdateExpression: "SET #status = :rejected, reviewedBy = :reviewer, reviewNotes = :notes, updatedAt = :now, updatedBy = :reviewer",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":rejected": "rejected",
          ":reviewer": reviewerId,
          ":notes": reviewNotes,
          ":now": new Date().toISOString(),
        },
      })
    );
  }

  /**
   * Grant app access to a user (admin)
   */
  async grantAppAccess(
    userId: string,
    appId: string,
    roleId: string,
    grantedBy: string
  ): Promise<UserApp> {
    const now = new Date().toISOString();
    const userAppId = uuidv4();
    
    const userApp: UserApp = {
      id: userAppId,
      slug: `access-${userAppId.substring(0, 8)}`,
      name: `User Access`,
      description: `Access granted to ${appId}`,
      userId,
      appId,
      roleId,
      grantedBy,
      status: "active",
      app: "core",
      order: Date.now().toString(),
      fields: {},
      ownerId: grantedBy,
      createdAt: now,
      createdBy: grantedBy,
      updatedAt: now,
      updatedBy: grantedBy,
    };

    await docClient.send(
      new PutCommand({
        TableName: `${TABLE_PREFIX}-core-UserApp`,
        Item: userApp,
      })
    );

    return userApp;
  }

  /**
   * Revoke app access from a user (admin)
   */
  async revokeAppAccess(
    userId: string,
    appId: string,
    revokedBy: string
  ): Promise<void> {
    if (!this.isAdmin) {
      throw new Error("Admin access required");
    }

    // Find the UserApp record
    const userAppResponse = await docClient.send(
      new QueryCommand({
        TableName: `${TABLE_PREFIX}-core-UserApp`,
        IndexName: "userId-appId-index",
        KeyConditionExpression: "userId = :userId AND appId = :appId",
        ExpressionAttributeValues: {
          ":userId": userId,
          ":appId": appId,
        },
      })
    );

    const userApp = userAppResponse.Items?.[0];
    if (!userApp) {
      throw new Error("User app access not found");
    }

    // Update status to revoked
    await docClient.send(
      new UpdateCommand({
        TableName: `${TABLE_PREFIX}-core-UserApp`,
        Key: { id: userApp.id },
        UpdateExpression: "SET #status = :revoked, updatedAt = :now, updatedBy = :by",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":revoked": "revoked",
          ":now": new Date().toISOString(),
          ":by": revokedBy,
        },
      })
    );
  }

  /**
   * Get user's access profile for an app
   */
  async getUserAccessProfile(userId: string, appId: string): Promise<UserAccessProfile | null> {
    // Get user's app access
    const userAppResponse = await docClient.send(
      new QueryCommand({
        TableName: `${TABLE_PREFIX}-core-UserApp`,
        IndexName: "userId-appId-index", 
        KeyConditionExpression: "userId = :userId AND appId = :appId",
        FilterExpression: "#status = :active",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":userId": userId,
          ":appId": appId,
          ":active": "active",
        },
      })
    );

    const userApp = userAppResponse.Items?.[0] as UserApp;
    if (!userApp) {
      return null;
    }

    // Get role details
    const roleResponse = await docClient.send(
      new GetCommand({
        TableName: `${TABLE_PREFIX}-core-AppRole`,
        Key: { id: userApp.roleId },
      })
    );

    const role = roleResponse.Item as AppRole;
    if (!role) {
      return null;
    }

    return {
      userId,
      appId,
      roles: [userApp.roleId],
      permissions: role.permissions || [],
      dataAccess: role.dataAccess || "none",
      expiresAt: userApp.expiresAt,
    };
  }

  /**
   * Simple app access summary for admin dashboard
   */
  async getAppAccessSummary(appId: string): Promise<any> {
    if (!this.isAdmin) {
      throw new Error("Admin access required");
    }

    // Count active users
    const userAppsResponse = await docClient.send(
      new QueryCommand({
        TableName: `${TABLE_PREFIX}-core-UserApp`,
        IndexName: "appId-index",
        KeyConditionExpression: "appId = :appId",
        FilterExpression: "#status = :active",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":appId": appId,
          ":active": "active",
        },
        Select: "COUNT",
      })
    );

    // Count pending requests
    const pendingRequests = await this.getPendingRequests(appId);

    return {
      appId,
      totalUsers: userAppsResponse.Count || 0,
      pendingRequests: pendingRequests.length,
    };
  }
}

export default ApplicationManager;