/**
 * Monitor Types - OSCAL-compliant types for ATO management
 * Extends Core types to create DynamoDB tables automatically
 */

import { Core } from "@captify/core/types";

/**
 * OSCAL Control Catalog - NIST 800-53 Rev 5
 */
export interface OscalControl extends Core {
  controlId: string; // e.g., "AC-2"
  family: string; // e.g., "Access Control"
  title: string;
  description: string;
  guidance: string;
  parameters?: ControlParameter[];
  props?: Record<string, any>;
  links?: ControlLink[];
  parts?: ControlPart[];
  impact: "low" | "moderate" | "high";
  priority: "P0" | "P1" | "P2" | "P3";
  baselines: string[]; // Which baselines include this control
}

export interface ControlParameter {
  id: string;
  label: string;
  guidelines?: string;
  values?: string[];
  select?: ParameterSelection;
}

export interface ParameterSelection {
  howMany?: "one" | "one-or-more";
  choice?: string[];
}

export interface ControlLink {
  href: string;
  rel: string;
  text?: string;
}

export interface ControlPart {
  id: string;
  name: string;
  title?: string;
  prose?: string;
  parts?: ControlPart[];
}

/**
 * Control Implementation & Assessment
 */
export interface ControlAssessment extends Core {
  controlId: string;
  status:
    | "compliant"
    | "non-compliant"
    | "not-applicable"
    | "partial"
    | "planned"
    | "unknown";
  implementationStatus:
    | "implemented"
    | "partial"
    | "planned"
    | "alternative"
    | "not-applicable";

  // OSCAL Assessment Results
  assessmentMethod: "examine" | "interview" | "test" | "automated";
  lastAssessment: Date;
  nextReview: Date;
  assessor: string;

  // Security Hub Integration
  securityHubFindings?: SecurityHubFinding[];
  automatedStatus?: "pass" | "fail" | "unknown";
  automatedScore?: number;

  // Evidence & Documentation
  evidence: Evidence[];
  implementationDetails?: string;
  compensatingControls?: string[];

  // Responsibility
  responsibleRole: string;
  responsibleParty: string;
  systemOwner: string;

  // Risk Management
  riskRating?: "critical" | "high" | "medium" | "low" | "very-low";
  inheritedRisk?: boolean;
  sharedResponsibility?: SharedResponsibility;
}

export interface SharedResponsibility {
  provider: string; // e.g., "AWS"
  providerResponsibility: string;
  consumerResponsibility: string;
  inheritedControls: string[];
}

export interface SecurityHubFinding {
  id: string;
  productArn: string;
  generatorId: string;
  awsAccountId: string;
  types: string[];
  title: string;
  description: string;
  severity: FindingSeverity;
  compliance?: ComplianceInfo;
  resources: Resource[];
  remediation?: Remediation;
  workflowState: "NEW" | "ASSIGNED" | "IN_PROGRESS" | "DEFERRED" | "RESOLVED";
  recordState: "ACTIVE" | "ARCHIVED";
  relatedFindings?: RelatedFinding[];
}

export interface FindingSeverity {
  label: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
  normalized: number; // 0-100
  original?: string;
}

export interface ComplianceInfo {
  status: "PASSED" | "FAILED" | "WARNING" | "NOT_AVAILABLE";
  relatedRequirements: string[]; // NIST control IDs
  statusReasons?: StatusReason[];
}

export interface StatusReason {
  reasonCode: string;
  description: string;
}

export interface Resource {
  type: string;
  id: string;
  partition?: string;
  region?: string;
  tags?: Record<string, string>;
  details?: any;
}

export interface Remediation {
  recommendation?: {
    text: string;
    url?: string;
  };
}

export interface RelatedFinding {
  productArn: string;
  id: string;
}

/**
 * Evidence Management
 */
export interface Evidence extends Core {
  controlId: string;
  type:
    | "document"
    | "screenshot"
    | "log"
    | "report"
    | "config"
    | "test-result"
    | "scan-result";
  title: string;

  // Storage
  s3Bucket?: string;
  s3Key?: string;
  url?: string;
  content?: string; // For small text-based evidence

  // Metadata
  collectionDate: Date;
  collector: string;
  automated: boolean;
  source: string; // Which service/tool generated this

