/**
 * Ontology Helper Functions
 *
 * Utility functions for working with ontology entities via apiClient
 * All functions use apiClient.run() from @captify-io/core
 *
 * Reference: specification.md and IMPLEMENTATION_NOTES.md
 */

import { apiClient, type CaptifyResponse } from "@captify-io/core";
import type {
  OntologyEntity,
  EntityType,
  ONTOLOGY_TABLES,
  Strategy,
  Objective,
  Outcome,
  UseCase,
  Capability,
  Task,
  DataProduct,
  Model,
  Agent,
  System,
  OntologyApplication,
  Feature,
  Pipeline,
  Report,
  Contract,
  CLIN,
  Metric,
  GovernanceRecord,
  Feedback,
  OntologyGraph,
} from "@/types/ontology";

// ===============================================================
// GENERIC CRUD OPERATIONS
// ===============================================================

/**
 * Get entity by ID
 */
export async function getEntityById<T extends OntologyEntity>(
  table: string,
  id: string
): Promise<CaptifyResponse<T>> {
  return apiClient.run({
    service: "platform.dynamodb",
    operation: "get",
    table,
    data: {
      Key: { id },
    },
  });
}

/**
 * Query entities by tenantId
 */
export async function getEntitiesByTenant<T extends OntologyEntity>(
  table: string,
  tenantId: string,
  limit?: number
): Promise<CaptifyResponse<{ items: T[]; lastKey?: any }>> {
  const response = await apiClient.run({
    service: "platform.dynamodb",
    operation: "query",
    table,
    data: {
      IndexName: "tenantId-createdAt-index",
      KeyConditionExpression: "tenantId = :tenantId",
      ExpressionAttributeValues: {
        ":tenantId": tenantId
      },
      Limit: limit,
    },
  });

  // Transform DynamoDB response format to match expected format
  if (response.success && response.data) {
    return {
      success: true,
      data: {
        items: response.data.Items || response.data.items || [],
        lastKey: response.data.LastEvaluatedKey || response.data.lastKey,
      },
    };
  }

  return response;
}

/**
 * Create new entity
 */
export async function createEntity<T extends OntologyEntity>(
  table: string,
  entity: T
): Promise<CaptifyResponse<T>> {
  return apiClient.run({
    service: "platform.dynamodb",
    operation: "create",
    table,
    data: {
      values: [entity],
    },
  });
}

/**
 * Update existing entity
 */
export async function updateEntity<T extends OntologyEntity>(
  table: string,
  id: string,
  updates: Partial<T>
): Promise<CaptifyResponse<T>> {
  return apiClient.run({
    service: "platform.dynamodb",
    operation: "update",
    table,
    data: {
      Key: { id },
      values: [updates],
    },
  });
}

/**
 * Delete entity
 */
export async function deleteEntity(
  table: string,
  id: string
): Promise<CaptifyResponse<void>> {
  return apiClient.run({
    service: "platform.dynamodb",
    operation: "delete",
    table,
    data: {
      Key: { id },
    },
  });
}

// ===============================================================
// STRATEGY & OUTCOMES
// ===============================================================

/**
 * Get all strategies for a tenant
 */
export async function getStrategies(tenantId: string): Promise<CaptifyResponse<{items: Strategy[]}>> {
  return getEntitiesByTenant<Strategy>("core-Strategy", tenantId);
}

/**
 * Get outcomes for a strategy
 */
export async function getOutcomesByStrategy(
  strategyId: string
): Promise<CaptifyResponse<{ items: Outcome[] }>> {
  return apiClient.run({
    service: "platform.dynamodb",
    operation: "query",
    table: "core-outcome",
    data: {
      index: "strategyId-index",
      fields: ["strategyId"],
      values: [{ strategyId }],
    },
  });
}

/**
 * Get outcomes for a CLIN
 */
