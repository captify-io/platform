import { Core } from "@captify/core/types";

/**
 * Internal service marketplace and ticketing system
 */

export interface ServiceArea extends Core {
  area:
    | "DataOps"
    | "DevOps"
    | "PlatformOps"
    | "HelpDesk"
    | "Programmatic"
    | "Operations"
    | "Security"
    | "QA";
  lead: string;
  team: string[];
  slas: SLA[];
  capabilities: string[];
  tools: string[];
  metrics: ServiceMetrics;
}

export interface ServiceTicket extends Core {
  requestor: string;
  requestorTeam?: string;
  serviceArea: string;
  assignee?: string;

  // Request details
  type: "request" | "incident" | "change" | "problem" | "access";
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  acceptanceCriteria?: string[];

  // Incentives
  bounty?: number;
  bonusPool?: number;
  expedited: boolean;

  // SLA tracking
  sla?: string;
  dueDate?: string;
  responseDeadline?: string;
  resolutionDeadline?: string;

  // Work tracking
  status:
    | "open"
    | "assigned"
    | "in-progress"
    | "pending-customer"
    | "resolved"
    | "closed"
    | "cancelled";
  workLog: WorkLog[];
  totalHours: number;

  // Resolution
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  customerSatisfaction?: number;
  feedback?: string;

  // Links
  relatedTickets?: string[];
  capabilities?: string[];
  contracts?: string[];
  blockedWork?: string[];
}

export interface SLA extends Core {
  serviceArea: string;
  type: string;
  priority: string;
  responseTime: number;
  resolutionTime: number;
  unit: "minutes" | "hours" | "days";
  escalationPath: string[];
  penalties?: string;
  contractRequired?: string[];
}

export interface WorkLog {
  id: string;
  ticketId: string;
  userId: string;
  timestamp: string;
  action:
    | "created"
    | "assigned"
    | "updated"
    | "commented"
    | "resolved"
    | "reopened"
    | "escalated";
  description: string;
  hoursSpent?: number;
  visibility: "internal" | "customer";
}

export interface ServiceMetrics extends Core {
  serviceArea: string;
  period: string;

  // Volume metrics
  ticketsCreated: number;
  ticketsResolved: number;
  ticketsClosed: number;
  ticketsEscalated: number;

  // Performance metrics
  avgResponseTime: number;
  avgResolutionTime: number;
  firstContactResolution: number;
  slaCompliance: number;

  // Quality metrics
  customerSatisfaction: number;
  reworkRate: number;
  knowledgeArticlesCreated: number;

  // Efficiency metrics
  utilizationRate: number;
  costPerTicket: number;
  automationRate: number;

  // Team metrics
  teamCapacity: number;
  teamVelocity: number;
  backlogSize: number;
}

export interface ServiceCatalog extends Core {
  serviceArea: string;
  category: string;
  service: string;
  description: string;

  // Self-service options
  selfService: boolean;
  automationAvailable: boolean;
  formTemplate?: string;

  // Delivery
  estimatedTime: number;
  complexity: "simple" | "moderate" | "complex";
  requiredInfo: string[];
  deliverables: string[];

  // Pricing
  baseCost?: number;
  rushCost?: number;

  // Requirements
  approvalRequired?: boolean;
  approvers?: string[];
  prerequisites?: string[];
}

export interface ServiceRequest {
  ticketId: string;
  catalogItem: string;
  requestedBy: string;
  requestedFor?: string;

  // Request specifics
  parameters: Record<string, any>;
  justification?: string;
  businessCase?: string;

  // Scheduling
  neededBy?: string;
  preferredSchedule?: string;

  // Approval workflow
  approvalStatus?: "pending" | "approved" | "rejected";
  approvers?: ApprovalRecord[];

  // Fulfillment
  fulfillmentMethod?: "manual" | "automated" | "hybrid";
  automationJobId?: string;
}

export interface ApprovalRecord {
  approver: string;
  decision: "approved" | "rejected" | "delegated";
  timestamp: string;
  comments?: string;
  delegatedTo?: string;
}

export interface ServiceLevelObjective extends Core {
  serviceArea: string;
  objective: string;
  target: number;
  current: number;
  unit: string;
  period: "daily" | "weekly" | "monthly" | "quarterly";
  status: "meeting" | "at-risk" | "breached";
  impactedContracts?: string[];
  improvementPlan?: string;
}
