/**
 * Seed Ontology Action Types
 *
 * Extracts actions from the Captify UI and inserts them into:
 * 1. captify-ontology-action-types - Action definitions
 * 2. captify-ontology-link-type - Links between objects and actions
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

const SCHEMA = process.env.SCHEMA || "captify";
const ACTION_TYPES_TABLE = `${SCHEMA}-ontology-action-type`;
const LINK_TYPE_TABLE = `${SCHEMA}-ontology-link-type`;

// Parsed actions from HTML with categories and object mappings
const actions = [
  // Issues
  {
    id: "create-new-issue",
    name: "Create new issue",
    category: "Issues",
    description: "Create a new issue in Captify",
    objectTypes: ["issue"],
    shortcut: "C",
  },
  {
    id: "create-issue-fullscreen",
    name: "Create issue in fullscreen",
    category: "Issues",
    description: "Create a new issue in fullscreen mode",
    objectTypes: ["issue"],
    shortcut: "V",
  },
  {
    id: "create-new-label",
    name: "Create new label",
    category: "Issues",
    description: "Create a new label for issues",
    objectTypes: ["label"],
  },

  // Projects
  {
    id: "create-new-project",
    name: "Create new project",
    category: "Projects",
    description: "Create a new project in Captify",
    objectTypes: ["project"],
    shortcut: "N then P",
  },

  // Documents
  {
    id: "create-new-document",
    name: "Create new document",
    category: "Documents",
    description: "Create a new document in a project or folder",
    objectTypes: ["document"],
  },

  // Views
  {
    id: "create-view",
    name: "Create view",
    category: "Views",
    description: "Create a custom view for filtering and organizing",
    objectTypes: ["view"],
  },

  // Filter
  {
    id: "search-workspace",
    name: "Search workspace",
    category: "Filter",
    description: "Search across the entire workspace",
    objectTypes: ["workspace"],
  },
  {
    id: "find-in-view",
    name: "Find in view",
    category: "Filter",
    description: "Search within the current view",
    objectTypes: ["view"],
    shortcut: "Ctrl+F",
  },
  {
    id: "filter",
    name: "Filter",
    category: "Filter",
    description: "Apply filters to current view",
    objectTypes: ["view"],
    shortcut: "F",
  },

  // Templates
  {
    id: "create-issue-template",
    name: "Create issue template",
    category: "Templates",
    description: "Create a reusable template for issues",
    objectTypes: ["template", "issue"],
  },
  {
    id: "create-document-template",
    name: "Create document template",
    category: "Templates",
    description: "Create a reusable template for documents",
    objectTypes: ["template", "document"],
  },
  {
    id: "create-project-template",
    name: "Create project template",
    category: "Templates",
    description: "Create a reusable template for projects",
    objectTypes: ["template", "project"],
  },

  // Favorite
  {
    id: "favorite-page",
    name: "Favorite page",
    category: "Favorite",
    description: "Mark current page as favorite",
    objectTypes: [],
    shortcut: "Alt+F",
  },

  // Navigation
  {
    id: "open-last-viewed-issue",
    name: "Open last viewed issue",
    category: "Navigation",
    description: "Navigate to the most recently viewed issue",
    objectTypes: ["issue"],
  },
];

/**
 * Insert action types into ontology-action-types table
 */
async function insertActionTypes() {
  console.log(`\n📝 Inserting ${actions.length} action types into ${ACTION_TYPES_TABLE}...\n`);

  const timestamp = new Date().toISOString();

  for (const action of actions) {
    // Use the first objectType as the primary objectType
    // Links to other objectTypes will be created separately
    const primaryObjectType = action.objectTypes[0] || "workspace";

    const item = {
      slug: action.id,
      name: action.name,
      description: action.description,
      objectType: primaryObjectType,
      status: "active",
      canCreateNew: action.id.includes("create-new") || action.id.includes("create-issue") || action.id.includes("create-document") || action.id.includes("create-project") || action.id.includes("create-view"),
      category: action.category,
      shortcut: action.shortcut || undefined,
      version: 1,
      parameters: {},
      modifiesProperties: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    try {
      await docClient.send(
        new PutCommand({
          TableName: ACTION_TYPES_TABLE,
          Item: item,
        })
      );
      console.log(`✓ Inserted: ${action.name} (${action.category}) for ${primaryObjectType}`);
    } catch (error) {
      console.error(`✗ Failed to insert ${action.name}:`, error.message);
    }
  }
}

/**
 * Create links between objects and actions in ontology-link-type table
 */
async function createObjectActionLinks() {
  console.log(`\n🔗 Creating object-action links in ${LINK_TYPE_TABLE}...\n`);

  const timestamp = new Date().toISOString();
  const links = [];

  for (const action of actions) {
    for (const objectType of action.objectTypes) {
      const slug = `${objectType}-can-${action.id}`;
      const link = {
        slug: slug,
        id: slug,
        name: `${objectType.charAt(0).toUpperCase() + objectType.slice(1)} Can ${action.name}`,
        description: `A ${objectType} can perform the action: ${action.name}`,
        sourceObjectType: objectType,
        targetObjectType: action.id,
        cardinality: "MANY_TO_ONE",
        bidirectional: false,
        foreignKey: "actionType",
        status: "active",
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      links.push(link);
    }
  }

  console.log(`Creating ${links.length} object-action links...\n`);

  // Batch write in chunks of 25 (DynamoDB limit)
  const BATCH_SIZE = 25;
  for (let i = 0; i < links.length; i += BATCH_SIZE) {
    const batch = links.slice(i, i + BATCH_SIZE);

    try {
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [LINK_TYPE_TABLE]: batch.map((link) => ({
              PutRequest: {
                Item: link,
              },
            })),
          },
        })
      );
      console.log(`✓ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} links)`);
    } catch (error) {
      console.error(`✗ Failed to insert batch:`, error.message);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("\n🚀 Starting Ontology Action Types Seed Script\n");
  console.log(`Schema: ${SCHEMA}`);
  console.log(`Action Types Table: ${ACTION_TYPES_TABLE}`);
  console.log(`Link Type Table: ${LINK_TYPE_TABLE}`);

  try {
    await insertActionTypes();
    await createObjectActionLinks();

    console.log("\n✅ Seed script completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Seed script failed:", error);
    process.exit(1);
  }
}

// Run script
main();

export { insertActionTypes, createObjectActionLinks };