export async function getOutcomesByCLIN(
  clinId: string
): Promise<CaptifyResponse<{ items: Outcome[] }>> {
  return apiClient.run({
    service: "platform.dynamodb",
    operation: "query",
    table: "core-outcome",
    data: {
      index: "clinId-index",
      fields: ["clinId"],
      values: [{ clinId }],
    },
  });
}

/**
 * Get all objectives for a tenant
 */
export async function getObjectives(tenantId: string): Promise<CaptifyResponse<{items: Objective[]}>> {
  return getEntitiesByTenant<Objective>("core-Objective", tenantId);
}

/**
 * Get objectives by status
 */
export async function getObjectivesByStatus(
  tenantId: string,
  status: string
): Promise<CaptifyResponse<{ items: Objective[] }>> {
  return apiClient.run({
    service: "platform.dynamodb",
    operation: "query",
    table: "core-objective",
    data: {
      index: "tenantId-status-index",
      fields: ["tenantId", "status"],
      values: [{ tenantId, status }],
    },
  });
}

// ===============================================================
// USE CASES & TASKS
// ===============================================================

/**
 * Get use cases for an outcome
 */
export async function getUseCasesByOutcome(
  outcomeId: string
): Promise<CaptifyResponse<{ items: UseCase[] }>> {
  return apiClient.run({
    service: "platform.dynamodb",
    operation: "query",
    table: "core-usecase",
    data: {
      index: "outcomeId-index",
      fields: ["outcomeId"],
      values: [{ outcomeId }],
    },
  });
}

/**
 * Get use cases by lifecycle stage
 */
export async function getUseCasesByStage(
  tenantId: string,
  stage: string
): Promise<CaptifyResponse<{ items: UseCase[] }>> {
  return apiClient.run({
    service: "platform.dynamodb",
    operation: "query",
    table: "core-usecase",
    data: {
      index: "tenantId-stage-index",
      fields: ["tenantId", "stage"],
      values: [{ tenantId, stage }],
    },
  });
}

/**
 * Get capabilities for an outcome
 */
export async function getCapabilitiesByOutcome(
  outcomeId: string
): Promise<CaptifyResponse<{ items: Capability[] }>> {
  return apiClient.run({
    service: "platform.dynamodb",
    operation: "query",
    table: "core-capability",
    data: {
      index: "outcomeId-index",
      fields: ["outcomeId"],
      values: [{ outcomeId }],
    },
  });
}

/**
 * Get capabilities by lifecycle stage
 */
export async function getCapabilitiesByStage(
  tenantId: string,
  stage: string
): Promise<CaptifyResponse<{ items: Capability[] }>> {
  return apiClient.run({
    service: "platform.dynamodb",
    operation: "query",
    table: "core-capability",
    data: {
      index: "tenantId-stage-index",
      fields: ["tenantId", "stage"],
      values: [{ tenantId, stage }],
    },
  });
}

/**
 * Get tasks by related entity
 */
export async function getTasksByEntity(
  relatedEntity: string,
  relatedEntityType: string
): Promise<CaptifyResponse<{ items: Task[] }>> {
  return apiClient.run({
    service: "platform.dynamodb",
    operation: "query",
    table: "core-task",
    data: {
      index: "relatedEntity-type-index",
      fields: ["relatedEntity", "relatedEntityType"],
      values: [{ relatedEntity, relatedEntityType }],
    },
  });
}

/**
 * Get tasks by team and status
 */
export async function getTasksByTeamAndStatus(
  team: string,
  status: string
): Promise<CaptifyResponse<{ items: Task[] }>> {
  return apiClient.run({
    service: "platform.dynamodb",
    operation: "query",
    table: "core-task",
    data: {
      index: "team-status-index",
      fields: ["team", "status"],
      values: [{ team, status }],
    },
  });
}

// ===============================================================
// ONTOLOGY THINGS
// ===============================================================

/**
 * Get data products by lifecycle stage
 */
