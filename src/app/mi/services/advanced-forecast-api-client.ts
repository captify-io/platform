import { ApiClient } from "@/lib/api-client";

// Type definitions for API responses
export interface RiskForecastData {
  nsn: string;
  part_number: string;
  nomenclature: string;
  system: string;
  assembly: string;
  horizon_days: 90 | 180 | 270 | 365;
  risk_score: number;
  confidence: number;
  days_of_supply: number;
  lead_time_days: number;
  supplier_otd_percent: number;
  assistance_requests: {
    depot_202: number;
    field_107: number;
    dla_339: number;
  };
  maintenance_flags: string[];
  projected_micap_days: number;
  bom_mapped: boolean;
  supplier_cage?: string;
  supplier_name?: string;
}

export interface AdvancedForecastKPIs {
  total_parts_at_risk: number;
  projected_micap_days: number;
  avg_days_of_supply: number;
  avg_supplier_otd: number;
  total_open_assistance_requests: number;
  risk_distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  trend_indicators: {
    risk_trend: "increasing" | "stable" | "decreasing";
    supply_chain_stress: number;
  };
}

export interface ChartDataResponse {
  chart_type:
    | "risk_trend"
    | "dos_distribution"
    | "assistance_request_trend"
    | "supplier_performance_trend";
  scope: string;
  horizon_days: number;
  data_points: any[];
  metadata?: {
    total_points: number;
    date_range?: {
      start: string;
      end: string;
    };
  };
}

export interface AssistanceRequestData {
  request_id: string;
  type: "202" | "107" | "339";
  type_description: string;
  nsn: string;
  part_number?: string;
  nomenclature?: string;
  date: string;
  status: "open" | "closed" | "pending";
  summary: string;
  linked_supplier?: string;
  supplier_cage?: string;
  urgency: "low" | "moderate" | "high" | "critical";
  days_open: number;
  risk_score?: number;
}

export interface SupplierPerformanceData {
  supplier_cage: string;
  supplier_name: string;
  month: string;
  otd_percent: number;
  pqdr_rate: number;
  lead_time_days: number;
  lead_time_variance: number;
  performance_tier: "tier_1" | "tier_2" | "tier_3";
  parts_supplied: number;
  total_orders: number;
  risk_score: number;
  health_status: "healthy" | "at_risk" | "critical";
}

// Query parameters interfaces
export interface RiskScoresParams {
  horizon?: 90 | 180 | 270 | 365;
  system?: string;
  assembly?: string;
  limit?: number;
  riskThreshold?: number;
}

export interface KPIsParams {
  horizon?: 90 | 180 | 270 | 365;
  system?: string;
  assembly?: string;
}

export interface ChartDataParams {
  type:
    | "risk_trend"
    | "dos_distribution"
    | "assistance_request_trend"
    | "supplier_performance_trend";
  horizon?: 90 | 180 | 270 | 365;
  scope?: string;
}

export interface AssistanceRequestsParams {
  nsn?: string;
  type?: "202" | "107" | "339";
  status?: "open" | "closed" | "pending";
  limit?: number;
  summary?: boolean;
}

export interface SupplierPerformanceParams {
  supplier?: string;
  month?: string;
  tier?: "tier_1" | "tier_2" | "tier_3";
  health?: "healthy" | "at_risk" | "critical";
  limit?: number;
  summary?: boolean;
}

/**
 * Advanced Forecasting API Client
 * Provides centralized access to all advanced forecasting endpoints
 */
export class AdvancedForecastApiClient {
  private static baseUrl = "/api/mi/advanced-forecast";
  private static apiClient = new ApiClient();

  /**
   * Get risk scores for parts with optional filtering
   */
  static async getRiskScores(params: RiskScoresParams = {}): Promise<{
    data: RiskForecastData[];
    metadata: any;
  }> {
    const searchParams = new URLSearchParams();

    if (params.horizon) searchParams.set("horizon", params.horizon.toString());
    if (params.system) searchParams.set("system", params.system);
    if (params.assembly) searchParams.set("assembly", params.assembly);
    if (params.limit) searchParams.set("limit", params.limit.toString());
    if (params.riskThreshold)
      searchParams.set("riskThreshold", params.riskThreshold.toString());

    const url = `${this.baseUrl}/risk-scores?${searchParams.toString()}`;
    const response = await this.apiClient.get(url);
    return response.data as { data: RiskForecastData[]; metadata: any };
  }

