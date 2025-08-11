import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });

export interface Organization {
  org_id: string;
  name: string;
  display_name: string;
  domain: string;
  status: string;
  subscription_tier: string;
  settings: {
    max_users: number;
    max_applications: number;
    allow_custom_apps: boolean;
    require_approval: boolean;
  };
}

class OrganizationService {
  private static instance: OrganizationService;
  private organizationCache: Map<string, Organization> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate = 0;

  static getInstance(): OrganizationService {
    if (!OrganizationService.instance) {
      OrganizationService.instance = new OrganizationService();
    }
    return OrganizationService.instance;
  }

  async getOrganizations(): Promise<Organization[]> {
    await this.refreshCacheIfNeeded();
    return Array.from(this.organizationCache.values());
  }

  async getOrganizationById(orgId: string): Promise<Organization | null> {
    await this.refreshCacheIfNeeded();
    return this.organizationCache.get(orgId) || null;
  }

  async getOrganizationByDomain(domain: string): Promise<Organization | null> {
    await this.refreshCacheIfNeeded();
    const orgs = Array.from(this.organizationCache.values());
    return orgs.find((org) => org.domain === domain) || null;
  }

  async getDefaultOrganization(): Promise<Organization | null> {
    await this.refreshCacheIfNeeded();
    const orgs = Array.from(this.organizationCache.values());
    // For now, return the first organization (Anautics)
    return orgs[0] || null;
  }

  async getDefaultOrganizationId(): Promise<string> {
    const org = await this.getDefaultOrganization();
    if (!org) {
      throw new Error("No default organization found");
    }
    return org.org_id;
  }

  private async refreshCacheIfNeeded(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCacheUpdate > this.cacheExpiry) {
      await this.refreshCache();
      this.lastCacheUpdate = now;
    }
  }

  private async refreshCache(): Promise<void> {
    try {
      const result = await client.send(
        new ScanCommand({
          TableName: "captify-organizations",
        })
      );

      this.organizationCache.clear();

      if (result.Items) {
        for (const item of result.Items) {
          const org: Organization = {
            org_id: item.org_id?.S || "",
            name: item.name?.S || "",
            display_name: item.display_name?.S || "",
            domain: item.domain?.S || "",
            status: item.status?.S || "active",
            subscription_tier: item.subscription_tier?.S || "basic",
            settings: {
              max_users: parseInt(item.settings?.M?.max_users?.N || "10"),
              max_applications: parseInt(
                item.settings?.M?.max_applications?.N || "5"
              ),
              allow_custom_apps:
                item.settings?.M?.allow_custom_apps?.BOOL || false,
              require_approval:
                item.settings?.M?.require_approval?.BOOL || true,
            },
          };
          this.organizationCache.set(org.org_id, org);
        }
      }
    } catch (error) {
      console.error("Failed to refresh organization cache:", error);
    }
  }
}

export const organizationService = OrganizationService.getInstance();
