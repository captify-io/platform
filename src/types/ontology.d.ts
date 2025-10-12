/**
 * Ontology Type Definitions
 *
 * All entities extend Core from @captify-io/core/types
 * Base fields (id, slug, tenantId, name, app, order, fields, description,
 * ownerId, createdAt, createdBy, updatedAt, updatedBy) are inherited.
 *
 * Reference: specification.md for complete entity definitions
 */
import { Core } from "@captify-io/core/types";
export type LifecycleStage = "ideation" | "validation" | "prototype" | "operational" | "continuous" | "retired";
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
export type AgentStatus = "active" | "inactive" | "testing";
export type SystemType = "internal" | "external" | "saas" | "custom";
export type SystemStatus = "active" | "deprecated" | "maintenance";
export type ApplicationStatus = "active" | "inactive" | "development";
export type FeatureStatus = "planned" | "in-development" | "released" | "deprecated";
export type PipelineType = "batch" | "streaming" | "realtime";
export type DataFormat = "parquet" | "csv" | "json" | "avro" | "delta";
export type Trend = "up" | "down" | "stable";
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
    timeToValue?: number;
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
    outcomes?: string[];
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
    linkedUseCaseId?: string;
    priority: Priority;
    owner: string;
    fundingSource?: string;
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
export interface DataProduct extends Core {
    sources: string[];
    consumers: string[];
    lifecycleStage: LifecycleStage;
    metrics: Record<string, any>;
    governance: Record<string, any>;
    glueDatabase?: string;
    glueTable?: string;
    glueCrawler?: string;
    glueJobName?: string;
    schema: Record<string, any>;
    location: string;
    format: DataFormat;
}
export interface Model extends Core {
    dataProducts: string[];
    retrainingSchedule?: string;
    performanceMetrics: Record<string, any>;
    ownerTeam: string;
    version: string;
    framework: ModelFramework;
    sageMakerModelName?: string;
    sageMakerEndpoint?: string;
    sageMakerTrainingJob?: string;
    modelPackageArn?: string;
    endpoint?: string;
    status: ModelStatus;
}
export type ProviderType = 'openai' | 'anthropic' | 'bedrock' | 'custom';
export type ProviderStatus = 'active' | 'deprecated' | 'maintenance';
export interface Provider extends Core {
    type: ProviderType;
    status: ProviderStatus;
    vendor: string;
    config: {
        apiKeyRequired: boolean;
        apiKeyEnvVar?: string;
        baseUrl?: string;
        headers?: Record<string, string>;
        timeout?: number;
        supportsStreaming: boolean;
        supportsTools: boolean;
        supportsVision: boolean;
    };
    features: {
        streaming: boolean;
        functionCalling: boolean;
        vision: boolean;
        embeddings: boolean;
    };
    aws?: {
        region: string;
        discoverable: boolean;
        lastDiscovery?: string;
    };
}
export type ModelCapability = 'text' | 'chat' | 'completion' | 'embedding' | 'vision' | 'code';
export type ProviderModelStatus = 'available' | 'deprecated' | 'preview';
export interface ProviderModel extends Core {
    providerId: string;
    modelId: string;
    status: ProviderModelStatus;
    capabilities: ModelCapability[];
    limits: {
        maxTokens: number;
        contextWindow: number;
    };
    defaults: {
        temperature: number;
        topP?: number;
        maxTokens?: number;
    };
    features: {
        streaming: boolean;
        tools: boolean;
        vision: boolean;
        jsonMode: boolean;
    };
    pricing?: {
        inputTokens: number;
        outputTokens: number;
        currency: string;
    };
}
export interface Agent extends Core {
    type: 'bedrock' | 'openai' | 'anthropic' | 'custom' | 'workflow';
    status: AgentStatus;
    providerId?: string;
    modelId?: string;
    config: {
        bedrockAgentId?: string;
        bedrockAgentAliasId?: string;
        bedrockAgentArn?: string;
        knowledgeBaseId?: string;
        guardrailId?: string;
        workflowId?: string;
        systemPrompt?: string;
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        tools?: string[];
    };
    ui?: {
        icon?: string;
        color?: string;
        avatar?: string;
        greeting?: string;
        placeholder?: string;
    };
    linkedOutcomes?: string[];
    linkedCapabilities?: string[];
    modelRef?: string;
    guardrailPolicy?: string;
    knowledgeBase?: string;
    agentId?: string;
    agentAliasId?: string;
    instructions?: string;
}
export interface AgentWorkflow extends Core {
    agentId: string;
    nodes: any[];
    edges: any[];
    settings: {
        timeout?: number;
        maxRetries?: number;
        parallelExecution?: boolean;
    };
    version: number;
    publishedVersion?: number;
    publishedAt?: string;
    status: 'draft' | 'published' | 'archived';
}
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
export type OntologyEntity = Strategy | Objective | Outcome | UseCase | Capability | Task | Ticket | DataProduct | Model | Agent | System | OntologyApplication | Feature | Pipeline | Report | Contract | CLIN | Metric | GovernanceRecord | Feedback | OntologyGraph;
export type EntityType = "Strategy" | "Objective" | "Outcome" | "UseCase" | "Capability" | "Task" | "Ticket" | "DataProduct" | "Model" | "Agent" | "System" | "Application" | "Feature" | "Pipeline" | "Report" | "Contract" | "CLIN" | "Metric" | "GovernanceRecord" | "Feedback" | "OntologyGraph";
export interface EntityRelationship {
    sourceId: string;
    sourceType: EntityType;
    targetId: string;
    targetType: EntityType;
    relationType: string;
}
export declare const ONTOLOGY_TABLES: {
    readonly STRATEGY: "core-Strategy";
    readonly OBJECTIVE: "core-Objective";
    readonly OUTCOME: "core-Outcome";
    readonly USE_CASE: "core-UseCase";
    readonly CAPABILITY: "core-Capability";
    readonly TASK: "core-Task";
    readonly TICKET: "core-Ticket";
    readonly DATA_PRODUCT: "core-DataProduct";
    readonly MODEL: "core-Model";
    readonly AGENT: "core-Agent";
    readonly SYSTEM: "core-System";
    readonly APPLICATION: "core-Application";
    readonly FEATURE: "core-Feature";
    readonly PIPELINE: "core-Pipeline";
    readonly REPORT: "core-Report";
    readonly CONTRACT: "core-Contract";
    readonly CLIN: "core-CLIN";
    readonly METRIC: "core-Metric";
    readonly GOVERNANCE: "core-GovernanceRecord";
    readonly FEEDBACK: "core-Feedback";
    readonly ONTOLOGY_GRAPH: "core-OntologyGraph";
};
export type OntologyTableName = typeof ONTOLOGY_TABLES[keyof typeof ONTOLOGY_TABLES];
//# sourceMappingURL=ontology.d.ts.map