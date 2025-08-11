/**
 * Material Insights (MI) Type Definitions
 *
 * Centralized type definitions for the MI application
 */

/**
 * Base MI API Response Metadata
 */
export interface MIMetadata {
  generated: string;
  asof?: string;
}

/**
 * Priority Action Item
 */
export interface PriorityAction {
  id: string;
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  action: string;
  target?: string;
  dueDate?: string;
  assignee?: string;
}

/**
 * Chart Color Utilities
 */
export interface ChartItem {
  fill: string;
}

/**
 * Dashboard Data Types
 */
export interface DashboardKPIMetadata extends MIMetadata {
  weapon_system_id: string;
  horizon: "Now" | "12mo" | "5yr";
  dataType: "kpis";
}

export interface HeroKPI {
  id: string;
  label: string;
  value: number;
  delta: number;
  unit: string;
  lineage: string;
  lastUpdated: string;
}

export interface DashboardKPIData {
  metadata: DashboardKPIMetadata;
  kpis: HeroKPI[];
}

export interface DashboardPredictionMetadata extends MIMetadata {
  weapon_system_id: string;
  horizon: "Now" | "12mo" | "5yr";
  page: number;
  total_pages: number;
  total_items: number;
  dataType: "predictions";
  data_lineage: string;
}

export interface PartInfo {
  nsn: string;
  pn: string;
  nomenclature: string;
}

export interface ProjectedImpact {
  micap_days: number;
  sorties_at_risk: number;
  cost_impact: number;
}

export interface StockPosture {
  on_hand: number;
  due_in: number;
  lead_time_days: number;
}

export interface SupplierSignal {
  otd_percent: number;
  pqdr_rate: number;
  quality_trend: "improving" | "stable" | "declining";
}

export interface PredictionRow {
  id: string;
  part: PartInfo;
  risk_score: number;
  confidence: number;
  predicted_window: string;
  leading_indicators: string[];
  projected_impact: ProjectedImpact;
  stock_posture: StockPosture;
  supplier_signal: SupplierSignal;
  recommendation: "Inspect" | "Replace" | "Derate" | "TCTO candidate";
  tail_context: string;
}

