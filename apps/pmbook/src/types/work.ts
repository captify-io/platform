import { Core } from "@captify/core/types";

/**
 * Work management types with automatic time tracking
 */

export interface WorkItem extends Core {
  capability: string;
  type:
    | "feature"
    | "bug"
    | "debt"
    | "research"
    | "review"
    | "meeting"
    | "support";
  status:
    | "backlog"
    | "ready"
    | "in-progress"
    | "review"
    | "testing"
    | "done"
    | "blocked";
  priority: "critical" | "high" | "medium" | "low";
  complexity: "trivial" | "simple" | "moderate" | "complex" | "epic";
  assignee?: string;
  team?: string;

  // Time tracking
  estimatedHours: number;
  actualHours: number;
  sessions: WorkSession[];

  // Value metrics
  valueScore: number;
  strategicWeight: number;
  customerImpact: number;
  technicalDebt?: number;

  // Dependencies
  blockedBy?: string[];
  blocking?: string[];
  relatedItems?: string[];

  // Delivery
  acceptanceCriteria?: string[];
  deliverables?: string[];
  pullRequests?: string[];
  commits?: string[];

  // Feedback
  reviewComments?: Comment[];
  customerFeedback?: string;
  completionQuality?: number;
}

export interface WorkSession extends Core {
  workItemId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  automatic: boolean;
  activity?: string;
  interrupted?: boolean;
  productivity?: number;
  commits?: string[];
  filesModified?: string[];
}

export interface WorkQueue {
  userId: string;
  recommended: WorkItem[];
  criticalPath: WorkItem[];
  quickWins: WorkItem[];
  techDebt: WorkItem[];
  exploration: WorkItem[];
  blocked: WorkItem[];
  inReview: WorkItem[];
  lastUpdated: string;
}

export interface ProductivityMetrics extends Core {
  userId: string;
  period: "daily" | "weekly" | "monthly" | "quarterly";
  periodStart: string;
  periodEnd: string;

  // Time metrics
  totalHours: number;
  productiveHours: number;
  meetingHours: number;
  focusTime: number;
  contextSwitches: number;

  // Value metrics
  totalValue: number;
  valuePerHour: number;
  capabilitiesDelivered: number;
  featuresCompleted: number;
  bugsFixed: number;

  // Quality metrics
  codeQuality: number;
  reviewScore: number;
  customerSatisfaction: number;
  reworkRate: number;

  // Alignment metrics
  strategicAlignment: number;
  criticalPathWork: number;
  plannedVsActual: number;
}

export interface Team extends Core {
  members: TeamMember[];
  lead: string;
  capabilities: string[];
  contracts: string[];
  velocity: number;
  capacity: number;
  utilization: number;
  skills: string[];
  tools: string[];
  currentSprint?: Sprint;
}

export interface TeamMember {
  userId: string;
  role: "lead" | "senior" | "mid" | "junior" | "contractor";
  allocation: number;
  skills: string[];
  clearance?: "none" | "public-trust" | "secret" | "top-secret";
  rate: number;
  availability: "available" | "busy" | "ooo" | "unavailable";
  currentWork?: string[];
}

export interface Sprint extends Core {
  team: string;
  number: number;
  startDate: string;
  endDate: string;
  goals: string[];
  capabilities: string[];
  workItems: string[];
  velocity: number;
  plannedHours: number;
  actualHours: number;
  completionRate: number;
  retrospective?: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  type: "review" | "feedback" | "question" | "suggestion";
  resolved?: boolean;
}
