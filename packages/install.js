#!/usr/bin/env node

/**
 * Captify Application Installer
 *
 * Usage: npx install.js <package-name> [--region=us-east-1] [--path=../]
 *
 * This script:
 * 1. Reads captify.json from the specified package
 * 2. Parses types.ts to extract interfaces for DynamoDB tables
 * 3. Creates DynamoDB tables using AWS CLI
 * 4. Copies deploy directory to platform app structure
 * 5. Registers application in platform database
 */

const fs = require("fs").promises;
const path = require("path");
const { execSync } = require("child_process");
const crypto = require("crypto");

// Parse command line arguments
const args = process.argv.slice(2);
const packageName = args[0];

if (!packageName) {
  console.error(
    "❌ Usage: npx install.js <package-name> [--region=us-east-1] [--path=../]"
  );
  process.exit(1);
}

// Parse options
const options = {
  region: "us-east-1",
  platformPath: "../",
};

args.slice(1).forEach((arg) => {
  if (arg.startsWith("--region=")) {
    options.region = arg.split("=")[1];
  } else if (arg.startsWith("--path=")) {
    options.platformPath = arg.split("=")[1];
  }
});

console.log(`🚀 Installing Captify application: ${packageName}`);
console.log(`📍 Region: ${options.region}`);
console.log(`📁 Platform path: ${options.platformPath}`);

async function main() {
  try {
    // 1. Read captify.json (we're in packages/ directory)
    const configPath = path.join(packageName, "captify.json");
    console.log(`🔍 Looking for config at: ${path.resolve(configPath)}`);

    if (
      !(await fs
        .access(configPath)
        .then(() => true)
        .catch(() => false))
    ) {
      throw new Error(`captify.json not found at ${configPath}`);
    }

    const configContent = await fs.readFile(configPath, "utf8");
    const config = JSON.parse(configContent);

    console.log(`✅ Loaded configuration for: ${config.name}`);

    // 2. Read and parse types.ts
    const typesPath = path.join(packageName, "src", "types.ts");
    let interfaces = [];

    if (
      await fs
        .access(typesPath)
        .then(() => true)
        .catch(() => false)
    ) {
      const typesContent = await fs.readFile(typesPath, "utf8");
      interfaces = parseTypeScriptInterfaces(typesContent);
      console.log(`✅ Found ${interfaces.length} interfaces in types.ts`);
    } else {
      console.log(`⚠️  No types.ts found at ${typesPath}`);
    }

    // 3. Manage DynamoDB tables (create, update, cleanup)
    if (interfaces.length > 0) {
      console.log(`🗄️  Managing DynamoDB tables...`);
      await manageDynamoDBTables(interfaces, config, options.region);
    }

    // 4. Copy deploy directory to platform
    await copyDeployDirectory(packageName, config.slug, options.platformPath);

    // 5. Register application in platform database
    await registerApplication(config, options.region);

    console.log(`🎉 Successfully installed ${config.name}!`);
    console.log(`📋 Next steps:`);
    console.log(`   - Visit /${config.slug} to access your application`);
    console.log(`   - Check AWS Console for created DynamoDB tables`);
  } catch (error) {
    console.error(`❌ Installation failed:`, error.message);
    process.exit(1);
  }
}

/**
 * Parse TypeScript interfaces from file content using regex
 */
function parseTypeScriptInterfaces(content) {
  const interfaces = [];

  // Regex to match exported interfaces
  const interfaceRegex = /export\s+interface\s+(\w+)\s*\{([^}]+)\}/g;
  let match;

  while ((match = interfaceRegex.exec(content)) !== null) {
    const interfaceName = match[1];
    const interfaceBody = match[2];

    // Parse fields from interface body
    const fields = parseInterfaceFields(interfaceBody);

    interfaces.push({
      name: interfaceName,
      fields: fields,
    });
  }

  return interfaces;
}

/**
 * Parse fields from interface body
 */
function parseInterfaceFields(body) {
  const fields = [];

  // Split by semicolon or newline and clean up
  const lines = body
    .split(/[;\n]/)
    .map((line) => line.trim())
    .filter((line) => line);

  for (const line of lines) {
    // Match field: type pattern
    const fieldMatch = line.match(/(\w+)(\?)?:\s*([^;]+)/);
    if (fieldMatch) {
      const fieldName = fieldMatch[1];
      const optional = !!fieldMatch[2];
      const fieldType = fieldMatch[3].trim();

      fields.push({
        name: fieldName,
        type: fieldType,
        optional: optional,
        dynamoType: mapToDynamoType(fieldType),
      });
    }
  }

  return fields;
}

/**
 * Map TypeScript types to DynamoDB types
 */
