/**
 * Compliance and risk management types
 */

import { Core } from "@captify/core/types";

// ===== COMPLIANCE & RISK MANAGEMENT =====

export interface SOP extends Core {
  orgId: string;
  category: string;
  version: string;
  status: "draft" | "active" | "archived";
  content: {
    purpose: string;
    scope: string;
    procedures: SOPProcedure[];
    responsibilities: SOPResponsibility[];
  };
  relatedPolicies: string[]; // Array of policy IDs
  nextReviewDate: string;
  procedures: SOPProcedure[];
  responsibilities: SOPResponsibility[];
}

export interface SOPProcedure {
  id: string;
  title: string;
  steps: string[];
  estimatedTime?: string;
  requiredTools?: string[];
}

export interface SOPResponsibility {
  role: string;
  description: string;
  accountabilities: string[];
}

export interface POAMAction extends Core {
  description: string;
  status: "pending" | "in_progress" | "completed";
  assignedTo?: string; // User ID
  dueDate?: string;
  completedAt?: string;
  notes?: string;
}

export interface ChangeApproval {
  approverUserId: string;
  status: "pending" | "approved" | "rejected";
  comments?: string;
  timestamp: string;
}

export interface RiskItem {
  id: string;
  threat: string;
  vulnerability: string;
  impact: string;
  likelihood: "very_low" | "low" | "medium" | "high" | "very_high";
  impactRating: "very_low" | "low" | "medium" | "high" | "very_high";
  riskScore: number; // Calculated value
  riskLevel: "low" | "medium" | "high" | "critical";
  mitigationStrategy: string;
  residualRisk: "low" | "medium" | "high" | "critical";
  status: "identified" | "analyzing" | "mitigating" | "monitoring" | "closed";
}

export interface ComplianceMonitoring extends Core {
  orgId: string;
  framework: string; // e.g., "SOC2", "NIST", "ISO27001", "GDPR"
  status:
    | "compliant"
    | "non_compliant"
    | "partially_compliant"
    | "under_review";
  lastAssessmentDate: string;
  nextAssessmentDate: string;
  controls: ComplianceControl[];
  assessor?: string; // User ID
  certificationDetails?: {
    certificationBody: string;
    certificateNumber?: string;
    validFrom?: string;
    validTo?: string;
  };
}

export interface ComplianceControl {
  id: string;
  controlId: string; // Framework-specific control ID
  title: string;
  description: string;
  requirement: string;
  status: "compliant" | "non_compliant" | "not_applicable" | "compensating";
  implementationStatus:
    | "not_started"
    | "in_progress"
    | "implemented"
    | "validated";
  evidence: string[]; // Array of evidence document IDs
  gaps?: string[];
  remediationPlan?: string;
  lastReviewDate?: string;
  nextReviewDate?: string;
}
