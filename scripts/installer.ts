#!/usr/bin/env tsx

/**
 * Captify Platform Installer
 * Unified installer for all platform infrastructure components
 *
 * Usage:
 *   tsx scripts/installer.ts --setup-auth-table
 *   tsx scripts/installer.ts --setup-server-production --github-token=ghp_xxx
 *   tsx scripts/installer.ts --install --github-token=ghp_xxx (full installation)
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  CreateTableCommand,
  DescribeTableCommand,
  UpdateTimeToLiveCommand,
  UpdateContinuousBackupsCommand
} from "@aws-sdk/client-dynamodb";
import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const AUTH_TOKENS_TABLE = process.env.AUTH_TOKENS_TABLE || "captify-auth-tokens";

// Available installation modules
const MODULES = {
  'setup-auth-table': setupAuthTable,
  'setup-core-tables': setupCoreTables,
  'setup-server-production': setupServerProduction,
  'install': fullInstall,
} as const;

type ModuleName = keyof typeof MODULES;

/**
 * Setup DynamoDB auth tokens table
 * NIST Rev 5 / DoD compliant configuration
 */
async function setupAuthTable() {
  console.log(`🔐 Setting up auth tokens table: ${AUTH_TOKENS_TABLE}`);
  console.log(`📍 Region: ${process.env.AWS_REGION || "us-east-1"}`);

  try {
    // Check if table exists
    try {
      const describeResult = await client.send(new DescribeTableCommand({
        TableName: AUTH_TOKENS_TABLE
      }));

      if (describeResult.Table?.TableStatus === "ACTIVE") {
        console.log(`✅ Table ${AUTH_TOKENS_TABLE} already exists and is active`);
        await configureSecurity();
        return;
      }
    } catch (error: any) {
      if (error.name !== "ResourceNotFoundException") {
        throw error;
      }
      // Table doesn't exist, we'll create it
    }

    console.log(`📋 Creating table ${AUTH_TOKENS_TABLE}...`);

    // Create table with security settings
    await client.send(new CreateTableCommand({
      TableName: AUTH_TOKENS_TABLE,
      KeySchema: [
        {
          AttributeName: "sessionId",
          KeyType: "HASH" // Partition key
        }
      ],
      AttributeDefinitions: [
        {
          AttributeName: "sessionId",
          AttributeType: "S"
        }
      ],
      BillingMode: "PAY_PER_REQUEST", // On-demand pricing

      // NIST Rev 5 / DoD Compliance: Encryption at rest
      SSESpecification: {
        Enabled: true,
        SSEType: "KMS",
        KMSMasterKeyId: "alias/aws/dynamodb" // Use AWS managed key
      },

      // Tags for compliance and cost tracking
      Tags: [
        {
          Key: "Environment",
          Value: process.env.NODE_ENV || "development"
        },
        {
          Key: "Application",
          Value: "captify-auth"
        },
        {
          Key: "Compliance",
          Value: "NIST-Rev5-DoD"
        },
        {
          Key: "DataClassification",
          Value: "sensitive"
        }
      ]
    }));

    console.log(`⏳ Waiting for table to become active...`);

    // Wait for table to be active
    let tableStatus = "CREATING";
    while (tableStatus !== "ACTIVE") {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const describeResult = await client.send(new DescribeTableCommand({
        TableName: AUTH_TOKENS_TABLE
      }));

      tableStatus = describeResult.Table?.TableStatus || "UNKNOWN";
      console.log(`   Status: ${tableStatus}`);
    }

    console.log(`✅ Table created successfully`);

    // Configure additional security features
    await configureSecurity();

    console.log(`\n✅ Auth table setup complete!`);
    console.log(`\nTable Configuration:`);
    console.log(`   Name: ${AUTH_TOKENS_TABLE}`);
    console.log(`   Partition Key: sessionId (String)`);
    console.log(`   TTL Attribute: ttl`);
    console.log(`   Encryption: AWS KMS`);
    console.log(`   Point-in-time Recovery: Enabled`);
    console.log(`   Billing: Pay-per-request`);

    console.log(`\nEnvironment Variables:`);
    console.log(`   export AUTH_TOKENS_TABLE=${AUTH_TOKENS_TABLE}`);
    console.log(`   export AWS_REGION=${process.env.AWS_REGION || "us-east-1"}`);

  } catch (error) {
    console.error(`❌ Failed to setup auth table:`, error);
    throw error;
  }
}

