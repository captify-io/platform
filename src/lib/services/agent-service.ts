/**
 * Agent Service - DynamoDB operations for digital twin agents
 * Handles CRUD operations for personal, specialized, and application agents
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  UserAgent,
  AgentCreationJob,
  AgentType,
  UserRole,
} from "@/types/agents";

// Environment variables
const REGION = process.env.REGION || "us-east-1";
const AGENTS_TABLE = process.env.AGENTS_TABLE_NAME || "captify-agents";
const JOBS_TABLE = process.env.AGENT_JOBS_TABLE_NAME || "captify-agent-jobs";

// Initialize DynamoDB client with the same configuration as the app
const dynamoClientConfig = {
  region: REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || process.env.ACCESS_KEY_ID!,
    secretAccessKey:
      process.env.SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY!,
  },
};

console.log("Agent Service DynamoDB Config:", {
  region: REGION,
  hasAccessKey: !!(process.env.ACCESS_KEY_ID || process.env.ACCESS_KEY_ID),
  hasSecretKey: !!(
    process.env.SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY
  ),
  accessKeyPrefix:
    (process.env.ACCESS_KEY_ID || process.env.ACCESS_KEY_ID)?.substring(0, 8) +
    "...",
  nodeEnv: process.env.NODE_ENV,
});

const client = new DynamoDBClient(dynamoClientConfig);
const docClient = DynamoDBDocumentClient.from(client);

export class AgentService {
  /**
   * Create a new agent record in DynamoDB
   */
  static async createAgent(
    agentData: Omit<
      UserAgent,
      "PK" | "SK" | "GSI1PK" | "GSI1SK" | "GSI2PK" | "GSI2SK"
    >
  ): Promise<UserAgent> {
    const agent: UserAgent = {
      ...agentData,
      PK: `AGENT#${agentData.id}`,
      SK: "METADATA",
      GSI1PK: agentData.userId
        ? `USER#${agentData.userId}`
        : `TYPE#${agentData.type}`,
      GSI1SK: `AGENT#${agentData.type}#${agentData.createdAt}`,
      GSI2PK: `TYPE#${agentData.type}`,
      GSI2SK: `ACTIVE#${agentData.isActive}#${agentData.createdAt}`,
    };

    const command = new PutCommand({
      TableName: AGENTS_TABLE,
      Item: agent,
      ConditionExpression: "attribute_not_exists(PK)",
    });

    await docClient.send(command);
    return agent;
  }

  /**
   * Get agent by ID
   */
  static async getAgent(agentId: string): Promise<UserAgent | null> {
    const command = new GetCommand({
      TableName: AGENTS_TABLE,
      Key: {
        PK: `AGENT#${agentId}`,
        SK: "METADATA",
      },
    });

    const result = await docClient.send(command);
    return (result.Item as UserAgent) || null;
  }

  /**
   * Update agent data
   */
  static async updateAgent(
    agentId: string,
    updates: Partial<UserAgent>
  ): Promise<UserAgent> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, unknown> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "PK" && key !== "SK" && key !== "id") {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    // Always update the updatedAt timestamp
    updateExpressions.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#updatedAt"] = "updatedAt";
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: AGENTS_TABLE,
      Key: {
        PK: `AGENT#${agentId}`,
        SK: "METADATA",
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    });

    const result = await docClient.send(command);
    return result.Attributes as UserAgent;
  }

  /**
   * Delete agent
   */
  static async deleteAgent(agentId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: AGENTS_TABLE,
      Key: {
        PK: `AGENT#${agentId}`,
        SK: "METADATA",
      },
    });

    await docClient.send(command);
  }

  /**
   * Get user's personal agent
   */
  static async getUserPersonalAgent(userId: string): Promise<UserAgent | null> {
    const command = new QueryCommand({
      TableName: AGENTS_TABLE,
      IndexName: "GSI1",
      KeyConditionExpression:
        "GSI1PK = :gsi1pk AND begins_with(GSI1SK, :gsi1sk)",
      FilterExpression: "#type = :type",
      ExpressionAttributeNames: {
        "#type": "type",
      },
      ExpressionAttributeValues: {
        ":gsi1pk": `USER#${userId}`,
        ":gsi1sk": "AGENT#personal",
        ":type": "personal",
      },
      Limit: 1,
    });

    const result = await docClient.send(command);
    return (result.Items?.[0] as UserAgent) || null;
  }

  /**
   * Get all agents by type
   */
  static async getAgentsByType(
    agentType: AgentType,
    isActive = true
  ): Promise<UserAgent[]> {
    const command = new QueryCommand({
      TableName: AGENTS_TABLE,
      IndexName: "GSI2",
      KeyConditionExpression:
        "GSI2PK = :gsi2pk AND begins_with(GSI2SK, :gsi2sk)",
      ExpressionAttributeValues: {
        ":gsi2pk": `TYPE#${agentType}`,
        ":gsi2sk": `ACTIVE#${isActive}`,
      },
    });

    const result = await docClient.send(command);
    return (result.Items as UserAgent[]) || [];
  }

  /**
   * Get accessible agents for user (personal + allowed specialized)
   */
  static async getAccessibleAgents(
    userId: string,
    userRole?: UserRole
  ): Promise<UserAgent[]> {
    const agents: UserAgent[] = [];

    // Get user's personal agent
    const personalAgent = await this.getUserPersonalAgent(userId);
    if (personalAgent) {
      agents.push(personalAgent);
    }

    // Get specialized agents (public or role-restricted)
    const specializedTypes: AgentType[] = [
      "policy-advisor",
      "technical-writer",
      "safety-compliance",
      "procurement-specialist",
      "data-analyst",
      "project-manager",
      "training-coordinator",
      "quality-assurance",
    ];

    for (const type of specializedTypes) {
      const typeAgents = await this.getAgentsByType(type, true);

      // Filter by access control
      const accessibleAgents = typeAgents.filter((agent) => {
        return (
          agent.isPublic ||
          (userRole && agent.allowedUserRoles?.includes(userRole))
        );
      });

      agents.push(...accessibleAgents);
    }

    return agents;
  }

  /**
   * Check if user needs agent setup
   */
  static async checkUserSetupStatus(userId: string): Promise<{
    needsSetup: boolean;
    hasPersonalAgent: boolean;
    agentId?: string;
    isProfileComplete?: boolean;
  }> {
    const personalAgent = await this.getUserPersonalAgent(userId);

    return {
      needsSetup: !personalAgent || !personalAgent.isProfileComplete,
      hasPersonalAgent: !!personalAgent,
      agentId: personalAgent?.id,
      isProfileComplete: personalAgent?.isProfileComplete,
    };
  }

  /**
   * Create agent creation job
   */
  static async createAgentJob(
    jobData: Omit<AgentCreationJob, "PK" | "SK" | "ttl">
  ): Promise<AgentCreationJob> {
    const job: AgentCreationJob = {
      ...jobData,
      PK: `JOB#${jobData.id}`,
      SK: "STATUS",
      ttl: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
    };

    const command = new PutCommand({
      TableName: JOBS_TABLE,
      Item: job,
    });

    await docClient.send(command);
    return job;
  }

  /**
   * Update agent creation job status
   */
  static async updateAgentJob(
    jobId: string,
    updates: Partial<AgentCreationJob>
  ): Promise<AgentCreationJob> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, unknown> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "PK" && key !== "SK" && key !== "id" && key !== "ttl") {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    const command = new UpdateCommand({
      TableName: JOBS_TABLE,
      Key: {
        PK: `JOB#${jobId}`,
        SK: "STATUS",
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    });

    const result = await docClient.send(command);
    return result.Attributes as AgentCreationJob;
  }

  /**
   * Get agent creation job status
   */
  static async getAgentJob(jobId: string): Promise<AgentCreationJob | null> {
    const command = new GetCommand({
      TableName: JOBS_TABLE,
      Key: {
        PK: `JOB#${jobId}`,
        SK: "STATUS",
      },
    });

    const result = await docClient.send(command);
    return (result.Item as AgentCreationJob) || null;
  }
}
