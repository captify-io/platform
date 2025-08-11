// Material Insights Type Definitions

export interface MIConfig {
  id: string;
  slug: string;
  name: string;
  title: string;
  description: string;
  version: string;
  category: string;
  agentId: string;
  agentAliasId: string;
  database: DatabaseConfig;
  menu: MenuItem[];
  features: FeatureConfig;
  demo: DemoConfig;
  streams: StreamConfig;
  integrations: IntegrationConfig;
  ui: UIConfig;
  security: SecurityConfig;
  performance: PerformanceConfig;
}

export interface DatabaseConfig {
  tables: {
    graph: {
      tableName: string;
      schema: DynamoDBSchema;
    };
  };
}

export interface DynamoDBSchema {
  partitionKey: string;
  sortKey: string;
  attributes: Record<string, AttributeDefinition>;
  globalSecondaryIndexes: GSIDefinition[];
}

export interface AttributeDefinition {
  type: "S" | "N" | "BOOL" | "M" | "L";
  description: string;
}

export interface GSIDefinition {
  name: string;
  partitionKey: string;
  sortKey: string;
  description: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  description: string;
  isPrimary?: boolean;
}

export interface FeatureConfig {
  forecast: ForecastFeature;
  bomExplorer: BOMExplorerFeature;
  workbench: WorkbenchFeature;
  supplyChain: SupplyChainFeature;
  realTimeUpdates: RealTimeFeature;
}

export interface ForecastFeature {
  enabled: boolean;
  models: string[];
  defaultModel: string;
  windows: number[];
  defaultWindow: number;
  refreshInterval: number;
}

export interface BOMExplorerFeature {
  enabled: boolean;
  maxDepth: number;
  defaultDepth: number;
  views: string[];
  defaultView: string;
}

export interface WorkbenchFeature {
  enabled: boolean;
  stages: string[];
  priorities: string[];
  aiRecommendations: boolean;
}

export interface SupplyChainFeature {
  enabled: boolean;
  metrics: string[];
  alertThresholds: Record<string, number>;
}

export interface RealTimeFeature {
  enabled: boolean;
  updateInterval: number;
  channels: string[];
}

export interface DemoConfig {
  enabled: boolean;
  scenario: string;
  aircraft: string;
  tail: string;
  criticalComponent: CriticalComponent;
  suppliers: SupplierData[];
}

export interface CriticalComponent {
  id: string;
  name: string;
  riskScore: number;
  daysToFailure: number;
  missionImpact: number;
}

export interface SupplierData {
  cage: string;
  name: string;
  leadTime: number;
  otd: number;
  cost: number;
  status: "problematic" | "recommended" | "backup" | "good" | "monitoring";
}

export interface StreamConfig {
  forecast: StreamEndpoint;
  bom: StreamEndpoint;
  workbench: StreamEndpoint;
  supplier: StreamEndpoint;
}

export interface StreamEndpoint {
  endpoint: string;
  cacheDuration: number;
  parameters: string[];
}

export interface IntegrationConfig {
  bedrock: BedrockIntegration;
  s3: S3Integration;
  eventbridge: EventBridgeIntegration;
}

export interface BedrockIntegration {
  enabled: boolean;
  agentId: string;
  aliasId: string;
  region: string;
  capabilities: string[];
}

export interface S3Integration {
  enabled: boolean;
  bucket: string;
  documentTypes: string[];
  maxFileSize: number;
}

export interface EventBridgeIntegration {
  enabled: boolean;
  events: string[];
}

export interface UIConfig {
  theme: ThemeConfig;
  animations: AnimationConfig;
  charts: ChartConfig;
}

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  critical: string;
}

export interface AnimationConfig {
  enabled: boolean;
  duration: number;
  easing: string;
}

export interface ChartConfig {
  library: string;
  defaultColors: string[];
  responsive: boolean;
}

export interface SecurityConfig {
  dataClassification: string;
  auditLogging: boolean;
  encryptionAtRest: boolean;
  accessControl: AccessControlConfig;
}

export interface AccessControlConfig {
  organizationIsolation: boolean;
  roleBasedAccess: boolean;
  dataFiltering: boolean;
}

export interface PerformanceConfig {
  caching: CachingConfig;
  pagination: PaginationConfig;
  virtualization: VirtualizationConfig;
}

export interface CachingConfig {
  enabled: boolean;
  provider: string;
  ttl: number;
}

export interface PaginationConfig {
  defaultPageSize: number;
  maxPageSize: number;
}

export interface VirtualizationConfig {
  enabled: boolean;
  threshold: number;
}

