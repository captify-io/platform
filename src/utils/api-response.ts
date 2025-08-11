/**
 * Utility functions for handling standardized API responses
 * Ensures compatibility with all component types (charts, tables, metrics, dashboards)
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  data: T;
  metadata: {
    lastUpdated: string;
    dataType: "timeseries" | "snapshot" | "aggregate" | "list";
    source: string;
    count: number;
    units?: Record<string, string>;
  };
  schema?: {
    fields: Array<{
      name: string;
      type: "string" | "number" | "date" | "boolean";
      label: string;
      description?: string;
    }>;
  };
}

/**
 * Transform standardized API response for chart components
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformForChart(response: ApiResponse): any[] {
  const { data, metadata } = response;

  // If already an array (timeseries), return as-is
  if (Array.isArray(data)) {
    return data;
  }

  // For single metrics, create a simple time series
  if (metadata.dataType === "snapshot" && typeof data === "object") {
    const value = data.value ?? data;
    return [
      {
        name: "Current",
        value: typeof value === "number" ? value : 0,
        timestamp: metadata.lastUpdated,
      },
    ];
  }

  // For aggregates, convert to chart-friendly format
  if (metadata.dataType === "aggregate" && typeof data === "object") {
    return Object.entries(data).map(([key, value]) => ({
      name: key.replace(/_/g, " ").toUpperCase(),
      value: typeof value === "number" ? value : 0,
    }));
  }

  // Fallback: wrap primitive in array
  return [{ name: "Value", value: data }];
}

/**
 * Transform standardized API response for table components
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformForTable(response: ApiResponse): any[] {
  const { data } = response;

  // If already an array, return as-is
  if (Array.isArray(data)) {
    return data;
  }

  // For objects, convert to single-row table
  if (typeof data === "object") {
    return [data];
  }

  // For primitives, create basic row
  return [{ value: data }];
}

/**
 * Transform standardized API response for metric components
 */
export function transformForMetric(response: ApiResponse): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  trend?: number;
  units?: string;
  lastUpdated: string;
} {
  const { data, metadata } = response;

  // For objects with value field (new standardized format)
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    if ("value" in data) {
      return {
        value: data.value,
        trend: data.trend,
        units: metadata.units?.value,
        lastUpdated: metadata.lastUpdated,
      };
    }

    // For legacy objects, try to extract meaningful value
    const possibleValue =
      data.count || data.total || data.metric || data.result;
    if (possibleValue !== undefined) {
      return {
        value: possibleValue,
        units: metadata.units ? Object.values(metadata.units)[0] : undefined,
        lastUpdated: metadata.lastUpdated,
      };
    }
  }

  // For primitive values (legacy format)
  if (typeof data === "number" || typeof data === "string") {
    return {
      value: data,
      units: metadata.units ? Object.values(metadata.units)[0] : undefined,
      lastUpdated: metadata.lastUpdated,
    };
  }

  // Fallback
  return {
    value: "N/A",
    lastUpdated: metadata.lastUpdated,
  };
}

/**
 * Transform standardized API response for dashboard components
 */
export function transformForDashboard(
  response: ApiResponse
): Record<string, unknown> {
  const { data } = response;

  // If already an object, return as-is
  if (typeof data === "object" && !Array.isArray(data)) {
    return data;
  }

  // For arrays, convert to summary object
  if (Array.isArray(data)) {
    return {
      total_items: data.length,
      data_available: true,
    };
  }

  // For primitives, create basic dashboard
  return { value: data };
}

/**
 * Detect if API response follows the standardized format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isStandardizedResponse(response: any): response is ApiResponse {
  return (
    response &&
    typeof response === "object" &&
    "data" in response &&
    "metadata" in response &&
    response.metadata &&
    typeof response.metadata === "object" &&
    "lastUpdated" in response.metadata &&
    "dataType" in response.metadata
  );
}

/**
 * Migrate legacy API response to standardized format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateToStandardFormat(legacyResponse: any): ApiResponse {
  // Handle legacy format like { data: value, lastUpdated: timestamp }
  if (
    legacyResponse &&
    typeof legacyResponse === "object" &&
    "data" in legacyResponse
  ) {
    const data = legacyResponse.data;

    // If data is primitive, wrap it for metrics
    const wrappedData =
      typeof data === "number" || typeof data === "string"
        ? { value: data }
        : data;

    return {
      data: wrappedData,
      metadata: {
        lastUpdated: legacyResponse.lastUpdated || new Date().toISOString(),
        dataType: Array.isArray(data) ? "list" : "snapshot",
        source: "legacy_api",
        count: Array.isArray(data) ? data.length : 1,
        units: {},
      },
    };
  }

  // Handle direct data without wrapper
  const wrappedData =
    typeof legacyResponse === "number" || typeof legacyResponse === "string"
      ? { value: legacyResponse }
      : legacyResponse;

  return {
    data: wrappedData,
    metadata: {
      lastUpdated: new Date().toISOString(),
      dataType: Array.isArray(legacyResponse) ? "list" : "snapshot",
      source: "legacy_api",
      count: Array.isArray(legacyResponse) ? legacyResponse.length : 1,
      units: {},
    },
  };
}
