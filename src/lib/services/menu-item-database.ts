/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * DynamoDB Service for Application Menu Items
 * Handles CRUD operations for dynamic menu items per application
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
  ApplicationMenuItem,
  CreateMenuItemRequest,
  UpdateMenuItemRequest,
  DatabaseError,
} from "@/types/database";

// Environment variables
const REGION = process.env.AWS_REGION || "us-east-1";
const MENU_ITEMS_TABLE =
  process.env.DYNAMODB_MENU_ITEMS_TABLE || "captify-application-menu-items";

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

export class MenuItemDatabaseService {
  /**
   * Get all menu items for an application
   */
  async getMenuItemsByAppId(appId: string): Promise<ApplicationMenuItem[]> {
    try {
      console.log(`📋 Getting menu items for app: ${appId}`);

      const command = new QueryCommand({
        TableName: MENU_ITEMS_TABLE,
        KeyConditionExpression: "app_id = :appId",
        ExpressionAttributeValues: {
          ":appId": appId,
        },
        ScanIndexForward: true, // Sort by sort key (menu_item_id) ascending
      });

      const result = await docClient.send(command);
      const menuItems = (result.Items as any[]) || [];

      console.log(`📋 Found ${menuItems.length} menu items:`, menuItems);

      // Transform and sort by order_index field for proper menu display
      const transformedItems: ApplicationMenuItem[] = menuItems.map((item) => ({
        app_id: item.app_id,
        menu_item_id: item.menu_item_id,
        label: item.label || item.display_name || "Unknown",
        icon: item.icon,
        href: item.href || `#${item.menu_item_id}`,
        order: item.order || item.order_index || 0,
        parent_id: item.parent_id,
        required_permissions: item.required_permissions,
        visible_when: item.visible_when || "always",
        custom_visibility_rule: item.custom_visibility_rule,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
        created_by: item.created_by || "system",
      }));

      return transformedItems.sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error("❌ Failed to get menu items:", error);
      throw this.handleError("GET_MENU_ITEMS_FAILED", error);
    }
  }

  /**
   * Get a specific menu item
   */
  async getMenuItem(
    appId: string,
    menuItemId: string
  ): Promise<ApplicationMenuItem | null> {
    try {
      const command = new GetCommand({
        TableName: MENU_ITEMS_TABLE,
        Key: { app_id: appId, menu_item_id: menuItemId },
      });

      const result = await docClient.send(command);
      return (result.Item as ApplicationMenuItem) || null;
    } catch (error) {
      throw this.handleError("GET_MENU_ITEM_FAILED", error);
    }
  }

  /**
   * Create a new menu item
   */
  async createMenuItem(
    request: CreateMenuItemRequest,
    createdBy: string
  ): Promise<ApplicationMenuItem> {
    try {
      const now = new Date().toISOString();
      const menuItemId = this.generateMenuItemId(request.app_id, request.label);

      const menuItem: ApplicationMenuItem = {
        app_id: request.app_id,
        menu_item_id: menuItemId,
        label: request.label,
        icon: request.icon,
        href: request.href,
        order: request.order,
        parent_id: request.parent_id,
        required_permissions: request.required_permissions,
        visible_when: request.visible_when || "always",
        custom_visibility_rule: request.custom_visibility_rule,
        created_at: now,
        updated_at: now,
        created_by: createdBy,
      };

      const command = new PutCommand({
        TableName: MENU_ITEMS_TABLE,
        Item: menuItem,
        ConditionExpression:
          "attribute_not_exists(app_id) AND attribute_not_exists(menu_item_id)",
      });

      await docClient.send(command);
      console.log(`✅ Created menu item: ${menuItemId}`);
      return menuItem;
    } catch (error: any) {
      if (error.name === "ConditionalCheckFailedException") {
        throw this.handleError("MENU_ITEM_ALREADY_EXISTS", error);
      }
      throw this.handleError("CREATE_MENU_ITEM_FAILED", error);
    }
  }

