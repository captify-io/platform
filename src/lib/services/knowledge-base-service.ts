/**
 * AWS Bedrock Knowledge Base Service
 * Handles creation and management of knowledge bases for agents
 */

import {
  BedrockAgentClient,
  CreateKnowledgeBaseCommand,
} from "@aws-sdk/client-bedrock-agent";
import {
  OpenSearchServerlessClient,
  CreateCollectionCommand,
} from "@aws-sdk/client-opensearchserverless";

export interface KnowledgeBaseConfig {
  name: string;
  description: string;
  s3BucketName: string;
  s3KeyPrefix: string; // e.g., "users/user-123/" or "specialized/policy-advisor/"
  roleArn: string;
}

export interface KnowledgeBaseStatus {
  id: string;
  status: "CREATING" | "ACTIVE" | "UPDATING" | "FAILED" | "DELETING";
  collectionArn?: string;
  vectorIndexName?: string;
  dataSourceId?: string;
  dataSourceStatus?: "CREATING" | "ACTIVE" | "FAILED" | "SYNCING";
  lastSyncTime?: string;
  progress?: number;
  errorMessage?: string;
}

export class KnowledgeBaseService {
  private bedrockAgent: BedrockAgentClient;
  private opensearch: OpenSearchServerlessClient;

  constructor() {
    this.bedrockAgent = new BedrockAgentClient({
      region: process.env.AWS_REGION || "us-gov-west-1",
    });
    this.opensearch = new OpenSearchServerlessClient({
      region: process.env.AWS_REGION || "us-gov-west-1",
    });
  }

  /**
   * Creates a knowledge base with vector store (async operation)
   */
  async createKnowledgeBase(
    config: KnowledgeBaseConfig
  ): Promise<{ knowledgeBaseId: string; status: string }> {
    try {
      // Step 1: Create OpenSearch Serverless collection for vector storage
      const collectionName = `kb-${config.name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")}`;

      const collectionResponse = await this.opensearch.send(
        new CreateCollectionCommand({
          name: collectionName,
          type: "VECTORSEARCH",
          description: `Vector collection for ${config.description}`,
        })
      );

      // Step 2: Create the knowledge base
      const kbResponse = await this.bedrockAgent.send(
        new CreateKnowledgeBaseCommand({
          name: config.name,
          description: config.description,
          roleArn: config.roleArn,
          knowledgeBaseConfiguration: {
            type: "VECTOR",
            vectorKnowledgeBaseConfiguration: {
              embeddingModelArn:
                "arn:aws-us-gov:bedrock:us-gov-west-1::foundation-model/amazon.titan-embed-text-v1",
            },
          },
          storageConfiguration: {
            type: "OPENSEARCH_SERVERLESS",
            opensearchServerlessConfiguration: {
              collectionArn:
                collectionResponse.createCollectionDetail?.arn || "",
              vectorIndexName: "bedrock-knowledge-base-default-index",
              fieldMapping: {
                vectorField: "vector",
                textField: "text",
                metadataField: "metadata",
              },
            },
          },
        })
      );

      if (!kbResponse.knowledgeBase?.knowledgeBaseId) {
        throw new Error(
          "Failed to create knowledge base - no knowledge base ID returned"
        );
      }

      return {
        knowledgeBaseId: kbResponse.knowledgeBase.knowledgeBaseId,
        status: "CREATING",
      };
    } catch (error) {
      console.error("Error creating knowledge base:", error);
      throw error;
    }
  }

  /**
   * Checks the status of knowledge base creation
   */
  async getKnowledgeBaseStatus(
    knowledgeBaseId: string
  ): Promise<KnowledgeBaseStatus> {
    try {
      const response = await this.bedrockAgent.send(
        new GetKnowledgeBaseCommand({
          knowledgeBaseId,
        })
      );

      // Map AWS status to our allowed status values
      const allowedStatuses = [
        "CREATING",
        "ACTIVE",
        "UPDATING",
        "FAILED",
        "DELETING",
      ] as const;
      const rawStatus = response.knowledgeBase?.status;
      const status: KnowledgeBaseStatus["status"] = allowedStatuses.includes(
        rawStatus as KnowledgeBaseStatus["status"]
      )
        ? (rawStatus as KnowledgeBaseStatus["status"])
        : "FAILED";

      return {
        id: knowledgeBaseId,
        status,
        // Add other status fields as needed
      };
    } catch (error) {
      console.error("Error getting knowledge base status:", error);
      throw error;
    }
  }

  /**
   * Triggers data source synchronization (ingests S3 documents)
   */
  async syncDataSource(
    knowledgeBaseId: string,
    dataSourceId: string
  ): Promise<{ syncJobId: string }> {
    try {
      const response = await this.bedrockAgent.send(
        new StartIngestionJobCommand({
          knowledgeBaseId,
          dataSourceId,
        })
      );

      if (!response.ingestionJob?.ingestionJobId) {
        throw new Error("Failed to start ingestion job - no job ID returned");
      }

      return {
        syncJobId: response.ingestionJob.ingestionJobId,
      };
    } catch (error) {
      console.error("Error syncing data source:", error);
      throw error;
    }
  }
}

// Import missing commands
import {
  GetKnowledgeBaseCommand,
  StartIngestionJobCommand,
} from "@aws-sdk/client-bedrock-agent";