  // Validation
  hash?: string;
  signature?: string;
  validated: boolean;
  validatedBy?: string;
  validatedDate?: Date;

  // Retention
  retentionDate?: Date;
  classification?: "public" | "internal" | "confidential" | "restricted";
}

/**
 * System Security Plan (SSP) - OSCAL compliant
 */
export interface SystemSecurityPlan extends Core {
  systemId: string;
  systemName: string;
  systemDescription: string;
  systemOwner: string;

  // OSCAL SSP Metadata
  version: string;
  revisionDate: Date;
  publicationDate?: Date;
  lastModified: Date;

  // System Characteristics
  systemType:
    | "major-application"
    | "general-support-system"
    | "minor-application";
  operationalStatus:
    | "operational"
    | "under-development"
    | "under-major-modification"
    | "disposition";

  // Security Categorization (FIPS 199)
  confidentialityImpact: "low" | "moderate" | "high";
  integrityImpact: "low" | "moderate" | "high";
  availabilityImpact: "low" | "moderate" | "high";
  overallImpact: "low" | "moderate" | "high";

  // System Boundary
  authorizationBoundary: SystemBoundary;
  networkDiagrams?: NetworkDiagram[];
  dataFlowDiagrams?: DataFlowDiagram[];

  // Components
  systemComponents: SystemComponent[];
  systemInventory?: Inventory[];

  // Users
  systemUsers: SystemUser[];
  privilegedUsers?: PrivilegedUser[];

  // Implementation
  controlImplementations: ControlImplementation[];
}

export interface SystemBoundary {
  description: string;
  diagrams?: string[]; // URLs to diagrams
  networkSegments?: NetworkSegment[];
  dataFlows?: DataFlow[];
}

export interface NetworkSegment {
  name: string;
  description: string;
  ipRange?: string;
  vpcId?: string;
  subnetIds?: string[];
  securityGroups?: string[];
}

export interface DataFlow {
  source: string;
  destination: string;
  dataType: string;
  protocol?: string;
  encryption?: string;
}

export interface NetworkDiagram {
  title: string;
  description?: string;
  url: string;
  lastUpdated: Date;
}

export interface DataFlowDiagram {
  title: string;
  description?: string;
  url: string;
  lastUpdated: Date;
}

export interface SystemComponent {
  componentId: string;
  componentType:
    | "software"
    | "hardware"
    | "service"
    | "policy"
    | "procedure"
    | "process"
    | "guidance";
  title: string;
  description: string;
  purpose?: string;
  responsibleRoles?: string[];
  props?: Record<string, any>;

  // AWS specific
  awsService?: string;
  awsResourceType?: string;
  awsResourceIds?: string[];
}

export interface Inventory {
  assetId: string;
  assetType: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  location?: string;
  owner?: string;
  custodian?: string;
}

export interface SystemUser {
  userType: string;
  privileges: string[];
  authorizedPrivileges?: string[];
  functionsPerformed?: string[];
}

export interface PrivilegedUser {
  userId: string;
  role: string;
  privileges: string[];
  justification: string;
}

export interface ControlImplementation {
  controlId: string;
  implementedRequirements: ImplementedRequirement[];
}

export interface ImplementedRequirement {
  controlId: string;
  uuid?: string;
  description: string;
  responsible_roles?: string[];
  statements?: ImplementationStatement[];
  by_components?: ComponentImplementation[];
}

export interface ImplementationStatement {
  statementId: string;
  description: string;
  uuid?: string;
  by_components?: ComponentImplementation[];
}

export interface ComponentImplementation {
  componentUuid: string;
  description: string;
  export?: ExportDescription;
  inherited?: InheritedControl[];
  satisfied?: SatisfiedControl[];
}

export interface ExportDescription {
  description?: string;
  provided?: ProvidedControl[];
  responsibilities?: ResponsibilityDescription[];
}

export interface ProvidedControl {
  uuid: string;
  description: string;
}

export interface ResponsibilityDescription {
  uuid: string;
  description: string;
  responsible_roles?: string[];
}

export interface InheritedControl {
  uuid: string;
  provided_uuid?: string;
  description: string;
}

export interface SatisfiedControl {
  uuid: string;
  responsibility_uuid?: string;
  description: string;
}