  /**
   * Update an existing menu item
   */
  async updateMenuItem(
    appId: string,
    menuItemId: string,
    updates: UpdateMenuItemRequest
  ): Promise<ApplicationMenuItem> {
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

      // Add other fields if they exist in the update request
      if (updates.label !== undefined) {
        updateExpressions.push("#label = :label");
        expressionAttributeNames["#label"] = "label";
        expressionAttributeValues[":label"] = updates.label;
      }
      if (updates.icon !== undefined) {
        updateExpressions.push("#icon = :icon");
        expressionAttributeNames["#icon"] = "icon";
        expressionAttributeValues[":icon"] = updates.icon;
      }
      if (updates.href !== undefined) {
        updateExpressions.push("#href = :href");
        expressionAttributeNames["#href"] = "href";
        expressionAttributeValues[":href"] = updates.href;
      }
      if (updates.order !== undefined) {
        updateExpressions.push("#order = :order");
        expressionAttributeNames["#order"] = "order";
        expressionAttributeValues[":order"] = updates.order;
      }
      if (updates.parent_id !== undefined) {
        updateExpressions.push("#parent_id = :parent_id");
        expressionAttributeNames["#parent_id"] = "parent_id";
        expressionAttributeValues[":parent_id"] = updates.parent_id;
      }
      if (updates.required_permissions !== undefined) {
        updateExpressions.push("#required_permissions = :required_permissions");
        expressionAttributeNames["#required_permissions"] =
          "required_permissions";
        expressionAttributeValues[":required_permissions"] =
          updates.required_permissions;
      }
      if (updates.visible_when !== undefined) {
        updateExpressions.push("#visible_when = :visible_when");
        expressionAttributeNames["#visible_when"] = "visible_when";
        expressionAttributeValues[":visible_when"] = updates.visible_when;
      }
      if (updates.custom_visibility_rule !== undefined) {
        updateExpressions.push(
          "#custom_visibility_rule = :custom_visibility_rule"
        );
        expressionAttributeNames["#custom_visibility_rule"] =
          "custom_visibility_rule";
        expressionAttributeValues[":custom_visibility_rule"] =
          updates.custom_visibility_rule;
      }

      const command = new UpdateCommand({
        TableName: MENU_ITEMS_TABLE,
        Key: { app_id: appId, menu_item_id: menuItemId },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
        ConditionExpression:
          "attribute_exists(app_id) AND attribute_exists(menu_item_id)",
      });

      const result = await docClient.send(command);
      console.log(`✅ Updated menu item: ${menuItemId}`);
      return result.Attributes as ApplicationMenuItem;
    } catch (error: any) {
      if (error.name === "ConditionalCheckFailedException") {
        throw this.handleError("MENU_ITEM_NOT_FOUND", error);
      }
      throw this.handleError("UPDATE_MENU_ITEM_FAILED", error);
    }
  }

  /**
   * Delete a menu item
   */
  async deleteMenuItem(appId: string, menuItemId: string): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: MENU_ITEMS_TABLE,
        Key: { app_id: appId, menu_item_id: menuItemId },
        ConditionExpression:
          "attribute_exists(app_id) AND attribute_exists(menu_item_id)",
      });

      await docClient.send(command);
      console.log(`✅ Deleted menu item: ${menuItemId}`);
    } catch (error: any) {
      if (error.name === "ConditionalCheckFailedException") {
        throw this.handleError("MENU_ITEM_NOT_FOUND", error);
      }
      throw this.handleError("DELETE_MENU_ITEM_FAILED", error);
    }
  }

  /**
   * Delete all menu items for an application
   */
  async deleteAllMenuItemsForApp(appId: string): Promise<number> {
    try {
      console.log(`🗑️ Deleting all menu items for app: ${appId}`);

      // First, get all menu items for this app
      const menuItems = await this.getMenuItemsByAppId(appId);

      if (menuItems.length === 0) {
        console.log(`📋 No menu items found for app: ${appId}`);
        return 0;
      }

      // Delete each menu item
      let deletedCount = 0;
      for (const menuItem of menuItems) {
        try {
          await this.deleteMenuItem(appId, menuItem.menu_item_id);
          deletedCount++;
        } catch (error) {
          console.warn(
            `⚠️ Failed to delete menu item ${menuItem.menu_item_id}:`,
            error
          );
          // Continue with other items
        }
      }

      console.log(
        `✅ Deleted ${deletedCount}/${menuItems.length} menu items for app: ${appId}`
      );
      return deletedCount;
    } catch (error: any) {
      console.error(`❌ Failed to delete menu items for app ${appId}:`, error);
      throw this.handleError("DELETE_ALL_MENU_ITEMS_FAILED", error);
    }
  }

  /**
   * Generate a unique menu item ID
   */
  private generateMenuItemId(appId: string, label: string): string {
    const cleanLabel = label.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const timestamp = Date.now();
    return `${appId}-${cleanLabel}-${timestamp}`;
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
export const menuItemDb = new MenuItemDatabaseService();
