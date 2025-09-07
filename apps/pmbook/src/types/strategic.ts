import { Core } from "@captify/core/types";

/**
 * Strategic alignment types for connecting vision to daily work
 */

export interface StrategicObjective extends Core {
  level: "company" | "contract" | "program";
  statement: string;
  vision: string;
  keyResults: KeyResult[];
  owner: string;
  stakeholders: string[];
  deadline: string;
  status: "planning" | "active" | "at-risk" | "completed" | "cancelled";
  valueAtRisk: number;
  contractIds?: string[];
  parentObjective?: string;
  childObjectives?: string[];
  metrics: ObjectiveMetrics;
}

export interface KeyResult extends Core {
  objectiveId: string;
  metric: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  status: "on-track" | "at-risk" | "behind" | "completed";
  owner: string;
  updateFrequency: "daily" | "weekly" | "monthly";
  lastUpdated: string;
  evidence?: string[];
}

export interface Capability extends Core {
  objectives: string[];
  strategicWeight: number;
  customerValue: string;
  acceptanceCriteria: string[];
  dependencies: string[];
  contractCDRLs: string[];
  estimatedHours: number;
  actualHours: number;
  status: "planning" | "in-progress" | "testing" | "delivered" | "accepted";
  teamId: string;
  techStack?: string[];
  risks?: Risk[];
  valueScore?: number;
}

export interface Risk extends Core {
  type: "technical" | "schedule" | "resource" | "dependency" | "external";
  probability: "low" | "medium" | "high";
  impact: "low" | "medium" | "high" | "critical";
  mitigation: string;
  owner: string;
  status: "identified" | "mitigating" | "accepted" | "resolved";
  escalated: boolean;
  affectedObjectives: string[];
  affectedCapabilities: string[];
}

export interface GroundTruth extends Core {
  type: "blocker" | "risk" | "opportunity" | "insight" | "feedback";
  source: string;
  sourceRole?: string;
  impact: "tactical" | "operational" | "strategic";
  affectedObjectives: string[];
  affectedCapabilities: string[];
  suggestedAction: string;
  escalationNeeded: boolean;
  escalationLevel?: "team" | "program" | "executive";
  decisionDeadline?: string;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface ObjectiveMetrics {
  alignment: number;
  completion: number;
  velocity: number;
  burnRate: number;
  teamFocus: number;
  valueDelivered: number;
  risksIdentified: number;
  blockers: number;
}
