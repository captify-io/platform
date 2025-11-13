/**
 * Seed DataOps Ontology Nodes
 *
 * Creates ontology nodes for NextGen DataOps platform
 * IL5 NIST Rev 5 compliant data operations
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const dynamodb = DynamoDBDocumentClient.from(client);

const ONTOLOGY_TABLE = "captify-core-ontology-node";

interface OntologyNode {
  id: string;
  type: string;
  category: string;
  domain: string;
  name: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  shape?: string;
  active: string;
  properties?: any;
  createdAt: string;
  updatedAt: string;
}

// Check if node exists before creating
async function nodeExists(id: string): Promise<boolean> {
  try {
    const result = await dynamodb.send(new GetCommand({
      TableName: ONTOLOGY_TABLE,
      Key: { id }
    }));
    return !!result.Item;
  } catch (error) {
    return false;
  }
}

// Create ontology node
async function createNode(node: OntologyNode) {
  const exists = await nodeExists(node.id);

  if (exists) {
    console.log(`✓ Node already exists: ${node.id} (${node.name})`);
    return;
  }

  try {
    await dynamodb.send(new PutCommand({
      TableName: ONTOLOGY_TABLE,
      Item: node
    }));
    console.log(`✓ Created node: ${node.id} (${node.name})`);
  } catch (error) {
    console.error(`✗ Failed to create node ${node.id}:`, error);
    throw error;
  }
}

// DataOps Ontology Nodes
const dataopsNodes: OntologyNode[] = [
  // 1. DataOps Data Source (external system)
  {
    id: "dataops-data-source",
    type: "dataSource",
    category: "datasource",
    domain: "DataOps",
    name: "Data Source",
    label: "Data Source",
    description: "External system providing data (S3, Glue, Databricks, Snowflake)",
    icon: "database",
    color: "#3b82f6",
    shape: "rectangle",
    active: "true",
    properties: {
      dataSource: "dataops-data-source",
      schema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Unique identifier" },
          type: {
            type: "string",
            enum: ["s3", "glue", "aurora", "dynamodb", "databricks", "snowflake", "athena"],
            description: "Data source type"
          },
          name: { type: "string", description: "Display name" },
          description: { type: "string", description: "Description" },
          connectionInfo: {
            type: "object",
            description: "Connection details (host, credentials, etc.)"
          },
          domain: { type: "string", description: "Business domain" },
          owner: { type: "string", description: "Owner user ID" },
          classification: {
            type: "string",
            enum: ["U", "C", "S", "TS"],
            description: "Data classification (IL5)"
          },
          status: {
            type: "string",
            enum: ["active", "offline", "deprecated"],
            description: "Connection status"
          },
          qualityScore: { type: "number", description: "Quality score 0-100" },
          lastSyncedAt: { type: "string", description: "Last sync timestamp" }
        },
        required: ["id", "type", "name", "owner", "classification"]
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 2. Quality Rule
  {
    id: "dataops-quality-rule",
    type: "qualityRule",
    category: "governance",
    domain: "DataOps",
    name: "Quality Rule",
    label: "Quality Rule",
    description: "Data quality validation rule",
    icon: "check-circle",
    color: "#10b981",
    shape: "diamond",
    active: "true",
    properties: {
      dataSource: "dataops-quality-rule",
      schema: {
        type: "object",
        properties: {
          id: { type: "string" },
          datasetId: { type: "string", description: "Target dataset ID" },
          name: { type: "string" },
          description: { type: "string" },
          type: {
            type: "string",
            enum: ["completeness", "validity", "consistency", "timeliness", "uniqueness", "custom"],
            description: "Quality dimension"
          },
          expression: { type: "string", description: "SQL WHERE or Python expression" },
          threshold: { type: "number", description: "Pass threshold (0-100)" },
          severity: {
            type: "string",
            enum: ["low", "medium", "high", "critical"]
          },
          schedule: { type: "string", description: "Cron expression" },
          enabled: { type: "boolean" }
        },
        required: ["id", "datasetId", "name", "type", "expression", "threshold"]
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 3. Quality Check Result
  {
    id: "dataops-quality-check",
    type: "qualityCheck",
    category: "governance",
    domain: "DataOps",
    name: "Quality Check",
    label: "Quality Check",
    description: "Quality check execution result",
    icon: "activity",
    color: "#6366f1",
    shape: "circle",
    active: "true",
    properties: {
      dataSource: "dataops-quality-check",
      schema: {
        type: "object",
        properties: {
          id: { type: "string" },
          datasetId: { type: "string" },
          ruleId: { type: "string" },
          passed: { type: "boolean" },
          score: { type: "number" },
          message: { type: "string" },
          checkedAt: { type: "string" },
          executionTime: { type: "number", description: "Milliseconds" }
        }
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 4. Lineage (data flow relationship)
  {
    id: "dataops-lineage",
    type: "lineage",
    category: "metadata",
    domain: "DataOps",
    name: "Data Lineage",
    label: "Data Lineage",
    description: "Data flow from source to target with transformations",
    icon: "git-branch",
    color: "#8b5cf6",
    shape: "edge",
    active: "true",
    properties: {
      dataSource: "dataops-lineage",
      schema: {
        type: "object",
        properties: {
          id: { type: "string" },
          sourceId: { type: "string", description: "Source dataset ID" },
          targetId: { type: "string", description: "Target dataset ID" },
          relationType: {
            type: "string",
            enum: ["derives_from", "feeds_into", "references"]
          },
          transformations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                description: { type: "string" },
                code: { type: "string" }
              }
            }
          },
          pipelineId: { type: "string", description: "Pipeline that created this lineage" }
        }
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 5. Policy (governance policy)
  {
    id: "dataops-policy",
    type: "policy",
    category: "governance",
    domain: "DataOps",
    name: "Data Policy",
    label: "Data Policy",
    description: "Governance policy for data compliance (NIST 800-53 Rev 5)",
    icon: "shield",
    color: "#ef4444",
    shape: "hexagon",
    active: "true",
    properties: {
      dataSource: "dataops-policy",
      schema: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          category: {
            type: "string",
            enum: ["security", "privacy", "compliance", "quality"]
          },
          content: { type: "string", description: "Full policy (markdown)" },
          rules: {
            type: "array",
            items: {
              type: "object",
              properties: {
                condition: { type: "string" },
                requirement: { type: "string" },
                enforcement: {
                  type: "string",
                  enum: ["warning", "blocking"]
                }
              }
            }
          },
          authority: {
            type: "string",
            description: "NIST 800-53 Rev 5, DoD 8570, FedRAMP"
          },
          nistControls: {
            type: "array",
            items: { type: "string" },
            description: "NIST 800-53 control IDs (e.g., AC-3, AU-2)"
          },
          effectiveDate: { type: "string" },
          reviewDate: { type: "string" },
          status: {
            type: "string",
            enum: ["draft", "active", "deprecated"]
          }
        },
        required: ["id", "name", "category", "authority", "status"]
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 6. Classification (IL5 data classification)
  {
    id: "dataops-classification",
    type: "classification",
    category: "security",
    domain: "DataOps",
    name: "Data Classification",
    label: "Data Classification",
    description: "IL5 data classification metadata (U/C/S/TS)",
    icon: "lock",
    color: "#f59e0b",
    shape: "shield",
    active: "true",
    properties: {
      dataSource: "dataops-classification",
      schema: {
        type: "object",
        properties: {
          id: { type: "string" },
          datasetId: { type: "string" },
          classification: {
            type: "string",
            enum: ["U", "C", "S", "TS"],
            description: "Unclassified, Confidential, Secret, Top Secret"
          },
          rationale: { type: "string", description: "Why this classification" },
          classifiedBy: { type: "string", description: "User who classified" },
          classifiedAt: { type: "string" },
          reviewDate: { type: "string", description: "Declassification review date" },
          derivativeFrom: {
            type: "array",
            items: { type: "string" },
            description: "Source classifications"
          },
          downgradeInstructions: { type: "string" },
          markingRequired: { type: "boolean", description: "Require classification marking on all views" }
        },
        required: ["id", "datasetId", "classification", "classifiedBy"]
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 7. PII Field (PII metadata)
  {
    id: "dataops-pii-field",
    type: "piiField",
    category: "security",
    domain: "DataOps",
    name: "PII Field",
    label: "PII Field",
    description: "Personally Identifiable Information field metadata",
    icon: "eye-off",
    color: "#dc2626",
    shape: "diamond",
    active: "true",
    properties: {
      dataSource: "dataops-pii-field",
      schema: {
        type: "object",
        properties: {
          id: { type: "string" },
          datasetId: { type: "string" },
          columnName: { type: "string" },
          piiType: {
            type: "string",
            enum: ["ssn", "email", "phone", "credit_card", "drivers_license", "passport", "address", "dob"],
            description: "Type of PII"
          },
          confidence: { type: "number", description: "Detection confidence 0-1" },
          masked: { type: "boolean", description: "Is field currently masked" },
          maskingStrategy: {
            type: "string",
            enum: ["full_redaction", "partial_masking", "tokenization", "encryption"],
            description: "How PII is masked"
          },
          detectedBy: { type: "string", description: "Detection method (ai, regex, manual)" },
          detectedAt: { type: "string" }
        },
        required: ["id", "datasetId", "columnName", "piiType"]
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 8. Compliance Check (NIST compliance)
  {
    id: "dataops-compliance-check",
    type: "complianceCheck",
    category: "governance",
    domain: "DataOps",
    name: "Compliance Check",
    label: "Compliance Check",
    description: "NIST 800-53 Rev 5 compliance check result",
    icon: "clipboard-check",
    color: "#059669",
    shape: "rectangle",
    active: "true",
    properties: {
      dataSource: "dataops-compliance-check",
      schema: {
        type: "object",
        properties: {
          id: { type: "string" },
          datasetId: { type: "string" },
          policyId: { type: "string" },
          nistControl: { type: "string", description: "NIST 800-53 control ID (e.g., AC-3)" },
          checkType: {
            type: "string",
            enum: ["automated", "manual", "continuous"]
          },
          status: {
            type: "string",
            enum: ["compliant", "non-compliant", "warning", "pending"]
          },
          findings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                rule: { type: "string" },
                result: { type: "string", enum: ["pass", "fail", "warning"] },
                message: { type: "string" },
                severity: { type: "string", enum: ["low", "medium", "high", "critical"] }
              }
            }
          },
          remediationStatus: {
            type: "string",
            enum: ["not_started", "in_progress", "completed"]
          },
          assignedTo: { type: "string" },
          dueDate: { type: "string" },
          checkedAt: { type: "string" },
          checkedBy: { type: "string" }
        },
        required: ["id", "datasetId", "policyId", "nistControl", "status"]
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// AWS Service Nodes (for integration)
const awsServiceNodes: OntologyNode[] = [
  // 9. AWS Glue Database
  {
    id: "aws-glue-database",
    type: "glueDatabase",
    category: "datasource",
    domain: "AWS",
    name: "Glue Database",
    label: "Glue Database",
    description: "AWS Glue Data Catalog database",
    icon: "database",
    color: "#ff9900",
    active: "true",
    properties: {
      dataSource: "aws-glue-database",
      schema: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          catalogId: { type: "string" },
          region: { type: "string" },
          tableCount: { type: "number" }
        }
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 10. AWS Glue Table
  {
    id: "aws-glue-table",
    type: "glueTable",
    category: "dataset",
    domain: "AWS",
    name: "Glue Table",
    label: "Glue Table",
    description: "AWS Glue Data Catalog table",
    icon: "table",
    color: "#ff9900",
    active: "true",
    properties: {
      dataSource: "aws-glue-table",
      schema: {
        type: "object",
        properties: {
          id: { type: "string" },
          database: { type: "string" },
          tableName: { type: "string" },
          location: { type: "string", description: "S3 location" },
          storageFormat: { type: "string", description: "Parquet, CSV, JSON" },
          schema: { type: "object" },
          partitionKeys: { type: "array", items: { type: "string" } },
          rowCount: { type: "number" },
          sizeBytes: { type: "number" }
        }
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 11. AWS S3 Bucket
  {
    id: "aws-s3-bucket",
    type: "s3Bucket",
    category: "datasource",
    domain: "AWS",
    name: "S3 Bucket",
    label: "S3 Bucket",
    description: "AWS S3 storage bucket",
    icon: "hard-drive",
    color: "#ff9900",
    active: "true",
    properties: {
      dataSource: "aws-s3-bucket",
      schema: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          region: { type: "string" },
          encryption: { type: "boolean", description: "SSE-S3 or SSE-KMS" },
          versioning: { type: "boolean" },
          publicAccess: { type: "boolean" },
          sizeBytes: { type: "number" },
          objectCount: { type: "number" }
        }
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 12. AWS Athena Table
  {
    id: "aws-athena-table",
    type: "athenaTable",
    category: "dataset",
    domain: "AWS",
    name: "Athena Table",
    label: "Athena Table",
    description: "AWS Athena queryable table",
    icon: "search",
    color: "#ff9900",
    active: "true",
    properties: {
      dataSource: "aws-athena-table",
      schema: {
        type: "object",
        properties: {
          id: { type: "string" },
          database: { type: "string" },
          tableName: { type: "string" },
          location: { type: "string" },
          schema: { type: "object" },
          lastQueried: { type: "string" }
        }
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 13. AWS QuickSight Dataset
  {
    id: "aws-quicksight-dataset",
    type: "quicksightDataset",
    category: "dataproduct",
    domain: "AWS",
    name: "QuickSight Dataset",
    label: "QuickSight Dataset",
    description: "AWS QuickSight dashboard dataset",
    icon: "bar-chart",
    color: "#ff9900",
    active: "true",
    properties: {
      dataSource: "aws-quicksight-dataset",
      schema: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          datasetId: { type: "string" },
          importMode: { type: "string", enum: ["SPICE", "DIRECT"] },
          spiceCapacity: { type: "number" },
          lastRefresh: { type: "string" },
          dashboards: { type: "array", items: { type: "string" } }
        }
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function main() {
  console.log("🚀 Seeding DataOps Ontology Nodes...\n");

  console.log("Creating DataOps nodes (8)...");
  for (const node of dataopsNodes) {
    await createNode(node);
  }

  console.log("\nCreating AWS Service nodes (5)...");
  for (const node of awsServiceNodes) {
    await createNode(node);
  }

  console.log("\n✅ DataOps ontology seeding complete!");
  console.log(`   Total nodes: ${dataopsNodes.length + awsServiceNodes.length}`);
}

main().catch(console.error);
