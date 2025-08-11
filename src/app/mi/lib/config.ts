/**
 * Material Insights (MI) Configuration
 *
 * Centralized configuration for the MI application
 */

/**
 * MI Application Metadata
 */
export const MI_CONFIG = {
  id: "mi",
  name: "Material Insights",
  version: "1.0.0",
  description: "BOM360 - Material Insights for Defense Supply Chain Analytics",

  // Navigation configuration
  navigation: {
    defaultRoute: "/mi",
    sections: [
      { id: "forecast", name: "Demand Forecast", path: "#forecast" },
      { id: "bom-explorer", name: "BOM Explorer", path: "#bom-explorer" },
      { id: "workbench", name: "Issue Workbench", path: "#workbench" },
    ],
  },

  // API configuration
  api: {
    endpoints: {
      forecast: "/api/mi/stream/forecast",
      bom: "/api/mi/stream/bom",
      workbench: "/api/mi/stream/workbench",
    },
    defaultParams: {
      forecast: {
        scope: "tail",
        id: "60-0020",
        window: "30",
        model: "v1.3",
      },
      bom: {
        nodeId: "NODE#nsn:2840-00-123-4567",
        depth: "3",
        view: "Engineering",
      },
      workbench: {
        status: undefined,
        priority: undefined,
        assignee: undefined,
      },
    },
  },

  // Theme configuration
  theme: {
    chartColors: {
      primary: "var(--chart-1)",
      secondary: "var(--chart-2)",
      accent: "var(--chart-3)",
      warning: "var(--chart-4)",
      danger: "var(--chart-5)",
    },
    riskColors: {
      low: "hsl(var(--success))",
      medium: "hsl(var(--accent))",
      high: "hsl(var(--warning))",
      critical: "hsl(var(--destructive))",
    },
  },

  // Business logic configuration
  business: {
    riskThresholds: {
      low: 0.4,
      medium: 0.6,
      high: 0.8,
    },
    supplierThresholds: {
      leadTimeCritical: 45, // days
      otifMinimum: 0.85, // on-time in-full percentage
    },
    forecastModels: ["v1.0", "v1.1", "v1.2", "v1.3"],
    bomViews: ["Engineering", "Manufacturing", "Maintenance", "Financial"],
  },
} as const;

/**
 * Environment-specific configuration
 */
export const MI_ENV = {
  tableName: process.env.MI_DYNAMODB_TABLE || "mi-bom-graph",
  region: process.env.AWS_REGION || "us-east-1",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
} as const;

/**
 * Get risk color based on score
 */
export function getRiskColor(riskScore: number): string {
  const { riskThresholds } = MI_CONFIG.business;
  const { riskColors } = MI_CONFIG.theme;

  if (riskScore > riskThresholds.high) return riskColors.critical;
  if (riskScore > riskThresholds.medium) return riskColors.high;
  if (riskScore > riskThresholds.low) return riskColors.medium;
  return riskColors.low;
}

/**
 * Get supplier status based on metrics
 */
export function getSupplierStatus(
  leadDays: number,
  otifPct: number
): "good" | "concerning" | "problematic" {
  const { supplierThresholds } = MI_CONFIG.business;

  if (leadDays > supplierThresholds.leadTimeCritical) return "problematic";
  if (otifPct < supplierThresholds.otifMinimum) return "concerning";
  return "good";
}

/**
 * Get chart color by index
 */
export function getChartColor(index: number): string {
  const colors = Object.values(MI_CONFIG.theme.chartColors);
  return colors[index % colors.length];
}
