import { Core } from "@captify/core/types";

/**
 * Business performance and health metrics
 */

export interface CompanyHealth extends Core {
  period: string;
  periodStart: string;
  periodEnd: string;

  // Financial health
  runway: number;
  runwayMonths: number;
  cashBalance: number;
  monthlyBurn: number;
  monthlyRevenue: number;
  profitMargin: number;

  // Revenue metrics
  contractedRevenue: number;
  recognizedRevenue: number;
  deferredRevenue: number;
  pipeline: number;
  winRate: number;

  // Cost metrics
  laborCosts: number;
  subcontractorCosts: number;
  odcCosts: number;
  indirectCosts: number;
  totalCosts: number;
  costPerEmployee: number;

  // Efficiency metrics
  revenuePerEmployee: number;
  utilizationRate: number;
  billableHours: number;
  nonBillableHours: number;

  // Growth metrics
  headcount: number;
  headcountGrowth: number;
  revenueGrowth: number;
  contractGrowth: number;

  // Risk indicators
  customerConcentration: number;
  contractDiversification: number;
  cashFlowRisk: "low" | "medium" | "high";

  score: number;
  trend: "improving" | "stable" | "declining";
  alerts: HealthAlert[];
}

export interface HealthAlert {
  id: string;
  type: "financial" | "operational" | "compliance" | "strategic";
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  metric?: string;
  threshold?: number;
  current?: number;
  recommendations: string[];
  relatedContracts?: string[];
  owner?: string;
}

export interface BurnAnalysis extends Core {
  period: string;

  // Labor burn
  laborHours: number;
  laborCost: number;
  overtimeCost: number;
  contractorCost: number;

  // By category
  directLabor: number;
  indirectLabor: number;
  overhead: number;
  ga: number;
  bid: number;
  ir: number;

  // Capability burn
  capabilityHours: Record<string, number>;
  capabilityCost: Record<string, number>;
  capabilityROI: Record<string, number>;

  // Contract burn
  contractBurn: Record<string, ContractBurn>;

  // Projections
  projectedMonthlyBurn: number;
  burnTrend: number;
  burnVariance: number;

  // Recommendations
  optimizations: string[];
  risks: string[];
}

export interface ContractBurn {
  contractId: string;
  periodBurn: number;
  totalBurn: number;
  remaining: number;
  burnRate: number;
  projectedCompletion: string;
  profitability: number;
  onBudget: boolean;
  variance: number;
}

export interface EmployeeValue extends Core {
  userId: string;
  period: string;

  // Value metrics
  valueDelivered: number;
  costIncurred: number;
  roi: number;
  ranking?: number;
  percentile?: number;

  // Work metrics
  capabilitiesDelivered: number;
  featuresCompleted: number;
  bugsFixed: number;
  ticketsResolved: number;

  // Time metrics
  billableHours: number;
  nonBillableHours: number;
  utilizationRate: number;
  overtimeHours: number;

  // Quality metrics
  qualityScore: number;
  reworkRate: number;
  customerSatisfaction: number;
  peerReview: number;

  // Strategic alignment
  strategicWork: number;
  criticalPathWork: number;
  innovationWork: number;

  // Team contribution
  mentorshipHours: number;
  knowledgeSharing: number;
  processImprovement: number;

  trend: "improving" | "stable" | "declining";
}

export interface TeamPerformance extends Core {
  teamId: string;
  period: string;

  // Delivery metrics
  velocity: number;
  velocityTrend: number;
  completionRate: number;
  onTimeDelivery: number;

  // Financial metrics
  teamBurn: number;
  teamRevenue: number;
  teamROI: number;
  costPerPoint: number;

  // Quality metrics
  defectRate: number;
  customerSatisfaction: number;
  technicalDebtRatio: number;
  codeQuality: number;

  // Team health
  utilization: number;
  capacity: number;
  attrition: number;
  satisfaction: number;
  collaboration: number;

  // Capability delivery
  capabilitiesDelivered: string[];
  capabilityVelocity: Record<string, number>;

  topPerformers: string[];
  improvementAreas: string[];
}

export interface FinancialForecast extends Core {
  forecastDate: string;
  horizon: "monthly" | "quarterly" | "annual";
  periods: ForecastPeriod[];

  assumptions: {
    winRate: number;
    attritionRate: number;
    growthRate: number;
    utilizationTarget: number;
  };

  scenarios: {
    best: ForecastScenario;
    likely: ForecastScenario;
    worst: ForecastScenario;
  };

  risks: string[];
  opportunities: string[];
}

export interface ForecastPeriod {
  period: string;
  revenue: number;
  costs: number;
  profit: number;
  cashFlow: number;
  headcount: number;
  contracts: number;
  confidence: number;
}

export interface ForecastScenario {
  name: string;
  probability: number;
  revenue: number;
  costs: number;
  profit: number;
  runway: number;
  breakeven?: string;
  assumptions: string[];
}
