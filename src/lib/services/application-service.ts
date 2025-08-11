/**
 * Application Service - Database-Only Implementation
 * Pure database-driven service with no mock/demo data fallbacks
 */

import {
  ApplicationEntity,
  UserApplicationState,
  ListApplicationsQuery,
  CreateApplicationRequest,
  UpdateApplicationRequest,
} from "@/types/database";
import { applicationDb } from "./application-database";

export class ApplicationService {
  private static instance: ApplicationService;

  static getInstance(): ApplicationService {
    if (!ApplicationService.instance) {
      ApplicationService.instance = new ApplicationService();
    }
    return ApplicationService.instance;
  }

  /**
   * Get applications from database
   */
  async getApplications(query: ListApplicationsQuery) {
    const result = await applicationDb.listApplications(query);
    return {
      applications: result.applications,
      last_key: result.last_key,
      total_count: result.total_count,
    };
  }

  /**
   * Get application by ID from database
   */
  async getApplication(
    org_id: string,
    app_id: string
  ): Promise<ApplicationEntity | null> {
    return await applicationDb.getApplication(org_id, app_id);
  }

  /**
   * Get user application state from database
   */
  async getUserApplicationState(
    user_id: string,
    app_id: string
  ): Promise<UserApplicationState | null> {
    return await applicationDb.getUserApplicationState(user_id, app_id);
  }

  /**
   * Get user's applications from database
   */
  async getUserApplications(user_id: string): Promise<UserApplicationState[]> {
    return await applicationDb.getUserApplications(user_id);
  }

  /**
   * Create application in database
   */
  async createApplication(
    org_id: string,
    user_id: string,
    request: CreateApplicationRequest
  ): Promise<ApplicationEntity> {
    return await applicationDb.createApplication(org_id, user_id, request);
  }

  /**
   * Update application in database
   */
  async updateApplication(
    org_id: string,
    app_id: string,
    user_id: string,
    request: UpdateApplicationRequest
  ): Promise<ApplicationEntity> {
    return await applicationDb.updateApplication(
      org_id,
      app_id,
      user_id,
      request
    );
  }

  /**
   * Update user application state in database
   */
  async updateUserApplicationState(
    user_id: string,
    app_id: string,
    updates: Partial<UserApplicationState>
  ): Promise<UserApplicationState> {
    return await applicationDb.updateUserApplicationState(
      user_id,
      app_id,
      updates
    );
  }

  /**
   * Get applications and user states for a user
   */
  async getApplicationsWithUserStates(
    query: ListApplicationsQuery,
    user_id: string
  ): Promise<{
    applications: ApplicationEntity[];
    userStates: UserApplicationState[];
    last_key?: string;
    total_count?: number;
  }> {
    const appResult = await applicationDb.listApplications(query);
    const userStates = await applicationDb.getUserApplications(user_id);

    return {
      applications: appResult.applications,
      userStates,
      last_key: appResult.last_key,
      total_count: appResult.total_count,
    };
  }
}

// Export singleton instance
export const applicationService = ApplicationService.getInstance();
