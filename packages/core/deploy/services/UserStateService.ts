/**
 * User State Service
 * CRUD operations for UserState table using CaptifyClient
 */

import { CaptifyClient } from "../../src/api/client";
import type { UserState } from "../../src/types";
import { UUID } from "crypto";

export class UserStateService {
  private client: CaptifyClient;
  private tableName = "core-UserState";

  constructor(session?: any) {
    this.client = new CaptifyClient({ session });
  }

  /**
   * Create a new user state
   */
  async createUserState(
    data: Omit<UserState, "userStateId" | "createdAt" | "updatedAt">
  ): Promise<UserState> {
    const userStateId = crypto.randomUUID() as UUID;
    const now = new Date();

    const userState: UserState = {
      ...data,
      userStateId,
      createdAt: now,
      updatedAt: now,
      theme: data.theme || "auto",
      language: data.language || "en",
      timezone: data.timezone || "UTC",
    };

    const response = await this.client.post({
      table: this.tableName,
      item: userState,
    });

    if (!response.success) {
      throw new Error(`Failed to create user state: ${response.error}`);
    }

    return userState;
  }

  /**
   * Get user state by ID
   */
  async getUserState(userStateId: string): Promise<UserState | null> {
    const response = await this.client.get({
      table: this.tableName,
      key: { userStateId },
    });

    if (!response.success) {
      throw new Error(`Failed to get user state: ${response.error}`);
    }

    return response.data || null;
  }

  /**
   * Get user state by user ID
   */
  async getUserStateByUserId(userId: string): Promise<UserState | null> {
    const response = await this.client.get({
      table: this.tableName,
      params: {
        filterExpression: "#userId = :userId",
        expressionAttributeNames: { "#userId": "userId" },
        expressionAttributeValues: { ":userId": userId },
      },
    });

    if (!response.success) {
      throw new Error(`Failed to get user state by user ID: ${response.error}`);
    }

    const userStates = response.data || [];
    return userStates.length > 0 ? userStates[0] : null;
  }

  /**
   * Update user state
   */
  async updateUserState(
    userStateId: string,
    updates: Partial<Omit<UserState, "userStateId" | "createdAt">>
  ): Promise<UserState> {
    const updatedData = {
      ...updates,
      updatedAt: new Date(),
    };

    const response = await this.client.put({
      table: this.tableName,
      key: { userStateId },
      item: updatedData,
    });

    if (!response.success) {
      throw new Error(`Failed to update user state: ${response.error}`);
    }

    return response.data;
  }

  /**
   * Delete user state
   */
  async deleteUserState(userStateId: string): Promise<void> {
    const response = await this.client.delete({
      table: this.tableName,
      key: { userStateId },
    });

    if (!response.success) {
      throw new Error(`Failed to delete user state: ${response.error}`);
    }
  }

  /**
   * Add favorite app
   */
  async addFavoriteApp(userStateId: string, appId: string): Promise<UserState> {
    const userState = await this.getUserState(userStateId);
    if (!userState) {
      throw new Error(`User state not found: ${userStateId}`);
    }

    const favoriteApps = [
      ...new Set([...(userState.favoriteApps || []), appId]),
    ];
    return this.updateUserState(userStateId, { favoriteApps });
  }

  /**
   * Remove favorite app
   */
  async removeFavoriteApp(
    userStateId: string,
    appId: string
  ): Promise<UserState> {
    const userState = await this.getUserState(userStateId);
    if (!userState) {
      throw new Error(`User state not found: ${userStateId}`);
    }

    const favoriteApps = (userState.favoriteApps || []).filter(
      (id) => id !== appId
    );
    return this.updateUserState(userStateId, { favoriteApps });
  }

  /**
   * Add pinned app
   */
  async addPinnedApp(userStateId: string, appId: string): Promise<UserState> {
    const userState = await this.getUserState(userStateId);
    if (!userState) {
      throw new Error(`User state not found: ${userStateId}`);
    }

    const pinnedApps = [...new Set([...(userState.pinnedApps || []), appId])];
    return this.updateUserState(userStateId, { pinnedApps });
  }

  /**
   * Remove pinned app
   */
  async removePinnedApp(
    userStateId: string,
    appId: string
  ): Promise<UserState> {
    const userState = await this.getUserState(userStateId);
    if (!userState) {
      throw new Error(`User state not found: ${userStateId}`);
    }

    const pinnedApps = (userState.pinnedApps || []).filter(
      (id) => id !== appId
    );
    return this.updateUserState(userStateId, { pinnedApps });
  }

  /**
   * Update app display order
   */
  async updateAppDisplayOrder(
    userStateId: string,
    appId: string,
    order: number
  ): Promise<UserState> {
    const userState = await this.getUserState(userStateId);
    if (!userState) {
      throw new Error(`User state not found: ${userStateId}`);
    }

    const appDisplayOrder = {
      ...(userState.appDisplayOrder || {}),
      [appId]: order,
    };
    return this.updateUserState(userStateId, { appDisplayOrder });
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userStateId: string,
    preferences: {
      theme?: "light" | "dark" | "auto";
      language?: string;
      timezone?: string;
    }
  ): Promise<UserState> {
    return this.updateUserState(userStateId, preferences);
  }

  /**
   * Record app access
   */
  async recordAppAccess(
    userStateId: string,
    appId: string
  ): Promise<UserState> {
    const userState = await this.getUserState(userStateId);
    if (!userState) {
      throw new Error(`User state not found: ${userStateId}`);
    }

    const lastAccessedApps = {
      ...(userState.lastAccessedApps || {}),
      [appId]: new Date(),
    };

    return this.updateUserState(userStateId, {
      lastAccessedApps,
      lastActiveAt: new Date(),
    });
  }

  /**
   * Get user states by organization
   */
  async getUserStatesByOrganization(
    organizationId: string
  ): Promise<UserState[]> {
    const response = await this.client.get({
      table: this.tableName,
      params: {
        filterExpression: "#organizationId = :organizationId",
        expressionAttributeNames: { "#organizationId": "organizationId" },
        expressionAttributeValues: { ":organizationId": organizationId },
      },
    });

    if (!response.success) {
      throw new Error(
        `Failed to get user states by organization: ${response.error}`
      );
    }

    return response.data || [];
  }
}
