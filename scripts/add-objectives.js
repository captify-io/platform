/**
 * Script to add AFSC Strategic Objectives to DynamoDB
 * Run with: node scripts/add-objectives.js
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

const objectives = [
  {
    "id": "obj-loe1-1",
    "tenantId": "afsc",
    "name": "Deliver On Time and On Cost",
    "slug": "deliver-on-time-and-on-cost",
    "app": "platform",
    "ownerTeam": "Mission Operations",
    "priority": "high",
    "linkedOutcomes": ["outcome-loe1-1a"],
    "metrics": {
      "onTimeDelivery": { "target": 95, "unit": "%", "description": "Percent of depot and logistics operations delivered on or ahead of schedule" },
      "costVariance": { "target": 0, "unit": "%", "description": "Maintain zero cost overrun on production and sustainment" }
    },
    "status": "active",
    "description": "Ensure AFSC missions deliver aircraft, software, and logistics products on schedule and within cost targets.",
    "order": 1
  },
  {
    "id": "obj-loe1-2",
    "tenantId": "afsc",
    "name": "Exercise to Scale",
    "slug": "exercise-to-scale",
    "app": "platform",
    "ownerTeam": "Mission Operations",
    "priority": "medium",
    "linkedOutcomes": ["outcome-loe1-2a"],
    "metrics": {
      "exerciseFrequency": { "target": 2, "unit": "annual", "description": "Number of scaled readiness exercises executed per year" },
      "responseTime": { "target": 10, "unit": "hours", "description": "Average time to deploy support in contested environments" }
    },
    "status": "active",
    "description": "Conduct enterprise-wide readiness and sustainment exercises to validate global operations and scaling capacity.",
    "order": 2
  },
  {
    "id": "obj-loe1-3",
    "tenantId": "afsc",
    "name": "Increase Depot Capability and Capacity to Support All Theaters (GENUS)",
    "slug": "increase-depot-capability-genus",
    "app": "platform",
    "ownerTeam": "Industrial Base",
    "priority": "critical",
    "linkedOutcomes": ["outcome-loe1-3a"],
    "metrics": {
      "forwardNodes": { "target": 5, "unit": "locations", "description": "Number of forward sustainment nodes established under GENUS" },
      "depotThroughput": { "target": 15, "unit": "%", "description": "Percent increase in depot throughput capacity" }
    },
    "status": "active",
    "description": "Expand global sustainment reach through the Global Enterprise Network for Universal Sustainment (GENUS).",
    "order": 3
  },
  {
    "id": "obj-loe2-1",
    "tenantId": "afsc",
    "name": "Develop an Enterprise Recruitment and Talent Management Strategy",
    "slug": "develop-enterprise-recruitment-strategy",
    "app": "platform",
    "ownerTeam": "Human Capital",
    "priority": "high",
    "linkedOutcomes": ["outcome-loe2-1a"],
    "metrics": {
      "criticalSkillFills": { "target": 90, "unit": "%", "description": "Percent of critical-skill positions filled" },
      "candidatePoolGrowth": { "target": 25, "unit": "%", "description": "Growth in enterprise candidate pipeline" }
    },
    "status": "active",
    "description": "Build a unified recruitment and talent ecosystem to attract, hire, and retain world-class Airmen.",
    "order": 4
  },
  {
    "id": "obj-loe2-2",
    "tenantId": "afsc",
    "name": "Leverage Major Stakeholders to Improve and Streamline AFSC Hiring Processes",
    "slug": "streamline-hiring-processes",
    "app": "platform",
    "ownerTeam": "Human Capital",
    "priority": "medium",
    "linkedOutcomes": ["outcome-loe2-2a"],
    "metrics": {
      "avgTimeToHire": { "target": 45, "unit": "days", "description": "Average number of days to complete hiring process" }
    },
    "status": "active",
    "description": "Partner across AFMC and AFPC to accelerate hiring and standardize workforce management practices.",
    "order": 5
  },
  {
    "id": "obj-loe2-3",
    "tenantId": "afsc",
    "name": "Innovate, Design, and Deliver Training for Next Generation Workforce",
    "slug": "next-generation-training",
    "app": "platform",
    "ownerTeam": "Human Capital",
    "priority": "critical",
    "linkedOutcomes": ["outcome-loe2-3a"],
    "metrics": {
      "trainingCompletion": { "target": 90, "unit": "%", "description": "Percentage of employees completing new-gen digital training" },
      "digitalProficiencyIndex": { "target": 75, "unit": "%", "description": "Percent of workforce proficient in digital/AI tools" }
    },
    "status": "active",
    "description": "Develop and deploy competency-based training aligned to evolving digital sustainment needs.",
    "order": 6
  },
  {
    "id": "obj-loe2-4",
    "tenantId": "afsc",
    "name": "Develop a Comprehensive Employee Retention Plan",
    "slug": "employee-retention-plan",
    "app": "platform",
    "ownerTeam": "Human Capital",
    "priority": "medium",
    "linkedOutcomes": ["outcome-loe2-4a"],
    "metrics": {
      "attritionRate": { "target": 8, "unit": "%", "description": "Target annual attrition rate" },
      "retentionIncentives": { "target": 200, "unit": "count", "description": "Number of retention incentive actions executed" }
    },
    "status": "active",
    "description": "Implement data-driven retention and workforce flexibility strategies to sustain a high-skill team.",
    "order": 7
  },
  {
    "id": "obj-loe2-5",
    "tenantId": "afsc",
    "name": "Optimize In-Person Work",
    "slug": "optimize-in-person-work",
    "app": "platform",
    "ownerTeam": "Human Capital",
    "priority": "low",
    "linkedOutcomes": ["outcome-loe2-5a"],
    "metrics": {
      "onSiteEffectiveness": { "target": 90, "unit": "%", "description": "Employee satisfaction with hybrid/in-person model" }
    },
    "status": "active",
    "description": "Define hybrid work standards and collaboration metrics to balance mission performance and flexibility.",
    "order": 8
  },
  {
    "id": "obj-loe3-1",
    "tenantId": "afsc",
    "name": "Increase Inventory",
    "slug": "increase-inventory",
    "app": "platform",
    "ownerTeam": "Supply Chain",
    "priority": "critical",
    "linkedOutcomes": ["outcome-loe3-1a"],
    "metrics": {
      "inventoryFillRate": { "target": 95, "unit": "%", "description": "Percent of critical inventory positions filled" },
      "stockoutRate": { "target": 2, "unit": "%", "description": "Percent of stockouts reduced" }
    },
    "status": "active",
    "description": "Increase available inventory and accuracy to improve readiness while balancing cost efficiency.",
    "order": 9
  },
  {
    "id": "obj-loe3-2",
    "tenantId": "afsc",
    "name": "Streamline Acquisition Processes and Expand Buying Power",
    "slug": "streamline-acquisition-processes",
    "app": "platform",
    "ownerTeam": "Supply Chain",
    "priority": "high",
    "linkedOutcomes": ["outcome-loe3-2a"],
    "metrics": {
      "procurementCycleTime": { "target": 15, "unit": "%", "description": "Reduction in average procurement cycle time" }
    },
    "status": "active",
    "description": "Simplify and standardize acquisition workflows to accelerate part procurement and contracting.",
    "order": 10
  },
  {
    "id": "obj-loe3-3",
    "tenantId": "afsc",
    "name": "Expand the Commercial and Organic Supplier Base",
    "slug": "expand-supplier-base",
    "app": "platform",
    "ownerTeam": "Supply Chain",
    "priority": "high",
    "linkedOutcomes": ["outcome-loe3-3a"],
    "metrics": {
      "supplierGrowth": { "target": 20, "unit": "%", "description": "Increase in active suppliers" },
      "smallBusinessParticipation": { "target": 25, "unit": "%", "description": "Percent of spend with small business suppliers" }
    },
    "status": "active",
    "description": "Diversify supplier ecosystem to reduce dependency and increase supply resilience.",
    "order": 11
  },
  {
    "id": "obj-loe3-4",
    "tenantId": "afsc",
    "name": "Repair Network Management Optimization",
    "slug": "repair-network-optimization",
    "app": "platform",
    "ownerTeam": "Supply Chain",
    "priority": "critical",
    "linkedOutcomes": ["outcome-loe3-4a"],
    "metrics": {
      "repairCycleTime": { "target": 20, "unit": "%", "description": "Reduction in average repair cycle time" },
      "utilizationRate": { "target": 85, "unit": "%", "description": "Network utilization efficiency" }
    },
    "status": "active",
    "description": "Integrate predictive analytics into repair network management for efficiency and readiness gains.",
    "order": 12
  },
  {
    "id": "obj-loe3-5",
    "tenantId": "afsc",
    "name": "Implement FY22 NDAA Section 142",
    "slug": "implement-ndaa-section-142",
    "app": "platform",
    "ownerTeam": "Supply Chain Risk Management",
    "priority": "high",
    "linkedOutcomes": ["outcome-loe3-5a"],
    "metrics": {
      "complianceScore": { "target": 100, "unit": "%", "description": "Percent compliance with NDAA Section 142" }
    },
    "status": "active",
    "description": "Embed SCRM standards and transparency into acquisition and supplier oversight processes.",
    "order": 13
  },
  {
    "id": "obj-loe4-1",
    "tenantId": "afsc",
    "name": "Develop Integrated and Aligned OIB Investment Optimization Plan",
    "slug": "oib-investment-optimization",
    "app": "platform",
    "ownerTeam": "Industrial Base",
    "priority": "critical",
    "linkedOutcomes": ["outcome-loe4-1a"],
    "metrics": {
      "capitalInvestment": { "target": 8, "unit": "%", "description": "Annual reinvestment in depot modernization (as % of revenue)" }
    },
    "status": "active",
    "description": "Develop an enterprise-wide Organic Industrial Base investment plan to optimize infrastructure and capabilities.",
    "order": 14
  },
  {
    "id": "obj-loe4-2",
    "tenantId": "afsc",
    "name": "Develop and Deploy a Scalable and Secure AFSC Digital Ecosystem",
    "slug": "develop-digital-ecosystem",
    "app": "platform",
    "ownerTeam": "Industrial Base / IT",
    "priority": "critical",
    "linkedOutcomes": ["outcome-loe4-2a"],
    "metrics": {
      "digitalIntegrationScore": { "target": 90, "unit": "%", "description": "Percent of systems integrated into digital ecosystem" }
    },
    "status": "active",
    "description": "Digitally connect depots, supply chains, and software directorates into a unified, secure digital ecosystem.",
    "order": 15
  },
  {
    "id": "obj-loe4-3",
    "tenantId": "afsc",
    "name": "Deploy MRO/MRO-S",
    "slug": "deploy-mro-mros",
    "app": "platform",
    "ownerTeam": "Industrial Base / IT",
    "priority": "high",
    "linkedOutcomes": ["outcome-loe4-3a"],
    "metrics": {
      "systemUptime": { "target": 99.9, "unit": "%", "description": "System uptime for MRO/MRO-S platform" },
      "userAdoption": { "target": 85, "unit": "%", "description": "Percent of functional users onboarded" }
    },
    "status": "active",
    "description": "Deploy modernized Maintenance, Repair, and Overhaul (MRO/MRO-S) systems to standardize execution and enable digital sustainment.",
    "order": 16
  }
];

async function addObjectives() {
  const tableName = "core-Objective";
  const timestamp = new Date().toISOString();

  console.log(`Adding ${objectives.length} objectives to ${tableName}...`);

  let successCount = 0;
  let failureCount = 0;

  for (const objective of objectives) {
    try {
      // Add timestamps
      const item = {
        ...objective,
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: "system",
        updatedBy: "system"
      };

      const command = new PutCommand({
        TableName: tableName,
        Item: item
      });

      await docClient.send(command);
      successCount++;
      console.log(`✓ Added: ${objective.name} (${objective.id})`);
    } catch (error) {
      failureCount++;
      console.error(`✗ Failed to add ${objective.name}:`, error.message);
    }
  }

  console.log(`\nComplete: ${successCount} succeeded, ${failureCount} failed`);
}

addObjectives()
  .then(() => {
    console.log("\nAll objectives processed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