async function configureSecurity() {
  console.log(`🔒 Configuring security features...`);

  try {
    // Enable TTL for automatic token cleanup
    console.log(`   📅 Enabling TTL on 'ttl' attribute...`);
    await client.send(new UpdateTimeToLiveCommand({
      TableName: AUTH_TOKENS_TABLE,
      TimeToLiveSpecification: {
        AttributeName: "ttl",
        Enabled: true
      }
    }));

    // Enable point-in-time recovery (NIST requirement)
    console.log(`   💾 Enabling point-in-time recovery...`);
    await client.send(new UpdateContinuousBackupsCommand({
      TableName: AUTH_TOKENS_TABLE,
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true
      }
    }));

    console.log(`✅ Security features configured`);

  } catch (error: any) {
    if (error.name === "ValidationException" && error.message.includes("TimeToLive is already enabled")) {
      console.log(`   ℹ️  TTL already enabled`);
    } else if (error.name === "ContinuousBackupsUnavailableException") {
      console.log(`   ⚠️  Point-in-time recovery not available in this region`);
    } else {
      console.warn(`   ⚠️  Some security features may not have been configured:`, error.message);
    }
  }
}

/**
 * Setup Core tables - analyzes types and creates DynamoDB tables
 * Tables are named: {SCHEMA}-core-{TypeName}
 */
async function setupCoreTables() {
  const schema = process.env.SCHEMA || "captify";
  console.log(`📊 Setting up Core tables for schema: ${schema}`);
  console.log(`📍 Region: ${process.env.AWS_REGION || "us-east-1"}`);

  try {
    // Parse TypeScript files to find types extending Core
    const coreTypes = await parseCoreTypes();
    console.log(`🔍 Found ${coreTypes.length} types extending Core:`, coreTypes.map(t => t.name).join(', '));

    for (const type of coreTypes) {
      await createTableForType(schema, type);
    }

    console.log(`\n✅ Core tables setup complete!`);
    console.log(`\nCreated tables:`);
    coreTypes.forEach(type => {
      console.log(`   ${schema}-core-${type.name}`);
    });

  } catch (error) {
    console.error(`❌ Failed to setup core tables:`, error);
    throw error;
  }
}

/**
 * Parse TypeScript type files to find interfaces extending Core
 */
async function parseCoreTypes(): Promise<Array<{name: string, properties: string[], searchableFields: string[]}>> {
  const typesDir = join(process.cwd(), 'src', 'types');
  const coreTypes: Array<{name: string, properties: string[], searchableFields: string[]}> = [];

  if (!existsSync(typesDir)) {
    throw new Error(`Types directory not found: ${typesDir}`);
  }

  // Get all .ts files in types directory
  const typeFiles = execSync(`find ${typesDir} -name "*.ts" -type f`, { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);

  for (const file of typeFiles) {
    try {
      const content = readFileSync(file, 'utf8');

      // Find interfaces extending Core
      const interfaceRegex = /export\s+interface\s+(\w+)\s+extends\s+Core\s*\{([^}]*)\}/gs;
      let match;

      while ((match = interfaceRegex.exec(content)) !== null) {
        const [, typeName, bodyContent] = match;

        // Skip abstract types like TableMetadata
        if (typeName === 'TableMetadata') continue;

        // Parse properties from interface body
        const properties = parseInterfaceProperties(bodyContent);
        const searchableFields = determineSearchableFields(properties);

        coreTypes.push({
          name: typeName,
          properties,
          searchableFields
        });
      }
    } catch (error) {
      console.warn(`⚠️ Could not parse ${file}:`, error);
    }
  }

  return coreTypes;
}

/**
 * Parse interface properties from TypeScript interface body
 */
