/**
 * Ontology Type Definitions
 *
 * All entities extend Core from @captify-io/core/types
 * Base fields (id, slug, tenantId, name, app, order, fields, description,
 * ownerId, createdAt, createdBy, updatedAt, updatedBy) are inherited.
 *
 * Reference: specification.md for complete entity definitions
 */

import { Core, Agent, AgentType, AgentStatus, AgentWorkflow, Provider, ProviderType, ProviderStatus, ProviderModel, ProviderModelStatus, ModelCapability } from "@captify-io/core/types";

// ===============================================================
// LIFECYCLE & STATUS TYPES
// ===============================================================

export type LifecycleStage =
  | "ideation"
  | "validation"
  | "prototype"
  | "operational"
  | "continuous"
  | "retired";

export type Priority = "low" | "medium" | "high" | "critical" | "urgent";

export type TaskStatus = "todo" | "in-progress" | "blocked" | "done";

export type TicketStatus = "open" | "in-progress" | "resolved" | "closed";

export type PipelineStatus = "active" | "paused" | "failed" | "retired";

export type ReportStatus = "draft" | "pending-approval" | "approved" | "invoiced";

export type ReportType = "monthly" | "quarterly" | "milestone" | "final";

export type ContractStatus = "active" | "completed" | "terminated";

export type CLINStatus = "active" | "exhausted" | "closed";

export type GovernanceType = "ato" | "poam" | "risk-assessment" | "audit" | "compliance-check";

export type GovernanceStatus = "open" | "in-review" | "approved" | "closed";

export type Sentiment = "positive" | "neutral" | "negative";

export type FeedbackCategory = "bug" | "feature-request" | "improvement" | "question";

export type ModelFramework = "pytorch" | "tensorflow" | "sklearn" | "bedrock" | "sagemaker" | "custom";

export type ModelStatus = "training" | "deployed" | "retired";

// AgentStatus is imported from @captify-io/core/types below (line ~296)

export type SystemType = "internal" | "external" | "saas" | "custom";

export type SystemStatus = "active" | "deprecated" | "maintenance";

export type ApplicationStatus = "active" | "inactive" | "development";

export type FeatureStatus = "planned" | "in-development" | "released" | "deprecated";

export type PipelineType = "batch" | "streaming" | "realtime";

export type DataFormat = "parquet" | "csv" | "json" | "avro" | "delta";

export type Trend = "up" | "down" | "stable";

// ===============================================================
// STRATEGY & OUTCOMES
// ===============================================================

export interface KPI {
  name: string;
  target: number;
  actual?: number;
  unit: string;
  trend?: Trend;
}

export interface ROIModel {
  expectedReturn: number;
  actualReturn?: number;
  investmentCost: number;
  timeToValue?: number; // months
}

export interface Risk {
  description: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  mitigation?: string;
  status: "Open" | "Mitigated" | "Accepted";
}

export interface LineOfEffort {
  id: string;
  name: string;
  objectives: string[];
}

export interface StrategyGovernance {
  reviewFrequency?: string;
  owner?: string;
  reporting?: string;
}

export interface Strategy extends Core {
  ownerTeam: string;
  priority?: Priority;
  status: "active" | "archived" | "draft";
  category?: string;
  version?: string;
  effectiveDate?: string;
  startDate?: string;
  endDate?: string;
  targetHorizon?: string;
  vision?: string;
  mission?: string;
  strategyPillars?: string[];
  linesOfEffort?: LineOfEffort[];
  linkedObjectives?: string[];
  linkedOutcomes?: string[];
  linkedCapabilities?: string[];
  linkedPrograms?: string[];
  governance?: StrategyGovernance;
  metrics?: Record<string, any>;
  kpis?: Record<string, any>;
  dependencies?: string[];
  outcomes?: string[]; // Legacy field
}

export interface Outcome extends Core {
  /** Core identity - inherited from Core: id, name, slug, description **/

  /** Strategic context **/
  hypothesis?: string;
  objectiveId?: string;
  owner?: string;
  category?: "Mission" | "Business" | "Operational" | "Strategic";
  priority?: "High" | "Medium" | "Low";
  status?: "Planned" | "Committed" | "Active" | "Sustaining" | "Retired";
  horizon?: "Now" | "1-2 Years" | "3+ Years";

  /** Performance & economics **/
  kpis: KPI[];
  roi?: ROIModel;
  baselineDate?: string;
  lastEvaluated?: string;
  readinessScore?: number;
  confidenceLevel?: number;

