/**
 * Material Insights (MI) API Client
 *
 * Provides a simple interface for all MI API endpoints with proper authentication
 * Built on top of the centralized ApiClient for consistent auth header handling
 */

import { ApiClient, ApiResponse } from "@/lib/api-client";

// Initialize the API client
const apiClient = new ApiClient();

/**
 * MI API Response Types
 */
export interface ForecastData {
  metadata: {
    scope: string;
    id: string;
    window: string;
    model: string;
    asof: string;
    generated: string;
  };
  forecast: {
    baseline: number;
    prediction: number;
    confidence: number;
    trend: "increasing" | "decreasing" | "stable";
    riskLevel: "low" | "medium" | "high" | "critical";
  };
  chartData: Array<{
    period: string;
    baseline: number;
    prediction: number;
    lower: number;
    upper: number;
    fill: string;
  }>;
  priorityActions: Array<{
    id: string;
    title: string;
    description: string;
    priority: "Low" | "Medium" | "High" | "Critical";
    action: string;
    target?: string;
  }>;
}

export interface BOMData {
  metadata: {
    nodeId: string;
    depth: number;
    view: string;
    asof: string;
    generated: string;
  };
  rootNode: {
    id: string;
    name: string;
    entity: string;
    level: number;
    wbs: string;
    riskScore: number;
    costImpact: number;
    attrs: Record<string, unknown>;
    riskColor: string;
  };
  children: Array<{
    id: string;
    name: string;
    entity: string;
    level: number;
    wbs: string;
    riskScore: number;
    costImpact: number;
    hasChildren: boolean;
    chartColor: string;
    riskColor: string;
  }>;
  suppliers: Array<{
    id: string;
    name: string;
    leadDays: number;
    otifPct: number;
    unitCost: number;
    status: "good" | "concerning" | "problematic";
    chartColor: string;
  }>;
  chartData: {
    riskDistribution: Array<{
      name: string;
      risk: number;
      cost: number;
      fill: string;
    }>;
    supplierMetrics: Array<{
      name: string;
      leadTime: number;
      otd: number;
      cost: number;
      fill: string;
    }>;
  };
  priorityActions: Array<{
    id: string;
    title: string;
    description: string;
    priority: "Low" | "Medium" | "High" | "Critical";
    action: string;
    target?: string;
  }>;
}

export interface WorkbenchData {
  metadata: {
    filters: {
      status?: string;
      priority?: string;
      assignee?: string;
    };
    generated: string;
  };
  summary: {
    totalIssues: number;
    openIssues: number;
    criticalIssues: number;
    avgResolutionDays: number;
  };
  issues: Array<{
    id: string;
    title: string;
    description: string;
    status: "Open" | "In Progress" | "Resolved" | "Closed";
    priority: "Low" | "Medium" | "High" | "Critical";
    assignee: string;
    createdDate: string;
    updatedDate: string;
    tags: string[];
    aiRecommendation?: string;
    chartColor: string;
  }>;
  chartData: {
    statusDistribution: Array<{
      status: string;
      count: number;
      fill: string;
    }>;
    priorityTrend: Array<{
      month: string;
      critical: number;
      high: number;
      medium: number;
      low: number;
    }>;
  };
  priorityActions: Array<{
    id: string;
    title: string;
    description: string;
    priority: "Low" | "Medium" | "High" | "Critical";
    action: string;
    target?: string;
  }>;
}

/**
 * MI API Parameters
 */
export interface ForecastParams {
  scope?: string;
  id?: string;
  window?: string;
  model?: string;
  asof?: string;
}

export interface BOMParams {
  nodeId?: string;
  depth?: string;
  view?: string;
  asof?: string;
}

export interface WorkbenchParams {
  status?: string;
  priority?: string;
  assignee?: string;
}

/**
 * MI API Client Class
 */
export class MIApiClient {
  /**
   * Get forecast data
   */
  static async getForecast(
    params: ForecastParams = {}
  ): Promise<ApiResponse<ForecastData>> {
    const searchParams = new URLSearchParams();

    if (params.scope) searchParams.set("scope", params.scope);
    if (params.id) searchParams.set("id", params.id);
    if (params.window) searchParams.set("window", params.window);
    if (params.model) searchParams.set("model", params.model);
    if (params.asof) searchParams.set("asof", params.asof);

    const url = `/api/mi/stream/forecast${
      searchParams.toString() ? `?${searchParams}` : ""
    }`;
    return apiClient.get<ForecastData>(url);
  }

  /**
   * Get BOM data
   */
  static async getBOM(params: BOMParams = {}): Promise<ApiResponse<BOMData>> {
    const searchParams = new URLSearchParams();

    if (params.nodeId) searchParams.set("nodeId", params.nodeId);
    if (params.depth) searchParams.set("depth", params.depth);
    if (params.view) searchParams.set("view", params.view);
    if (params.asof) searchParams.set("asof", params.asof);

    const url = `/api/mi/stream/bom${
      searchParams.toString() ? `?${searchParams}` : ""
    }`;
    return apiClient.get<BOMData>(url);
  }

  /**
   * Get workbench data
   */
  static async getWorkbench(
    params: WorkbenchParams = {}
  ): Promise<ApiResponse<WorkbenchData>> {
    const searchParams = new URLSearchParams();

    if (params.status) searchParams.set("status", params.status);
    if (params.priority) searchParams.set("priority", params.priority);
    if (params.assignee) searchParams.set("assignee", params.assignee);

    const url = `/api/mi/stream/workbench${
      searchParams.toString() ? `?${searchParams}` : ""
    }`;
    return apiClient.get<WorkbenchData>(url);
  }
}

// Export a default instance for convenience
export const miApi = MIApiClient;
