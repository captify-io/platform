/**
 * Client-side API service for applications
 * This service makes HTTP requests to API routes instead of direct database calls
 */

import {
  ApplicationEntity,
  UserApplicationState,
  ListApplicationsQuery,
} from "@/types/database";
import { ApiClient } from "@/lib/api-client";

export interface ApplicationsWithUserStatesResponse {
  applications: ApplicationEntity[];
  userStates: UserApplicationState[];
  last_key?: string;
  total_count?: number;
}

export class ApplicationApiService {
  private static instance: ApplicationApiService;
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  static getInstance(): ApplicationApiService {
    if (!ApplicationApiService.instance) {
      ApplicationApiService.instance = new ApplicationApiService();
    }
    return ApplicationApiService.instance;
  }

  /**
   * Get applications with user states from API
   */
  async getApplicationsWithUserStates(
    query: Partial<ListApplicationsQuery> = {}
  ): Promise<ApplicationsWithUserStatesResponse> {
    const searchParams = new URLSearchParams();

    // Add query parameters
    if (query.org_id) searchParams.append("org_id", query.org_id);
    if (query.category) searchParams.append("category", query.category);
    if (query.status) searchParams.append("status", query.status);
    if (query.search) searchParams.append("search", query.search);
    if (query.template_only) searchParams.append("template_only", "true");
    if (query.limit) searchParams.append("limit", query.limit.toString());
    if (query.last_key) searchParams.append("last_key", query.last_key);

    // Use API client which automatically handles X-User-ID header and authentication
    const response =
      await this.apiClient.get<ApplicationsWithUserStatesResponse>(
        `/api/apps/with-user-states?${searchParams.toString()}`
      );

    if (!response.ok) {
      throw new Error(
        response.error ||
          `HTTP ${response.status}: Failed to fetch applications`
      );
    }

    return response.data!;
  }

  /**
   * Get applications from API
   */
  async getApplications(query: Partial<ListApplicationsQuery> = {}): Promise<{
    applications: ApplicationEntity[];
    last_key?: string;
    total_count?: number;
  }> {
    const searchParams = new URLSearchParams();

    // Add query parameters
    if (query.org_id) searchParams.append("org_id", query.org_id);
    if (query.category) searchParams.append("category", query.category);
    if (query.status) searchParams.append("status", query.status);
    if (query.search) searchParams.append("search", query.search);
    if (query.template_only) searchParams.append("template_only", "true");
    if (query.user_id) searchParams.append("user_id", query.user_id);
    if (query.limit) searchParams.append("limit", query.limit.toString());
    if (query.last_key) searchParams.append("last_key", query.last_key);

    const response = await fetch(`/api/apps?${searchParams.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          `HTTP ${response.status}: Failed to fetch applications`
      );
    }

    return await response.json();
  }

  /**
   * Update user application state
   */
  async updateUserApplicationState(
    appId: string,
    updates: Partial<UserApplicationState>
  ): Promise<UserApplicationState> {
    const response = await fetch(`/api/${appId}/user-state`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          `HTTP ${response.status}: Failed to update user state`
      );
    }

    return await response.json();
  }

  /**
   * Track application access
   */
  async trackAccess(appId: string): Promise<void> {
    const response = await fetch(`/api/apps/track-access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ app_id: appId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn("Failed to track access:", errorData.error);
      // Don't throw error for tracking failures
    }
  }
}

// Export singleton instance
export const applicationApiService = ApplicationApiService.getInstance();