/**
 * POA&M (Plan of Action & Milestones) - OSCAL compliant
 */
export interface POAM extends Core {
  poamId: string;
  systemId: string;

  // Finding/Weakness
  findingId?: string; // Security Hub finding ID
  controlId: string;
  weakness: string;
  description: string;

  // Risk Assessment
  riskRating: "critical" | "high" | "medium" | "low" | "very-low";
  likelihood: "certain" | "likely" | "possible" | "unlikely" | "rare";
  impact: "very-high" | "high" | "moderate" | "low" | "very-low";

  // Remediation Plan
  remediationPlan: string;
  milestones: Milestone[];
  resources: POAMResource[];

  // Dates
  identifiedDate: Date;
  scheduledCompletion: Date;
  actualCompletion?: Date;

  // Status
  status: "open" | "in-progress" | "completed" | "cancelled" | "delayed";
  percentComplete: number;

  // Ownership
  pocName: string;
  pocEmail: string;
  pocPhone?: string;

  // Verification
  verificationMethod?: string;
  verifiedBy?: string;
  verifiedDate?: Date;

  // OSCAL specific
  uuid?: string;
  origins?: POAMOrigin[];
  relatedObservations?: string[];
  relatedRisks?: string[];
}

export interface Milestone {
  milestoneId: string;
  title: string;
  description: string;
  scheduledCompletion: Date;
  actualCompletion?: Date;
  status: "pending" | "in-progress" | "completed" | "missed";
  responsibleParty: string;
  remarks?: string;
}

export interface POAMResource {
  resourceType: "personnel" | "technology" | "funding" | "other";
  description: string;
  required: string;
  allocated?: string;
}

export interface POAMOrigin {
  actor: "tool" | "assessment" | "organization" | "person";
  type:
    | "vulnerability-scan"
    | "penetration-test"
    | "audit"
    | "incident"
    | "other";
}

/**
 * Policies and Procedures - OSCAL compliant
 */
export interface Policy extends Core {
  policyId: string;
  title: string;
  type: "policy" | "procedure" | "standard" | "guideline" | "sop";

  // Versioning
  version: string;
  effectiveDate: Date;
  nextReview: Date;
  lastReviewed?: Date;

  // Content
  abstract: string;
  purpose: string;
  scope: string;
  statement: string;

  // Document Management
  documentUrl?: string;
  s3Bucket?: string;
  s3Key?: string;
  content?: string; // Markdown or HTML content

  // Relationships
  relatedControls: string[]; // NIST control IDs
  supersedes?: string; // Previous policy ID
  relatedPolicies?: string[];

  // Approval
  owner: string;
  approver: string;
  approvalDate?: Date;
  approvalStatus: "draft" | "pending" | "approved" | "expired";

  // Training & Acknowledgment
  requiresAcknowledgment: boolean;
  requiresTraining: boolean;
  trainingMaterial?: string;

  // OSCAL Metadata
  uuid?: string;
  metadata?: OscalMetadata;
  backMatter?: BackMatter;
}

export interface OscalMetadata {
  title: string;
  published?: Date;
  lastModified: Date;
  version: string;
  oscalVersion: string;
  authors?: Author[];
  props?: Property[];
  links?: Link[];
  roles?: MonitorRole[];
  locations?: Location[];
  parties?: Party[];
  responsibleParties?: ResponsibleParty[];
}

export interface Author {
  name?: string;
  email?: string;
  org?: string;
}

export interface Property {
  name: string;
  value: string;
  uuid?: string;
  ns?: string;
  class?: string;
}

export interface Link {
  href: string;
  rel?: string;
  mediaType?: string;
  text?: string;
}

export interface MonitorRole {
  id: string;
  title: string;
  shortName?: string;
  description?: string;
}

export interface Location {
  uuid: string;
  title?: string;
  address?: Address;
  emailAddresses?: string[];
  telephoneNumbers?: TelephoneNumber[];
  urls?: string[];
}

