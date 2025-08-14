/**
 * Script to populate advanced forecast seed data
 * Run this to add RISK_FORECAST and related data to mi-bom-graph table
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { AdvancedForecastSeedGenerator } from "./advanced-forecast-seeds";

async function runAdvancedForecastSeeding() {
  console.log("🚀 Starting Advanced Forecast Seed Data Generation");

  try {
    // Create DynamoDB clients
    const dynamoClient = new DynamoDBClient({
      region: process.env.REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
      },
    });

    const docClient = DynamoDBDocumentClient.from(dynamoClient);
    const tableName = process.env.MI_DYNAMODB_TABLE || "mi-bom-graph";

    console.log(`📊 Target table: ${tableName}`);

    // Create seed generator
    const seedGenerator = new AdvancedForecastSeedGenerator(
      docClient,
      tableName
    );

    // Generate and write all seed data
    await seedGenerator.generateAndWriteAll();

    console.log(
      "🎉 Advanced forecast seed data generation completed successfully!"
    );
  } catch (error) {
    console.error("❌ Advanced forecast seed data generation failed:", error);
    process.exit(1);
  }
}

// Run the seeding
runAdvancedForecastSeeding();
