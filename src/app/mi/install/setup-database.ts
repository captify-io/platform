import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  ScalarAttributeType,
  KeyType,
  ProjectionType,
  BillingMode,
  StreamViewType,
} from "@aws-sdk/client-dynamodb";
import { miSeedGenerator } from "./seed-data";

class MIDatabaseSetup {
  private dynamodb: DynamoDBClient;
  private tableName: string;

  constructor() {
    this.dynamodb = new DynamoDBClient({
      region: process.env.REGION || "us-east-1",
      ...(process.env.NODE_ENV === "development" && {
        endpoint: "http://localhost:8000", // For DynamoDB Local
        credentials: {
          accessKeyId: "fake",
          secretAccessKey: "fake",
        },
      }),
    });
    this.tableName = process.env.MI_DYNAMODB_TABLE || "MI-Graph-Dev";
  }

  async createTable(): Promise<void> {
    console.log(`Creating table: ${this.tableName}`);

    const createTableParams = {
      TableName: this.tableName,
      KeySchema: [
        { AttributeName: "pk", KeyType: KeyType.HASH },
        { AttributeName: "sk", KeyType: KeyType.RANGE },
      ],
      AttributeDefinitions: [
        { AttributeName: "pk", AttributeType: ScalarAttributeType.S },
        { AttributeName: "sk", AttributeType: ScalarAttributeType.S },
        { AttributeName: "gsi1pk", AttributeType: ScalarAttributeType.S },
        { AttributeName: "gsi1sk", AttributeType: ScalarAttributeType.S },
        { AttributeName: "gsi2pk", AttributeType: ScalarAttributeType.S },
        { AttributeName: "gsi2sk", AttributeType: ScalarAttributeType.S },
        { AttributeName: "gsi3pk", AttributeType: ScalarAttributeType.S },
        { AttributeName: "gsi3sk", AttributeType: ScalarAttributeType.S },
        { AttributeName: "gsi4pk", AttributeType: ScalarAttributeType.S },
        { AttributeName: "gsi4sk", AttributeType: ScalarAttributeType.S },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "GSI1",
          KeySchema: [
            { AttributeName: "gsi1pk", KeyType: KeyType.HASH },
            { AttributeName: "gsi1sk", KeyType: KeyType.RANGE },
          ],
          Projection: { ProjectionType: ProjectionType.ALL },
          BillingMode: BillingMode.PAY_PER_REQUEST,
        },
        {
          IndexName: "GSI2",
          KeySchema: [
            { AttributeName: "gsi2pk", KeyType: KeyType.HASH },
            { AttributeName: "gsi2sk", KeyType: KeyType.RANGE },
          ],
          Projection: { ProjectionType: ProjectionType.ALL },
          BillingMode: BillingMode.PAY_PER_REQUEST,
        },
        {
          IndexName: "GSI3",
          KeySchema: [
            { AttributeName: "gsi3pk", KeyType: KeyType.HASH },
            { AttributeName: "gsi3sk", KeyType: KeyType.RANGE },
          ],
          Projection: { ProjectionType: ProjectionType.ALL },
          BillingMode: BillingMode.PAY_PER_REQUEST,
        },
        {
          IndexName: "GSI4",
          KeySchema: [
            { AttributeName: "gsi4pk", KeyType: KeyType.HASH },
            { AttributeName: "gsi4sk", KeyType: KeyType.RANGE },
          ],
          Projection: { ProjectionType: ProjectionType.ALL },
          BillingMode: BillingMode.PAY_PER_REQUEST,
        },
      ],
      BillingMode: BillingMode.PAY_PER_REQUEST,
      StreamSpecification: {
        StreamEnabled: true,
        StreamViewType: StreamViewType.NEW_AND_OLD_IMAGES,
      },
    };

    try {
      await this.dynamodb.send(new CreateTableCommand(createTableParams));
      console.log(`Table ${this.tableName} created successfully`);

      // Wait for table to be active
      await this.waitForTableActive();
    } catch (error: unknown) {
      const err = error as Error & { name?: string };
      if (err.name === "ResourceInUseException") {
        console.log(`Table ${this.tableName} already exists`);
      } else {
        throw error;
      }
    }
  }

  private async waitForTableActive(): Promise<void> {
    console.log("Waiting for table to become active...");
    let isActive = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!isActive && attempts < maxAttempts) {
      try {
        const response = await this.dynamodb.send(
          new DescribeTableCommand({ TableName: this.tableName })
        );

        if (response.Table?.TableStatus === "ACTIVE") {
          isActive = true;
          console.log("Table is now active");
        } else {
          console.log(
            `Table status: ${response.Table?.TableStatus}, waiting...`
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
          attempts++;
        }
      } catch (error) {
        console.error("Error checking table status:", error);
        break;
      }
    }

    if (!isActive) {
      throw new Error("Table did not become active within expected time");
    }
  }

  async seedData(): Promise<void> {
    console.log("Starting data seeding...");
    await miSeedGenerator.generateB52HDemoData();
    console.log("Data seeding completed");
  }

  async setupMIDatabase(): Promise<void> {
    try {
      console.log("=== MI Database Setup Starting ===");

      // Step 1: Create table
      await this.createTable();

      // Step 2: Seed data
      await this.seedData();

      console.log("=== MI Database Setup Complete ===");
      console.log("");
      console.log("Next steps:");
      console.log("1. Start the dev server: npm run dev");
      console.log(
        "2. Navigate to: http://localhost:3000/mi#bom-explorer?part=332311h&aircraft=b-52"
      );
      console.log(
        "3. View the Advanced Forecast: http://localhost:3000/mi#advanced-forecast"
      );
      console.log("");
    } catch (error) {
      console.error("Setup failed:", error);
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  const setup = new MIDatabaseSetup();
  setup.setupMIDatabase().catch(console.error);
}

export { MIDatabaseSetup };
