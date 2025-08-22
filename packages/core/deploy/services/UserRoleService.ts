/**
 * User Role Service
 * CRUD operations for UserRole table using CaptifyClient
 */

import { CaptifyClient } from "../../src/api/client";
import type { UserRole } from "../../src/types";
import { UUID } from "crypto";

export class UserRoleService {
  private client: CaptifyClient;
  private tableName = "core-UserRole";

  constructor(session?: any) {
    this.client = new CaptifyClient({ session });
  }

  /**
   * Create a new user role
   */
  async createRole(data: Omit<UserRole, "roleId">): Promise<UserRole> {
    const roleId = crypto.randomUUID() as UUID;
    const role: UserRole = {
      roleId,
      ...data,
    };

    const response = await this.client.post({
      table: this.tableName,
      item: role,
    });

    if (!response.success) {
      throw new Error(`Failed to create role: ${response.error}`);
    }

    return role;
  }

  /**
   * Get role by ID
   */
  async getRole(roleId: string): Promise<UserRole | null> {
    const response = await this.client.get({
      table: this.tableName,
      key: { roleId },
    });

    if (!response.success) {
      throw new Error(`Failed to get role: ${response.error}`);
    }

    return response.data || null;
  }

  /**
   * Get role by name
   */
  async getRoleByName(name: string): Promise<UserRole | null> {
    const response = await this.client.get({
      table: this.tableName,
      params: {
        filterExpression: "#name = :name",
        expressionAttributeNames: { "#name": "name" },
        expressionAttributeValues: { ":name": name },
      },
    });

    if (!response.success) {
      throw new Error(`Failed to get role by name: ${response.error}`);
    }

    const roles = response.data || [];
    return roles.length > 0 ? roles[0] : null;
  }

  /**
   * Update an existing role
   */
  async updateRole(
    roleId: string,
    updates: Partial<Omit<UserRole, "roleId">>
  ): Promise<UserRole> {
    const response = await this.client.put({
      table: this.tableName,
      key: { roleId },
      item: updates,
    });

    if (!response.success) {
      throw new Error(`Failed to update role: ${response.error}`);
    }

    return response.data;
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: string): Promise<void> {
    const response = await this.client.delete({
      table: this.tableName,
      key: { roleId },
    });

    if (!response.success) {
      throw new Error(`Failed to delete role: ${response.error}`);
    }
  }

  /**
   * List all roles
   */
  async listRoles(params?: {
    limit?: number;
    searchName?: string;
  }): Promise<UserRole[]> {
    let requestParams: any = {
      limit: params?.limit || 50,
    };

    if (params?.searchName) {
      requestParams.filterExpression = "contains(#name, :searchName)";
      requestParams.expressionAttributeNames = { "#name": "name" };
      requestParams.expressionAttributeValues = {
        ":searchName": params.searchName,
      };
    }

    const response = await this.client.get({
      table: this.tableName,
      params: requestParams,
    });

    if (!response.success) {
      throw new Error(`Failed to list roles: ${response.error}`);
    }

    return response.data || [];
  }

  /**
   * Add permission to role
   */
  async addPermissionToRole(
    roleId: string,
    permission: string
  ): Promise<UserRole> {
    const role = await this.getRole(roleId);
    if (!role) {
      throw new Error(`Role not found: ${roleId}`);
    }

    const updatedPermissions = [...new Set([...role.permissions, permission])];
    return this.updateRole(roleId, { permissions: updatedPermissions });
  }

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(
    roleId: string,
    permission: string
  ): Promise<UserRole> {
    const role = await this.getRole(roleId);
    if (!role) {
      throw new Error(`Role not found: ${roleId}`);
    }

    const updatedPermissions = role.permissions.filter((p) => p !== permission);
    return this.updateRole(roleId, { permissions: updatedPermissions });
  }

  /**
   * Set all permissions for a role
   */
  async setRolePermissions(
    roleId: string,
    permissions: string[]
  ): Promise<UserRole> {
    return this.updateRole(roleId, { permissions: [...new Set(permissions)] });
  }
}
