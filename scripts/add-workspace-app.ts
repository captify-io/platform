import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const region = process.env.AWS_REGION || "us-east-1";
const schema = process.env.SCHEMA || "captify";

const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client);

async function addWorkspaceApp() {
  const TABLE_NAME = `${schema}-core-app`;

  // Read the config file
  const configPath = path.join(
    __dirname,
    "../src/app/workspace/config.json"
  );
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  const app = {
    id: "workspace", // Primary key
    slug: "workspace",
    name: "Workspace",
    description:
      "Workspace collaboration hub for projects, issues, and team coordination",
    icon: "Layers",
    color: "#3b82f6",
    category: "workspace",
    version: "1.0.0",
    status: "active",
    visibility: "public",
    order: "1", // First in the apps list (string for GSI)
    tags: ["workspace", "projects", "issues", "collaboration", "team"],
    config: config,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log("Adding workspace app to table:", TABLE_NAME);
  console.log("App data:", JSON.stringify(app, null, 2));

  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: app,
      })
    );

    console.log("✅ Successfully added workspace app");
  } catch (error) {
    console.error("❌ Error adding workspace app:", error);
    throw error;
  }
}

addWorkspaceApp()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
