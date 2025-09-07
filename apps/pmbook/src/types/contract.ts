import { Core } from "@captify/core/types";

/**
 * Contract management types for government contracting
 */

export interface Contract extends Core {
  contractNumber: string;
  type: "FFP" | "CPFF" | "CPIF" | "T&M" | "IDIQ";
  customer: string;
  agency?: string;
  contractingOfficer?: string;
  contractingOfficerRep?: string;

  // Financial
  totalValue: number;
  fundedValue: number;
  burnedValue: number;
  remainingValue: number;
  monthlyBurnRate: number;

  // Schedule
  startDate: string;
  endDate: string;
  optionPeriods?: OptionPeriod[];
  popStart: string;
  popEnd: string;

  // Deliverables
  cdrls: CDRL[];
  milestones: Milestone[];

  // Team
  programManager: string;
  technicalLead?: string;
  teams: string[];
  subcontractors?: Subcontractor[];

  // Rates
  laborCategories: LaborCategory[];
  indirectRate: number;
  feeRate?: number;

  // Status
  status: "pre-award" | "active" | "option-pending" | "closing" | "closed";
  healthScore: number;
  risks: string[];
  modifications?: ContractMod[];
}

export interface CDRL extends Core {
  contractId: string;
  number: string;
  title: string;
  did?: string;
  type: "document" | "software" | "hardware" | "data" | "report";
  frequency?: "one-time" | "monthly" | "quarterly" | "annual" | "as-required";
  dueDate?: string;
  submittalDates?: string[];
  format?: string;
  distribution?: string[];
  capabilities: string[];
  status: "pending" | "in-progress" | "submitted" | "approved" | "rejected";
  currentVersion?: string;
  submissions?: CDRLSubmission[];
}

export interface CDRLSubmission {
  id: string;
  cdrlId: string;
  version: string;
  submittedDate: string;
  submittedBy: string;
  status: "draft" | "submitted" | "under-review" | "approved" | "rejected";
  reviewComments?: string;
  approvedBy?: string;
  approvalDate?: string;
  fileUrl?: string;
}

export interface LaborCategory {
  id: string;
  title: string;
  level: "junior" | "mid" | "senior" | "expert" | "sme";
  rate: number;
  escalation?: number;
  minimumEducation?: string;
  minimumExperience?: number;
  requiredSkills?: string[];
  clearanceRequired?: string;
}

export interface Subcontractor extends Core {
  contractId: string;
  company: string;
  type: "fsp" | "material" | "odc";
  value: number;
  startDate: string;
  endDate: string;
  pointOfContact: string;
  email: string;
  phone?: string;
  deliverables: string[];
  invoiceFrequency: "monthly" | "quarterly" | "milestone";
  status: "active" | "pending" | "complete" | "terminated";
}

export interface Invoice extends Core {
  contractId: string;
  invoiceNumber: string;
  period: string;
  periodStart: string;
  periodEnd: string;

  // Line items
  laborCosts: LaborLineItem[];
  odcCosts: ODCLineItem[];
  subcontractorCosts: SubcontractorLineItem[];

  // Totals
  totalLabor: number;
  totalODC: number;
  totalSubs: number;
  totalDirect: number;
  indirectCosts: number;
  fee?: number;
  totalInvoice: number;

  // Status
  status: "draft" | "review" | "submitted" | "approved" | "paid" | "disputed";
  submittedDate?: string;
  approvedDate?: string;
  paidDate?: string;
  paymentAmount?: number;
  notes?: string;
}

export interface LaborLineItem {
  employeeId: string;
  laborCategory: string;
  hours: number;
  rate: number;
  total: number;
  capabilities?: string[];
}

export interface ODCLineItem {
  description: string;
  category: "travel" | "materials" | "equipment" | "other";
  amount: number;
  justification?: string;
  approvedBy?: string;
}

export interface SubcontractorLineItem {
  subcontractorId: string;
  description: string;
  amount: number;
  invoiceRef?: string;
}

export interface Milestone extends Core {
  contractId: string;
  number: number;
  title: string;
  value: number;
  dueDate: string;
  completionCriteria: string[];
  capabilities: string[];
  dependencies?: string[];
  status: "pending" | "in-progress" | "complete" | "accepted" | "missed";
  completedDate?: string;
  acceptedDate?: string;
  evidence?: string[];
}

export interface ContractMod {
  id: string;
  modNumber: string;
  type: "scope" | "schedule" | "cost" | "terms";
  description: string;
  valueChange?: number;
  scheduleChange?: number;
  effectiveDate: string;
  approvedBy: string;
  documentation?: string[];
}

export interface OptionPeriod {
  number: number;
  startDate: string;
  endDate: string;
  value: number;
  exercised: boolean;
  exerciseDeadline?: string;
}

export interface ContractMetrics {
  contractValue: number;
  burnRate: number;
  runway: number;
  cdrlCompliance: number;
  milestoneProgress: number;
  profitMargin: number;
  riskScore: number;
  customerSatisfaction: number;
}