export interface PagingInfo {
  current_page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface DashboardPredictionData {
  metadata: DashboardPredictionMetadata;
  predictions: PredictionRow[];
  paging: PagingInfo;
}

/**
 * Forecast Data Types
 */
export interface ForecastMetadata extends MIMetadata {
  scope: string;
  id: string;
  window: string;
  model: string;
}

export interface ForecastPrediction {
  baseline: number;
  prediction: number;
  confidence: number;
  trend: "increasing" | "decreasing" | "stable";
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface ForecastChartPoint extends ChartItem {
  period: string;
  baseline: number;
  prediction: number;
  lower: number;
  upper: number;
}

export interface ForecastData {
  metadata: ForecastMetadata;
  forecast: ForecastPrediction;
  chartData: ForecastChartPoint[];
  priorityActions: PriorityAction[];
}

/**
 * BOM Data Types
 */
export interface BOMMetadata extends MIMetadata {
  nodeId: string;
  depth: number;
  view: string;
}

export interface BOMNode {
  id: string;
  name: string;
  entity: string;
  level: number;
  wbs: string;
  riskScore: number;
  costImpact: number;
  attrs?: Record<string, unknown>;
  riskColor: string;
}

export interface BOMChild extends BOMNode, ChartItem {
  hasChildren: boolean;
  chartColor: string;
}

export interface BOMSupplier extends ChartItem {
  id: string;
  name: string;
  leadDays: number;
  otifPct: number;
  unitCost: number;
  status: "good" | "concerning" | "problematic";
  chartColor: string;
}

export interface BOMRiskDistribution extends ChartItem {
  name: string;
  risk: number;
  cost: number;
}

export interface BOMSupplierMetric extends ChartItem {
  name: string;
  leadTime: number;
  otd: number;
  cost: number;
}

export interface BOMChartData {
  riskDistribution: BOMRiskDistribution[];
  supplierMetrics: BOMSupplierMetric[];
}

export interface BOMData {
  metadata: BOMMetadata;
  rootNode: BOMNode;
  children: BOMChild[];
  suppliers: BOMSupplier[];
  chartData: BOMChartData;
  priorityActions: PriorityAction[];
}

/**
 * Workbench Data Types
 */
export interface WorkbenchMetadata extends MIMetadata {
  filters: Record<string, string>;
  totalIssues: number;
  filteredIssues: number;
}

export interface WorkbenchSummary {
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface WorkbenchIssue extends ChartItem {
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
  riskScore: number;
  missionImpact: number;
  taskCount: number;
  completedTasks: number;
  links?: Array<{ type: string; url: string; title: string }>;
}

export interface WorkbenchStatusDistribution extends ChartItem {
  status: string;
  count: number;
}

export interface WorkbenchPriorityTrend {
  month: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface WorkbenchChartData {
  statusDistribution: Array<{ name: string; value: number; color: string }>;
  priorityDistribution: Array<{ name: string; value: number; color: string }>;
}

export interface WorkbenchData {
  metadata: WorkbenchMetadata;
  summary: WorkbenchSummary;
  issues: WorkbenchIssue[];
  charts: WorkbenchChartData;
  priorityActions?: PriorityAction[];
}

/**
 * API Parameters
 */
export interface ForecastParams {
  scope?: string;
  id?: string;
  window?: string;
  model?: string;
  asof?: string;
}

export interface DashboardKPIParams {
  weapon_system_id?: string;
  horizon?: "Now" | "12mo" | "5yr";
  scenario?: "Baseline" | "What-if";
}

export interface DashboardPredictionParams {
  weapon_system_id?: string;
  horizon?: "Now" | "12mo" | "5yr";
  page?: string;
  sort?: string;
  filters?: Record<string, string>;
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

export interface SupplyChainParams {
  supplier?: string;
  risk?: string;
  category?: string;
  region?: string;
}

// Internal API parameter types with required fields
export interface ProcessedBOMParams {
  nodeId: string;
  depth: string;
  view: string;
  asof: string;
}

/**
 * Supply Chain Insights Data Types
 */
export interface SupplierHealth {
  id: string;
  name: string;
  performanceScore: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  onTimeDelivery: number;
  qualityRating: number;
  criticalParts: number;
  totalParts: number;
  lastAssessment: string;
  financialHealth: "Stable" | "Watch" | "Risk";
  region: string;
  certification: string[];
  recentIssues: number;
  avgLeadTime: number;
  priceVariance: number;
}

export interface PartAvailability {
  partNumber: string;
  description: string;
  currentStock: number;
  minimumStock: number;
  maxStock: number;
  availabilityStatus: "Available" | "Low" | "Critical" | "Out of Stock";
  primarySupplier: string;
  alternateSuppliers: string[];
  leadTime: number;
  lastRestocked: string;
  demandForecast: number;
  riskFactors: string[];
  unitCost: number;
  category: string;
}

export interface SupplyRisk {
  id: string;
  title: string;
  category: "Supplier" | "Geographic" | "Financial" | "Quality" | "Capacity";
  severity: "Low" | "Medium" | "High" | "Critical";
  probability: number;
  impact: number;
  affectedParts: number;
  mitigation: string;
  owner: string;
  dueDate: string;
  status: "Open" | "In Progress" | "Mitigated" | "Closed";
}

export interface SupplyChainSummary {
  totalSuppliers: number;
  criticalSuppliers: number;
  partsAtRisk: number;
  averageLeadTime: number;
  supplyChainHealth: number;
}

export interface SupplyChainCharts {
  supplierPerformance: Array<{ name: string; score: number; color: string }>;
  riskDistribution: Array<{ name: string; value: number; color: string }>;
  availabilityTrend: Array<{
    month: string;
    available: number;
    critical: number;
  }>;
  leadTimeTrend: Array<{ month: string; avgLeadTime: number; target: number }>;
}

export interface SupplyChainData {
  suppliers: SupplierHealth[];
  partAvailability: PartAvailability[];
  supplyRisks: SupplyRisk[];
  summary: SupplyChainSummary;
  charts: SupplyChainCharts;
}