export interface Address {
  type?: "home" | "work";
  addressLines?: string[];
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface TelephoneNumber {
  type?: "home" | "office" | "mobile";
  number: string;
}

export interface Party {
  uuid: string;
  type: "person" | "organization";
  name?: string;
  shortName?: string;
  emailAddresses?: string[];
  telephoneNumbers?: TelephoneNumber[];
  addresses?: Address[];
  locationUuids?: string[];
  memberOfOrganizations?: string[];
}

export interface ResponsibleParty {
  roleId: string;
  partyUuids: string[];
}

export interface BackMatter {
  resources?: BackMatterResource[];
}

export interface BackMatterResource {
  uuid: string;
  title?: string;
  description?: string;
  props?: Property[];
  documentIds?: DocumentId[];
  citation?: Citation;
  rlinks?: ResourceLink[];
  base64?: Base64;
  remarks?: string;
}

export interface DocumentId {
  scheme?: string;
  identifier: string;
}

export interface Citation {
  text: string;
  props?: Property[];
  links?: Link[];
}

export interface ResourceLink {
  href: string;
  mediaType?: string;
  hashes?: Hash[];
}

export interface Hash {
  algorithm: string;
  value: string;
}

export interface Base64 {
  filename?: string;
  mediaType?: string;
  value: string;
}

/**
 * Change Request Management
 */
export interface ChangeRequest extends Core {
  requestId: string;
  title: string;
  description: string;

  // Classification
  changeType:
    | "configuration"
    | "infrastructure"
    | "application"
    | "security"
    | "process"
    | "emergency";
  priority: "critical" | "high" | "medium" | "low";

  // Impact Analysis
  impactedSystems: string[];
  impactedControls: ControlImpact[];
  riskAssessment: RiskAssessment;

  // Planning
  implementationPlan: string;
  testPlan: string;
  rollbackPlan: string;

  // Schedule
  requestedDate: Date;
  scheduledDate?: Date;
  completedDate?: Date;

  // Approval Workflow
  requestor: string;
  approvals: Approval[];
  status:
    | "draft"
    | "pending"
    | "approved"
    | "implementing"
    | "completed"
    | "rejected"
    | "cancelled";

  // Post-Implementation
  implementationNotes?: string;
  validationResults?: ValidationResult[];
  lessonsLearned?: string;
}

export interface ControlImpact {
  controlId: string;
  impactType: "enhance" | "degrade" | "none";
  description: string;
  mitigations?: string;
}

export interface RiskAssessment {
  overallRisk: "critical" | "high" | "medium" | "low";
  technicalRisk: string;
  businessRisk: string;
  securityRisk: string;
  mitigations: string[];
}

export interface Approval {
  approver: string;
  role: string;
  decision: "approved" | "rejected" | "pending";
  comments?: string;
  date?: Date;
}

export interface ValidationResult {
  validator: string;
  date: Date;
  result: "pass" | "fail" | "partial";
  notes: string;
}

/**
 * Compliance Tasks - For ATO team management
 */
export interface ComplianceTask extends Core {
  taskId: string;
  title: string;
  description: string;

  // Task Type
  taskType:
    | "assessment"
    | "evidence-collection"
    | "review"
    | "remediation"
    | "documentation"
    | "approval";
  automated: boolean;

  // Related Items
  controlId?: string;
  poamId?: string;
  policyId?: string;

  // Assignment
  assignedTo?: string;
  assignedTeam?: string;
  assignedRole?: string;

  // Schedule
  frequency?:
    | "once"
    | "daily"
    | "weekly"
    | "monthly"
    | "quarterly"
    | "annually"
    | "continuous";
  dueDate?: Date;
  completedDate?: Date;
  lastExecuted?: Date;
  nextExecution?: Date;

  // Automation
  automationScript?: string;
  automationService?: string; // Lambda, SSM, etc.
  automationParameters?: Record<string, any>;

  // Status
  status: "pending" | "in-progress" | "completed" | "failed" | "cancelled";
  completionPercentage?: number;

  // Results
  results?: TaskResult[];
  evidence?: string[]; // Evidence IDs
}

export interface TaskResult {
  executionDate: Date;
  executor: string;
  status: "success" | "failure" | "partial";
  findings?: string;
  evidenceGenerated?: string[];
  nextSteps?: string;
}

/**
 * Reports and Dashboards
 */
export interface ComplianceReport extends Core {
  reportId: string;
  reportType:
    | "executive"
    | "technical"
    | "audit"
    | "continuous-monitoring"
    | "ato-package";

