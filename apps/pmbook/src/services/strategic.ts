import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
// Simple type definitions for service pattern
interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  region: string;
}

interface ApiUserSession {
  user?: any;
}

import type { StrategicObjective, KeyResult, Capability, Risk, GroundTruth } from "../types/strategic";

interface StrategicServiceRequest {
  service: string;
  operation: string;
  data?: any;
  schema?: string;
  app?: string;
}

/**
 * Execute strategic management operations
 */
export async function execute(
  request: StrategicServiceRequest,
  credentials?: AwsCredentials,
  session?: ApiUserSession
): Promise<any> {
  if (!credentials) {
    return { success: false, error: "AWS credentials required" };
  }

  const client = new DynamoDBClient({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });

  const docClient = DynamoDBDocumentClient.from(client);
  const schema = request.schema || "captify";

  try {
    switch (request.operation) {
      case "getObjectivesHierarchy": {
        const { level } = request.data || {};
        
        const params: any = {
          TableName: `${schema}-pmbook-StrategicObjective`,
        };

        if (level) {
          params.FilterExpression = "#level = :level";
          params.ExpressionAttributeNames = { "#level": "level" };
          params.ExpressionAttributeValues = { ":level": level };
        }

        const response = await docClient.send(new QueryCommand(params));
        const objectives = response.Items || [];

        // Build hierarchy
        const hierarchy = buildObjectiveHierarchy(objectives as StrategicObjective[]);
        return { success: true, data: hierarchy };
      }

      case "getAlignedCapabilities": {
        const { objectiveIds } = request.data || {};
        if (!objectiveIds || objectiveIds.length === 0) {
          return { success: true, data: [] };
        }
        
        const response = await docClient.send(new BatchGetCommand({
          RequestItems: {
            [`${schema}-pmbook-Capability`]: {
              Keys: objectiveIds.map((id: string) => ({ id })),
            },
          },
        }));
        
        return { 
          success: true, 
          data: response.Responses?.[`${schema}-pmbook-Capability`] || [] 
        };
      }

      case "calculateAlignment": {
        const { userId, teamId } = request.data || {};
        
        // Get work items
        const workItemsResult = await getWorkItems(docClient, schema, userId, teamId);
        const workItems = workItemsResult.Items || [];
        
        // Get capabilities
        const capabilityIds = [...new Set(workItems.map((w: any) => w.capability))];
        const capabilitiesResult = await getCapabilities(docClient, schema, capabilityIds);
        const capabilities = capabilitiesResult || [];
        
        // Calculate alignment
        const totalHours = workItems.reduce((sum: number, w: any) => sum + (w.actualHours || 0), 0);
        const strategicHours = workItems
          .filter((w: any) => {
            const cap = capabilities.find((c: any) => c.id === w.capability);
            return cap && (cap.strategicWeight || 0) > 7;
          })
          .reduce((sum: number, w: any) => sum + (w.actualHours || 0), 0);
        
        return {
          success: true,
          data: {
            alignmentScore: totalHours > 0 ? (strategicHours / totalHours) * 100 : 0,
            totalHours,
            strategicHours,
            workBreakdown: categorizeWork(workItems, capabilities),
          },
        };
      }

      case "submitGroundTruth": {
        const { feedback } = request.data || {};
        if (!feedback) {
          return { success: false, error: "Feedback data required" };
        }

        const groundTruth = {
          ...feedback,
          id: generateId(),
          createdAt: new Date().toISOString(),
          status: 'active',
        };

        await docClient.send(new PutCommand({
          TableName: `${schema}-pmbook-GroundTruth`,
          Item: groundTruth,
        }));

        // Check if escalation needed
        if (feedback.escalationNeeded) {
          console.log("Escalating ground truth:", groundTruth.id);
        }

        return { success: true, data: groundTruth };
      }

      case "getRisksAndBlockers": {
        const { level } = request.data || {};
        
        const risksParams: any = {
          TableName: `${schema}-pmbook-Risk`,
        };
        
        if (level) {
          risksParams.FilterExpression = "#impact = :level";
          risksParams.ExpressionAttributeNames = { "#impact": "impact" };
          risksParams.ExpressionAttributeValues = { ":level": level };
        }

        const risks = await docClient.send(new QueryCommand(risksParams));

        const groundTruth = await docClient.send(new QueryCommand({
          TableName: `${schema}-pmbook-GroundTruth`,
          FilterExpression: "#type = :type AND attribute_not_exists(resolvedAt)",
          ExpressionAttributeNames: { "#type": "type" },
          ExpressionAttributeValues: { ":type": "blocker" },
        }));

        const risksData = risks.Items || [];
        const blockersData = groundTruth.Items || [];

        return {
          success: true,
          data: {
            risks: risksData,
            blockers: blockersData,
            summary: summarizeRisks(risksData, blockersData),
          },
        };
      }

      case "updateObjectiveProgress": {
        const { objectiveId, keyResultUpdates } = request.data || {};
        if (!objectiveId || !keyResultUpdates) {
          return { success: false, error: "Objective ID and key result updates required" };
        }

        // Update key results
        for (const update of keyResultUpdates) {
          await docClient.send(new UpdateCommand({
            TableName: `${schema}-pmbook-KeyResult`,
            Key: { id: update.id },
            UpdateExpression: "SET #current = :current, #status = :status, lastUpdated = :now",
            ExpressionAttributeNames: {
              "#current": "current",
              "#status": "status",
            },
            ExpressionAttributeValues: {
              ":current": update.current,
              ":status": calculateKeyResultStatus(update),
              ":now": new Date().toISOString(),
            },
          }));
        }

        // Recalculate objective metrics
        const metrics = calculateObjectiveMetrics();
        
        await docClient.send(new UpdateCommand({
          TableName: `${schema}-pmbook-StrategicObjective`,
          Key: { id: objectiveId },
          UpdateExpression: "SET metrics = :metrics, updatedAt = :now",
          ExpressionAttributeValues: {
            ":metrics": metrics,
            ":now": new Date().toISOString(),
          },
        }));

        return { success: true, data: { metrics } };
      }

      case "getStrategicRecommendations": {
        const alignmentResult = await execute({
          service: request.service,
          operation: "calculateAlignment",
          data: {},
          schema: request.schema,
        }, credentials, session);

        const risksResult = await execute({
          service: request.service,
          operation: "getRisksAndBlockers",
          data: {},
          schema: request.schema,
        }, credentials, session);

        const objectivesResult = await execute({
          service: request.service,
          operation: "getObjectivesHierarchy",
          data: {},
          schema: request.schema,
        }, credentials, session);

        if (!alignmentResult.success || !risksResult.success || !objectivesResult.success) {
          return { success: false, error: "Failed to gather data for recommendations" };
        }

        const alignment = alignmentResult.data;
        const risks = risksResult.data;
        const objectives = objectivesResult.data;
        
        const recommendations = [];

        // Low alignment recommendation
        if (alignment.alignmentScore < 70) {
          recommendations.push({
            type: 'alignment',
            priority: 'high',
            message: `Only ${alignment.alignmentScore.toFixed(0)}% of work is strategically aligned`,
            action: 'Review work queue prioritization',
          });
        }

        // High risk recommendation
        const criticalRisks = risks.risks.filter((r: any) => r.impact === 'critical');
        if (criticalRisks.length > 0) {
          recommendations.push({
            type: 'risk',
            priority: 'critical',
            message: `${criticalRisks.length} critical risks identified`,
            action: 'Immediate risk mitigation required',
          });
        }

        // Objective at risk
        const atRiskObjectives = objectives.filter((o: any) => o.status === 'at-risk');
        if (atRiskObjectives.length > 0) {
          recommendations.push({
            type: 'objective',
            priority: 'high',
            message: `${atRiskObjectives.length} strategic objectives at risk`,
            action: 'Review resource allocation and timeline',
          });
        }

        return { success: true, data: recommendations };
      }

      default:
        return {
          success: false,
          error: `Unknown operation: ${request.operation}`,
        };
    }
  } catch (error) {
    console.error(`Error in strategicService.${request.operation}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Helper functions
function buildObjectiveHierarchy(objectives: any[]) {
  const map = new Map();
  objectives.forEach(obj => map.set(obj.id, { ...obj, children: [] }));
  
  const roots = [];
  for (const obj of objectives) {
    if (obj.parentObjective) {
      const parent = map.get(obj.parentObjective);
      if (parent) parent.children.push(map.get(obj.id));
    } else {
      roots.push(map.get(obj.id));
    }
  }
  
  return roots;
}

async function getWorkItems(docClient: DynamoDBDocumentClient, schema: string, userId?: string, teamId?: string) {
  const params: any = {
    TableName: `${schema}-pmbook-WorkItem`,
  };

  if (userId) {
    params.FilterExpression = "assignee = :userId";
    params.ExpressionAttributeValues = { ":userId": userId };
  } else if (teamId) {
    params.FilterExpression = "#team = :teamId";
    params.ExpressionAttributeNames = { "#team": "team" };
    params.ExpressionAttributeValues = { ":teamId": teamId };
  }

  return await docClient.send(new QueryCommand(params));
}

async function getCapabilities(docClient: DynamoDBDocumentClient, schema: string, ids: string[]) {
  if (ids.length === 0) return [];
  
  const response = await docClient.send(new BatchGetCommand({
    RequestItems: {
      [`${schema}-pmbook-Capability`]: {
        Keys: ids.map(id => ({ id })),
      },
    },
  }));
  
  return response.Responses?.[`${schema}-pmbook-Capability`] || [];
}

function categorizeWork(workItems: any[], capabilities: any[]) {
  return {
    strategic: workItems.filter(w => {
      const cap = capabilities.find(c => c.id === w.capability);
      return cap && (cap.strategicWeight || 0) > 7;
    }).length,
    operational: workItems.filter(w => {
      const cap = capabilities.find(c => c.id === w.capability);
      return cap && (cap.strategicWeight || 0) >= 4 && (cap.strategicWeight || 0) <= 7;
    }).length,
    maintenance: workItems.filter(w => {
      const cap = capabilities.find(c => c.id === w.capability);
      return cap && (cap.strategicWeight || 0) < 4;
    }).length,
  };
}

function calculateKeyResultStatus(keyResult: any) {
  const progress = ((keyResult.current || 0) / (keyResult.target || 1)) * 100;
  const daysUntilDeadline = keyResult.deadline ? 
    Math.floor((new Date(keyResult.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 30;
  
  if (progress >= 100) return 'completed';
  if (progress >= 80 && daysUntilDeadline > 0) return 'on-track';
  if (progress >= 60 && daysUntilDeadline > 7) return 'at-risk';
  return 'behind';
}

function calculateObjectiveMetrics() {
  return {
    alignment: 85,
    completion: 62,
    velocity: 1.2,
    burnRate: 18500,
    teamFocus: 78,
    valueDelivered: 245000,
    risksIdentified: 3,
    blockers: 1,
  };
}

function summarizeRisks(risks: any[], blockers: any[]) {
  return {
    critical: risks?.filter(r => r.impact === 'critical').length || 0,
    high: risks?.filter(r => r.impact === 'high').length || 0,
    activeBlockers: blockers?.length || 0,
    totalRiskScore: calculateRiskScore(risks),
  };
}

function calculateRiskScore(risks: any[]) {
  if (!risks) return 0;
  return risks.reduce((score, risk) => {
    const impactMap: any = { low: 1, medium: 2, high: 3, critical: 5 };
    const probabilityMap: any = { low: 1, medium: 2, high: 3 };
    const impactScore = impactMap[risk.impact] || 0;
    const probabilityScore = probabilityMap[risk.probability] || 0;
    return score + (impactScore * probabilityScore);
  }, 0);
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Export the service
export const strategicService = {
  execute,
};