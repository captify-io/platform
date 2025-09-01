#!/usr/bin/env node

import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  statSync,
} from "fs";
import { join, dirname, relative, basename } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

// Simple UUID generator
const uuidv4 = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Captify Package Installer
 *
 * Analyzes package types, creates/updates DynamoDB tables,
 * generates menus from page structure, and deploys apps.
 */
class CaptifyPackageInstaller {
  constructor() {
    this.packagesDir = join(__dirname, "..");
    this.region = process.env.AWS_REGION || "us-east-1";
    this.tablePrefix = "captify";
  }

  /**
   * Parse TypeScript types to find interfaces with id/ID and UUID fields
   */
  parseTypesForTables(typesFilePath) {
    if (!existsSync(typesFilePath)) {
      console.log(`⚠️  No types.ts file found at ${typesFilePath}`);
      return [];
    }

    const content = readFileSync(typesFilePath, "utf8");
    const tables = [];

    // Regex to match interface definitions
    const interfaceRegex = /export\s+interface\s+(\w+)\s*\{([^}]+)\}/g;
    let match;

    while ((match = interfaceRegex.exec(content)) !== null) {
      const interfaceName = match[1];
      const body = match[2];

      // Check if first property is id/ID with string type and has UUID mentioned
      const lines = body
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);
      if (lines.length === 0) continue;

      const firstProperty = lines[0];

      // Check for id/ID as first property
      const hasIdProperty = /^(id|ID):\s*string/.test(firstProperty);

      // Check if interface body contains UUID reference or if name suggests it's a table entity
      const hasUuidReference =
        body.includes("UUID") ||
        body.includes("uuid") ||
        interfaceName.endsWith("Entity") ||
        (hasIdProperty && lines.length > 2); // Simple heuristic