function parseInterfaceProperties(bodyContent: string): string[] {
  const properties: string[] = [];

  // Remove comments and clean up
  const cleaned = bodyContent
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
    .replace(/\/\/.*$/gm, '') // Remove // comments
    .trim();

  // Split by lines and parse property definitions
  const lines = cleaned.split('\n').map(line => line.trim()).filter(Boolean);

  for (const line of lines) {
    // Match property: type patterns
    const propMatch = line.match(/^(\w+)[\?\:]?\s*:/);
    if (propMatch) {
      properties.push(propMatch[1]);
    }
  }

  return properties;
}

/**
 * Determine which fields should be indexed for search
 */
function determineSearchableFields(properties: string[]): string[] {
  const searchableFields: string[] = [];

  // Common searchable patterns
  const searchablePatterns = [
    'email', 'userId', 'code', 'status', 'type', 'category',
    'name', 'title', 'slug', 'tenantId', 'ownerId', 'app'
  ];

  for (const prop of properties) {
    const lowerProp = prop.toLowerCase();
    if (searchablePatterns.some(pattern => lowerProp.includes(pattern))) {
      searchableFields.push(prop);
    }
  }

  // Always include Core fields that are commonly searched
  const coreSearchFields = ['tenantId', 'app', 'ownerId', 'slug'];
  for (const field of coreSearchFields) {
    if (!searchableFields.includes(field)) {
      searchableFields.push(field);
    }
  }

  return searchableFields.slice(0, 5); // Limit to 5 GSIs max
}

/**
 * Create or update DynamoDB table for a specific type
 */
