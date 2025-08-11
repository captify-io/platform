/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * DynamoDB Service for Application Workspace Content
 * Handles CRUD operations for dynamic workspace content that agents can update
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  ApplicationWorkspaceContent,
  CreateWorkspaceContentRequest,
  UpdateWorkspaceContentRequest,
  DatabaseError,
} from "@/types/database";

// Environment variables
const REGION = process.env.AWS_REGION || "us-east-1";
const WORKSPACE_CONTENT_TABLE =
  process.env.DYNAMODB_WORKSPACE_CONTENT_TABLE ||
  "captify-application-workspace-content";

// Initialize DynamoDB client with existing configuration
const dynamoClientConfig = {
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID!,
    secretAccessKey:
      process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY!,
  },
};

const dynamoClient = new DynamoDBClient(dynamoClientConfig);
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export class WorkspaceContentDatabaseService {
  /**
   * Get all workspace content for an application
   */
  async getWorkspaceContentByAppId(
    appId: string
  ): Promise<ApplicationWorkspaceContent[]> {
    try {
      console.log(`📋 Getting workspace content for app: ${appId}`);

      const command = new QueryCommand({
        TableName: WORKSPACE_CONTENT_TABLE,
        KeyConditionExpression: "app_id = :appId",
        ExpressionAttributeValues: {
          ":appId": appId,
        },
        ScanIndexForward: true, // Sort by sort key (content_id) ascending
      });

      const result = await docClient.send(command);
      const content = (result.Items as ApplicationWorkspaceContent[]) || [];

      console.log(
        `📋 Found ${content.length} workspace content items for app: ${appId}`
      );

      // Sort by menu_item_id if available, or by content_id
      return content.sort((a, b) => {
        // Try to get order from menu_item_id or content_id
        const aId = (a as any).menu_item_id || a.content_id;
        const bId = (b as any).menu_item_id || b.content_id;
        return aId.localeCompare(bId);
      });
    } catch (error: any) {
      console.error("❌ Failed to get workspace content:", error);
      throw this.handleError("GET_WORKSPACE_CONTENT_FAILED", error);
    }
  }

  /**
   * Get a specific workspace content item
   */
  async getWorkspaceContent(
    appId: string,
    contentId: string
  ): Promise<ApplicationWorkspaceContent | null> {
    try {
      const command = new GetCommand({
        TableName: WORKSPACE_CONTENT_TABLE,
        Key: { app_id: appId, content_id: contentId },
      });

      const result = await docClient.send(command);
      return (result.Item as ApplicationWorkspaceContent) || null;
    } catch (error: any) {
      throw this.handleError("GET_WORKSPACE_CONTENT_ITEM_FAILED", error);
    }
  }

  /**
   * Get workspace content for a specific menu item
   */
  async getWorkspaceContentByMenuItemId(
    appId: string,
    menuItemId: string
  ): Promise<ApplicationWorkspaceContent[]> {
    try {
      console.log(
        `📋 Getting workspace content for app: ${appId}, menu item: ${menuItemId}`
      );

      const command = new QueryCommand({
        TableName: WORKSPACE_CONTENT_TABLE,
        KeyConditionExpression: "app_id = :appId",
        FilterExpression: "menu_item_id = :menuItemId",
        ExpressionAttributeValues: {
          ":appId": appId,
          ":menuItemId": menuItemId,
        },
        ScanIndexForward: true,
      });

      const result = await docClient.send(command);
      const content = (result.Items as ApplicationWorkspaceContent[]) || [];

      console.log(
        `📋 Found ${content.length} workspace content items for app: ${appId}, menu item: ${menuItemId}`
      );

      return content;
    } catch (error: any) {
      console.error("❌ Failed to get workspace content by menu item:", error);
      throw this.handleError(
        "GET_WORKSPACE_CONTENT_BY_MENU_ITEM_FAILED",
        error
      );
    }
  }

  /**
   * Create new workspace content
   */
  async createWorkspaceContent(
    request: CreateWorkspaceContentRequest,
    createdBy: string
  ): Promise<ApplicationWorkspaceContent> {
    try {
      const now = new Date().toISOString();
      const contentId = this.generateContentId(request.app_id, request.title);

      const content: ApplicationWorkspaceContent = {
        app_id: request.app_id,
        content_id: contentId,
        menu_item_id: request.menu_item_id, // Include menu item reference
        content_type: request.content_type,
        title: request.title,
        description: request.description,
        content_data: request.content_data,
        layout_config: request.layout_config,
        agent_updatable: request.agent_updatable || false,
        version: "1.0.0",
        created_at: now,
        updated_at: now,
        created_by: createdBy,
      };

      const command = new PutCommand({
        TableName: WORKSPACE_CONTENT_TABLE,
        Item: content,
        ConditionExpression:
          "attribute_not_exists(app_id) AND attribute_not_exists(content_id)",
      });

      await docClient.send(command);
      console.log(`✅ Created workspace content: ${contentId}`);
      return content;
    } catch (error: any) {
      if (error.name === "ConditionalCheckFailedException") {
        throw this.handleError("WORKSPACE_CONTENT_ALREADY_EXISTS", error);
      }
      throw this.handleError("CREATE_WORKSPACE_CONTENT_FAILED", error);
    }
  }

  /**
   * Update existing workspace content
   */
  async updateWorkspaceContent(
    appId: string,
    contentId: string,
    updates: UpdateWorkspaceContentRequest,
    updatedBy: "user" | "agent" = "user",
    agentUpdateReason?: string
  ): Promise<ApplicationWorkspaceContent> {
    try {
      const now = new Date().toISOString();

      // Build update expression dynamically
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      // Always update the updated_at timestamp
      updateExpressions.push("#updated_at = :updated_at");
      expressionAttributeNames["#updated_at"] = "updated_at";
      expressionAttributeValues[":updated_at"] = now;

      // Handle agent-specific updates
      if (updatedBy === "agent") {
        updateExpressions.push("#last_agent_update = :last_agent_update");
        expressionAttributeNames["#last_agent_update"] = "last_agent_update";
        expressionAttributeValues[":last_agent_update"] = now;

        if (agentUpdateReason) {
          updateExpressions.push("#agent_update_reason = :agent_update_reason");
          expressionAttributeNames["#agent_update_reason"] =
            "agent_update_reason";
          expressionAttributeValues[":agent_update_reason"] = agentUpdateReason;
        }
      }

      // Add other fields if they exist in the update request
      if (updates.content_type !== undefined) {
        updateExpressions.push("#content_type = :content_type");
        expressionAttributeNames["#content_type"] = "content_type";
        expressionAttributeValues[":content_type"] = updates.content_type;
      }
      if (updates.title !== undefined) {
        updateExpressions.push("#title = :title");
        expressionAttributeNames["#title"] = "title";
        expressionAttributeValues[":title"] = updates.title;
      }
      if (updates.description !== undefined) {
        updateExpressions.push("#description = :description");
        expressionAttributeNames["#description"] = "description";
        expressionAttributeValues[":description"] = updates.description;
      }
      if (updates.content_data !== undefined) {
        updateExpressions.push("#content_data = :content_data");
        expressionAttributeNames["#content_data"] = "content_data";
        expressionAttributeValues[":content_data"] = updates.content_data;
      }
      if (updates.layout_config !== undefined) {
        updateExpressions.push("#layout_config = :layout_config");
        expressionAttributeNames["#layout_config"] = "layout_config";
        expressionAttributeValues[":layout_config"] = updates.layout_config;
      }
      if (updates.agent_updatable !== undefined) {
        updateExpressions.push("#agent_updatable = :agent_updatable");
        expressionAttributeNames["#agent_updatable"] = "agent_updatable";
        expressionAttributeValues[":agent_updatable"] = updates.agent_updatable;
      }

      const command = new UpdateCommand({
        TableName: WORKSPACE_CONTENT_TABLE,
        Key: { app_id: appId, content_id: contentId },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
        ConditionExpression:
          "attribute_exists(app_id) AND attribute_exists(content_id)",
      });

      const result = await docClient.send(command);
      console.log(
        `✅ Updated workspace content: ${contentId} (by ${updatedBy})`
      );
      return result.Attributes as ApplicationWorkspaceContent;
    } catch (error: any) {
      if (error.name === "ConditionalCheckFailedException") {
        throw this.handleError("WORKSPACE_CONTENT_NOT_FOUND", error);
      }
      throw this.handleError("UPDATE_WORKSPACE_CONTENT_FAILED", error);
    }
  }

  /**
   * Delete workspace content
   */
  async deleteWorkspaceContent(
    appId: string,
    contentId: string
  ): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: WORKSPACE_CONTENT_TABLE,
        Key: { app_id: appId, content_id: contentId },
        ConditionExpression:
          "attribute_exists(app_id) AND attribute_exists(content_id)",
      });

      await docClient.send(command);
      console.log(`✅ Deleted workspace content: ${contentId}`);
    } catch (error: any) {
      if (error.name === "ConditionalCheckFailedException") {
        throw this.handleError("WORKSPACE_CONTENT_NOT_FOUND", error);
      }
      throw this.handleError("DELETE_WORKSPACE_CONTENT_FAILED", error);
    }
  }

  /**
   * Delete all workspace content for an application
   */
  async deleteAllWorkspaceContentForApp(appId: string): Promise<number> {
    try {
      console.log(`🗑️ Deleting all workspace content for app: ${appId}`);

      // First, get all workspace content for this app
      const workspaceContent = await this.getWorkspaceContentByAppId(appId);

      if (workspaceContent.length === 0) {
        console.log(`📋 No workspace content found for app: ${appId}`);
        return 0;
      }

      // Delete each content item
      let deletedCount = 0;
      for (const content of workspaceContent) {
        try {
          await this.deleteWorkspaceContent(appId, content.content_id);
          deletedCount++;
        } catch (error) {
          console.warn(
            `⚠️ Failed to delete workspace content ${content.content_id}:`,
            error
          );
          // Continue with other items
        }
      }

      console.log(
        `✅ Deleted ${deletedCount}/${workspaceContent.length} workspace content items for app: ${appId}`
      );
      return deletedCount;
    } catch (error: any) {
      console.error(
        `❌ Failed to delete workspace content for app ${appId}:`,
        error
      );
      throw this.handleError("DELETE_ALL_WORKSPACE_CONTENT_FAILED", error);
    }
  }

  /**
   * Get workspace content by type
   */
  async getWorkspaceContentByType(
    appId: string,
    contentType: ApplicationWorkspaceContent["content_type"]
  ): Promise<ApplicationWorkspaceContent[]> {
    try {
      const command = new QueryCommand({
        TableName: WORKSPACE_CONTENT_TABLE,
        KeyConditionExpression: "app_id = :appId",
        FilterExpression: "content_type = :contentType",
        ExpressionAttributeValues: {
          ":appId": appId,
          ":contentType": contentType,
        },
      });

      const result = await docClient.send(command);
      return (result.Items as ApplicationWorkspaceContent[]) || [];
    } catch (error: any) {
      throw this.handleError("GET_WORKSPACE_CONTENT_BY_TYPE_FAILED", error);
    }
  }

  /**
   * Generate a unique content ID
   */
  private generateContentId(appId: string, title: string): string {
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const timestamp = Date.now();
    return `${appId}-content-${cleanTitle}-${timestamp}`;
  }

  /**
   * Handle database errors with proper error codes
   */
  private handleError(code: string, error: any): DatabaseError {
    console.error(`❌ Database error [${code}]:`, error);

    return {
      code,
      message: error.message || "Database operation failed",
      details: {
        errorName: error.name,
        errorCode: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId,
      },
    };
  }
}

// Export singleton instance
export const workspaceContentDb = new WorkspaceContentDatabaseService();
