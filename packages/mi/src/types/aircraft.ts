/**
 * Aircraft-specific types for Materiel Insights
 */

import { Core } from "@captify/core";

// ===== AIRCRAFT CORE TYPES =====

export interface Aircraft extends Core {
  tailNumber: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  yearManufactured: number;
  status: AircraftStatus;
  currentLocation?: string;
  totalFlightHours: number;
  totalCycles: number;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  configurationId: string;
}

export type AircraftStatus =
  | "active"
  | "maintenance"
  | "grounded"
  | "retired"
  | "storage";

// ===== BILL OF MATERIALS =====

export interface BillOfMaterials extends Core {
  aircraftId: string;
  partNumber: string;
  partName: string;
  manufacturer: string;
  quantity: number;
  position: string; // Location on aircraft
  parentPartId?: string; // For hierarchical BOM
  level: number; // BOM level (0 = top level)
  category: PartCategory;
  criticality: CriticalityLevel;
  serialNumbers: string[];
  installDate?: Date;
  lifeLimit?: number; // Hours or cycles
  currentLife: number;
  nextDueAction?: MaintenanceAction;
}

export type PartCategory =
  | "structure"
  | "engine"
  | "avionics"
  | "hydraulic"
  | "electrical"
  | "pneumatic"
  | "landing-gear"
  | "flight-controls"
  | "interior"
  | "other";

export type CriticalityLevel =
  | "critical"
  | "essential"
  | "standard"
  | "consumable";

// ===== ENGINEERING REQUESTS =====

export interface EngineeringRequest extends Core {
  requestNumber: string;
  type: EngineeringRequestType;
  priority: Priority;
  status: RequestStatus;
  requester: string;
  assignedTo?: string;
  aircraftAffected: string[];
  summary: string;
  description: string;
  justification: string;
  proposedSolution?: string;
  estimatedCost?: number;
  estimatedEffort?: number; // Hours
  targetCompletionDate?: Date;
  approvals: Approval[];
  relatedDocuments: string[];
}

export type EngineeringRequestType =
  | "design-change"
  | "modification"
  | "repair"
  | "inspection"
  | "certification"
  | "analysis";

export type RequestStatus =
  | "draft"
  | "submitted"
  | "under-review"
  | "approved"
  | "rejected"
  | "in-progress"
  | "completed"
  | "cancelled";

// ===== PROBLEM REPORTS =====

export interface ProblemReport extends Core {
  reportNumber: string;
  aircraftId: string;
  flightNumber?: string;
  occurrence: Date;
  reporter: string;
  priority: Priority;
  status: ProblemStatus;
  category: ProblemCategory;
  affectedSystems: string[];
  description: string;
  immediateAction?: string;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  partsAffected: string[];
  flightSafety: boolean;
  regulatoryReporting: boolean;
  relatedReports: string[];
}

export type ProblemStatus =
  | "open"
  | "investigating"
  | "action-required"
  | "closed"
  | "deferred";

export type ProblemCategory =
  | "mechanical"
  | "electrical"
  | "avionics"
  | "structural"
  | "performance"
  | "operational"
  | "environmental";

// ===== ASSEMBLIES =====

export interface Assembly extends Core {
  assemblyNumber: string;
  assemblyName: string;
  aircraftModel: string;
  category: PartCategory;
  components: AssemblyComponent[];
  drawingNumbers: string[];
  specifications: string[];
  weight: number;
  dimensions?: Dimensions;
  installationInstructions?: string;
  removalInstructions?: string;
  testProcedures?: string[];
}

export interface AssemblyComponent {
  partNumber: string;
  quantity: number;
  position: string;
  required: boolean;
  alternatives?: string[];
}

// ===== STRUCTURES =====

export interface Structure extends Core {
  structureId: string;
  structureName: string;
  aircraftSection: AircraftSection;
  structureType: StructureType;
  material: string;
  inspectionZones: InspectionZone[];
  stressAnalysis?: StressAnalysis;
  fatigueLife?: number;
  lastInspection?: Date;
  nextInspection?: Date;
  defects: StructuralDefect[];
}

export type AircraftSection =
  | "fuselage"
  | "wing"
  | "empennage"
  | "landing-gear"
  | "engine-mount";

export type StructureType =
  | "frame"
  | "skin"
  | "stringer"
  | "bulkhead"
  | "spar"
  | "rib"
  | "fitting";

// ===== MAINTENANCE =====

export interface MaintenanceTask extends Core {
  taskNumber: string;
  aircraftId: string;
  type: MaintenanceType;
  interval: MaintenanceInterval;
  estimatedDuration: number; // Hours
  requiredSkills: string[];
  tools: string[];
  consumables: string[];
  instructions: string;
  signOffRequired: boolean;
  regulatoryReference?: string;
}

export type MaintenanceType =
  | "inspection"
  | "replacement"
  | "repair"
  | "overhaul"
  | "modification"
  | "test"
  | "lubrication"
  | "cleaning";

export interface MaintenanceInterval {
  type: "hours" | "cycles" | "calendar" | "condition";
  value: number;
  tolerance?: number;
}

// ===== FORECASTING =====

export interface ForecastData extends Core {
  aircraftId: string;
  forecastType: ForecastType;
  timeHorizon: number; // Months
  predictions: Prediction[];
  confidence: number; // 0-1
  methodology: string;
  lastUpdated: Date;
  factors: ForecastFactor[];
}

export type ForecastType =
  | "maintenance-demand"
  | "part-consumption"
  | "cost-projection"
  | "availability"
  | "reliability";

export interface Prediction {
  period: string;
  value: number;
  uncertainty: number;
  trend: "increasing" | "decreasing" | "stable";
}

// ===== SHARED TYPES =====

export type Priority = "critical" | "high" | "medium" | "low";

export interface Approval {
  approver: string;
  role: string;
  status: "pending" | "approved" | "rejected";
  date?: Date;
  comments?: string;
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  units: "mm" | "cm" | "in" | "ft";
}

export interface InspectionZone {
  zoneId: string;
  description: string;
  inspectionMethod: string;
  frequency: MaintenanceInterval;
  accessRequirements?: string;
}

export interface StructuralDefect {
  defectId: string;
  type: string;
  severity: "minor" | "major" | "critical";
  location: string;
  discovered: Date;
  repaired?: Date;
  disposition: "monitor" | "repair" | "replace";
}

export interface StressAnalysis {
  maxStress: number;
  safetyFactor: number;
  analysisMethod: string;
  lastUpdate: Date;
  validUntil?: Date;
}

export interface ForecastFactor {
  factor: string;
  weight: number;
  impact: "positive" | "negative" | "neutral";
}

export interface MaintenanceAction {
  type: MaintenanceType;
  description: string;
  dueDate: Date;
  estimatedHours: number;
}
