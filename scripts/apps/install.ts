#!/usr/bin/env node
/**
 * Application Installation Script
 *
 * Discovers all application configurations in the scripts directory,
 * registers them in the captify-applications table, and creates
 * the required DynamoDB tables for each application.
 */

import { execSync } from "child_process";
import { readdirSync, statSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  DynamoDBClient,
  PutItemCommand,
  CreateTableCommand,
  DescribeTableCommand,
  AttributeDefinition,
  KeySchemaElement,
  GlobalSecondaryIndex,
  ScalarAttributeType,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from "uuid";

interface ApplicationConfig {
  id: string;
  slug: string;
  name: string;
  title?: string;
  description?: string;
  version?: string;
  agentId?: string;
  agentAliasId?: string;
  database?: {
    tables?: Record<string, string | TableSchema>;
    requiresSharedTables?: string[];
  };
  menu?: Array<{
    id: string;
    label: string;
    icon: string;
    href?: string;
    order?: number;
    parent_id?: string;
  }>;
  workspace?: any;
  permissions?: string[];
  capabilities?: string[];
  category?: string;
  status?: string;
  logo_url?: string;
  documentation_url?: string;
  repository_url?: string;
}

interface TableSchema {
  tableName: string;
  schema: {
    partitionKey: string;
    sortKey?: string;
    attributes: Record<
      string,
      {
        type: string;
        description: string;
      }
    >;
    globalSecondaryIndexes?: Array<{
      name: string;
      partitionKey: string;
      sortKey?: string;
    }>;
  };
}

interface ApplicationEntity {
  // DynamoDB Keys
  id: string; // UUID - main identifier

  // Application data from config
  slug: string;
  name: string;
  title: string;
  description: string;
  version: string;
  status: string;
  category: string;

  // Agent configuration
  agentId?: string;
  agentAliasId?: string;

  // Database configuration
  database_tables?: Record<string, string>;
  requires_shared_tables?: string[];

  // UI configuration
  menu?: any[];
  workspace?: any;

  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;

  // Additional properties
  permissions?: string[];
  capabilities?: string[];
  logo_url?: string;
  documentation_url?: string;
  repository_url?: string;

  // Graph metadata
  node_type: string;
  tags?: string[];
}

class ApplicationInstaller {
  private dynamoClient: DynamoDBClient;
  private region: string;
  private scriptsDir: string;

  constructor() {
    this.region = process.env.REGION || "us-east-1";
    this.dynamoClient = new DynamoDBClient({ region: this.region });
    this.scriptsDir = join(process.cwd(), "scripts", "apps"); // Look in scripts/apps directory
  }

  /**
   * Convert database tables config to simple Record<string, string> for storage
   */
  private convertDatabaseTables(
    tables?: Record<string, string | TableSchema>
  ): Record<string, string> | undefined {
    if (!tables) return undefined;

    const converted: Record<string, string> = {};
    for (const [tableName, tableConfig] of Object.entries(tables)) {
      if (typeof tableConfig === "string") {
        converted[tableName] = tableConfig;
      } else {
        // For TableSchema objects, use the schema description or table name as purpose
        converted[tableName] =
          tableConfig.schema.attributes.purpose?.description ||
          "application-specific";
      }
    }
    return converted;
  }

  /**
   * Discover all application configs in scripts/apps directory
   */
  private discoverApplications(): ApplicationConfig[] {
    const applications: ApplicationConfig[] = [];

    try {
      const entries = readdirSync(this.scriptsDir);

      for (const entry of entries) {
        const entryPath = join(this.scriptsDir, entry);

        // Skip non-directories, system files, and the install.ts file
        if (
          !statSync(entryPath).isDirectory() ||
          entry.startsWith(".") ||
          entry === "install.ts"
        ) {
          continue;
        }

        const configPath = join(entryPath, "config.json");

        if (existsSync(configPath)) {
          try {
            const configContent = readFileSync(configPath, "utf-8");
            const config: ApplicationConfig = JSON.parse(configContent);

            // Validate required fields
            if (!config.id || !config.slug || !config.name) {
              console.warn(
                `⚠️  Skipping ${entry}: Missing required fields (id, slug, name)`
              );
              continue;
            }

            applications.push(config);
            console.log(
              `📱 Found application: ${config.name} (${config.slug})`
            );
          } catch (error) {
            console.error(`❌ Error reading config for ${entry}:`, error);
          }
        } else {
          console.log(`⏭️  Skipping ${entry}: No config.json found`);
        }
      }
    } catch (error) {
      console.error("❌ Error reading scripts/apps directory:", error);
    }

    return applications;
  }

  /**
   * Transform config to ApplicationEntity for DynamoDB
   */
  private configToApplicationEntity(
    config: ApplicationConfig
  ): ApplicationEntity {
    const now = new Date().toISOString();

    return {
      // Keys
      id: config.id,

      // Basic info
      slug: config.slug,
      name: config.name,
      title: config.title || config.name,
      description: config.description || `${config.name} application`,
      version: config.version || "1.0.0",
      status: config.status || "active",
      category: config.category || "general",

      // Agent config
      agentId: config.agentId,
      agentAliasId: config.agentAliasId,

      // Database config
      database_tables: this.convertDatabaseTables(config.database?.tables),
      requires_shared_tables: config.database?.requiresSharedTables,

      // UI config
      menu: config.menu,
      workspace: config.workspace,

      // Metadata
      created_at: now,
      updated_at: now,
      created_by: "system",

      // Additional
      permissions: config.permissions,
      capabilities: config.capabilities,
      logo_url: config.logo_url,
      documentation_url: config.documentation_url,
      repository_url: config.repository_url,

      // Graph metadata
      node_type: "application",
      tags: [config.category || "general", config.slug],
    };
  }

  /**
   * Register application in captify-applications table
   */
  private async registerApplication(entity: ApplicationEntity): Promise<void> {
    try {
      const item = marshall(entity, {
        removeUndefinedValues: true,
        convertEmptyValues: false,
      });

      const command = new PutItemCommand({
        TableName: "captify-applications",
        Item: item,
        ConditionExpression: "attribute_not_exists(id)", // Prevent overwriting
      });

      await this.dynamoClient.send(command);
      console.log(`✅ Registered application: ${entity.name}`);
    } catch (error: any) {
      if (error.name === "ConditionalCheckFailedException") {
        console.log(
          `📝 Application ${entity.name} already exists, updating...`
        );

        // Update without condition
        const updateCommand = new PutItemCommand({
          TableName: "captify-applications",
          Item: marshall(
            { ...entity, updated_at: new Date().toISOString() },
            {
              removeUndefinedValues: true,
              convertEmptyValues: false,
            }
          ),
        });

        await this.dynamoClient.send(updateCommand);
        console.log(`✅ Updated application: ${entity.name}`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Check if table exists
   */
  private async tableExists(tableName: string): Promise<boolean> {
    try {
      await this.dynamoClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );
      return true;
    } catch (error: any) {
      if (error.name === "ResourceNotFoundException") {
        return false;
      }
      throw error;
    }
  }

  /**
   * Create application-specific table
   */
  private async createApplicationTable(
    tableName: string,
    purpose: string
  ): Promise<void> {
    if (await this.tableExists(tableName)) {
      console.log(`✅ Table ${tableName} already exists`);
      return;
    }

    try {
      // Create a basic table structure - can be customized per app needs
      const command = new CreateTableCommand({
        TableName: tableName,
        AttributeDefinitions: [
          { AttributeName: "id", AttributeType: "S" },
          { AttributeName: "user_id", AttributeType: "S" },
        ],
        KeySchema: [
          { AttributeName: "id", KeyType: "HASH" },
          { AttributeName: "user_id", KeyType: "RANGE" },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: "UserIndex",
            KeySchema: [
              { AttributeName: "user_id", KeyType: "HASH" },
              { AttributeName: "id", KeyType: "RANGE" },
            ],
            Projection: { ProjectionType: "ALL" },
          },
        ],
        BillingMode: "PAY_PER_REQUEST",
        Tags: [
          { Key: "Purpose", Value: purpose },
          { Key: "Environment", Value: process.env.NODE_ENV || "development" },
          { Key: "Project", Value: "captify" },
          { Key: "TableType", Value: "application-specific" },
        ],
      });

      await this.dynamoClient.send(command);
      console.log(`✅ Created table: ${tableName} (${purpose})`);
    } catch (error) {
      console.error(`❌ Failed to create table ${tableName}:`, error);
    }
  }

  /**
   * Create application table from enhanced schema definition
   */
  private async createApplicationTableFromSchema(
    tableName: string,
    tableSchema: TableSchema
  ): Promise<void> {
    const actualTableName = tableSchema.tableName;

    if (await this.tableExists(actualTableName)) {
      console.log(`✅ Table ${actualTableName} already exists`);
      return;
    }

    try {
      const schema = tableSchema.schema;

      // Build attribute definitions from schema
      const attributeDefinitions: AttributeDefinition[] = [];
      const keyAttributes = new Set([schema.partitionKey]);
      if (schema.sortKey) keyAttributes.add(schema.sortKey);

      // Add GSI key attributes
      if (schema.globalSecondaryIndexes) {
        for (const gsi of schema.globalSecondaryIndexes) {
          keyAttributes.add(gsi.partitionKey);
          if (gsi.sortKey) keyAttributes.add(gsi.sortKey);
        }
      }

      // Define attributes for key fields
      for (const attrName of keyAttributes) {
        const attrConfig = schema.attributes[attrName];
        if (attrConfig) {
          attributeDefinitions.push({
            AttributeName: attrName,
            AttributeType: this.mapAttributeType(attrConfig.type),
          });
        }
      }

      // Build key schema
      const keySchema: KeySchemaElement[] = [
        { AttributeName: schema.partitionKey, KeyType: "HASH" },
      ];
      if (schema.sortKey) {
        keySchema.push({ AttributeName: schema.sortKey, KeyType: "RANGE" });
      }

      // Build GSIs
      const globalSecondaryIndexes: GlobalSecondaryIndex[] = [];
      if (schema.globalSecondaryIndexes) {
        for (const gsi of schema.globalSecondaryIndexes) {
          const gsiKeySchema: KeySchemaElement[] = [
            { AttributeName: gsi.partitionKey, KeyType: "HASH" },
          ];
          if (gsi.sortKey) {
            gsiKeySchema.push({ AttributeName: gsi.sortKey, KeyType: "RANGE" });
          }

          globalSecondaryIndexes.push({
            IndexName: gsi.name,
            KeySchema: gsiKeySchema,
            Projection: { ProjectionType: "ALL" },
          });
        }
      }

      const command = new CreateTableCommand({
        TableName: actualTableName,
        AttributeDefinitions: attributeDefinitions,
        KeySchema: keySchema,
        GlobalSecondaryIndexes:
          globalSecondaryIndexes.length > 0
            ? globalSecondaryIndexes
            : undefined,
        BillingMode: "PAY_PER_REQUEST",
        Tags: [
          {
            Key: "Purpose",
            Value:
              tableSchema.schema.attributes.purpose?.description ||
              "application-specific",
          },
          { Key: "Environment", Value: process.env.NODE_ENV || "development" },
          { Key: "Project", Value: "captify" },
          { Key: "TableType", Value: "application-specific" },
        ],
      });

      await this.dynamoClient.send(command);
      console.log(`✅ Created table: ${actualTableName} with enhanced schema`);
    } catch (error) {
      console.error(`❌ Failed to create table ${actualTableName}:`, error);
    }
  }

  /**
   * Map schema attribute type to DynamoDB type
   */
  private mapAttributeType(type: string): ScalarAttributeType {
    switch (type.toUpperCase()) {
      case "S":
      case "STRING":
        return "S";
      case "N":
      case "NUMBER":
        return "N";
      case "B":
      case "BINARY":
        return "B";
      default:
        return "S"; // Default to string
    }
  }

  /**
   * Create all tables required by an application
   */
  private async createApplicationTables(
    config: ApplicationConfig
  ): Promise<void> {
    if (!config.database?.tables) {
      console.log(`⏭️  No custom tables defined for ${config.name}`);
      return;
    }

    console.log(`🗄️  Creating tables for ${config.name}...`);

    for (const [tableName, tableConfig] of Object.entries(
      config.database.tables
    )) {
      if (typeof tableConfig === "string") {
        // Legacy format: tableName -> purpose
        await this.createApplicationTable(tableName, tableConfig);
      } else {
        // New format: tableName -> TableSchema
        await this.createApplicationTableFromSchema(tableName, tableConfig);
      }
    }

    // Seed demo data if configured
    await this.seedDemoData(config);
  }

  /**
   * Install all discovered applications
   */
  async installAllApplications(): Promise<void> {
    console.log("🚀 Starting application installation...");
    console.log(`Apps directory: ${this.scriptsDir}`);
    console.log("");

    // Discover applications
    const applications = this.discoverApplications();

    if (applications.length === 0) {
      console.log("❌ No applications found to install");
      return;
    }

    console.log(`Found ${applications.length} application(s) to install:`);
    applications.forEach((app) => console.log(`  - ${app.name} (${app.slug})`));
    console.log("");

    let successCount = 0;
    let errorCount = 0;

    // Process each application
    for (const config of applications) {
      try {
        console.log(`📱 Processing ${config.name}...`);

        // Convert config to entity
        const entity = this.configToApplicationEntity(config);

        // Register in captify-applications table
        await this.registerApplication(entity);

        // Create application-specific tables
        await this.createApplicationTables(config);

        successCount++;
        console.log(`✅ Successfully installed ${config.name}`);
        console.log("");
      } catch (error) {
        console.error(`❌ Error installing ${config.name}:`, error);
        errorCount++;
        console.log("");
      }
    }

    // Summary
    console.log("📊 Installation Summary:");
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📱 Total: ${applications.length}`);

    if (errorCount === 0) {
      console.log("🎉 All applications installed successfully!");
    }
  }

  /**
   * Seed demo data for applications that have demo configuration
   */
  private async seedDemoData(config: ApplicationConfig): Promise<void> {
    // Check if demo data is configured and enabled
    const demoConfig = (config as any).demo;
    if (!demoConfig || !demoConfig.enabled) {
      return;
    }

    console.log(`🌱 Seeding demo data for ${config.name}...`);

    try {
      // Look for seed data script in the app directory
      const appDir = join(this.scriptsDir, config.slug);
      const seedDataPath = join(appDir, "seed-data.ts");

      if (existsSync(seedDataPath)) {
        // Convert Windows path to file:// URL for dynamic import
        const seedDataUrl = `file:///${seedDataPath.replace(/\\/g, "/")}`;

        // Dynamically import and execute the seed data generator
        const { miSeedGenerator } = await import(seedDataUrl);

        // Set environment variables for the seeder
        process.env.MI_DYNAMODB_TABLE = `${config.slug}-bom-graph`;

        await miSeedGenerator.generateB52HDemoData();
        console.log(`✅ Demo data seeded successfully for ${config.name}`);
      } else {
        console.log(`⚠️  No seed data script found at ${seedDataPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to seed demo data for ${config.name}:`, error);
      throw error;
    }
  }

  /**
   * Install specific application
   */
  async installApplication(appSlug: string): Promise<void> {
    const applications = this.discoverApplications();
    const app = applications.find((a) => a.slug === appSlug);

    if (!app) {
      throw new Error(`Application '${appSlug}' not found`);
    }

    console.log(`📱 Installing ${app.name}...`);

    const entity = this.configToApplicationEntity(app);
    await this.registerApplication(entity);
    await this.createApplicationTables(app);

    console.log(`✅ Successfully installed ${app.name}`);
  }

  /**
   * List available applications
   */
  listApplications(): void {
    const applications = this.discoverApplications();

    if (applications.length === 0) {
      console.log("No applications found in scripts directory");
      return;
    }

    console.log("Available applications:");
    applications.forEach((app) => {
      console.log(`  ${app.slug} - ${app.name}`);
      if (app.description) {
        console.log(`    Description: ${app.description}`);
      }
      if (app.database?.tables) {
        const tableCount = Object.keys(app.database.tables).length;
        console.log(`    Tables: ${tableCount} custom table(s)`);
      }
      console.log("");
    });
  }
}

// CLI Interface
async function main() {
  const installer = new ApplicationInstaller();

  // Get command line arguments
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    if (command === "list") {
      installer.listApplications();
    } else if (command === "install" && args[1]) {
      // Install specific app
      await installer.installApplication(args[1]);
    } else if (command === "install" || !command) {
      // Install all apps
      await installer.installAllApplications();
    } else {
      console.log("Usage:");
      console.log("  npm run install-app           # Install all applications");
      console.log("  npm run install-app install   # Install all applications");
      console.log(
        "  npm run install-app install <slug>  # Install specific application"
      );
      console.log(
        "  npm run install-app list      # List available applications"
      );
      console.log("");
      console.log("Environment variables:");
      console.log("  REGION   - AWS region (default: us-east-1)");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Installation failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { ApplicationInstaller };