// BOM Data Model Types
export interface BOMNode {
  pk: string;
  sk: string;
  type: EntityType;
  entity: EntityCategory;
  name: string;
  wbs?: string;
  level: number;
  attrs: Record<string, unknown>;
  version: string;
  valid_from: string;
  valid_to?: string;
  is_current: boolean;
  hash: string;
  riskScore?: number;
  costImpact?: number;
  created_at: string;
  updated_at: string;
  // GSI fields for DynamoDB access patterns
  gsi1pk?: string;
  gsi1sk?: string;
  gsi2pk?: string;
  gsi2sk?: string;
  gsi3pk?: string;
  gsi3sk?: string;
  gsi4pk?: string;
  gsi4sk?: string;
}

export interface BOMEdge {
  pk: string;
  sk: string;
  type: "EDGE";
  edge: EdgeType;
  parentId: string;
  childId: string;
  qtyPerParent: number;
  valid_from: string;
  is_current: boolean;
  version: string;
}

export interface AlternateGroup {
  pk: string;
  sk: string;
  type: "ALT";
  groupId: string;
  memberId: string;
  rank: number;
  constraints: FormFitFunction;
  valid_from: string;
  is_current: boolean;
}

export interface Supersession {
  pk: string;
  sk: string;
  type: "SUPERSESSION";
  oldId: string;
  newId: string;
  reason: string;
  valid_from: string;
  is_current: boolean;
}

export interface Effectivity {
  pk: string;
  sk: string;
  type: "EFFECTIVITY";
  scope: "TAIL" | "BLOCK" | "DATE";
  tail?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  tctoRefs: string[];
  // GSI fields for DynamoDB access patterns
  gsi1pk?: string;
  gsi1sk?: string;
  gsi2pk?: string;
  gsi2sk?: string;
  gsi3pk?: string;
  gsi3sk?: string;
  gsi4pk?: string;
  gsi4sk?: string;
}

export interface Installation {
  pk: string;
  sk: string;
  type: "INSTALL";
  tail: string;
  partId: string;
  installedOn: string;
  removedOn?: string;
  source: string;
  // GSI fields for DynamoDB access patterns
  gsi1pk?: string;
  gsi1sk?: string;
  gsi2pk?: string;
  gsi2sk?: string;
  gsi3pk?: string;
  gsi3sk?: string;
  gsi4pk?: string;
  gsi4sk?: string;
}

export interface SupplierLink {
  pk: string;
  sk: string;
  type: "SUPPLY";
  supplierId: string;
  metrics: SupplierMetrics;
  valid_from: string;
  is_current: boolean;
  // GSI fields for DynamoDB access patterns
  gsi1pk?: string;
  gsi1sk?: string;
  gsi2pk?: string;
  gsi2sk?: string;
  gsi3pk?: string;
  gsi3sk?: string;
  gsi4pk?: string;
  gsi4sk?: string;
}

export interface SupplierMetrics {
  leadDays: number;
  otifPct: number;
  escapes12m: number;
  unitCost: number;
}

export interface DocumentReference {
  pk: string;
  sk: string;
  type: "DOC";
  title?: string;
  uri?: string;
  tags?: string[];
  nodeId?: string;
  section?: string;
  page?: number;
  // GSI fields for DynamoDB access patterns
  gsi1pk?: string;
  gsi1sk?: string;
  gsi2pk?: string;
  gsi2sk?: string;
  gsi3pk?: string;
  gsi3sk?: string;
  gsi4pk?: string;
  gsi4sk?: string;
}

export interface ForecastData {
  pk: string;
  sk: string;
  type: "FORECAST";
  scope: "tail" | "system";
  id: string;
  windowDays: number;
  modelVersion: string;
  predictions?: PredictionItem[];
  top?: Array<{ entityId: string; score: number }>;
}

export interface PredictionItem {
  entityId: string;
  score: number;
  daysToFailure?: number;
  confidence?: number;
  factors?: string[];
}

export interface WorkbenchIssue {
  pk: string;
  sk: string;
  type: "ISSUE";
  title: string;
  status: WorkbenchStatus;
  criticality: Priority;
  links: IssueLinks;
  risk?: RiskMetrics;
  streamIds: string[];
  aiRecommendation?: string;
  created_at: string;
  updated_at: string;
}

export interface IssueLinks {
  nodes: string[];
  tails: string[];
  suppliers: string[];
}

export interface RiskMetrics {
  micap30d?: number;
  missionImpact?: number;
  financialImpact?: number;
}

export interface WorkbenchTask {
  pk: string;
  sk: string;
  type: "TASK";
  taskId: string;
  title: string;
  assignee: string;
  due: string;
  status: TaskStatus;
}

