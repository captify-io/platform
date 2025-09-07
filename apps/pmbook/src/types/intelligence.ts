import { Core } from "@captify/core/types";

/**
 * AI Intelligence and Analytics types
 */

export interface IntelligenceAlert extends Core {
  type: "anomaly" | "trend" | "risk" | "opportunity" | "performance";
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  metric?: string;
  threshold?: number;
  value?: number;
  confidence: number;
  status: "active" | "acknowledged" | "resolved";
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface Prediction extends Core {
  type: "revenue" | "utilization" | "risk" | "satisfaction" | "performance";
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  horizon: number; // days
  factors: string[];
  methodology?: string;
  accuracy?: number;
  generatedAt: string;
  validUntil?: string;
}

export interface Insight extends Core {
  category: "performance" | "risk" | "opportunity" | "pattern" | "anomaly";
  type: "positive" | "negative" | "warning" | "informational";
  title: string;
  description: string;
  confidence: number;
  impact: "low" | "medium" | "high";
  evidence?: any[];
  recommendations?: string[];
  generatedAt: string;
  actedUpon?: boolean;
}

export interface Recommendation extends Core {
  category:
    | "resource"
    | "contract"
    | "strategic"
    | "financial"
    | "operational"
    | "predictive";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  action: string;
  impact: string;
  effort: "low" | "medium" | "high";
  confidence: number;
  timeline?: string;
  resources?: string[];
  dependencies?: string[];
  implemented?: boolean;
  implementedAt?: string;
}

export interface AnalyticsQuery {
  id: string;
  query: string;
  intent: "status" | "prediction" | "recommendation" | "analysis" | "general";
  entities: any;
  response: string;
  confidence: number;
  timestamp: string;
  userId?: string;
}

export interface TrendAnalysis {
  metric: string;
  direction: "up" | "down" | "stable";
  change: number;
  significance: number;
  period: string;
  dataPoints: number;
}