      if (hasIdProperty && hasUuidReference) {
        // Parse the interface properties to create table schema
        const attributes = this.parseInterfaceProperties(body);

        tables.push({
          name: interfaceName,
          tableName: `${
            this.tablePrefix
          }-${this.getPackageSlug()}-${interfaceName}`,
          attributes,
          keySchema: [{ AttributeName: "id", KeyType: "HASH" }], // Primary key
        });
      }
    }

    return tables;
  }

  /**
   * Parse interface properties to create DynamoDB attributes
   */
  parseInterfaceProperties(interfaceBody) {
    const attributes = [];
    const lines = interfaceBody
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("//"));

    for (const line of lines) {
      // Parse property: type format
      const propertyMatch = line.match(/^(\w+)(\?)?:\s*(.+);?$/);
      if (propertyMatch) {
        const [, name, optional, type] = propertyMatch;

        let attributeType = "S"; // String default

        // Map TypeScript types to DynamoDB types
        if (type.includes("number")) attributeType = "N";
        else if (type.includes("boolean")) attributeType = "BOOL";
        else if (type.includes("[]") || type.includes("Array"))
          attributeType = "L";
        else if (type.includes("{") || type.includes("object"))
          attributeType = "M";

        attributes.push({
          AttributeName: name,
          AttributeType: attributeType,
        });
      }
    }

    return attributes;
  }

  /**
   * Scan pages directory and generate menu structure
   */
  generateMenuFromPages(packagePath, packageName) {
    const pagesPath = join(packagePath, "src", "app", "pages");
    const indexPath = join(packagePath, "src", "app", "index.ts");

    if (!existsSync(pagesPath)) {
      console.log(`⚠️  No pages directory found at ${pagesPath}`);
      return [];
    }

    const menu = [];
    let order = 0;

    // Try to read existing index.ts for page definitions
    let pageRoutes = {};
    if (existsSync(indexPath)) {
      try {
        const indexContent = readFileSync(indexPath, "utf8");
        pageRoutes = this.parsePageRoutes(indexContent);
      } catch (error) {
        console.log(`⚠️  Could not parse index.ts: ${error.message}`);
      }
    }

    // Scan pages directory
    const pageFiles = readdirSync(pagesPath).filter(
      (file) => file.endsWith(".tsx") || file.endsWith(".ts")
    );

    for (const pageFile of pageFiles) {
      const pageName = basename(pageFile, ".tsx").replace(".ts", "");
      const pageId = `${packageName}-${order}`;

      // Convert camelCase/PascalCase to readable labels
      const label = this.convertToLabel(pageName);

      // Determine icon based on page name
      const icon = this.getIconForPage(pageName);

      // Determine href - use from pageRoutes if available, otherwise generate
      let href = `/${pageName.toLowerCase().replace("page", "")}`;
      if (pageRoutes[pageName.toLowerCase()]) {
        href = pageRoutes[pageName.toLowerCase()];
      }

      // Check if this is a main section that might have children
      const children = this.generateChildrenForPage(
        pageName,
        packageName,
        pageRoutes,
        order
      );

      const menuItem = {
        id: pageId,
        label,
        href,
        icon,
        order,
      };

      if (children.length > 0) {
        menuItem.children = children;
      }

      menu.push(menuItem);
      order++;
    }

    return menu;
  }

  /**
   * Parse page routes from index.ts export
   */
  parsePageRoutes(indexContent) {
    const routes = {};

    // Look for pages export object
    const pagesMatch = indexContent.match(
      /export\s+const\s+pages\s*=\s*\{([^}]+)\}/s
    );
    if (pagesMatch) {
      const pagesContent = pagesMatch[1];
      const routeMatches = pagesContent.matchAll(
        /"([^"]+)":\s*\(\)\s*=>\s*import\("([^"]+)"\)/g
      );

      for (const match of routeMatches) {
        const [, routeName, importPath] = match;
        routes[routeName] = `/${routeName.replace(/-/g, "/")}`;
      }
    }

    return routes;
  }

  /**
   * Generate children menu items for main sections
   */
  generateChildrenForPage(pageName, packageName, pageRoutes, parentOrder) {
    const children = [];
    const basePageName = pageName.toLowerCase().replace("page", "");

    // Look for related routes in pageRoutes
    const relatedRoutes = Object.keys(pageRoutes).filter(
      (route) => route.startsWith(basePageName + "-") && route !== basePageName
    );

    let childOrder = 0;
    for (const route of relatedRoutes) {
      const childName = route.replace(basePageName + "-", "");
      const label = this.convertToLabel(childName);
      const icon = this.getIconForPage(childName);

      children.push({
        id: `${packageName}-${parentOrder}-${childOrder}`,
        label,
        href: pageRoutes[route],
        icon,
        order: childOrder,
      });

      childOrder++;
    }

    return children;
  }

  /**
   * Convert camelCase/PascalCase to readable label
   */
  convertToLabel(name) {
    return name
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/page$/i, "")
      .trim();
  }

  /**
   * Get appropriate icon for page name
   */
  getIconForPage(pageName) {
    const iconMap = {
      dashboard: "layout-dashboard",
      policies: "shield-check",
      access: "users",
      services: "database",
      organizations: "building",
      settings: "settings",
      monitor: "activity",
      users: "user",
      roles: "shield",
      security: "shield-check",
      performance: "bar-chart",
      audit: "file-text",
      alerts: "alert-triangle",
      ssp: "file-shield",
      poams: "file-check",
      "change-requests": "git-pull-request",
      sops: "book-open",
      "risk-assessments": "shield-alert",
      compliance: "clipboard-check",
      dynamodb: "database",
      neptune: "network",
      s3: "hard-drive",
      bedrock: "brain",
      agents: "bot",
      lambda: "zap",
      themes: "palette",
      notifications: "bell",
      integrations: "globe",
      system: "sliders",
    };

    const key = pageName.toLowerCase().replace("page", "");
    return iconMap[key] || "folder";
  }

  /**
   * Create or update DynamoDB table
   */
  async createOrUpdateTable(tableConfig) {
    try {
      // Check if table exists
      const describeCommand = `aws dynamodb describe-table --table-name ${tableConfig.tableName} --region ${this.region}`;

      try {
        execSync(describeCommand, { stdio: "pipe" });
        console.log(`✅ Table ${tableConfig.tableName} already exists`);
        return;
      } catch (error) {
        // Table doesn't exist, create it
        console.log(`📋 Creating table ${tableConfig.tableName}...`);
      }

      // Create table
      const createTableCommand = {
        TableName: tableConfig.tableName,
        KeySchema: tableConfig.keySchema,
        AttributeDefinitions: tableConfig.attributes.filter((attr) =>
          tableConfig.keySchema.some(
            (key) => key.AttributeName === attr.AttributeName
          )
        ),
        BillingMode: "PAY_PER_REQUEST",
      };

      const command = `aws dynamodb create-table --cli-input-json '${JSON.stringify(
        createTableCommand
      )}' --region ${this.region}`;
      execSync(command);

      console.log(`✅ Created table ${tableConfig.tableName}`);

      // Wait for table to be active
      console.log(`⏳ Waiting for table to be active...`);
      const waitCommand = `aws dynamodb wait table-exists --table-name ${tableConfig.tableName} --region ${this.region}`;
      execSync(waitCommand);
    } catch (error) {
      console.error(
        `❌ Error creating table ${tableConfig.tableName}: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Delete unused tables
   */
  async deleteUnusedTables(currentTables, existingTables) {
    const currentTableNames = currentTables.map((t) => t.tableName);
    const tablesToDelete = existingTables.filter(
      (name) =>
        name.startsWith(`${this.tablePrefix}-${this.getPackageSlug()}-`) &&
        !currentTableNames.includes(name)
    );

    for (const tableName of tablesToDelete) {
      try {
        console.log(`🗑️  Deleting unused table ${tableName}...`);
        const deleteCommand = `aws dynamodb delete-table --table-name ${tableName} --region ${this.region}`;
        execSync(deleteCommand);
        console.log(`✅ Deleted table ${tableName}`);
      } catch (error) {
        console.error(`❌ Error deleting table ${tableName}: ${error.message}`);
      }
    }
  }

  /**
   * Get existing tables for this package
   */
  getExistingTables() {
    try {
      const command = `aws dynamodb list-tables --region ${this.region}`;
      const result = execSync(command, { encoding: "utf8" });
      const data = JSON.parse(result);
      return data.TableNames || [];
    } catch (error) {
      console.error(`❌ Error listing tables: ${error.message}`);
      return [];
    }
  }

  /**
   * Update app configuration in captify-core-App table
   */
  async updateAppConfiguration(packagePath, packageName, menu) {
    try {
      const packageJsonPath = join(packagePath, "package.json");
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

      const appConfig = {
        appId: uuidv4(),
        name: packageJson.description || packageJson.name || packageName,
        slug: packageName,
        description: packageJson.description || `${packageName} package`,
        category: this.getCategory(packageName),
        version: packageJson.version || "1.0.0",
        icon: this.getIconForPage(packageName),
        status: "active",
        visibility: "internal",
        createdBy: "installer",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        menu,
      };

      // Convert to DynamoDB format
      const dynamoItem = this.toDynamoDBFormat(appConfig);

      // Put item in table
      const putCommand = `aws dynamodb put-item --table-name captify-core-App --item '${JSON.stringify(
        dynamoItem
      )}' --region ${this.region}`;
      execSync(putCommand);

      console.log(`✅ Updated app configuration for ${packageName}`);

      return appConfig;
    } catch (error) {
      console.error(`❌ Error updating app configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Convert JavaScript object to DynamoDB format
   */
  toDynamoDBFormat(obj) {
    const convert = (value) => {
      if (value === null || value === undefined) {
        return { NULL: true };
      }
      if (typeof value === "string") {
        return { S: value };
      }
      if (typeof value === "number") {
        return { N: value.toString() };
      }
      if (typeof value === "boolean") {
        return { BOOL: value };
      }
      if (Array.isArray(value)) {
        return { L: value.map(convert) };
      }
      if (typeof value === "object") {
        const converted = {};
        for (const [k, v] of Object.entries(value)) {
          converted[k] = convert(v);
        }
        return { M: converted };
      }
      return { S: value.toString() };
    };

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = convert(value);
    }
    return result;
  }

  /**
   * Get package slug from current context
   */
  getPackageSlug() {
    return this.currentPackage || "unknown";
  }

  /**
   * Get category based on package name
   */
  getCategory(packageName) {
    const categoryMap = {
      core: "administration",
      auth: "authentication",
      admin: "administration",
      api: "integration",
      ui: "interface",
    };
    return categoryMap[packageName] || "application";
  }

  /**
   * Install package
   */
  async installPackage(packageName) {
    this.currentPackage = packageName;

    console.log(`🚀 Installing package: ${packageName}`);

    const packagePath = join(this.packagesDir, packageName);

    if (!existsSync(packagePath)) {
      throw new Error(`Package directory not found: ${packagePath}`);
    }

    try {
      // 1. Parse types and create/update tables
      const typesPath = join(packagePath, "src", "types.ts");
      const tables = this.parseTypesForTables(typesPath);

      console.log(`📋 Found ${tables.length} table definitions`);

      // Get existing tables
      const existingTables = this.getExistingTables();

      // Create/update tables
      for (const table of tables) {
        await this.createOrUpdateTable(table);
      }

      // Delete unused tables
      await this.deleteUnusedTables(tables, existingTables);

      // 2. Generate menu from pages
      const menu = this.generateMenuFromPages(packagePath, packageName);
      console.log(`📋 Generated menu with ${menu.length} items`);

      // 3. Update app configuration
      const appConfig = await this.updateAppConfiguration(
        packagePath,
        packageName,
        menu
      );

      console.log(`🎉 Successfully installed package: ${packageName}`);
      console.log(`📋 App ID: ${appConfig.appId}`);

      return {
        packageName,
        tables,
        menu,
        appConfig,
      };
    } catch (error) {
      console.error(
        `❌ Failed to install package ${packageName}: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * List available packages
   */
  listPackages() {
    let allItems;
    try {
      allItems = readdirSync(this.packagesDir);
      console.log(`📋 Found items: ${allItems.join(", ")}`);
    } catch (error) {
      console.error(`❌ Error reading packages directory: ${error.message}`);
      return [];
    }

    const packages = allItems.filter((item) => {
      if (
        item.startsWith(".") ||
        item === "node_modules" ||
        item.endsWith(".js") ||
        item.endsWith(".json")
      ) {
        console.log(`  ⏭️  Skipping ${item} (not a package directory)`);
        return false;
      }

      const itemPath = join(this.packagesDir, item);
      try {
        const stats = statSync(itemPath);
        const hasPackageJson = existsSync(join(itemPath, "package.json"));
        console.log(
          `  📂 ${item}: isDirectory=${stats.isDirectory()}, hasPackageJson=${hasPackageJson}`
        );
        return stats.isDirectory() && hasPackageJson;
      } catch (error) {
        console.log(
          `  ⚠️  Warning: Could not access ${item}: ${error.message}`
        );
        return false;
      }
    });

    console.log("📦 Available packages:");
    packages.forEach((pkg) => {
      const packageJsonPath = join(this.packagesDir, pkg, "package.json");
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
        console.log(
          `  - ${pkg} (${packageJson.description || "No description"})`
        );
      } catch (error) {
        console.log(`  - ${pkg} (Could not read package.json)`);
      }
    });

    return packages;
  }
}

// CLI Interface
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  const installer = new CaptifyPackageInstaller();
  const command = process.argv[2];
  const packageName = process.argv[3];

  console.log(`🔧 Running command: ${command}`);

  switch (command) {
    case "list":
      installer.listPackages();
      break;

    case "install":
      if (!packageName) {
        console.error("❌ Please provide a package name");
        console.log("Usage: node install.js install <package-name>");
        installer.listPackages();
        process.exit(1);
      }

      installer
        .installPackage(packageName)
        .then(() => {
          console.log(`\n🎉 Installation complete!`);
        })
        .catch((error) => {
          console.error(`\n❌ Installation failed: ${error.message}`);
          process.exit(1);
        });
      break;

    default:
      console.log(`
🚀 Captify Package Installer

Usage:
  node install.js list                    - List available packages
  node install.js install <package-name> - Install package

Examples:
  node install.js list
  node install.js install core
      `);
  }
}

export default CaptifyPackageInstaller;