export interface WorkbenchDecision {
  pk: string;
  sk: string;
  type: "DECISION";
  gate: string;
  decision: string;
  basis: string[];
  effectiveFrom: string;
}

export interface ContentBlock {
  pk: string;
  sk: string;
  type: "CONTENT_REF";
  content: ContentMetadata;
  // GSI fields for DynamoDB access patterns
  gsi1pk?: string;
  gsi1sk?: string;
  gsi2pk?: string;
  gsi2sk?: string;
  gsi3pk?: string;
  gsi3sk?: string;
  gsi4pk?: string;
  gsi4sk?: string;
}

export interface ContentMetadata {
  type: "chart" | "table" | "text" | "panel";
  title: string;
  visual: "bar" | "line" | "donut" | "table" | "md";
  streamId: string;
  filters?: Record<string, unknown>;
  insight?: string;
}

// Enums and Union Types
export type EntityType =
  | "META"
  | "EDGE"
  | "ALT"
  | "SUPERSESSION"
  | "EFFECTIVITY"
  | "SUPPLY"
  | "INSTALL"
  | "DOC"
  | "ISSUE"
  | "TASK"
  | "DECISION"
  | "FORECAST"
  | "CONTENT_REF";

export type EntityCategory =
  | "Part"
  | "Assembly"
  | "System"
  | "Aircraft"
  | "Supplier"
  | "Tail"
  | "Document";

export type EdgeType =
  | "HAS_PART"
  | "SUPPLIES"
  | "INSTALLED_ON"
  | "REFERENCES"
  | "SUPERSEDES";

export type FormFitFunction = {
  form: "=" | "±" | "~";
  fit: "=" | "±" | "~";
  function: "=" | "±" | "~";
};

export type WorkbenchStatus =
  | "Intake"
  | "Analyze"
  | "Validate Solution"
  | "Qualify"
  | "Field"
  | "Monitor";

export type TaskStatus =
  | "NotStarted"
  | "InProgress"
  | "Blocked"
  | "Completed"
  | "Cancelled";

export type Priority = "Low" | "Medium" | "High" | "Critical";

// Stream Query Types
export interface StreamQuery {
  domain: string;
  route: string;
  parameters: Record<string, string>;
  asof?: string;
  model?: string;
}

// Navigation Types
export interface MINavigationState {
  page?: string;
  params?: Record<string, string>;
}

// API Response Types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface MIApiResponse<T = any> {
  data?: T;
  error?: string;
  meta?: {
    timestamp: string;
    requestId: string;
    cached?: boolean;
    source?: string;
  };
}

// Stream Response Types
export interface ForecastStreamResponse {
  predictions: Array<{
    nodeId: string;
    name: string;
    riskScore: number;
    daysToMICAP: number;
    missionImpact: number;
    recommendations: AIRecommendation[];
  }>;
  kpis: {
    predictedMICAPs: number;
    readinessImpact: number;
    atRiskSuppliers: number;
    dmsmsThreats: number;
  };
}

export interface BOMStreamResponse {
  nodes: BOMNode[];
  edges: BOMEdge[];
  alternates: AlternateGroup[];
  suppliers: SupplierLink[];
  documents: DocumentReference[];
  metadata: {
    totalNodes: number;
    maxDepth: number;
    filters: Record<string, unknown>;
  };
}

export interface WorkbenchStreamResponse {
  issues: WorkbenchIssue[];
  tasks: WorkbenchTask[];
  decisions: WorkbenchDecision[];
  summary: {
    totalIssues: number;
    criticalCount: number;
    overdueCount: number;
    avgResolutionTime: number;
  };
}

export interface SupplierStreamResponse {
  suppliers: SupplierData[];
  scorecards: SupplierScorecard[];
  alternates: AlternateAvailability[];
  alerts: SupplierAlert[];
}

export interface SupplierScorecard {
  cage: string;
  name: string;
  metrics: SupplierMetrics;
  trend: "improving" | "stable" | "declining";
  alerts: string[];
}

export interface AlternateAvailability {
  primaryPart: string;
  alternates: Array<{
    partId: string;
    availability: number;
    leadTime: number;
    costDelta: number;
    qualityRating: number;
  }>;
}

export interface SupplierAlert {
  supplierId: string;
  type: "quality" | "delivery" | "cost" | "capacity";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  triggeredAt: string;
}

export interface AIRecommendation {
  type:
    | "supplier_switch"
    | "maintenance_delay"
    | "emergency_order"
    | "alternate_part";
  title: string;
  description: string;
  confidence: number;
  costImpact: number;
  timeImpact: number;
  riskReduction: number;
  factors: string[];
}
