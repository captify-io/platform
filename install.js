#!/usr/bin/env node

import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  statSync,
  mkdtempSync,
} from "fs";
import { join, dirname, relative, basename } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { tmpdir } from "os";

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
    this.packagesDir = join(__dirname, "packages");
    this.region = process.env.AWS_REGION || "us-east-1";
    this.tablePrefix = "captify";
  }

  /**
   * Parse TypeScript types to find interfaces that extend Core
   */
  parseTypesForTables(typesFilePath) {
    if (!existsSync(typesFilePath)) {
      console.log(`⚠️  No types file found at ${typesFilePath}`);
      return [];
    }

    const tables = [];

    // Check if this is an index file with re-exports
    const content = readFileSync(typesFilePath, "utf8");
    const isIndexFile =
      content.includes("export * from") || content.includes("export { ");

    if (isIndexFile) {
      // This is an index file, read all .ts files in the types directory
      const typesDir = dirname(typesFilePath);
      const typeFiles = readdirSync(typesDir)
        .filter((file) => file.endsWith(".ts") && file !== "index.ts")
        .map((file) => join(typesDir, file));

      for (const typeFile of typeFiles) {
        const fileTables = this.parseInterfacesFromFile(typeFile);
        tables.push(...fileTables);
      }
    } else {
      // This is a single types file
      const fileTables = this.parseInterfacesFromFile(typesFilePath);
      tables.push(...fileTables);
    }

    return tables;
  }

  /**
   * Parse interfaces from a single TypeScript file
   */
  parseInterfacesFromFile(filePath) {
    const content = readFileSync(filePath, "utf8");
    const tables = [];

    // Regex to match interface definitions that extend Core
    const interfaceRegex =
      /export\s+interface\s+(\w+)\s+extends\s+Core\s*\{([^}]+)\}/g;
    let match;

    while ((match = interfaceRegex.exec(content)) !== null) {
      const interfaceName = match[1];
      const body = match[2];

      // Skip the Core interface itself (it's just the base interface)
      if (interfaceName === "Core") {
        continue;
      }

      // Parse the interface properties for DynamoDB table creation (just keys)
      const attributes = this.parseInterfaceProperties(body);

      // Parse all interface properties for TableMetadata
      const allAttributes = this.parseAllInterfaceProperties(body);

      tables.push({
        name: interfaceName,
        tableName: `${
          this.tablePrefix
        }-${this.getPackageSlug()}-${interfaceName}`,
        attributes, // For DynamoDB table creation
        allAttributes, // For TableMetadata
        keySchema: [{ AttributeName: "id", KeyType: "HASH" }], // Primary key
      });
    }

    return tables;
  }

  /**
   * Parse interface properties to create DynamoDB attributes
   * Since all our interfaces extend Core, they all have an 'id' field as primary key
   * DynamoDB only needs AttributeDefinitions for key attributes
   */
  parseInterfaceProperties(interfaceBody) {
    // For tables extending Core, we only need the 'id' attribute for the primary key
    return [
      {
        AttributeName: "id",
        AttributeType: "S", // String type for UUID
      },
    ];
  }

  /**
   * Parse all interface properties for TableMetadata (captures all fields)
   */
  parseAllInterfaceProperties(interfaceBody) {
    const attributes = [];
    const lines = interfaceBody
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("//"));

    for (const line of lines) {
      // Parse property: type format, excluding nested objects and complex types
      const propertyMatch = line.match(/^(\w+)(\?)?:\s*(.+);?\s*$/);
      if (propertyMatch) {
        const [, name, optional, type] = propertyMatch;

        // Skip nested object definitions (lines with { )
        if (type.includes("{")) {
          continue;
        }

        let attributeType = "S"; // String default
        let required = !optional; // Required if not optional

        // Map TypeScript types to DynamoDB types
        if (type.includes("number")) {
          attributeType = "N";
        } else if (type.includes("boolean")) {
          attributeType = "BOOL";
        } else if (type.includes("[]") || type.includes("Array")) {
          attributeType = "L";
        } else if (type.includes("Record<") || type.includes("object")) {
          attributeType = "M";
        }

        attributes.push({
          name,
          type: attributeType,
          required,
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
    const menuJsonPath = join(packagePath, "src", "menu.json");

    // First, check if there's a menu.json file
    if (existsSync(menuJsonPath)) {
      try {
        console.log(`📋 Reading menu from menu.json`);
        const menuContent = readFileSync(menuJsonPath, "utf8");
        const menu = JSON.parse(menuContent);
        return menu;
      } catch (error) {
        console.log(`⚠️  Could not parse menu.json: ${error.message}`);
        console.log(`   Falling back to page scanning...`);
      }
    }

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

      // Create table configuration
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

      // Create temporary file for the JSON
      const tempDir = mkdtempSync(join(tmpdir(), "captify-installer-"));
      const tempFile = join(tempDir, "create-table.json");

      writeFileSync(tempFile, JSON.stringify(createTableCommand, null, 2));

      const command = `aws dynamodb create-table --cli-input-json file://${tempFile.replace(
        /\\/g,
        "/"
      )} --region ${this.region}`;
      execSync(command);

      console.log(`✅ Created table ${tableConfig.tableName}`);

      // Clean up temp file
      try {
        const fs = await import("fs");
        fs.unlinkSync(tempFile);
        fs.rmdirSync(tempDir);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

      // Wait for table to be active
      console.log(`⏳ Waiting for table to be active...`);
      const waitCommand = `aws dynamodb wait table-exists --table-name ${tableConfig.tableName} --region ${this.region}`;
      execSync(waitCommand);

      // Save TableMetadata record
      await this.saveTableMetadata(tableConfig);
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
        !currentTableNames.includes(name) &&
        !name.endsWith("-App") // Don't delete the main App table
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
   * Create Cognito Identity Pool for app
   */
  async createIdentityPool(packageName) {
    try {
      const poolName = `captify-${packageName}-identity-pool`;
      
      console.log(`🔐 Creating identity pool: ${poolName}...`);
      
      // Check if pool already exists
      try {
        const listCommand = `aws cognito-identity list-identity-pools --max-results 60 --region ${this.region}`;
        const result = execSync(listCommand, { encoding: "utf8" });
        const pools = JSON.parse(result);
        
        const existingPool = pools.IdentityPools?.find(p => p.IdentityPoolName === poolName);
        if (existingPool) {
          console.log(`✅ Identity pool already exists: ${existingPool.IdentityPoolId}`);
          return {
            IdentityPoolId: existingPool.IdentityPoolId,
            IdentityPoolArn: `arn:aws:cognito-identity:${this.region}:${process.env.AWS_ACCOUNT_ID || '211125459951'}:identitypool/${existingPool.IdentityPoolId}`
          };
        }
      } catch (error) {
        console.log("⚠️  Could not list existing pools, will create new one");
      }
      
      // Create IAM roles for the identity pool
      const authenticatedRole = await this.createIAMRole(packageName, 'authenticated');
      const unauthenticatedRole = await this.createIAMRole(packageName, 'unauthenticated');
      
      // Create identity pool configuration
      const poolConfig = {
        IdentityPoolName: poolName,
        AllowUnauthenticatedIdentities: false,
        CognitoIdentityProviders: process.env.COGNITO_USER_POOL_ID ? [{
          ClientId: process.env.COGNITO_CLIENT_ID,
          ProviderName: `cognito-idp.${this.region}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
          ServerSideTokenCheck: false
        }] : [],
        SupportedLoginProviders: {}
      };
      
      // Create temporary file for the JSON
      const tempDir = mkdtempSync(join(tmpdir(), "captify-installer-"));
      const tempFile = join(tempDir, "identity-pool.json");
      writeFileSync(tempFile, JSON.stringify(poolConfig, null, 2));
      
      // Create identity pool
      const createCommand = `aws cognito-identity create-identity-pool --cli-input-json file://${tempFile.replace(/\\/g, "/")} --region ${this.region}`;
      const createResult = execSync(createCommand, { encoding: "utf8" });
      const pool = JSON.parse(createResult);
      
      console.log(`✅ Created identity pool: ${pool.IdentityPoolId}`);
      
      // Set identity pool roles
      const rolesConfig = {
        IdentityPoolId: pool.IdentityPoolId,
        Roles: {
          authenticated: authenticatedRole.Arn,
          unauthenticated: unauthenticatedRole.Arn
        }
      };
      
      const rolesFile = join(tempDir, "pool-roles.json");
      writeFileSync(rolesFile, JSON.stringify(rolesConfig, null, 2));
      
      const setRolesCommand = `aws cognito-identity set-identity-pool-roles --cli-input-json file://${rolesFile.replace(/\\/g, "/")} --region ${this.region}`;
      execSync(setRolesCommand);
      
      console.log(`✅ Set identity pool roles`);
      
      // Clean up temp files
      try {
        const fs = await import("fs");
        fs.unlinkSync(tempFile);
        fs.unlinkSync(rolesFile);
        fs.rmdirSync(tempDir);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      return {
        IdentityPoolId: pool.IdentityPoolId,
        IdentityPoolArn: `arn:aws:cognito-identity:${this.region}:${process.env.AWS_ACCOUNT_ID || '211125459951'}:identitypool/${pool.IdentityPoolId}`
      };
    } catch (error) {
      console.error(`⚠️  Could not create identity pool: ${error.message}`);
      return {
        IdentityPoolId: `placeholder-pool-${packageName}`,
        IdentityPoolArn: `arn:aws:cognito-identity:${this.region}:placeholder:identitypool/placeholder-${packageName}`
      };
    }
  }
  
  /**
   * Create IAM role for identity pool
   */
  async createIAMRole(packageName, roleType) {
    try {
      const roleName = `captify-${packageName}-${roleType}`;
      
      // Check if role exists
      try {
        const getCommand = `aws iam get-role --role-name ${roleName} --region ${this.region}`;
        const result = execSync(getCommand, { encoding: "utf8" });
        const role = JSON.parse(result).Role;
        console.log(`  ✅ IAM role already exists: ${roleName}`);
        return role;
      } catch (error) {
        // Role doesn't exist, create it
      }
      
      // Create trust policy
      const trustPolicy = {
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: {
            Federated: "cognito-identity.amazonaws.com"
          },
          Action: "sts:AssumeRoleWithWebIdentity"
        }]
      };
      
      // Create role
      const tempDir = mkdtempSync(join(tmpdir(), "captify-installer-"));
      const trustFile = join(tempDir, "trust-policy.json");
      writeFileSync(trustFile, JSON.stringify(trustPolicy, null, 2));
      
      const createRoleCommand = `aws iam create-role --role-name ${roleName} --assume-role-policy-document file://${trustFile.replace(/\\/g, "/")} --region ${this.region}`;
      const roleResult = execSync(createRoleCommand, { encoding: "utf8" });
      const role = JSON.parse(roleResult).Role;
      
      // Create access policy
      const accessPolicy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:UpdateItem",
              "dynamodb:DeleteItem",
              "dynamodb:Query",
              "dynamodb:Scan"
            ],
            Resource: `arn:aws:dynamodb:${this.region}:*:table/captify-${packageName}-*`
          },
          {
            Effect: "Allow",
            Action: [
              "s3:GetObject",
              "s3:PutObject",
              "s3:DeleteObject"
            ],
            Resource: `arn:aws:s3:::captify-${packageName}-bucket/*`
          }
        ]
      };
      
      const policyFile = join(tempDir, "access-policy.json");
      writeFileSync(policyFile, JSON.stringify(accessPolicy, null, 2));
      
      const putPolicyCommand = `aws iam put-role-policy --role-name ${roleName} --policy-name ${roleName}-policy --policy-document file://${policyFile.replace(/\\/g, "/")} --region ${this.region}`;
      execSync(putPolicyCommand);
      
      console.log(`  ✅ Created IAM role: ${roleName}`);
      
      // Clean up
      try {
        const fs = await import("fs");
        fs.unlinkSync(trustFile);
        fs.unlinkSync(policyFile);
        fs.rmdirSync(tempDir);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      return role;
    } catch (error) {
      console.error(`  ⚠️  Could not create IAM role: ${error.message}`);
      return {
        Arn: `arn:aws:iam::placeholder:role/captify-${packageName}-${roleType}`,
        RoleName: `captify-${packageName}-${roleType}`
      };
    }
  }
  
  /**
   * Create S3 bucket for app
   */
  async createS3Bucket(packageName) {
    try {
      const bucketName = `captify-${packageName}-bucket`;
      
      console.log(`📦 Creating S3 bucket: ${bucketName}...`);
      
      // Check if bucket exists
      try {
        const headCommand = `aws s3api head-bucket --bucket ${bucketName} --region ${this.region}`;
        execSync(headCommand, { stdio: "pipe" });
        console.log(`✅ S3 bucket already exists: ${bucketName}`);
        return {
          BucketName: bucketName,
          BucketArn: `arn:aws:s3:::${bucketName}`
        };
      } catch (error) {
        // Bucket doesn't exist, create it
      }
      
      // Create bucket
      const createCommand = this.region === 'us-east-1' 
        ? `aws s3api create-bucket --bucket ${bucketName} --region ${this.region}`
        : `aws s3api create-bucket --bucket ${bucketName} --region ${this.region} --create-bucket-configuration LocationConstraint=${this.region}`;
      
      execSync(createCommand);
      console.log(`✅ Created S3 bucket: ${bucketName}`);
      
      // Enable versioning
      const versioningCommand = `aws s3api put-bucket-versioning --bucket ${bucketName} --versioning-configuration Status=Enabled --region ${this.region}`;
      execSync(versioningCommand);
      
      // Set bucket policy for app access
      const bucketPolicy = {
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "AllowAppAccess",
            Effect: "Allow",
            Principal: {
              AWS: `arn:aws:iam::*:role/captify-${packageName}-authenticated`
            },
            Action: [
              "s3:GetObject",
              "s3:PutObject"
            ],
            Resource: `arn:aws:s3:::${bucketName}/*`
          }
        ]
      };
      
      const tempDir = mkdtempSync(join(tmpdir(), "captify-installer-"));
      const policyFile = join(tempDir, "bucket-policy.json");
      writeFileSync(policyFile, JSON.stringify(bucketPolicy, null, 2));
      
      const policyCommand = `aws s3api put-bucket-policy --bucket ${bucketName} --policy file://${policyFile.replace(/\\/g, "/")} --region ${this.region}`;
      
      try {
        execSync(policyCommand);
        console.log(`✅ Set bucket policy`);
      } catch (error) {
        console.log(`⚠️  Could not set bucket policy: ${error.message}`);
      }
      
      // Clean up
      try {
        const fs = await import("fs");
        fs.unlinkSync(policyFile);
        fs.rmdirSync(tempDir);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      return {
        BucketName: bucketName,
        BucketArn: `arn:aws:s3:::${bucketName}`
      };
    } catch (error) {
      console.error(`⚠️  Could not create S3 bucket: ${error.message}`);
      return {
        BucketName: `placeholder-bucket-${packageName}`,
        BucketArn: `arn:aws:s3:::placeholder-bucket-${packageName}`
      };
    }
  }
  
  /**
   * Create Bedrock Agent placeholder
   */
  async createBedrockAgent(packageName) {
    // Placeholder for future Bedrock Agent creation
    console.log(`🤖 Creating Bedrock agent placeholder for ${packageName}...`);
    
    return {
      AgentId: `agent-${packageName}-${Date.now()}`,
      AgentAliasId: `alias-${packageName}-${Date.now()}`,
      AgentName: `captify-${packageName}-agent`,
      AgentArn: `arn:aws:bedrock:${this.region}:placeholder:agent/captify-${packageName}`,
      Status: "placeholder",
      CreatedAt: new Date().toISOString()
    };
  }
  
  /**
   * Create Knowledge Base placeholder
   */
  async createKnowledgeBase(packageName, s3Bucket) {
    // Placeholder for future Knowledge Base creation
    console.log(`📚 Creating Knowledge Base placeholder for ${packageName}...`);
    
    return {
      KnowledgeBaseId: `kb-${packageName}-${Date.now()}`,
      KnowledgeBaseArn: `arn:aws:bedrock:${this.region}:placeholder:knowledge-base/captify-${packageName}`,
      DataSourceId: `ds-${packageName}-${Date.now()}`,
      S3BucketName: s3Bucket.BucketName,
      Status: "placeholder",
      CreatedAt: new Date().toISOString()
    };
  }

  /**
   * Update app configuration in captify-core-App table
   */
  async updateAppConfiguration(packagePath, packageName, menu, awsResources = {}) {
    try {
      const packageJsonPath = join(packagePath, "package.json");
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

      const appConfig = {
        id: uuidv4(), // Core interface requires 'id', not 'appId'
        slug: packageName,
        name: packageJson.description || packageJson.name || packageName,
        app: packageName, // Which app/package this entity belongs to
        order: this.getAppOrder(packageName), // Sort order for GSI queries
        fields: {}, // Extensible JSON object for app-specific data
        description: packageJson.description || `${packageName} package`,
        ownerId: "system", // System-owned entity
        createdAt: new Date().toISOString(),
        createdBy: "installer",
        updatedAt: new Date().toISOString(),
        updatedBy: "installer",
        // App-specific fields
        version: packageJson.version || "1.0.0",
        status: "active",
        category: this.getCategory(packageName),
        visibility: "internal",
        icon: this.getIconForPage(packageName),
        menu,
        // AWS Resources
        identityPoolId: awsResources.identityPool?.IdentityPoolId || null,
        identityPoolArn: awsResources.identityPool?.IdentityPoolArn || null,
        s3BucketName: awsResources.s3Bucket?.BucketName || null,
        s3BucketArn: awsResources.s3Bucket?.BucketArn || null,
        agentId: awsResources.agent?.AgentId || null,
        agentAliasId: awsResources.agent?.AgentAliasId || null,
        agentArn: awsResources.agent?.AgentArn || null,
        knowledgeBaseId: awsResources.knowledgeBase?.KnowledgeBaseId || null,
        knowledgeBaseArn: awsResources.knowledgeBase?.KnowledgeBaseArn || null,
      };

      // Convert to DynamoDB format
      const dynamoItem = this.toDynamoDBFormat(appConfig);

      // Create temporary file for the item JSON
      const tempDir = mkdtempSync(join(tmpdir(), "captify-installer-"));
      const tempFile = join(tempDir, "put-item.json");

      writeFileSync(tempFile, JSON.stringify(dynamoItem, null, 2));

      // Put item in table
      const putCommand = `aws dynamodb put-item --table-name ${
        this.tablePrefix
      }-core-App --item file://${tempFile.replace(/\\/g, "/")} --region ${
        this.region
      }`;
      execSync(putCommand);

      // Clean up temp file
      try {
        const fs = await import("fs");
        fs.unlinkSync(tempFile);
        fs.rmdirSync(tempDir);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

      console.log(`✅ Updated app configuration for ${packageName}`);

      return appConfig;
    } catch (error) {
      console.error(`❌ Error updating app configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save TableMetadata record for tracking tables created by the installer
   * Updates existing record if slug matches, otherwise creates new record
   */
  async saveTableMetadata(tableConfig) {
    try {
      const slug = `${this.getPackageSlug()}-${tableConfig.name.toLowerCase()}`;

      // First, try to get existing record by slug using scan
      let existingRecord = null;
      try {
        // Create temporary file for expression attribute values
        const tempDir = mkdtempSync(join(tmpdir(), "captify-installer-"));
        const expressionFile = join(tempDir, "expression-values.json");

        const expressionValues = {
          ":slug": { S: slug },
        };

        writeFileSync(
          expressionFile,
          JSON.stringify(expressionValues, null, 2)
        );

        const scanCommand = `aws dynamodb scan --table-name ${
          this.tablePrefix
        }-core-TableMetadata --filter-expression "slug = :slug" --expression-attribute-values file://${expressionFile.replace(
          /\\/g,
          "/"
        )} --region ${this.region}`;
        const scanResult = execSync(scanCommand, { encoding: "utf8" });
        const scanData = JSON.parse(scanResult);

        if (scanData.Items && scanData.Items.length > 0) {
          existingRecord = scanData.Items[0];
        }

        // Clean up temp file
        try {
          const fs = await import("fs");
          fs.unlinkSync(expressionFile);
          fs.rmdirSync(tempDir);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      } catch (scanError) {
        console.log(
          `⚠️  Could not check for existing record, will create new one`
        );
      }

      // Prepare metadata
      const now = new Date().toISOString();
      const metadata = {
        id: existingRecord ? existingRecord.id.S : uuidv4(), // Keep existing ID or create new
        slug,
        name: `${tableConfig.name} Table`,
        app: this.getPackageSlug(),
        fields: {},
        description: `Table for ${tableConfig.name} entities`,
        ownerId: "system",
        createdAt: existingRecord ? existingRecord.createdAt.S : now, // Keep original creation time
        createdBy: existingRecord ? existingRecord.createdBy.S : "installer",
        updatedAt: now, // Always update the timestamp
        updatedBy: "installer",
        // TableMetadata-specific fields
        typeName: tableConfig.name,
        keySchema: {
          hashKey: "id", // All our tables use 'id' as primary key
        },
        attributes:
          tableConfig.allAttributes ||
          tableConfig.attributes.map((attr) => ({
            name: attr.AttributeName,
            type: attr.AttributeType,
            required: true,
          })),
        status: "active",
      };

      // Convert to DynamoDB format
      const dynamoItem = this.toDynamoDBFormat(metadata);

      // Create temporary file for the item JSON
      const tempDir = mkdtempSync(join(tmpdir(), "captify-installer-"));
      const tempFile = join(tempDir, "table-metadata.json");

      writeFileSync(tempFile, JSON.stringify(dynamoItem, null, 2));

      // Put item in TableMetadata table (this will overwrite if same id)
      const putCommand = `aws dynamodb put-item --table-name ${
        this.tablePrefix
      }-core-TableMetadata --item file://${tempFile.replace(
        /\\/g,
        "/"
      )} --region ${this.region}`;
      execSync(putCommand);

      if (existingRecord) {
        console.log(
          `  ✅ Updated existing TableMetadata for ${tableConfig.name}`
        );
      } else {
        console.log(`  ✅ Created new TableMetadata for ${tableConfig.name}`);
      }

      // Clean up temp file
      try {
        const fs = await import("fs");
        fs.unlinkSync(tempFile);
        fs.rmdirSync(tempDir);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    } catch (error) {
      console.error(
        `⚠️  Warning: Could not save TableMetadata for ${tableConfig.tableName}: ${error.message}`
      );
      // Don't throw error - TableMetadata is optional
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
   * Get app order based on package name for GSI sorting
   */
  getAppOrder(packageName) {
    const orderMap = {
      core: "0",
      auth: "1",
      admin: "2",
      api: "3",
      ui: "4",
      mi: "5",
      veripicks: "6",
    };

    // If package not in map, use timestamp-based order to ensure uniqueness
    return orderMap[packageName] || Date.now().toString();
  }

  /**
   * Ensure core tables (App and TableMetadata) exist
   * These tables are required by all packages
   */
  async ensureCoreTablesExist() {
    console.log("🔍 Checking for core tables...");
    
    // Define core table configurations
    const coreTableConfigs = [
      {
        name: "App",
        tableName: `${this.tablePrefix}-core-App`,
        attributes: [
          {
            AttributeName: "id",
            AttributeType: "S",
          },
        ],
        keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      },
      {
        name: "TableMetadata",
        tableName: `${this.tablePrefix}-core-TableMetadata`,
        attributes: [
          {
            AttributeName: "id",
            AttributeType: "S",
          },
        ],
        keySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      },
    ];

    // Check and create each core table if needed
    for (const tableConfig of coreTableConfigs) {
      try {
        // Check if table exists
        const describeCommand = `aws dynamodb describe-table --table-name ${tableConfig.tableName} --region ${this.region}`;
        
        try {
          execSync(describeCommand, { stdio: "pipe" });
          console.log(`✅ Core table ${tableConfig.tableName} already exists`);
        } catch (error) {
          // Table doesn't exist, create it
          console.log(`📋 Creating core table ${tableConfig.tableName}...`);
          
          // Create table configuration
          const createTableCommand = {
            TableName: tableConfig.tableName,
            KeySchema: tableConfig.keySchema,
            AttributeDefinitions: tableConfig.attributes,
            BillingMode: "PAY_PER_REQUEST",
          };

          // Create temporary file for the JSON
          const tempDir = mkdtempSync(join(tmpdir(), "captify-installer-"));
          const tempFile = join(tempDir, "create-table.json");

          writeFileSync(tempFile, JSON.stringify(createTableCommand, null, 2));

          const command = `aws dynamodb create-table --cli-input-json file://${tempFile.replace(
            /\\/g,
            "/"
          )} --region ${this.region}`;
          execSync(command);

          console.log(`✅ Created core table ${tableConfig.tableName}`);

          // Clean up temp file
          try {
            const fs = await import("fs");
            fs.unlinkSync(tempFile);
            fs.rmdirSync(tempDir);
          } catch (cleanupError) {
            // Ignore cleanup errors
          }

          // Wait for table to be active
          console.log(`⏳ Waiting for table to be active...`);
          const waitCommand = `aws dynamodb wait table-exists --table-name ${tableConfig.tableName} --region ${this.region}`;
          execSync(waitCommand);
        }
      } catch (error) {
        console.error(
          `❌ Error ensuring core table ${tableConfig.tableName}: ${error.message}`
        );
        throw error;
      }
    }
    
    console.log("✅ Core tables ready");
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
      let typesPath = join(packagePath, "src", "types.ts");

      // Check for types directory structure
      if (!existsSync(typesPath)) {
        typesPath = join(packagePath, "src", "types", "index.ts");
      }

      const tables = this.parseTypesForTables(typesPath);

      console.log(`📋 Found ${tables.length} table definitions`);

      // Get existing tables
      const existingTables = this.getExistingTables();

      // 1a. FIRST: Ensure core tables exist (App and TableMetadata)
      await this.ensureCoreTablesExist();

      // 1b. Separate tables into core tables and others
      const coreTableNames = ['App', 'TableMetadata'];
      const coreTables = tables.filter(t => coreTableNames.includes(t.name));
      const otherTables = tables.filter(t => !coreTableNames.includes(t.name));

      // 1c. Create/update core tables first
      for (const table of coreTables) {
        await this.createOrUpdateTable(table);
      }

      // 1d. Then create/update other tables
      for (const table of otherTables) {
        await this.createOrUpdateTable(table);
      }

      // Delete unused tables
      await this.deleteUnusedTables(tables, existingTables);

      // 2. Create AWS resources for the app
      console.log(`\n🔧 Creating AWS resources for ${packageName}...`);
      
      const awsResources = {};
      
      // Create Identity Pool
      awsResources.identityPool = await this.createIdentityPool(packageName);
      
      // Create S3 Bucket
      awsResources.s3Bucket = await this.createS3Bucket(packageName);
      
      // Create Bedrock Agent placeholder
      awsResources.agent = await this.createBedrockAgent(packageName);
      
      // Create Knowledge Base placeholder
      awsResources.knowledgeBase = await this.createKnowledgeBase(packageName, awsResources.s3Bucket);
      
      console.log(`✅ AWS resources created/verified\n`);

      // 3. Generate menu from pages
      const menu = this.generateMenuFromPages(packagePath, packageName);
      console.log(`📋 Generated menu with ${menu.length} items`);

      // 4. Update app configuration with AWS resources
      const appConfig = await this.updateAppConfiguration(
        packagePath,
        packageName,
        menu,
        awsResources
      );

      console.log(`🎉 Successfully installed package: ${packageName}`);
      console.log(`📋 App ID: ${appConfig.id}`);
      console.log(`🔐 Identity Pool: ${awsResources.identityPool?.IdentityPoolId || 'placeholder'}`);
      console.log(`📦 S3 Bucket: ${awsResources.s3Bucket?.BucketName || 'placeholder'}`);
      console.log(`🤖 Agent: ${awsResources.agent?.AgentId || 'placeholder'}`);

      return {
        packageName,
        tables,
        menu,
        appConfig,
        awsResources,
      };
    } catch (error) {
      console.error(
        `❌ Failed to install package ${packageName}: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Update TableMetadata for all existing tables in a package
   */
  async updateTableMetadata(packageName) {
    this.currentPackage = packageName;

    console.log(`🔄 Updating TableMetadata for package: ${packageName}`);

    const packagePath = join(this.packagesDir, packageName);

    if (!existsSync(packagePath)) {
      throw new Error(`Package directory not found: ${packagePath}`);
    }

    try {
      // 1. Parse types to get table definitions
      let typesPath = join(packagePath, "src", "types.ts");

      // Check for types directory structure
      if (!existsSync(typesPath)) {
        typesPath = join(packagePath, "src", "types", "index.ts");
      }

      const tables = this.parseTypesForTables(typesPath);

      console.log(`📋 Found ${tables.length} table definitions`);

      // 2. Get existing tables to verify they exist
      const existingTables = this.getExistingTables();

      let updatedCount = 0;

      // 3. Update/create TableMetadata for each table
      for (const table of tables) {
        const tableExists = existingTables.includes(table.tableName);

        if (tableExists) {
          console.log(`📝 Updating TableMetadata for ${table.tableName}...`);
          await this.saveTableMetadata(table);
          updatedCount++;
        } else {
          console.log(
            `⚠️  Table ${table.tableName} does not exist, skipping...`
          );
        }
      }

      console.log(`✅ Updated TableMetadata for ${updatedCount} tables`);

      return {
        packageName,
        tablesProcessed: tables.length,
        metadataUpdated: updatedCount,
      };
    } catch (error) {
      console.error(
        `❌ Failed to update TableMetadata for ${packageName}: ${error.message}`
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
  const flags = process.argv.slice(4);

  console.log(`🔧 Running command: ${command}`);

  switch (command) {
    case "list":
      installer.listPackages();
      break;

    case "install":
      if (!packageName) {
        console.error("❌ Please provide a package name");
        console.log(
          "Usage: node install.js install <package-name> [--TableMetadata]"
        );
        installer.listPackages();
        process.exit(1);
      }

      // Check if --TableMetadata flag is present
      if (flags.includes("--TableMetadata")) {
        installer
          .updateTableMetadata(packageName)
          .then((result) => {
            console.log(`\n🎉 TableMetadata update complete!`);
            console.log(
              `📊 Processed ${result.tablesProcessed} tables, updated ${result.metadataUpdated} metadata entries`
            );
          })
          .catch((error) => {
            console.error(`\n❌ TableMetadata update failed: ${error.message}`);
            process.exit(1);
          });
      } else {
        installer
          .installPackage(packageName)
          .then(() => {
            console.log(`\n🎉 Installation complete!`);
          })
          .catch((error) => {
            console.error(`\n❌ Installation failed: ${error.message}`);
            process.exit(1);
          });
      }
      break;

    default:
      console.log(`
🚀 Captify Package Installer

Usage:
  node install.js list                              - List available packages
  node install.js install <package-name>           - Install package
  node install.js install <package-name> --TableMetadata - Update TableMetadata for existing tables

Examples:
  node install.js list
  node install.js install core
  node install.js install core --TableMetadata
      `);
  }
}

export default CaptifyPackageInstaller;
