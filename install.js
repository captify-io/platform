#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdtempSync } from 'fs';
import { join, dirname, relative, basename } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { tmpdir } from 'os';

// Simple UUID generator
const uuidv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
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
    this.packagesDir = join(__dirname, 'packages');
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.tablePrefix = 'captify';
  }

  /**
   * Parse TypeScript types to find interfaces that extend Core
   */
  parseTypesForTables(typesFilePath) {
    if (!existsSync(typesFilePath)) {
      console.log(`⚠️  No types.ts file found at ${typesFilePath}`);
      return [];
    }

    const content = readFileSync(typesFilePath, 'utf8');
    const tables = [];

    // Regex to match interface definitions that extend Core
    const interfaceRegex = /export\s+interface\s+(\w+)\s+extends\s+Core\s*\{([^}]+)\}/g;
    let match;

    while ((match = interfaceRegex.exec(content)) !== null) {
      const interfaceName = match[1];
      const body = match[2];

      // Skip the Core interface itself (it's just the base interface)
      if (interfaceName === 'Core') {
        continue;
      }

      // Parse the interface properties for DynamoDB table creation (just keys)
      const attributes = this.parseInterfaceProperties(body);
      
      // Parse all interface properties for TableMetadata
      const allAttributes = this.parseAllInterfaceProperties(body);
      
      tables.push({
        name: interfaceName,
        tableName: `${this.tablePrefix}-${this.getPackageSlug()}-${interfaceName}`,
        attributes, // For DynamoDB table creation
        allAttributes, // For TableMetadata
        keySchema: [{ AttributeName: 'id', KeyType: 'HASH' }] // Primary key
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
        AttributeName: 'id',
        AttributeType: 'S' // String type for UUID
      }
    ];
  }

  /**
   * Parse all interface properties for TableMetadata (captures all fields)
   */
  parseAllInterfaceProperties(interfaceBody) {
    const attributes = [];
    const lines = interfaceBody.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));

    for (const line of lines) {
      // Parse property: type format, excluding nested objects and complex types
      const propertyMatch = line.match(/^(\w+)(\?)?:\s*(.+);?\s*$/);
      if (propertyMatch) {
        const [, name, optional, type] = propertyMatch;
        
        // Skip nested object definitions (lines with { )
        if (type.includes('{')) {
          continue;
        }

        let attributeType = 'S'; // String default
        let required = !optional; // Required if not optional
        
        // Map TypeScript types to DynamoDB types
        if (type.includes('number')) {
          attributeType = 'N';
        } else if (type.includes('boolean')) {
          attributeType = 'BOOL';
        } else if (type.includes('[]') || type.includes('Array')) {
          attributeType = 'L';
        } else if (type.includes('Record<') || type.includes('object')) {
          attributeType = 'M';
        }
        
        attributes.push({
          name,
          type: attributeType,
          required
        });
      }
    }

    return attributes;
  }

  /**
   * Scan pages directory and generate menu structure
   */
  generateMenuFromPages(packagePath, packageName) {
    const pagesPath = join(packagePath, 'src', 'app', 'pages');
    const indexPath = join(packagePath, 'src', 'app', 'index.ts');
    
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
        const indexContent = readFileSync(indexPath, 'utf8');
        pageRoutes = this.parsePageRoutes(indexContent);
      } catch (error) {
        console.log(`⚠️  Could not parse index.ts: ${error.message}`);
      }
    }

    // Scan pages directory
    const pageFiles = readdirSync(pagesPath).filter(file => 
      file.endsWith('.tsx') || file.endsWith('.ts')
    );

    for (const pageFile of pageFiles) {
      const pageName = basename(pageFile, '.tsx').replace('.ts', '');
      const pageId = `${packageName}-${order}`;
      
      // Convert camelCase/PascalCase to readable labels
      const label = this.convertToLabel(pageName);
      
      // Determine icon based on page name
      const icon = this.getIconForPage(pageName);
      
      // Determine href - use from pageRoutes if available, otherwise generate
      let href = `/${pageName.toLowerCase().replace('page', '')}`;
      if (pageRoutes[pageName.toLowerCase()]) {
        href = pageRoutes[pageName.toLowerCase()];
      }

      // Check if this is a main section that might have children
      const children = this.generateChildrenForPage(pageName, packageName, pageRoutes, order);

      const menuItem = {
        id: pageId,
        label,
        href,
        icon,
        order
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
    const pagesMatch = indexContent.match(/export\s+const\s+pages\s*=\s*\{([^}]+)\}/s);
    if (pagesMatch) {
      const pagesContent = pagesMatch[1];
      const routeMatches = pagesContent.matchAll(/"([^"]+)":\s*\(\)\s*=>\s*import\("([^"]+)"\)/g);
      
      for (const match of routeMatches) {
        const [, routeName, importPath] = match;
        routes[routeName] = `/${routeName.replace(/-/g, '/')}`;
      }
    }

    return routes;
  }

  /**
   * Generate children menu items for main sections
   */
  generateChildrenForPage(pageName, packageName, pageRoutes, parentOrder) {
    const children = [];
    const basePageName = pageName.toLowerCase().replace('page', '');
    
    // Look for related routes in pageRoutes
    const relatedRoutes = Object.keys(pageRoutes).filter(route => 
      route.startsWith(basePageName + '-') && route !== basePageName
    );

    let childOrder = 0;
    for (const route of relatedRoutes) {
      const childName = route.replace(basePageName + '-', '');
      const label = this.convertToLabel(childName);
      const icon = this.getIconForPage(childName);

      children.push({
        id: `${packageName}-${parentOrder}-${childOrder}`,
        label,
        href: pageRoutes[route],
        icon,
        order: childOrder
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
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/page$/i, '')
      .trim();
  }

  /**
   * Get appropriate icon for page name
   */
  getIconForPage(pageName) {
    const iconMap = {
      dashboard: 'layout-dashboard',
      policies: 'shield-check',
      access: 'users',
      services: 'database',
      organizations: 'building',
      settings: 'settings',
      monitor: 'activity',
      users: 'user',
      roles: 'shield',
      security: 'shield-check',
      performance: 'bar-chart',
      audit: 'file-text',
      alerts: 'alert-triangle',
      ssp: 'file-shield',
      poams: 'file-check',
      'change-requests': 'git-pull-request',
      sops: 'book-open',
      'risk-assessments': 'shield-alert',
      compliance: 'clipboard-check',
      dynamodb: 'database',
      neptune: 'network',
      s3: 'hard-drive',
      bedrock: 'brain',
      agents: 'bot',
      lambda: 'zap',
      themes: 'palette',
      notifications: 'bell',
      integrations: 'globe',
      system: 'sliders'
    };

    const key = pageName.toLowerCase().replace('page', '');
    return iconMap[key] || 'folder';
  }

  /**
   * Create or update DynamoDB table
   */
  async createOrUpdateTable(tableConfig) {
    try {
      // Check if table exists
      const describeCommand = `aws dynamodb describe-table --table-name ${tableConfig.tableName} --region ${this.region}`;
      
      try {
        execSync(describeCommand, { stdio: 'pipe' });
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
        AttributeDefinitions: tableConfig.attributes.filter(attr => 
          tableConfig.keySchema.some(key => key.AttributeName === attr.AttributeName)
        ),
        BillingMode: 'PAY_PER_REQUEST'
      };

      // Create temporary file for the JSON
      const tempDir = mkdtempSync(join(tmpdir(), 'captify-installer-'));
      const tempFile = join(tempDir, 'create-table.json');
      
      writeFileSync(tempFile, JSON.stringify(createTableCommand, null, 2));

      const command = `aws dynamodb create-table --cli-input-json file://${tempFile.replace(/\\/g, '/')} --region ${this.region}`;
      execSync(command);
      
      console.log(`✅ Created table ${tableConfig.tableName}`);
      
      // Clean up temp file
      try {
        const fs = await import('fs');
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
      console.error(`❌ Error creating table ${tableConfig.tableName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete unused tables
   */
  async deleteUnusedTables(currentTables, existingTables) {
    const currentTableNames = currentTables.map(t => t.tableName);
    const tablesToDelete = existingTables.filter(name => 
      name.startsWith(`${this.tablePrefix}-${this.getPackageSlug()}-`) &&
      !currentTableNames.includes(name) &&
      !name.endsWith('-App') // Don't delete the main App table
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
      const result = execSync(command, { encoding: 'utf8' });
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
      const packageJsonPath = join(packagePath, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

      const appConfig = {
        id: uuidv4(), // Core interface requires 'id', not 'appId'
        slug: packageName,
        name: packageJson.description || packageJson.name || packageName,
        app: packageName, // Which app/package this entity belongs to
        fields: {}, // Extensible JSON object for app-specific data
        description: packageJson.description || `${packageName} package`,
        ownerId: 'system', // System-owned entity
        createdAt: new Date().toISOString(),
        createdBy: 'installer',
        updatedAt: new Date().toISOString(),
        updatedBy: 'installer',
        // App-specific fields
        version: packageJson.version || '1.0.0',
        status: 'active',
        category: this.getCategory(packageName),
        visibility: 'internal',
        icon: this.getIconForPage(packageName),
        menu,
        agentId: null,
        agentAliasId: null
      };

      // Convert to DynamoDB format
      const dynamoItem = this.toDynamoDBFormat(appConfig);
      
      // Create temporary file for the item JSON
      const tempDir = mkdtempSync(join(tmpdir(), 'captify-installer-'));
      const tempFile = join(tempDir, 'put-item.json');
      
      writeFileSync(tempFile, JSON.stringify(dynamoItem, null, 2));
      
      // Put item in table
      const putCommand = `aws dynamodb put-item --table-name ${this.tablePrefix}-core-App --item file://${tempFile.replace(/\\/g, '/')} --region ${this.region}`;
      execSync(putCommand);
      
      // Clean up temp file
      try {
        const fs = await import('fs');
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
        const tempDir = mkdtempSync(join(tmpdir(), 'captify-installer-'));
        const expressionFile = join(tempDir, 'expression-values.json');
        
        const expressionValues = {
          ":slug": { "S": slug }
        };
        
        writeFileSync(expressionFile, JSON.stringify(expressionValues, null, 2));
        
        const scanCommand = `aws dynamodb scan --table-name ${this.tablePrefix}-core-TableMetadata --filter-expression "slug = :slug" --expression-attribute-values file://${expressionFile.replace(/\\/g, '/')} --region ${this.region}`;
        const scanResult = execSync(scanCommand, { encoding: 'utf8' });
        const scanData = JSON.parse(scanResult);
        
        if (scanData.Items && scanData.Items.length > 0) {
          existingRecord = scanData.Items[0];
        }
        
        // Clean up temp file
        try {
          const fs = await import('fs');
          fs.unlinkSync(expressionFile);
          fs.rmdirSync(tempDir);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      } catch (scanError) {
        console.log(`⚠️  Could not check for existing record, will create new one`);
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
        ownerId: 'system',
        createdAt: existingRecord ? existingRecord.createdAt.S : now, // Keep original creation time
        createdBy: existingRecord ? existingRecord.createdBy.S : 'installer',
        updatedAt: now, // Always update the timestamp
        updatedBy: 'installer',
        // TableMetadata-specific fields
        typeName: tableConfig.name,
        keySchema: {
          hashKey: 'id' // All our tables use 'id' as primary key
        },
        attributes: tableConfig.allAttributes || tableConfig.attributes.map(attr => ({
          name: attr.AttributeName,
          type: attr.AttributeType,
          required: true
        })),
        status: 'active'
      };

      // Convert to DynamoDB format
      const dynamoItem = this.toDynamoDBFormat(metadata);
      
      // Create temporary file for the item JSON
      const tempDir = mkdtempSync(join(tmpdir(), 'captify-installer-'));
      const tempFile = join(tempDir, 'table-metadata.json');
      
      writeFileSync(tempFile, JSON.stringify(dynamoItem, null, 2));
      
      // Put item in TableMetadata table (this will overwrite if same id)
      const putCommand = `aws dynamodb put-item --table-name ${this.tablePrefix}-core-TableMetadata --item file://${tempFile.replace(/\\/g, '/')} --region ${this.region}`;
      execSync(putCommand);
      
      if (existingRecord) {
        console.log(`  ✅ Updated existing TableMetadata for ${tableConfig.name}`);
      } else {
        console.log(`  ✅ Created new TableMetadata for ${tableConfig.name}`);
      }
      
      // Clean up temp file
      try {
        const fs = await import('fs');
        fs.unlinkSync(tempFile);
        fs.rmdirSync(tempDir);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
    } catch (error) {
      console.error(`⚠️  Warning: Could not save TableMetadata for ${tableConfig.tableName}: ${error.message}`);
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
      if (typeof value === 'string') {
        return { S: value };
      }
      if (typeof value === 'number') {
        return { N: value.toString() };
      }
      if (typeof value === 'boolean') {
        return { BOOL: value };
      }
      if (Array.isArray(value)) {
        return { L: value.map(convert) };
      }
      if (typeof value === 'object') {
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
    return this.currentPackage || 'unknown';
  }

  /**
   * Get category based on package name
   */
  getCategory(packageName) {
    const categoryMap = {
      core: 'administration',
      auth: 'authentication',
      admin: 'administration',
      api: 'integration',
      ui: 'interface'
    };
    return categoryMap[packageName] || 'application';
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
      const typesPath = join(packagePath, 'src', 'types.ts');
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
      const appConfig = await this.updateAppConfiguration(packagePath, packageName, menu);
      
      console.log(`🎉 Successfully installed package: ${packageName}`);
      console.log(`📋 App ID: ${appConfig.appId}`);
      
      return {
        packageName,
        tables,
        menu,
        appConfig
      };
      
    } catch (error) {
      console.error(`❌ Failed to install package ${packageName}: ${error.message}`);
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
      const typesPath = join(packagePath, 'src', 'types.ts');
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
          console.log(`⚠️  Table ${table.tableName} does not exist, skipping...`);
        }
      }
      
      console.log(`✅ Updated TableMetadata for ${updatedCount} tables`);
      
      return {
        packageName,
        tablesProcessed: tables.length,
        metadataUpdated: updatedCount
      };
      
    } catch (error) {
      console.error(`❌ Failed to update TableMetadata for ${packageName}: ${error.message}`);
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
      console.log(`📋 Found items: ${allItems.join(', ')}`);
    } catch (error) {
      console.error(`❌ Error reading packages directory: ${error.message}`);
      return [];
    }

    const packages = allItems.filter(item => {
      if (item.startsWith('.') || item === 'node_modules' || item.endsWith('.js') || item.endsWith('.json')) {
        console.log(`  ⏭️  Skipping ${item} (not a package directory)`);
        return false;
      }
      
      const itemPath = join(this.packagesDir, item);
      try {
        const stats = statSync(itemPath);
        const hasPackageJson = existsSync(join(itemPath, 'package.json'));
        console.log(`  📂 ${item}: isDirectory=${stats.isDirectory()}, hasPackageJson=${hasPackageJson}`);
        return stats.isDirectory() && hasPackageJson;
      } catch (error) {
        console.log(`  ⚠️  Warning: Could not access ${item}: ${error.message}`);
        return false;
      }
    });
    
    console.log('📦 Available packages:');
    packages.forEach(pkg => {
      const packageJsonPath = join(this.packagesDir, pkg, 'package.json');
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        console.log(`  - ${pkg} (${packageJson.description || 'No description'})`);
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
    case 'list':
      installer.listPackages();
      break;
      
    case 'install':
      if (!packageName) {
        console.error('❌ Please provide a package name');
        console.log('Usage: node install.js install <package-name> [--TableMetadata]');
        installer.listPackages();
        process.exit(1);
      }
      
      // Check if --TableMetadata flag is present
      if (flags.includes('--TableMetadata')) {
        installer.updateTableMetadata(packageName)
          .then((result) => {
            console.log(`\n🎉 TableMetadata update complete!`);
            console.log(`📊 Processed ${result.tablesProcessed} tables, updated ${result.metadataUpdated} metadata entries`);
          })
          .catch(error => {
            console.error(`\n❌ TableMetadata update failed: ${error.message}`);
            process.exit(1);
          });
      } else {
        installer.installPackage(packageName)
          .then(() => {
            console.log(`\n🎉 Installation complete!`);
          })
          .catch(error => {
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