function mapToDynamoType(tsType) {
  if (tsType.includes("string")) return "S";
  if (tsType.includes("number")) return "N";
  if (tsType.includes("boolean")) return "BOOL";
  if (tsType.includes("string[]")) return "SS";
  if (tsType.includes("number[]")) return "NS";
  return "S"; // Default to string
}

/**
 * Manage DynamoDB tables - create, update, and cleanup
 */
async function manageDynamoDBTables(interfaces, config, region) {
  const schema = config.schema || "captify";
  const prefix = config.database?.prefix || config.slug;
  const tablePrefix = `${schema}-${prefix}`;
  const expectedTables = new Set();

  // 1. Process each interface to create/update tables
  for (const interface of interfaces) {
    const tableName = `${tablePrefix}-${interface.name}`;

    console.log(`  📝 Analyzing interface: ${interface.name}`);

    // Check if this interface should have a DynamoDB table
    // Rule: First property must have "Id" in name AND be of type UUID
    if (interface.fields.length === 0) {
      console.log(
        `    ⚠️  No fields found, skipping interface ${interface.name}`
      );
      continue;
    }

    const firstField = interface.fields[0];
    const hasIdInName = firstField.name.includes("Id");
    const isUuidType =
      firstField.type === "UUID" ||
      (firstField.type === "string" &&
        firstField.name.toLowerCase().includes("uuid"));

    if (!hasIdInName || firstField.type !== "UUID") {
      console.log(
        `    ⏭️  Skipping ${interface.name}: first field '${firstField.name}' (${firstField.type}) doesn't match criteria (needs 'Id' in name AND UUID type)`
      );
      continue;
    }

    expectedTables.add(tableName);
    console.log(
      `    ✅ Table eligible: ${tableName} (first field: ${firstField.name}: ${firstField.type})`
    );

    // Use the first field as primary key since it matches our criteria
    const primaryKey = firstField;

    try {
      // Check if table exists
      const tableExists = await checkTableExists(tableName, region);

      if (tableExists) {
        // Update existing table
        await updateTable(tableName, interface, region);
      } else {
        // Create new table
        await createTable(tableName, interface, region);
      }
    } catch (error) {
      console.error(
        `    ❌ Failed to manage table ${tableName}:`,
        error.message
      );
    }
  }

  // 2. Cleanup orphaned tables
  await cleanupOrphanedTables(tablePrefix, expectedTables, region);
}

/**
 * Check if DynamoDB table exists
 */