  /** Relationships **/
  linkedObjectives?: string[];
  linkedCapabilities?: string[];
  linkedUseCases?: string[];
  linkedTasks?: string[];
  linkedReports?: string[];
  linkedContracts?: string[];

  /** Governance & metadata **/
  risks?: Risk[];
  dependencies?: string[];

  // Legacy fields for compatibility
  strategyId?: string;
  clinId?: string;
  maturity?: LifecycleStage;
  metrics?: Record<string, any>;
  targetDate?: string;
  actualDate?: string;
}

export interface UseCase extends Core {
  stage: LifecycleStage;
  outcomes: string[];
  dependencies: string[];
  priority: Priority;
  owner: string;
}

export interface Capability extends Core {
  outcomeId: string;
  stage: LifecycleStage;
  linkedUseCaseId?: string;  // POC that proved this works
  priority: Priority;
  owner: string;
  fundingSource?: string;    // CLIN or budget
  technicalRequirements: Record<string, any>;
  dependencies: string[];
  deliverables: string[];
  metrics: Record<string, any>;
  targetDate?: string;
  actualDate?: string;
}

export interface Objective extends Core {
  ownerTeam: string;
  priority: Priority;
  linkedOutcomes: string[];
  metrics: Record<string, any>;
  status: "active" | "on-hold" | "completed" | "archived";
  targetDate?: string;
}

// ===============================================================
// OPERATIONS
// ===============================================================

export interface Task extends Core {
  team: string;
  lifecycleStage: LifecycleStage;
  outcomes: string[];
  relatedEntity?: string;
  relatedEntityType?: "UseCase" | "Capability" | "Outcome";
  relatedTickets: string[];
  deliverables: string[];
  metrics: Record<string, any>;
  status: TaskStatus;
  dueDate?: string;
  assignee?: string;
}

export interface Ticket extends Core {
  title: string;
  sourceTeam: string;
  targetTeam: string;
  relatedThing: string;
  relatedThingType: string;
  priority: Priority;
  status: TicketStatus;
  dueDate?: string;
}

// ===============================================================
// ONTOLOGY THINGS - DATA & ML
// ===============================================================

export interface DataProduct extends Core {
  sources: string[];
  consumers: string[];
  lifecycleStage: LifecycleStage;
  metrics: Record<string, any>;
  governance: Record<string, any>;

  // AWS Glue integration - references to Glue resources
  glueDatabase?: string;        // AWS Glue Database name
  glueTable?: string;           // AWS Glue Table name
  glueCrawler?: string;         // AWS Glue Crawler name
  glueJobName?: string;         // AWS Glue ETL Job name

  schema: Record<string, any>;
  location: string;             // S3 location or other storage
  format: DataFormat;
}

export interface Model extends Core {
  dataProducts: string[];
  retrainingSchedule?: string;
  performanceMetrics: Record<string, any>;
  ownerTeam: string;
  version: string;
  framework: ModelFramework;

  // AWS SageMaker integration - references to SageMaker resources
  sageMakerModelName?: string;      // SageMaker Model name
  sageMakerEndpoint?: string;       // SageMaker Endpoint name
  sageMakerTrainingJob?: string;    // Training Job ARN
  modelPackageArn?: string;         // Model Package ARN from Model Registry

  endpoint?: string;
  status: ModelStatus;
}

// ===============================================================
// LLM PROVIDERS & MODELS
// ===============================================================
// Re-export from core to avoid circular dependency
// These are imported above and re-exported here for convenience
export type { Provider, ProviderType, ProviderStatus, ProviderModel, ProviderModelStatus, ModelCapability };

// ===============================================================
// AGENTS & WORKFLOWS
// ===============================================================
// Re-export from core to avoid circular dependency
// These are imported above and re-exported here for convenience
export type { Agent, AgentType, AgentStatus, AgentWorkflow };

export interface System extends Core {
  integrations: string[];
  delivers: string[];
  capabilities: string[];
  metrics: Record<string, any>;
  type: SystemType;
  url?: string;
  apiEndpoint?: string;
  status: SystemStatus;
}

export interface Capability extends Core {
  deliveredBySystem: string;
  outcomes: string[];
  maturity: LifecycleStage;
  refreshCadence?: string;
  dependencies: string[];
}

// ===============================================================
// APPLICATIONS & FEATURES
// ===============================================================

export interface OntologyApplication extends Core {
  features: string[];
  systems: string[];
  outcomes: string[];
  type: "web" | "mobile" | "api" | "service";
  url?: string;
  status: ApplicationStatus;
}