export async function getDataProductsByStage(
  tenantId: string,
  lifecycleStage: string
): Promise<CaptifyResponse<{ items: DataProduct[] }>> {
  return apiClient.run({
    service: "platform.dynamodb",
    operation: "query",
    table: "core-dataproduct",
    data: {
      index: "tenantId-lifecycleStage-index",
      fields: ["tenantId", "lifecycleStage"],
      values: [{ tenantId, lifecycleStage }],
    },
  });
}

/**
 * Get models by team and status
 */
export async function getModelsByTeamAndStatus(
  ownerTeam: string,
  status: string
): Promise<CaptifyResponse<{ items: Model[] }>> {
  return apiClient.run({
    service: "platform.dynamodb",
    operation: "query",
    table: "core-model",
    data: {
      index: "ownerTeam-status-index",
      fields: ["ownerTeam", "status"],
      values: [{ ownerTeam, status }],
    },
  });
}

// ===============================================================
// AWS INTEGRATION HELPERS
// ===============================================================

/**
 * List AWS Glue databases
 */
export async function listGlueDatabases(): Promise<CaptifyResponse<any>> {
  return apiClient.run({
    service: "platform.glue",
    operation: "getDatabases",
    data: {},
  });
}

/**
 * List AWS Glue tables in a database
 */
export async function listGlueTables(databaseName: string): Promise<CaptifyResponse<any>> {
  return apiClient.run({
    service: "platform.glue",
    operation: "getTables",
    data: { DatabaseName: databaseName },
  });
}

/**
 * Get AWS Glue table details
 */
export async function getGlueTable(
  databaseName: string,
  tableName: string
): Promise<CaptifyResponse<any>> {
  return apiClient.run({
    service: "platform.glue",
    operation: "getTable",
    data: { DatabaseName: databaseName, Name: tableName },
  });
}

/**
 * List AWS Bedrock Agents
 */
export async function listBedrockAgents(): Promise<CaptifyResponse<any>> {
  return apiClient.run({
    service: "platform.bedrock",
    operation: "listAgents",
    data: {},
  });
}

/**
 * Get AWS Bedrock Agent details
 */
export async function getBedrockAgent(agentId: string): Promise<CaptifyResponse<any>> {
  return apiClient.run({
    service: "platform.bedrock",
    operation: "getAgent",
    data: { agentId },
  });
}

/**
 * List SageMaker Models
 */
export async function listSageMakerModels(): Promise<CaptifyResponse<any>> {
  return apiClient.run({
    service: "platform.sagemaker",
    operation: "listModels",
    data: {},
  });
}

/**
 * List SageMaker Endpoints
 */
export async function listSageMakerEndpoints(): Promise<CaptifyResponse<any>> {
  return apiClient.run({
    service: "platform.sagemaker",
    operation: "listEndpoints",
    data: {},
  });
}

/**
 * Get active agents for a tenant
 */
export async function getActiveAgents(
  tenantId: string
): Promise<CaptifyResponse<{ items: Agent[] }>> {
  return apiClient.run({
    service: "platform.dynamodb",
    operation: "query",
    table: "core-agent",
    data: {
      index: "tenantId-status-index",
      fields: ["tenantId", "status"],
      values: [{ tenantId, status: "active" }],
    },
  });
}

/**
 * Get capability by system
 */
export async function getCapabilitiesBySystem(
  deliveredBySystem: string
): Promise<CaptifyResponse<{ items: Capability[] }>> {
  return apiClient.run({
    service: "platform.dynamodb",
    operation: "query",
    table: "core-capability",
    data: {
      index: "deliveredBySystem-index",
      fields: ["deliveredBySystem"],
      values: [{ deliveredBySystem }],
    },
  });
}

// ===============================================================
// PROGRAM MANAGEMENT
// ===============================================================

/**
 * Get CLINs for a contract
 */
export async function getCLINsByContract(
  contractId: string
): Promise<CaptifyResponse<{ items: CLIN[] }>> {
  return apiClient.run({
    service: "platform.dynamodb",
    operation: "query",
    table: "core-clin",
    data: {
      index: "contractId-index",
      fields: ["contractId"],
      values: [{ contractId }],
    },
  });
}

