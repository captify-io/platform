#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CaptifyAppInstaller {
  constructor() {
    this.templatesDir = join(__dirname, "..", "templates");
    this.region = process.env.AWS_REGION || "us-east-1";
    this.tableName = "captify-core-App";
  }

  /**
   * Load a template file
   */
  loadTemplate(templateName) {
    const templatePath = join(this.templatesDir, `${templateName}.json`);
    if (!existsSync(templatePath)) {
      throw new Error(`Template ${templateName} not found at ${templatePath}`);
    }
    return JSON.parse(readFileSync(templatePath, "utf8"));
  }

  /**
   * Replace template variables with actual values
   */
  processTemplate(template, variables) {
    let content = JSON.stringify(template, null, 2);

    // Replace all template variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      content = content.replace(regex, value);
    }

    return JSON.parse(content);
  }

  /**
   * Convert JSON to DynamoDB format
   */
  toDynamoDBFormat(item) {
    const convertValue = (value) => {
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
        return { L: value.map(convertValue) };
      }

      if (typeof value === "object") {
        const converted = {};
        for (const [k, v] of Object.entries(value)) {
          converted[k] = convertValue(v);
        }
        return { M: converted };
      }

      return { S: value.toString() };
    };

    const dynamoItem = {};
    for (const [key, value] of Object.entries(item)) {
      dynamoItem[key] = convertValue(value);
    }

    return dynamoItem;
  }

  /**
   * Generate AWS CLI command to put item in DynamoDB
   */
  generatePutItemCommand(item) {
    const dynamoItem = this.toDynamoDBFormat(item);
    const itemJson = JSON.stringify(dynamoItem);

    return `aws dynamodb put-item --table-name ${this.tableName} --item '${itemJson}' --region ${this.region}`;
  }

  /**
   * Generate AWS CLI command to delete item from DynamoDB
   */
  generateDeleteItemCommand(appId) {
    return `aws dynamodb delete-item --table-name ${this.tableName} --key '{"appId":{"S":"${appId}"}}' --region ${this.region}`;
  }

  /**
   * Install an app from template
   */
  async installApp(templateName, variables = {}) {
    console.log(`🚀 Installing app from template: ${templateName}`);

    try {
      // Load template
      const template = this.loadTemplate(templateName);

      // Set default variables
      const defaultVariables = {
        APP_ID: uuidv4(),
        CREATED_AT: new Date().toISOString(),
        UPDATED_AT: new Date().toISOString(),
        BEDROCK_AGENT_ID: process.env.BEDROCK_AGENT_ID || "${BEDROCK_AGENT_ID}",
        BEDROCK_AGENT_ALIAS_ID:
          process.env.BEDROCK_AGENT_ALIAS_ID || "${BEDROCK_AGENT_ALIAS_ID}",
      };

      const finalVariables = { ...defaultVariables, ...variables };

      // Process template
      const processedApp = this.processTemplate(template, finalVariables);

      // Generate AWS CLI command
      const command = this.generatePutItemCommand(processedApp);

      console.log(`✅ Generated app configuration:`);
      console.log(JSON.stringify(processedApp, null, 2));
      console.log(`\n📋 AWS CLI Command:`);
      console.log(command);

      // Save processed app to file
      const outputPath = join(
        __dirname,
        "..",
        "output",
        `${processedApp.slug}-app.json`
      );
      writeFileSync(outputPath, JSON.stringify(processedApp, null, 2));
      console.log(`💾 Saved processed app to: ${outputPath}`);

      return {
        app: processedApp,
        command,
      };
    } catch (error) {
      console.error(`❌ Error installing app: ${error.message}`);
      throw error;
    }
  }

  /**
   * List available templates
   */
  listTemplates() {
    const fs = require("fs");
    const templates = fs
      .readdirSync(this.templatesDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(".json", ""));

    console.log("📋 Available templates:");
    templates.forEach((template) => {
      console.log(`  - ${template}`);
    });

    return templates;
  }

  /**
   * Deploy app to AWS
   */
  async deployApp(appOrCommand) {
    const { execSync } = require("child_process");

    try {
      const command =
        typeof appOrCommand === "string"
          ? appOrCommand
          : this.generatePutItemCommand(appOrCommand);

      console.log(`🚀 Deploying app to AWS...`);
      console.log(`📋 Command: ${command}`);

      const result = execSync(command, { encoding: "utf8" });
      console.log(`✅ App deployed successfully!`);
      console.log(result);

      return result;
    } catch (error) {
      console.error(`❌ Error deploying app: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove app from AWS
   */
  async removeApp(appId) {
    const { execSync } = require("child_process");

    try {
      const command = this.generateDeleteItemCommand(appId);

      console.log(`🗑️  Removing app ${appId} from AWS...`);
      console.log(`📋 Command: ${command}`);

      const result = execSync(command, { encoding: "utf8" });
      console.log(`✅ App removed successfully!`);
      console.log(result);

      return result;
    } catch (error) {
      console.error(`❌ Error removing app: ${error.message}`);
      throw error;
    }
  }

  /**
   * Backup current apps from AWS
   */
  async backupApps() {
    const { execSync } = require("child_process");

    try {
      console.log(`💾 Backing up current apps from AWS...`);

      const command = `aws dynamodb scan --table-name ${this.tableName} --region ${this.region}`;
      const result = execSync(command, { encoding: "utf8" });
      const data = JSON.parse(result);

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = join(
        __dirname,
        "..",
        "backups",
        `apps-backup-${timestamp}.json`
      );

      // Ensure backups directory exists
      const fs = require("fs");
      const backupsDir = join(__dirname, "..", "backups");
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }

      writeFileSync(backupPath, JSON.stringify(data, null, 2));
      console.log(`✅ Apps backed up to: ${backupPath}`);

      return backupPath;
    } catch (error) {
      console.error(`❌ Error backing up apps: ${error.message}`);
      throw error;
    }
  }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const installer = new CaptifyAppInstaller();
  const command = process.argv[2];

  switch (command) {
    case "list":
      installer.listTemplates();
      break;

    case "install":
      const templateName = process.argv[3];
      if (!templateName) {
        console.error("❌ Please provide a template name");
        console.log("Usage: node installer.js install <template-name>");
        process.exit(1);
      }

      // Parse additional variables from command line
      const variables = {};
      for (let i = 4; i < process.argv.length; i += 2) {
        if (process.argv[i] && process.argv[i + 1]) {
          const key = process.argv[i].replace("--", "");
          variables[key] = process.argv[i + 1];
        }
      }

      installer
        .installApp(templateName, variables)
        .then((result) => {
          console.log(`\n🎉 Installation complete!`);
          console.log(`\n📋 To deploy to AWS, run:`);
          console.log(`${result.command}`);
        })
        .catch((error) => process.exit(1));
      break;

    case "deploy":
      const deployTemplate = process.argv[3];
      if (!deployTemplate) {
        console.error("❌ Please provide a template name");
        console.log("Usage: node installer.js deploy <template-name>");
        process.exit(1);
      }

      installer
        .installApp(deployTemplate)
        .then((result) => installer.deployApp(result.command))
        .then(() => console.log(`\n🎉 Deployment complete!`))
        .catch((error) => process.exit(1));
      break;

    case "backup":
      installer
        .backupApps()
        .then(() => console.log(`\n🎉 Backup complete!`))
        .catch((error) => process.exit(1));
      break;

    case "remove":
      const appId = process.argv[3];
      if (!appId) {
        console.error("❌ Please provide an app ID");
        console.log("Usage: node installer.js remove <app-id>");
        process.exit(1);
      }

      installer
        .removeApp(appId)
        .then(() => console.log(`\n🎉 Removal complete!`))
        .catch((error) => process.exit(1));
      break;

    default:
      console.log(`
🚀 Captify App Installer

Usage:
  node installer.js list                           - List available templates
  node installer.js install <template> [options]  - Install app from template
  node installer.js deploy <template>             - Install and deploy app
  node installer.js backup                        - Backup current apps
  node installer.js remove <app-id>               - Remove app by ID

Options for install:
  --APP_NAME "My App"                             - Set app name
  --APP_SLUG "my-app"                             - Set app slug
  --APP_DESCRIPTION "My app description"          - Set description
  --APP_CATEGORY "category"                       - Set category
  --APP_ICON "icon-name"                          - Set icon

Examples:
  node installer.js list
  node installer.js install app-template --APP_NAME "My Custom App" --APP_SLUG "custom-app"
  node installer.js deploy core-app
  node installer.js backup
      `);
  }
}

export default CaptifyAppInstaller;
