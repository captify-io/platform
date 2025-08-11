/**
 * Notification Service
 *
 * Cross-app notification system for user alerts, system messages,
 * and inter-application communication.
 */

import { DatabaseService } from "./database";
import { getSharedTable } from "@/lib/config/database";

export interface Notification {
  id: string;
  user_id: string;
  app_id?: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  expires_at?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateNotificationInput {
  user_id: string;
  app_id?: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  expires_at?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationFilters {
  unreadOnly?: boolean;
  type?: string;
  app_id?: string;
  limit?: number;
}

export class NotificationService extends DatabaseService {
  constructor() {
    super(getSharedTable("notifications"));
  }

  /**
   * Create a new notification
   */
  async createNotification(
    input: CreateNotificationInput
  ): Promise<Notification> {
    const id = this.generateId();
    const timestamp = new Date().toISOString();

    const notification: Notification = {
      id,
      user_id: input.user_id,
      app_id: input.app_id,
      type: input.type,
      title: input.title,
      message: input.message,
      read: false,
      created_at: timestamp,
      expires_at: input.expires_at,
      metadata: input.metadata,
    };

    await this.putItem(notification as unknown as Record<string, unknown>);
    return notification;
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    filters: NotificationFilters = {}
  ): Promise<Notification[]> {
    const { unreadOnly = false, type, app_id, limit = 50 } = filters;

    // Build filter expression
    const filterExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, unknown> = {};

    if (unreadOnly) {
      filterExpressions.push("#read = :readValue");
      expressionAttributeNames["#read"] = "read";
      expressionAttributeValues[":readValue"] = false;
    }

    if (type) {
      filterExpressions.push("#type = :typeValue");
      expressionAttributeNames["#type"] = "type";
      expressionAttributeValues[":typeValue"] = type;
    }

    if (app_id) {
      filterExpressions.push("app_id = :appIdValue");
      expressionAttributeValues[":appIdValue"] = app_id;
    }

    // Check for expired notifications
    const now = new Date().toISOString();
    filterExpressions.push(
      "(attribute_not_exists(expires_at) OR expires_at > :now)"
    );
    expressionAttributeValues[":now"] = now;

    const notifications = await this.queryItems<Notification>(
      "user_id = :userId",
      {
        expressionAttributeValues: {
          ":userId": userId,
          ...expressionAttributeValues,
        },
        filterExpression:
          filterExpressions.length > 0
            ? filterExpressions.join(" AND ")
            : undefined,
        expressionAttributeNames:
          Object.keys(expressionAttributeNames).length > 0
            ? expressionAttributeNames
            : undefined,
        limit,
        scanIndexForward: false, // Most recent first
      }
    );

    return notifications;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.updateItem(
      { user_id: userId, id: notificationId },
      { read: true, read_at: new Date().toISOString() }
    );
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string, appId?: string): Promise<void> {
    const notifications = await this.getUserNotifications(userId, {
      unreadOnly: true,
      app_id: appId,
    });

    for (const notification of notifications) {
      await this.markAsRead(userId, notification.id);
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(
    userId: string,
    notificationId: string
  ): Promise<void> {
    await this.deleteItem({ user_id: userId, id: notificationId });
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<void> {
    const now = new Date().toISOString();

    // Note: This is a simplified cleanup. In production, you might want to use
    // a TTL attribute on the DynamoDB table or a scheduled Lambda function
    const expiredNotifications = await this.scanItems<Notification>({
      filterExpression: "expires_at < :now",
      expressionAttributeValues: { ":now": now },
    });

    for (const notification of expiredNotifications) {
      await this.deleteItem({
        user_id: notification.user_id,
        id: notification.id,
      });
    }
  }

  /**
   * Get notification count for a user
   */
  async getNotificationCount(
    userId: string,
    unreadOnly = true
  ): Promise<number> {
    const notifications = await this.getUserNotifications(userId, {
      unreadOnly,
      limit: 1000, // Should be sufficient for count
    });

    return notifications.length;
  }

  /**
   * Send notification to multiple users
   */
  async broadcastNotification(
    userIds: string[],
    notification: Omit<CreateNotificationInput, "user_id">
  ): Promise<Notification[]> {
    const createdNotifications: Notification[] = [];

    for (const userId of userIds) {
      const created = await this.createNotification({
        ...notification,
        user_id: userId,
      });
      createdNotifications.push(created);
    }

    return createdNotifications;
  }

  /**
   * Generate a unique notification ID
   */
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

// Export service instance
export const notificationService = new NotificationService();

// Helper functions for common notification types
export const NotificationHelpers = {
  /**
   * Send a system notification
   */
  async sendSystemNotification(
    userId: string,
    title: string,
    message: string,
    type: "info" | "warning" | "error" | "success" = "info"
  ) {
    return notificationService.createNotification({
      user_id: userId,
      type,
      title,
      message,
      metadata: {
        source: "system",
        category: "system",
      },
    });
  },

  /**
   * Send an application-specific notification
   */
  async sendAppNotification(
    userId: string,
    appId: string,
    title: string,
    message: string,
    type: "info" | "warning" | "error" | "success" = "info",
    metadata?: Record<string, unknown>
  ) {
    return notificationService.createNotification({
      user_id: userId,
      app_id: appId,
      type,
      title,
      message,
      metadata: {
        ...metadata,
        source: "application",
        app_id: appId,
      },
    });
  },

  /**
   * Send a temporary notification that expires
   */
  async sendTemporaryNotification(
    userId: string,
    title: string,
    message: string,
    expiresInMinutes: number = 60,
    type: "info" | "warning" | "error" | "success" = "info"
  ) {
    const expiresAt = new Date(
      Date.now() + expiresInMinutes * 60 * 1000
    ).toISOString();

    return notificationService.createNotification({
      user_id: userId,
      type,
      title,
      message,
      expires_at: expiresAt,
      metadata: {
        source: "system",
        category: "temporary",
        expires_in_minutes: expiresInMinutes,
      },
    });
  },
};
