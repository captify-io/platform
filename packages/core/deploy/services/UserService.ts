/**
 * User Service
 * CRUD operations for User table using CaptifyClient
 */

import { CaptifyClient } from "../../src/api/client";
import type { User } from "../../src/types";
import { UUID } from "crypto";

export class UserService {
  private client: CaptifyClient;
  private tableName = "core-User";

  constructor(session?: any) {
    this.client = new CaptifyClient({ session });
  }

  /**
   * Create a new user
   */
  async createUser(
    data: Omit<User, "userId" | "createdAt" | "updatedAt">
  ): Promise<User> {
    const userId = crypto.randomUUID() as UUID;
    const now = new Date();

    const user: User = {
      ...data,
      userId,
      createdAt: now,
      updatedAt: now,
      status: data.status || "pending", // Default status if not provided
      role: data.role || "member", // Default role if not provided
    };

    const response = await this.client.post({
      table: this.tableName,
      item: user,
    });

    if (!response.success) {
      throw new Error(`Failed to create user: ${response.error}`);
    }

    return user;
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User | null> {
    const response = await this.client.get({
      table: this.tableName,
      key: { userId },
    });

    if (!response.success) {
      throw new Error(`Failed to get user: ${response.error}`);
    }

    return response.data || null;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const response = await this.client.get({
      table: this.tableName,
      params: {
        filterExpression: "#email = :email",
        expressionAttributeNames: { "#email": "email" },
        expressionAttributeValues: { ":email": email },
      },
    });

    if (!response.success) {
      throw new Error(`Failed to get user by email: ${response.error}`);
    }

    const users = response.data || [];
    return users.length > 0 ? users[0] : null;
  }

  /**
   * Update an existing user
   */
  async updateUser(
    userId: string,
    updates: Partial<Omit<User, "userId" | "createdAt">>
  ): Promise<User> {
    const updatedData = {
      ...updates,
      updatedAt: new Date(),
    };

    const response = await this.client.put({
      table: this.tableName,
      key: { userId },
      item: updatedData,
    });

    if (!response.success) {
      throw new Error(`Failed to update user: ${response.error}`);
    }

    return response.data;
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: string): Promise<void> {
    const response = await this.client.delete({
      table: this.tableName,
      key: { userId },
    });

    if (!response.success) {
      throw new Error(`Failed to delete user: ${response.error}`);
    }
  }

  /**
   * List users with optional filtering
   */
  async listUsers(params?: {
    orgId?: string;
    status?: "active" | "pending" | "suspended";
    role?: "admin" | "member" | "viewer";
    limit?: number;
  }): Promise<User[]> {
    let filterExpression = "";
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (params?.orgId) {
      filterExpression += "#orgId = :orgId";
      expressionAttributeNames["#orgId"] = "orgId";
      expressionAttributeValues[":orgId"] = params.orgId;
    }

    if (params?.status) {
      if (filterExpression) filterExpression += " AND ";
      filterExpression += "#status = :status";
      expressionAttributeNames["#status"] = "status";
      expressionAttributeValues[":status"] = params.status;
    }

    if (params?.role) {
      if (filterExpression) filterExpression += " AND ";
      filterExpression += "#role = :role";
      expressionAttributeNames["#role"] = "role";
      expressionAttributeValues[":role"] = params.role;
    }

    const requestParams: any = {
      limit: params?.limit || 50,
    };

    if (filterExpression) {
      requestParams.filterExpression = filterExpression;
      requestParams.expressionAttributeNames = expressionAttributeNames;
      requestParams.expressionAttributeValues = expressionAttributeValues;
    }

    const response = await this.client.get({
      table: this.tableName,
      params: requestParams,
    });

    if (!response.success) {
      throw new Error(`Failed to list users: ${response.error}`);
    }

    return response.data || [];
  }

  /**
   * Update user status
   */
  async updateUserStatus(
    userId: string,
    status: "active" | "pending" | "suspended"
  ): Promise<User> {
    return this.updateUser(userId, { status });
  }

  /**
   * Update user role
   */
  async updateUserRole(
    userId: string,
    role: "admin" | "member" | "viewer"
  ): Promise<User> {
    return this.updateUser(userId, { role });
  }

  /**
   * Get users by organization
   */
  async getUsersByOrganization(orgId: string): Promise<User[]> {
    return this.listUsers({ orgId });
  }
}