  // Report Metadata
  title: string;
  generatedDate: Date;
  generatedBy: string;
  period: ReportPeriod;

  // Content
  executiveSummary?: string;
  complianceScore: number;
  controlsByFamily: ControlFamilySummary[];
  findings: FindingSummary;
  poamSummary: POAMSummary;

  // Evidence Package
  evidencePackage?: string; // S3 location
  artifacts?: ReportArtifact[];

  // Distribution
  classification: "public" | "internal" | "confidential" | "restricted";
  recipients?: string[];

  // OSCAL Export
  oscalExport?: string; // S3 location of OSCAL package
}

export interface ReportPeriod {
  start: Date;
  end: Date;
  type: "daily" | "weekly" | "monthly" | "quarterly" | "annual" | "custom";
}

export interface ControlFamilySummary {
  family: string;
  totalControls: number;
  compliant: number;
  nonCompliant: number;
  notApplicable: number;
  partial: number;
  notAssessed: number;
  compliancePercentage: number;
}

export interface FindingSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  informational: number;
  newFindings: number;
  closedFindings: number;
}

export interface POAMSummary {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  overdue: number;
  dueThisMonth: number;
  averageDaysOpen: number;
}

export interface ReportArtifact {
  name: string;
  type: string;
  url: string;
  size?: number;
  hash?: string;
}

/**
 * Performance Metrics
 */
export interface MonitorPerformanceMetric extends Core {
  metricId: string;
  metricType:
    | "availability"
    | "response-time"
    | "error-rate"
    | "throughput"
    | "security-score"
    | "compliance-score";

  // Metric Data
  timestamp: Date;
  value: number;
  unit: string;

  // Source
  source: string; // CloudWatch, Security Hub, etc.
  region?: string;
  service?: string;
  resource?: string;

  // Thresholds
  criticalThreshold?: number;
  warningThreshold?: number;

  // Status
  status: "healthy" | "warning" | "critical" | "unknown";

  // Trend
  trend?: "improving" | "stable" | "degrading";
  changePercentage?: number;
}

/**
 * Alerts and Notifications
 */
export interface Alert extends Core {
  alertId: string;
  alertType:
    | "security"
    | "compliance"
    | "performance"
    | "operational"
    | "deadline";

  // Alert Details
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low" | "informational";

  // Source
  source: string;
  sourceId?: string; // Finding ID, Control ID, etc.

  // Timing
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;

  // Assignment
  assignedTo?: string;
  assignedTeam?: string;

  // Status
  status:
    | "new"
    | "acknowledged"
    | "investigating"
    | "resolved"
    | "false-positive";

  // Actions
  requiredActions?: string[];
  actionsTaken?: string[];

  // Notification
  notificationsSent?: NotificationRecord[];
}

export interface NotificationRecord {
  channel: "email" | "sms" | "slack" | "teams" | "sns";
  recipient: string;
  sentAt: Date;
  status: "sent" | "failed" | "pending";
}

/**
 * Integration with External Systems
 */
export interface ExternalIntegration extends Core {
  integrationId: string;
  systemName: "emass" | "archer" | "servicenow" | "jira" | "splunk" | "custom";

  // Configuration
  endpoint?: string;
  apiKey?: string; // Encrypted
  credentials?: string; // Encrypted

  // Sync Settings
  syncEnabled: boolean;
  syncFrequency?: string; // Cron expression
  lastSync?: Date;
  nextSync?: Date;

  // Mapping
  fieldMappings?: FieldMapping[];

  // Status
  status: "active" | "inactive" | "error";
  lastError?: string;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string; // JavaScript expression
}

/**
 * Audit Trail
 */
export interface AuditLog extends Core {
  eventId: string;
  eventType: string;
  eventTime: Date;

  // Actor
  actor: string;
  actorType: "user" | "system" | "service";
  sourceIp?: string;
  userAgent?: string;

  // Target
  targetType: string;
  targetId: string;
  targetName?: string;

  // Action
  action: string;
  result: "success" | "failure";

  // Details
  changes?: any;
  metadata?: Record<string, any>;

  // Compliance
  relatedControl?: string;
  evidenceOf?: string[];
}
