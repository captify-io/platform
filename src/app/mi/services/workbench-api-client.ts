import { ApiClient } from "@/lib/api-client";

// Enhanced type definitions for Workbench API responses
export interface WorkbenchIssueDetail {
  pk: string;
  sk: string;
  type: string;
  title: string;
  status: "Analyze" | "Validate Solution" | "Qualify" | "Field" | "Monitor";
  criticality: "Critical" | "High" | "Medium" | "Low";
  description?: string;
  links: {
    nodes: string[];
    tails: string[];
    suppliers: string[];
  };
  risk: {
    micap30d: number;
    missionImpact: number;
    financialImpact: number;
  };
  streamIds: string[];
  aiRecommendation: string;
  created_at: string;
  updated_at: string;
  // Additional fields for UI display
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  progress?: number;
  comments?: number;
  attachments?: number;
  lastActivity?: string;
  riskScore?: number;
  taskCount?: number;
  completedTasks?: number;
  priorityColor?: string;
}

export interface WorkbenchDecision {
  id: string;
  issueId: string;
  title: string;
  description: string;
  decision: string;
  rationale: string;
  impact: string;
  alternatives: string[];
  risks: string[];
  implementationPlan: string;
  approvedBy: string;
  approvedDate: string;
  status: "Draft" | "Approved" | "Implemented" | "Reviewed";
  linkedParts: string[];
  financialImpact: number;
  timeline: string;
}

export interface WorkbenchPart {
  nsn: string;
  partNumber: string;
  nomenclature: string;
  system: string;
  assembly: string;
  riskScore: number;
  missionCritical: boolean;
  currentStatus: string;
  lastMaintenance: string;
  linkedIssues: string[];
  linkedDecisions: string[];
  supplier: {
    cage: string;
    name: string;
    performance: number;
  };
  stockPosture: {
    onHand: number;
    dueIn: number;
    daysOfSupply: number;
  };
}

export interface WorkbenchSummary {
  totalIssues: number;
  openIssues: number;
  criticalIssues: number;
  pendingDecisions: number;
  implementedSolutions: number;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  priorityDistribution: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
  trendData: Array<{
    month: string;
    issues: number;
    decisions: number;
    implementations: number;
  }>;
}

export interface WorkbenchData {
  metadata: {
    generated: string;
    dataType: "workbench";
    filters?: {
      status?: string;
      priority?: string;
      assignee?: string;
    };
  };
  summary: WorkbenchSummary;
  issues: WorkbenchIssueDetail[];
  chartData: {
    statusDistribution: Array<{
      name: string;
      value: number;
      fill: string;
    }>;
    priorityTrend: Array<{
      name: string;
      count: number;
      fill: string;
    }>;
  };
  priorityActions: Array<{
    id: string;
    title: string;
    description: string;
    priority: string;
    dueDate: string;
    assignee: string;
  }>;
}

// Query parameters interfaces
export interface WorkbenchParams {
  status?: "Analyze" | "Validate Solution" | "Qualify" | "Field" | "Monitor";
  priority?: "Critical" | "High" | "Medium" | "Low";
  assignee?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface WorkbenchDecisionParams {
  issueId?: string;
  status?: "Draft" | "Approved" | "Implemented" | "Reviewed";
  approver?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface WorkbenchPartParams {
  nsn?: string;
  system?: string;
  assembly?: string;
  riskThreshold?: number;
  missionCritical?: boolean;
}

// Initialize the API client
const apiClient = new ApiClient();

/**
 * Workbench API Client Class
 * Follows the same pattern as AdvancedForecastApiClient
 */
export class WorkbenchApiClient {
  /**
   * Get workbench issues with filtering and pagination
   */
  static async getIssues(
    params: WorkbenchParams = {}
  ): Promise<{ ok: boolean; data?: WorkbenchData; error?: string; status?: number }> {
    try {
      const searchParams = new URLSearchParams();

      if (params.status) searchParams.set("status", params.status);
      if (params.priority) searchParams.set("priority", params.priority);
      if (params.assignee) searchParams.set("assignee", params.assignee);
      if (params.search) searchParams.set("search", params.search);
      if (params.limit) searchParams.set("limit", params.limit.toString());
      if (params.offset) searchParams.set("offset", params.offset.toString());

      const url = `/api/mi/stream/workbench${
        searchParams.toString() ? `?${searchParams}` : ""
      }`;

      const response = await apiClient.get<WorkbenchData>(url);
      return response;
    } catch (error) {
      console.error("WorkbenchApiClient.getIssues error:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        status: 500,
      };
    }
  }

  /**
   * Get decisions for a specific issue or all decisions
   */
  static async getDecisions(
    params: WorkbenchDecisionParams = {}
  ): Promise<{ ok: boolean; data?: WorkbenchDecision[]; error?: string }> {
    try {
      const searchParams = new URLSearchParams();

      if (params.issueId) searchParams.set("issueId", params.issueId);
      if (params.status) searchParams.set("status", params.status);
      if (params.approver) searchParams.set("approver", params.approver);
      if (params.dateRange) {
        searchParams.set("startDate", params.dateRange.start);
        searchParams.set("endDate", params.dateRange.end);
      }

      const url = `/api/mi/workbench/decisions${
        searchParams.toString() ? `?${searchParams}` : ""
      }`;

      const response = await apiClient.get<WorkbenchDecision[]>(url);
      return response;
    } catch (error) {
      console.error("WorkbenchApiClient.getDecisions error:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get part details with linked issues and decisions
   */
  static async getPartDetails(
    nsn: string
  ): Promise<{ ok: boolean; data?: WorkbenchPart; error?: string }> {
    try {
      const url = `/api/mi/workbench/parts/${encodeURIComponent(nsn)}`;
      const response = await apiClient.get<WorkbenchPart>(url);
      return response;
    } catch (error) {
      console.error("WorkbenchApiClient.getPartDetails error:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Search parts with filtering
   */
  static async searchParts(
    params: WorkbenchPartParams = {}
  ): Promise<{ ok: boolean; data?: WorkbenchPart[]; error?: string }> {
    try {
      const searchParams = new URLSearchParams();

      if (params.nsn) searchParams.set("nsn", params.nsn);
      if (params.system) searchParams.set("system", params.system);
      if (params.assembly) searchParams.set("assembly", params.assembly);
      if (params.riskThreshold) {
        searchParams.set("riskThreshold", params.riskThreshold.toString());
      }
      if (params.missionCritical !== undefined) {
        searchParams.set("missionCritical", params.missionCritical.toString());
      }

      const url = `/api/mi/workbench/parts${
        searchParams.toString() ? `?${searchParams}` : ""
      }`;

      const response = await apiClient.get<WorkbenchPart[]>(url);
      return response;
    } catch (error) {
      console.error("WorkbenchApiClient.searchParts error:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get workbench analytics/summary data
   */
  static async getSummary(): Promise<{ ok: boolean; data?: WorkbenchSummary; error?: string }> {
    try {
      const url = "/api/mi/workbench/summary";
      const response = await apiClient.get<WorkbenchSummary>(url);
      return response;
    } catch (error) {
      console.error("WorkbenchApiClient.getSummary error:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export a default instance for convenience
export const workbenchApi = WorkbenchApiClient;