export interface Feature extends Core {
  parentApp: string;
  metrics: Record<string, any>;
  enabledByModels: string[];
  enabledByAgents: string[];
  status: FeatureStatus;
}

export interface Pipeline extends Core {
  source: string;
  target: string;
  status: PipelineStatus;
  metrics: Record<string, any>;
  schedule?: string;
  type: PipelineType;
  glueJobName?: string;
}

// ===============================================================
// PROGRAM MANAGEMENT
// ===============================================================

export interface Report extends Core {
  outcomes: string[];
  clins: string[];
  evidence: string[];
  generatedOn: string;
  approvedBy?: string;
  approvedOn?: string;
  status: ReportStatus;
  reportType: ReportType;
}

export interface Contract extends Core {
  contractNumber: string;
  customer: string;
  startDate: string;
  endDate: string;
  clins: string[];
  totalValue: number;
  status: ContractStatus;
}

export interface CLIN extends Core {
  number: string;
  contractId: string;
  fundingAmount: number;
  outcomes: string[];
  spentAmount: number;
  remainingAmount: number;
  period?: string;
  status: CLINStatus;
}

// ===============================================================
// METRICS & GOVERNANCE
// ===============================================================

export interface Metric extends Core {
  relatedEntityId: string;
  relatedEntityType: string;
  value: number;
  target: number;
  unit: string;
  lastUpdated: string;
  trend: Trend;
}

export interface GovernanceRecord extends Core {
  type: GovernanceType;
  status: GovernanceStatus;
  reviewedOn?: string;
  ownerTeam: string;
  relatedEntityId: string;
  relatedEntityType: string;
  findings?: string;
  remediation?: string;
}

export interface Feedback extends Core {
  source: string;
  comment: string;
  sentiment: Sentiment;
  relatedThing: string;
  relatedThingType: string;
  createdOn: string;
  category: FeedbackCategory;
}

// ===============================================================
// ONTOLOGY GRAPH
// ===============================================================

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  properties?: Record<string, any>;
}

export interface OntologyGraph extends Core {
  nodes: GraphNode[];
  edges: GraphEdge[];
  updatedOn: string;
  version: number;
  isSnapshot: boolean;
}

// ===============================================================
// HELPER TYPES FOR API RESPONSES
// ===============================================================

export type OntologyEntity =
  | Strategy
  | Objective
  | Outcome
  | UseCase
  | Capability
  | Task
  | Ticket
  | DataProduct
  | Model
  | Agent
  | System
  | OntologyApplication
  | Feature
  | Pipeline
  | Report
  | Contract
  | CLIN
  | Metric
  | GovernanceRecord
  | Feedback
  | OntologyGraph;

export type EntityType =
  | "Strategy"
  | "Objective"
  | "Outcome"
  | "UseCase"
  | "Capability"
  | "Task"
  | "Ticket"
  | "DataProduct"
  | "Model"
  | "Agent"
  | "System"
  | "Application"
  | "Feature"
  | "Pipeline"
  | "Report"
  | "Contract"
  | "CLIN"
  | "Metric"
  | "GovernanceRecord"
  | "Feedback"
  | "OntologyGraph";

export interface EntityRelationship {
  sourceId: string;
  sourceType: EntityType;
  targetId: string;
  targetType: EntityType;
  relationType: string;
}

// ===============================================================
// TABLE NAME CONSTANTS
// ===============================================================

export const ONTOLOGY_TABLES = {
  STRATEGY: "core-Strategy",
  OBJECTIVE: "core-Objective",
  OUTCOME: "core-Outcome",
  USE_CASE: "core-UseCase",
  CAPABILITY: "core-Capability",
  TASK: "core-Task",
  TICKET: "core-Ticket",
  DATA_PRODUCT: "core-DataProduct",
  MODEL: "core-Model",
  AGENT: "core-Agent",
  SYSTEM: "core-System",
  APPLICATION: "core-Application",
  FEATURE: "core-Feature",
  PIPELINE: "core-Pipeline",
  REPORT: "core-Report",
  CONTRACT: "core-Contract",
  CLIN: "core-CLIN",
  METRIC: "core-Metric",
  GOVERNANCE: "core-GovernanceRecord",
  FEEDBACK: "core-Feedback",
  ONTOLOGY_GRAPH: "core-OntologyGraph",
} as const;

export type OntologyTableName = typeof ONTOLOGY_TABLES[keyof typeof ONTOLOGY_TABLES];