async function checkTableExists(tableName, region) {
  try {
    execSync(
      `aws dynamodb describe-table --table-name ${tableName} --region ${region}`,
      { stdio: "ignore" }
    );
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Create a new DynamoDB table
 */
async function createTable(tableName, interfaceData, region) {
  // Use the first field as primary key (already validated to have "Id" in name and be UUID type)
  const primaryKey = interfaceData.fields[0];

  // Build attribute definitions
  const attributeDefinitions = [
    {
      AttributeName: primaryKey.name,
      AttributeType: primaryKey.dynamoType,
    },
  ];

  // Find GSI candidates (fields ending with 'Id' but not the primary key, '_id' fields, plus 'slug')
  const gsiFields = interfaceData.fields.filter(
    (f) =>
      (f.name.endsWith("Id") && f.name !== primaryKey.name) ||
      f.name.endsWith("_id") ||
      f.name === "slug"
  );

  gsiFields.forEach((field) => {
    attributeDefinitions.push({
      AttributeName: field.name,
      AttributeType: field.dynamoType,
    });
  });

  // Build key schema using the dynamic primary key
  const keySchema = [
    {
      AttributeName: primaryKey.name,
      KeyType: "HASH",
    },
  ];

  // Build GSIs
  const globalSecondaryIndexes = gsiFields.map((field) => ({
    IndexName: `${field.name}-index`,
    KeySchema: [
      {
        AttributeName: field.name,
        KeyType: "HASH",
      },
    ],
    Projection: {
      ProjectionType: "ALL",
    },
  }));

  // Create table using AWS CLI
  const createTableCommand = {
    TableName: tableName,
    AttributeDefinitions: attributeDefinitions,
    KeySchema: keySchema,
    BillingMode: "PAY_PER_REQUEST",
    SSESpecification: {
      Enabled: true,
    },
  };

  if (globalSecondaryIndexes.length > 0) {
    createTableCommand.GlobalSecondaryIndexes = globalSecondaryIndexes;
  }

  const jsonCommand = JSON.stringify(createTableCommand).replace(/"/g, '\\"');
  execSync(
    `aws dynamodb create-table --region ${region} --cli-input-json "${jsonCommand}"`,
    { stdio: "inherit" }
  );
  console.log(`    ✅ Created table: ${tableName}`);
}

/**
 * Update existing DynamoDB table (add new GSIs if needed)
 */
async function updateTable(tableName, interfaceData, region) {
  try {
    // Get current table description
    const describeOutput = execSync(
      `aws dynamodb describe-table --table-name ${tableName} --region ${region}`,
      { encoding: "utf8" }
    );
    const tableDesc = JSON.parse(describeOutput);

    // Get existing GSI names
    const existingGSIs = new Set(
      (tableDesc.Table.GlobalSecondaryIndexes || []).map((gsi) => gsi.IndexName)
    );

    // Find new GSI fields that don't exist yet (including slug)
    const newGSIFields = interfaceData.fields.filter(
      (field) =>
        (field.name.endsWith("Id") &&
          field.name !== "id" &&
          !existingGSIs.has(`${field.name}-index`)) ||
        (field.name === "slug" && !existingGSIs.has("slug-index"))
    );

    if (newGSIFields.length > 0) {
      console.log(
        `    🔄 Adding ${newGSIFields.length} new GSI(s) to ${tableName}`
      );

      for (const field of newGSIFields) {
        const updateCommand = {
          TableName: tableName,
          AttributeDefinitions: [
            {
              AttributeName: field.name,
              AttributeType: field.dynamoType,
            },
          ],
          GlobalSecondaryIndexUpdates: [
            {
              Create: {
                IndexName: `${field.name}-index`,
                KeySchema: [
                  {
                    AttributeName: field.name,
                    KeyType: "HASH",
                  },
                ],
                Projection: {
                  ProjectionType: "ALL",
                },
              },
            },
          ],
        };

        const jsonCommand = JSON.stringify(updateCommand).replace(/"/g, '\\"');
        execSync(
          `aws dynamodb update-table --region ${region} --cli-input-json "${jsonCommand}"`,
          { stdio: "inherit" }
        );

        // Wait for GSI to be created before adding next one
        console.log(
          `    ⏳ Waiting for GSI ${field.name}-index to be active...`
        );
        execSync(
          `aws dynamodb wait table-exists --table-name ${tableName} --region ${region}`,
          { stdio: "ignore" }
        );
      }

      console.log(`    ✅ Updated table: ${tableName}`);
    } else {
      console.log(`    ℹ️  Table ${tableName} is up to date`);
    }
  } catch (error) {
    console.log(
      `    ⚠️  Could not update table ${tableName}: ${error.message}`
    );
  }
}

/**
 * Clean up orphaned tables (tables that exist but types were removed)
 */
async function cleanupOrphanedTables(tablePrefix, expectedTables, region) {
  try {
    console.log(`🧹 Checking for orphaned tables with prefix: ${tablePrefix}`);

    // List all tables with our prefix
    const listOutput = execSync(`aws dynamodb list-tables --region ${region}`, {
      encoding: "utf8",
    });
    const allTables = JSON.parse(listOutput).TableNames;

    const existingAppTables = allTables.filter((table) =>
      table.startsWith(`${tablePrefix}-`)
    );
    const orphanedTables = existingAppTables.filter(
      (table) => !expectedTables.has(table)
    );

    if (orphanedTables.length > 0) {
      console.log(
        `🗑️  Found ${orphanedTables.length} orphaned table(s) to delete:`
      );

      for (const orphanedTable of orphanedTables) {
        console.log(`    🗑️  Deleting orphaned table: ${orphanedTable}`);
        try {
          execSync(
            `aws dynamodb delete-table --table-name ${orphanedTable} --region ${region}`,
            { stdio: "inherit" }
          );
          console.log(`    ✅ Deleted table: ${orphanedTable}`);
        } catch (error) {
          console.log(
            `    ⚠️  Could not delete table ${orphanedTable}: ${error.message}`
          );
        }
      }
    } else {
      console.log(`    ℹ️  No orphaned tables found`);
    }
  } catch (error) {
    console.log(
      `    ⚠️  Could not check for orphaned tables: ${error.message}`
    );
  }
}

/**
 * Copy deploy directory to platform app structure
 */
async function copyDeployDirectory(packageName, appSlug, platformPath) {
  const deployPath = path.join(packageName, "deploy");
  const targetPath = path.join(platformPath, "src", "app", appSlug);

  console.log(`📁 Copying deploy files from ${deployPath} to ${targetPath}`);

  try {
    // Check if deploy directory exists
    await fs.access(deployPath);

    // Create target directory
    await fs.mkdir(targetPath, { recursive: true });

    // Copy files recursively
    await copyDirectory(deployPath, targetPath);

    console.log(`✅ Copied application files to ${targetPath}`);
  } catch (error) {
    console.log(
      `⚠️  No deploy directory found at ${deployPath}, skipping file copy`
    );
  }
}

/**
 * Recursively copy directory
 */
async function copyDirectory(src, dest) {
  const entries = await fs.readdir(src, { withFileTypes: true });

  await fs.mkdir(dest, { recursive: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Register application in platform database
 */
async function registerApplication(config, region) {
  console.log(`📋 Registering application in captify-core-App table...`);

  // Transform navigation menu items to match MenuItem interface
  const menuItems =
    config.navigation?.menuItems?.map((item, index) => ({
      id: `${config.slug}-${index}`,
      label: item.label.replace(/&/g, "and"), // Replace & with 'and' to avoid command line issues
      href: item.href,
      icon: item.icon,
      order: index,
    })) || [];

  try {
    // First, check if an app with this slug already exists
    let existingApp = null;

    // Try to use slug-index GSI if it's active, otherwise use scan as fallback
    try {
      // Check if slug-index GSI is active
      const describeOutput = execSync(
        `aws dynamodb describe-table --table-name captify-core-App --region ${region}`,
        { encoding: "utf8" }
      );
      const tableDesc = JSON.parse(describeOutput);
      const slugGSI = tableDesc.Table.GlobalSecondaryIndexes?.find(
        (gsi) => gsi.IndexName === "slug-index"
      );

      if (slugGSI && slugGSI.IndexStatus === "ACTIVE") {
        // Use GSI query (preferred method)
        const queryCommand = JSON.stringify({
          TableName: "captify-core-App",
          IndexName: "slug-index",
          KeyConditionExpression: "slug = :slug",
          ExpressionAttributeValues: {
            ":slug": { S: config.slug },
          },
          Limit: 1,
        }).replace(/"/g, '\\"');

        const queryResult = execSync(
          `aws dynamodb query --region ${region} --cli-input-json "${queryCommand}"`,
          { stdio: "pipe", encoding: "utf8" }
        );

        const queryResponse = JSON.parse(queryResult);
        if (queryResponse.Items && queryResponse.Items.length > 0) {
          existingApp = queryResponse.Items[0];
          console.log(
            `    ℹ️  Found existing app with slug '${config.slug}' via GSI, updating...`
          );
        }
      } else {
        // Fallback to scan if GSI is not active yet
        console.log(`    ⏳ slug-index GSI not ready, using scan fallback...`);
        const scanCommand = JSON.stringify({
          TableName: "captify-core-App",
          FilterExpression: "slug = :slug",
          ExpressionAttributeValues: {
            ":slug": { S: config.slug },
          },
          Limit: 1,
        }).replace(/"/g, '\\"');

        const scanResult = execSync(
          `aws dynamodb scan --region ${region} --cli-input-json "${scanCommand}"`,
          { stdio: "pipe", encoding: "utf8" }
        );

        const scanResponse = JSON.parse(scanResult);
        if (scanResponse.Items && scanResponse.Items.length > 0) {
          existingApp = scanResponse.Items[0];
          console.log(
            `    ℹ️  Found existing app with slug '${config.slug}' via scan, updating...`
          );
        }
      }
    } catch (err) {
      // Query/scan failed, will create new record
      console.log(
        `    ℹ️  No existing app found with slug '${config.slug}', creating new...`
      );
    }

    // Create proper App record matching the App interface
    const applicationRecord = {
      appId: { S: existingApp ? existingApp.appId.S : crypto.randomUUID() },
      slug: { S: config.slug },
      name: { S: config.name },
      description: { S: config.description || "" },
      icon: { S: config.icon || "Bot" },
      version: { S: config.version || "1.0.0" },
      category: { S: config.category || "other" },
      status: { S: "active" },
      visibility: { S: "internal" },
      createdAt: {
        S: existingApp ? existingApp.createdAt.S : new Date().toISOString(),
      },
      updatedAt: { S: new Date().toISOString() },
      createdBy: { S: existingApp ? existingApp.createdBy.S : "system" },
    };

    // Add menu items if they exist
    if (menuItems.length > 0) {
      applicationRecord.menu = {
        L: menuItems.map((item) => ({
          M: {
            id: { S: item.id },
            label: { S: item.label },
            href: { S: item.href || "" },
            icon: { S: item.icon || "" },
            order: { N: item.order.toString() },
          },
        })),
      };
    }

    // Add optional fields if they exist
    if (config.agentId) {
      applicationRecord.agentId = { S: config.agentId };
    }
    if (config.agentAliasId) {
      applicationRecord.agentAliasId = { S: config.agentAliasId };
    }

    // Use PUT to create or update the record
    const putCommand = JSON.stringify({
      TableName: "captify-core-App",
      Item: applicationRecord,
    }).replace(/"/g, '\\"');

    execSync(
      `aws dynamodb put-item --region ${region} --cli-input-json "${putCommand}"`,
      { stdio: "inherit" }
    );

    const action = existingApp ? "Updated" : "Created";
    console.log(
      `✅ ${action} application '${config.name}' in captify-core-App table`
    );
  } catch (error) {
    console.log(`⚠️  Failed to register/update application: ${error.message}`);
  }
}

// Run the installer
main();
