/**
 * Material Insights (MI) API Client
 *
 * Provides a simple interface for all MI API endpoints with proper authentication
 * Built on top of the centralized ApiClient for consistent auth header handling
 */

import { ApiClient, ApiResponse } from "@/lib/api-client";
import type {
  ForecastData,
  BOMData,
  WorkbenchData,
  DashboardKPIData,
  DashboardPredictionData,
  SupplyChainData,
  ForecastParams,
  BOMParams,
  WorkbenchParams,
  DashboardKPIParams,
  DashboardPredictionParams,
  SupplyChainParams,
} from "../types";

// Initialize the API client
const apiClient = new ApiClient();

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
   * Get dashboard KPIs
   */
  static async getDashboardKPIs(
    params: DashboardKPIParams = {}
  ): Promise<ApiResponse<DashboardKPIData>> {
    const searchParams = new URLSearchParams();

    if (params.weapon_system_id)
      searchParams.set("weapon_system_id", params.weapon_system_id);
    if (params.horizon) searchParams.set("horizon", params.horizon);
    if (params.scenario) searchParams.set("scenario", params.scenario);
    searchParams.set("kpi_type", "all");

    const url = `/api/mi/stream/forecast?${searchParams}`;
    return apiClient.get<DashboardKPIData>(url);
  }

  /**
   * Get dashboard predictions (Top-10 Risk Panel)
   */
  static async getDashboardPredictions(
    params: DashboardPredictionParams = {}
  ): Promise<ApiResponse<DashboardPredictionData>> {
    const searchParams = new URLSearchParams();

    if (params.weapon_system_id)
      searchParams.set("weapon_system_id", params.weapon_system_id);
    if (params.horizon) searchParams.set("horizon", params.horizon);
    if (params.page) searchParams.set("page", params.page);
    if (params.sort) searchParams.set("sort", params.sort);
    searchParams.set("prediction_scope", "top10");

    const url = `/api/mi/stream/forecast?${searchParams}`;
    return apiClient.get<DashboardPredictionData>(url);
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

  /**
   * Get supply chain insights data
   */
  static async getSupplyChainInsights(
    params: SupplyChainParams = {}
  ): Promise<ApiResponse<SupplyChainData>> {
    const searchParams = new URLSearchParams();

    if (params.supplier) searchParams.set("supplier", params.supplier);
    if (params.risk) searchParams.set("risk", params.risk);
    if (params.category) searchParams.set("category", params.category);
    if (params.region) searchParams.set("region", params.region);

    const url = `/api/mi/stream/supply-chain${
      searchParams.toString() ? `?${searchParams}` : ""
    }`;
    return apiClient.get<SupplyChainData>(url);
  }
}

// Export a default instance for convenience
export const miApi = MIApiClient;
