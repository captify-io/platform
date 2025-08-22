/**
 * Organization Service
 * CRUD operations for Organization table using CaptifyClient
 */

import { CaptifyClient } from "../../src/api/client";
import type { Organization } from "../../src/types";
import { UUID } from "crypto";

export class OrganizationService {
  private client: CaptifyClient;
  private tableName = "core-Organization";

  constructor(session?: any) {
    this.client = new CaptifyClient({ session });
  }

  /**
   * Create a new organization
   */
  async createOrganization(
    data: Omit<Organization, "orgId">
  ): Promise<Organization> {
    const orgId = crypto.randomUUID() as UUID;
    const organization: Organization = {
      orgId,
      ...data,
    };

    const response = await this.client.post({
      table: this.tableName,
      item: organization,
    });

    if (!response.success) {
      throw new Error(`Failed to create organization: ${response.error}`);
    }

    return organization;
  }

  /**
   * Get organization by ID
   */
  async getOrganization(orgId: string): Promise<Organization | null> {
    const response = await this.client.get({
      table: this.tableName,
      key: { orgId },
    });

    if (!response.success) {
      throw new Error(`Failed to get organization: ${response.error}`);
    }

    return response.data || null;
  }

  /**
   * Update an existing organization
   */
  async updateOrganization(
    orgId: string,
    updates: Partial<Omit<Organization, "orgId">>
  ): Promise<Organization> {
    const response = await this.client.put({
      table: this.tableName,
      key: { orgId },
      item: updates,
    });

    if (!response.success) {
      throw new Error(`Failed to update organization: ${response.error}`);
    }

    return response.data;
  }

  /**
   * Delete an organization
   */
  async deleteOrganization(orgId: string): Promise<void> {
    const response = await this.client.delete({
      table: this.tableName,
      key: { orgId },
    });

    if (!response.success) {
      throw new Error(`Failed to delete organization: ${response.error}`);
    }
  }

  /**
   * List all organizations
   */
  async listOrganizations(params?: {
    limit?: number;
    filter?: Record<string, any>;
  }): Promise<Organization[]> {
    const response = await this.client.get({
      table: this.tableName,
      params: {
        limit: params?.limit || 50,
        ...(params?.filter && { filterExpression: params.filter }),
      },
    });

    if (!response.success) {
      throw new Error(`Failed to list organizations: ${response.error}`);
    }

    return response.data || [];
  }

  /**
   * Search organizations by domain
   */
  async getOrganizationByDomain(domain: string): Promise<Organization | null> {
    const response = await this.client.get({
      table: this.tableName,
      params: {
        filterExpression: "#domain = :domain",
        expressionAttributeNames: { "#domain": "domain" },
        expressionAttributeValues: { ":domain": domain },
      },
    });

    if (!response.success) {
      throw new Error(
        `Failed to search organization by domain: ${response.error}`
      );
    }

    const organizations = response.data || [];
    return organizations.length > 0 ? organizations[0] : null;
  }
}