/**
 * Get reports by status
 */
export async function getReportsByStatus(
  status: string
): Promise<CaptifyResponse<{ items: Report[] }>> {
  return apiClient.run({
    service: "platform.dynamodb",
    operation: "query",
    table: "core-report",
    data: {
      index: "status-generatedOn-index",
      fields: ["status"],
      values: [{ status }],
    },
  });
}

// ===============================================================
// METRICS & GOVERNANCE
// ===============================================================

/**
 * Get metrics for an entity
 */
export async function getMetricsForEntity(
  relatedEntityId: string
): Promise<CaptifyResponse<{ items: Metric[] }>> {
  return apiClient.run({
    service: "platform.dynamodb",
    operation: "query",
    table: "core-metric",
    data: {
      index: "relatedEntityId-index",
      fields: ["relatedEntityId"],
      values: [{ relatedEntityId }],
    },
  });
}

/**
 * Get governance records by team and status
 */
export async function getGovernanceRecordsByTeamAndStatus(
  ownerTeam: string,
  status: string
): Promise<CaptifyResponse<{ items: GovernanceRecord[] }>> {
  return apiClient.run({
    service: "platform.dynamodb",
    operation: "query",
    table: "core-governancerecord",
    data: {
      index: "ownerTeam-status-index",
      fields: ["ownerTeam", "status"],
      values: [{ ownerTeam, status }],
    },
  });
}

/**
 * Get feedback for an entity
 */
export async function getFeedbackForEntity(
  relatedThing: string
): Promise<CaptifyResponse<{ items: Feedback[] }>> {
  return apiClient.run({
    service: "platform.dynamodb",
    operation: "query",
    table: "core-feedback",
    data: {
      index: "relatedThing-index",
      fields: ["relatedThing"],
      values: [{ relatedThing }],
    },
  });
}

// ===============================================================
// ONTOLOGY GRAPH
// ===============================================================

/**
 * Get latest ontology graph for tenant
 */
export async function getLatestOntologyGraph(
  tenantId: string
): Promise<CaptifyResponse<OntologyGraph>> {
  const response = await apiClient.run<{ items: OntologyGraph[] }>({
    service: "platform.dynamodb",
    operation: "query",
    table: "core-ontologygraph",
    data: {
      index: "tenantId-version-index",
      fields: ["tenantId"],
      values: [{ tenantId }],
      limit: 1,
      sortDirection: "desc",
    },
  });

  if (response.success && response.data?.items && response.data.items.length > 0) {
    return {
      success: true,
      data: response.data.items[0],
    };
  }

  return {
    success: false,
    error: "No ontology graph found",
  };
}

// ===============================================================
// UTILITY FUNCTIONS
// ===============================================================

/**
 * Generate unique ID (UUID v4)
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Create base entity fields
 */
export function createBaseEntity(
  tenantId: string,
  userId: string,
  name: string,
  description: string = ""
): Partial<OntologyEntity> {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    tenantId,
    name,
    app: "ontology-manager",
    order: now,
    fields: {},
    description,
    ownerId: userId,
    createdAt: now,
    createdBy: userId,
    updatedAt: now,
    updatedBy: userId,
  };
}

/**
 * Update entity timestamps
 */
export function updateEntityTimestamps(
  userId: string
): { updatedAt: string; updatedBy: string } {
  return {
    updatedAt: new Date().toISOString(),
    updatedBy: userId,
  };
}

/**
 * Check if user has required group
 */
export function hasRequiredGroup(
  userGroups: string[],
  requiredGroups?: string[]
): boolean {
  if (!requiredGroups || requiredGroups.length === 0) {
    return true;
  }

  return userGroups.some((userGroup) =>
    requiredGroups.some((required) => userGroup.includes(required))
  );
}
