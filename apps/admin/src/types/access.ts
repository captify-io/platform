/**
 * Access management and security types
 */

import { Core } from "@captify/core/types";

// ===== ACCESS MANAGEMENT =====

export interface AccessRequest extends Core {
  orgId: string;
  requestType: "new_access" | "modify_access" | "remove_access" | "role_change";
  targetUserId: string;
  requestedBy: string; // User ID
  requestedAccess: {
    roles?: string[];
    groups?: string[];
    resources?: AccessResource[];
  };
  justification: string;
  urgency: "low" | "medium" | "high" | "critical";
  status: "pending" | "approved" | "rejected" | "provisioned" | "cancelled";
  approvals: AccessApproval[];
  provisioningDetails?: {
    provisionedAt?: string;
    provisionedBy?: string; // User ID
    expirationDate?: string;
  };
}

export interface AccessResource {
  resourceType: "application" | "system" | "data" | "physical";
  resourceId: string;
  accessLevel: "read" | "write" | "admin" | "owner";
  conditions?: {
    timeRestrictions?: string;
    locationRestrictions?: string[];
    deviceRestrictions?: string[];
  };
}

export interface AccessApproval {
  approverUserId: string;
  approverRole: string;
  status: "pending" | "approved" | "rejected";
  conditions?: string;
  comments?: string;
  timestamp: string;
}

export interface AccessReview extends Core {
  orgId: string;
  type: "periodic" | "event_driven" | "certification" | "audit";
  scope: {
    userGroups?: string[];
    roles?: string[];
    resources?: string[];
  };
  frequency: "monthly" | "quarterly" | "semi_annual" | "annual" | "ad_hoc";
  status: "scheduled" | "in_progress" | "completed" | "overdue";
  reviewers: string[]; // Array of user IDs
  findings: AccessReviewFinding[];
  completionDate?: string;
  nextReviewDate?: string;
}

export interface AccessReviewFinding {
  userId: string;
  currentAccess: string[];
  recommendedAction: "no_change" | "modify" | "remove" | "review_further";
  justification: string;
  reviewerUserId: string;
  reviewDate: string;
  implemented: boolean;
}