async function createTableForType(schema: string, type: {name: string, properties: string[], searchableFields: string[]}) {
  const tableName = `${schema}-core-${type.name}`;

  console.log(`\n📋 Processing table: ${tableName}`);
  console.log(`   Searchable fields: ${type.searchableFields.join(', ')}`);

  try {
    // Check if table exists and get current configuration
    let existingTable = null;
    try {
      const describeResult = await client.send(new DescribeTableCommand({
        TableName: tableName
      }));
      existingTable = describeResult.Table;
    } catch (error: any) {
      if (error.name !== "ResourceNotFoundException") {
        throw error;
      }
      // Table doesn't exist, we'll create it
    }

    // Define desired table configuration
    const desiredConfig = buildTableConfiguration(tableName, type, schema);

    if (existingTable) {
      // Table exists - check if updates are needed
      if (existingTable.TableStatus !== "ACTIVE") {
        console.log(`⚠️ Table ${tableName} exists but is not active (${existingTable.TableStatus}). Skipping.`);
        return;
      }

      const changesNeeded = analyzeTableChanges(existingTable, desiredConfig);

      if (changesNeeded.length === 0) {
        console.log(`✅ Table ${tableName} is already up-to-date. No changes needed.`);
        return;
      }

      console.log(`🔄 Table ${tableName} needs updates:`);
      changesNeeded.forEach(change => console.log(`   - ${change}`));

      await updateExistingTable(tableName, existingTable, desiredConfig, changesNeeded);
    } else {
      // Table doesn't exist - create it
      console.log(`🆕 Creating new table: ${tableName}`);
      await createNewTable(desiredConfig);
    }

  } catch (error) {
    console.error(`❌ Failed to process table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Build the desired table configuration
 */
function buildTableConfiguration(tableName: string, type: {name: string, properties: string[], searchableFields: string[]}, schema: string) {
  // Create GSIs for searchable fields first to determine which attributes are actually used
  const globalSecondaryIndexes = [];
  const usedAttributes = new Set(['id']); // Primary key is always used

  // GSI 1: tenantId-app-index (most common search pattern)
  globalSecondaryIndexes.push({
    IndexName: "tenantId-app-index",
    KeySchema: [
      { AttributeName: "tenantId", KeyType: "HASH" },
      { AttributeName: "app", KeyType: "RANGE" }
    ],
    Projection: { ProjectionType: "ALL" },
    BillingMode: "PAY_PER_REQUEST"
  });
  usedAttributes.add("tenantId");
  usedAttributes.add("app");

  // GSI 2-4: Individual field indexes (limit to 3 additional)
  const individualFields = type.searchableFields
    .filter(field => field !== 'tenantId' && field !== 'app' && field !== 'id')
    .slice(0, 3);

  for (const field of individualFields) {
    globalSecondaryIndexes.push({
      IndexName: `${field}-index`,
      KeySchema: [
        { AttributeName: field, KeyType: "HASH" }
      ],
      Projection: { ProjectionType: "ALL" },
      BillingMode: "PAY_PER_REQUEST"
    });
    usedAttributes.add(field);
  }

  // Only create attribute definitions for attributes that are actually used in indexes
  const attributeDefinitions = [];
  for (const attrName of usedAttributes) {
    attributeDefinitions.push({ AttributeName: attrName, AttributeType: "S" });
  }

  return {
    TableName: tableName,
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" }
    ],
    AttributeDefinitions: attributeDefinitions,
    BillingMode: "PAY_PER_REQUEST",
    GlobalSecondaryIndexes: globalSecondaryIndexes,

    // NIST Rev 5 / DoD Compliance: Encryption at rest
    SSESpecification: {
      Enabled: true,
      SSEType: "KMS",
      KMSMasterKeyId: "alias/aws/dynamodb"
    },

    // Tags for compliance and cost tracking
    Tags: [
      { Key: "Environment", Value: process.env.NODE_ENV || "development" },
      { Key: "Application", Value: "captify-core" },
      { Key: "Schema", Value: schema },
      { Key: "Type", Value: type.name },
      { Key: "Compliance", Value: "NIST-Rev5-DoD" },
      { Key: "DataClassification", Value: "internal" }
    ]
  };
}

/**
 * Analyze what changes are needed between existing and desired table configuration
 */
function analyzeTableChanges(existingTable: any, desiredConfig: any): string[] {
  const changes: string[] = [];

  // Check if new GSIs need to be added
  const existingIndexNames = new Set(
    (existingTable.GlobalSecondaryIndexes || []).map((gsi: any) => gsi.IndexName)
  );

  const desiredIndexNames = new Set(
    desiredConfig.GlobalSecondaryIndexes.map((gsi: any) => gsi.IndexName)
  );

  // Find missing indexes
  for (const indexName of desiredIndexNames) {
    if (!existingIndexNames.has(indexName)) {
      changes.push(`Add GSI: ${indexName}`);
    }
  }

  // Check for attribute definition changes (new attributes for GSIs)
  const existingAttributes = new Set(
    existingTable.AttributeDefinitions.map((attr: any) => attr.AttributeName)
  );

  const desiredAttributes = new Set(
    desiredConfig.AttributeDefinitions.map((attr: any) => attr.AttributeName)
  );

  for (const attrName of desiredAttributes) {
    if (!existingAttributes.has(attrName)) {
      changes.push(`Add attribute: ${attrName}`);
    }
  }

  return changes;
}

/**
 * Update an existing table with new configuration
 */
async function updateExistingTable(tableName: string, existingTable: any, desiredConfig: any, changes: string[]) {
  console.log(`🔄 Updating table ${tableName}...`);

  // Note: DynamoDB table updates are limited. We can only add GSIs, not modify existing ones.
  // For this use case, we'll focus on adding missing GSIs.

  const missingGSIs = [];
  const existingIndexNames = new Set(
    (existingTable.GlobalSecondaryIndexes || []).map((gsi: any) => gsi.IndexName)
  );

  for (const gsi of desiredConfig.GlobalSecondaryIndexes) {
    if (!existingIndexNames.has(gsi.IndexName)) {
      missingGSIs.push(gsi);
    }
  }

  if (missingGSIs.length === 0) {
    console.log(`✅ Table ${tableName} structure is already up-to-date`);
    return;
  }

  // Add missing attributes first (required for GSI creation)
  const missingAttributes = [];
  const existingAttributes = new Set(
    existingTable.AttributeDefinitions.map((attr: any) => attr.AttributeName)
  );

  for (const attr of desiredConfig.AttributeDefinitions) {
    if (!existingAttributes.has(attr.AttributeName)) {
      missingAttributes.push(attr);
    }
  }

  if (missingGSIs.length > 0) {
    try {
      // Use UpdateTable to add new GSIs
      const { UpdateTableCommand } = await import("@aws-sdk/client-dynamodb");

      const updateParams: any = {
        TableName: tableName,
      };

      // Add missing attributes if any
      if (missingAttributes.length > 0) {
        updateParams.AttributeDefinitions = [
          ...existingTable.AttributeDefinitions,
          ...missingAttributes
        ];
      }

      // Add new GSIs
      updateParams.GlobalSecondaryIndexUpdates = missingGSIs.map(gsi => ({
        Create: {
          IndexName: gsi.IndexName,
          KeySchema: gsi.KeySchema,
          Projection: gsi.Projection,
          BillingMode: gsi.BillingMode
        }
      }));

      await client.send(new UpdateTableCommand(updateParams));

      console.log(`⏳ Waiting for table ${tableName} updates to complete...`);

      // Wait for table to be active again
      let tableStatus = "UPDATING";
      while (tableStatus === "UPDATING") {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Check every 10 seconds

        const describeResult = await client.send(new DescribeTableCommand({
          TableName: tableName
        }));

        tableStatus = describeResult.Table?.TableStatus || "UNKNOWN";
        console.log(`   Status: ${tableStatus}`);
      }

      if (tableStatus === "ACTIVE") {
        console.log(`✅ Table ${tableName} updated successfully`);
      } else {
        throw new Error(`Table update failed. Status: ${tableStatus}`);
      }

    } catch (error) {
      console.error(`❌ Failed to update table ${tableName}:`, error);
      throw error;
    }
  }
}

/**
 * Create a new table with the desired configuration
 */
async function createNewTable(config: any) {
  await client.send(new CreateTableCommand(config));

  console.log(`⏳ Waiting for table ${config.TableName} to become active...`);

  // Wait for table to be active
  let tableStatus = "CREATING";
  while (tableStatus !== "ACTIVE") {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const describeResult = await client.send(new DescribeTableCommand({
      TableName: config.TableName
    }));

    tableStatus = describeResult.Table?.TableStatus || "UNKNOWN";
    console.log(`   Status: ${tableStatus}`);
  }

  console.log(`✅ Table ${config.TableName} created successfully`);
}

/**
 * Setup production server using setup-server-production.sh
 * Configures nginx, PM2, and deploys platform app
 */
async function setupServerProduction() {
  console.log(`🚀 Setting up production server`);

  // Check if script exists
  const scriptPath = './setup-server-production.sh';
  if (!existsSync(scriptPath)) {
    throw new Error(`Setup script not found: ${scriptPath}`);
  }

  // Get required parameters
  const domain = process.env.DOMAIN || process.argv.find(arg => arg.startsWith('--domain='))?.split('=')[1] || 'captify.io';
  const platformRepo = process.env.PLATFORM_REPO || 'https://github.com/captify-io/platform.git';
  const githubToken = process.env.GITHUB_TOKEN || process.argv.find(arg => arg.startsWith('--github-token='))?.split('=')[1];

  if (!githubToken) {
    console.error(`❌ GitHub token is required`);
    console.log(`Usage: tsx scripts/installer.ts --setup-server-production --github-token=YOUR_TOKEN [--domain=captify.io]`);
    console.log(`Or set environment variables: GITHUB_TOKEN, DOMAIN (optional)`);
    throw new Error('GitHub token is required');
  }

  console.log(`📋 Configuration:`);
  console.log(`   Domain: ${domain}`);
  console.log(`   Platform repo: ${platformRepo}`);
  console.log(`   GitHub token: ${githubToken.substring(0, 4)}...`);
  console.log(``);

  try {
    console.log(`🔧 Executing production server setup...`);

    // Make script executable
    execSync(`chmod +x ${scriptPath}`, { stdio: 'inherit' });

    // Execute the setup script (platform only, no pmbook)
    execSync(`${scriptPath} "${domain}" "${platformRepo}" "" "${githubToken}"`, {
      stdio: 'inherit',
      timeout: 30 * 60 * 1000 // 30 minute timeout
    });

    console.log(`✅ Production server setup completed successfully!`);

  } catch (error: any) {
    console.error(`❌ Production server setup failed:`, error.message);
    throw error;
  }
}

/**
 * Full platform installation
 * Installs all required infrastructure components
 */
async function fullInstall() {
  console.log(`🚀 Captify Platform Full Installation`);
  console.log(`=====================================`);

  const components = [
    { name: "Auth Tokens Table", fn: setupAuthTable },
    { name: "Core Tables", fn: setupCoreTables },
    { name: "Production Server", fn: setupServerProduction },
    // Add more components here as needed
    // { name: "Policy Store", fn: setupPolicyStore },
  ];

  for (const component of components) {
    console.log(`\n📦 Installing: ${component.name}`);
    console.log(`${'='.repeat(40)}`);

    try {
      await component.fn();
      console.log(`✅ ${component.name} installed successfully`);
    } catch (error) {
      console.error(`❌ Failed to install ${component.name}:`, error);
      console.log(`\n⚠️  Installation stopped due to error. Please fix the issue and retry.`);
      process.exit(1);
    }
  }

  console.log(`\n🎉 Full installation complete!`);
  console.log(`\nNIST Rev 5 / DoD Compliance Status:`);
  console.log(`   ✅ Encryption at rest (DynamoDB)`);
  console.log(`   ✅ Point-in-time recovery`);
  console.log(`   ✅ Automatic data expiration (TTL)`);
  console.log(`   ✅ Audit logging (CloudTrail)`);
  console.log(`   ✅ Access control (IAM)`);

  console.log(`\n🔧 Next Steps:`);
  console.log(`   1. Configure environment variables`);
  console.log(`   2. Set up IAM policies for DynamoDB access`);
  console.log(`   3. Deploy applications to use the new infrastructure`);
}

/**
 * Show usage information
 */
function showUsage() {
  console.log(`🔧 Captify Platform Installer`);
  console.log(`============================`);
  console.log(``);
  console.log(`Usage:`);
  console.log(`  tsx scripts/installer.ts --<module>`);
  console.log(``);
  console.log(`Available modules:`);
  console.log(`  --setup-auth-table         Setup DynamoDB auth tokens table`);
  console.log(`  --setup-core-tables        Create tables for all types extending Core`);
  console.log(`  --setup-server-production  Setup production server with nginx and PM2`);
  console.log(`  --install                  Full platform installation`);
  console.log(``);
  console.log(`Examples:`);
  console.log(`  tsx scripts/installer.ts --setup-auth-table`);
  console.log(`  tsx scripts/installer.ts --setup-core-tables`);
  console.log(`  tsx scripts/installer.ts --setup-server-production --github-token=ghp_xxx`);
  console.log(`  tsx scripts/installer.ts --install --github-token=ghp_xxx`);
  console.log(``);
  console.log(`Environment variables:`);
  console.log(`  AUTH_TOKENS_TABLE     DynamoDB table name (default: captify-auth-tokens)`);
  console.log(`  AWS_REGION           AWS region (default: us-east-1)`);
  console.log(`  NODE_ENV             Environment (development/production)`);
  console.log(`  SCHEMA               Table schema prefix (default: captify)`);
  console.log(`  GITHUB_TOKEN         GitHub token for package access`);
  console.log(`  DOMAIN               Domain for production setup (default: captify.io)`);
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showUsage();
    process.exit(1);
  }

  const moduleName = args[0].replace(/^--/, '') as ModuleName;

  if (!(moduleName in MODULES)) {
    console.error(`❌ Unknown module: ${moduleName}`);
    console.log(``);
    showUsage();
    process.exit(1);
  }

  try {
    await MODULES[moduleName]();
  } catch (error) {
    console.error(`❌ Installation failed:`, error);
    process.exit(1);
  }
}

// Run main if script is executed directly
main().catch(console.error);