  /**
   * Get KPI summary data for the dashboard
   */
  static async getKPIs(params: KPIsParams = {}): Promise<{
    data: AdvancedForecastKPIs;
    metadata: any;
  }> {
    const searchParams = new URLSearchParams();

    if (params.horizon) searchParams.set("horizon", params.horizon.toString());
    if (params.system) searchParams.set("system", params.system);
    if (params.assembly) searchParams.set("assembly", params.assembly);

    const url = `${this.baseUrl}/kpis?${searchParams.toString()}`;
    const response = await this.apiClient.get(url);
    return response.data as { data: AdvancedForecastKPIs; metadata: any };
  }

  /**
   * Get chart data for visualization
   */
  static async getChartData(
    params: ChartDataParams
  ): Promise<ChartDataResponse> {
    const searchParams = new URLSearchParams();

    searchParams.set("type", params.type);
    if (params.horizon) searchParams.set("horizon", params.horizon.toString());
    if (params.scope) searchParams.set("scope", params.scope);

    const url = `${this.baseUrl}/charts?${searchParams.toString()}`;
    const response = await this.apiClient.get(url);
    return response.data as ChartDataResponse;
  }

  /**
   * Get assistance request data
   */
  static async getAssistanceRequests(
    params: AssistanceRequestsParams = {}
  ): Promise<{
    data: AssistanceRequestData[] | any; // 'any' for summary response
    metadata: any;
  }> {
    const searchParams = new URLSearchParams();

    if (params.nsn) searchParams.set("nsn", params.nsn);
    if (params.type) searchParams.set("type", params.type);
    if (params.status) searchParams.set("status", params.status);
    if (params.limit) searchParams.set("limit", params.limit.toString());
    if (params.summary) searchParams.set("summary", "true");

    const url = `${
      this.baseUrl
    }/assistance-requests?${searchParams.toString()}`;
    const response = await this.apiClient.get(url);
    return response.data as {
      data: AssistanceRequestData[] | any;
      metadata: any;
    };
  }

  /**
   * Get supplier performance data
   */
  static async getSupplierPerformance(
    params: SupplierPerformanceParams = {}
  ): Promise<{
    data: SupplierPerformanceData[] | any; // 'any' for summary response
    metadata: any;
  }> {
    const searchParams = new URLSearchParams();

    if (params.supplier) searchParams.set("supplier", params.supplier);
    if (params.month) searchParams.set("month", params.month);
    if (params.tier) searchParams.set("tier", params.tier);
    if (params.health) searchParams.set("health", params.health);
    if (params.limit) searchParams.set("limit", params.limit.toString());
    if (params.summary) searchParams.set("summary", "true");

    const url = `${this.baseUrl}/suppliers?${searchParams.toString()}`;
    const response = await this.apiClient.get(url);
    return response.data as {
      data: SupplierPerformanceData[] | any;
      metadata: any;
    };
  }

  /**
   * Get all chart data for the dashboard (batch request)
   */
  static async getAllCharts(horizon: 90 | 180 | 270 | 365 = 90): Promise<{
    riskTrend: ChartDataResponse;
    dosDistribution: ChartDataResponse;
    assistanceRequestTrend: ChartDataResponse;
    supplierPerformanceTrend: ChartDataResponse;
  }> {
    const chartTypes = [
      "risk_trend",
      "dos_distribution",
      "assistance_request_trend",
      "supplier_performance_trend",
    ] as const;

    const promises = chartTypes.map((type) =>
      this.getChartData({ type, horizon })
    );

    const results = await Promise.all(promises);

    return {
      riskTrend: results[0],
      dosDistribution: results[1],
      assistanceRequestTrend: results[2],
      supplierPerformanceTrend: results[3],
    };
  }

  /**
   * Get comprehensive dashboard data (KPIs + Charts)
   */
  static async getDashboardData(
    params: {
      horizon?: 90 | 180 | 270 | 365;
      system?: string;
      assembly?: string;
    } = {}
  ): Promise<{
    kpis: AdvancedForecastKPIs;
    charts: {
      riskTrend: ChartDataResponse;
      dosDistribution: ChartDataResponse;
      assistanceRequestTrend: ChartDataResponse;
      supplierPerformanceTrend: ChartDataResponse;
    };
    metadata: any;
  }> {
    const horizon = params.horizon || 90;

    const [kpisResult, chartsResult] = await Promise.all([
      this.getKPIs(params),
      this.getAllCharts(horizon),
    ]);

    return {
      kpis: kpisResult.data,
      charts: chartsResult,
      metadata: {
        horizon,
        filters: params,
        last_updated: new Date().toISOString(),
      },
    };
  }
}
