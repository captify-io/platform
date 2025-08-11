import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  BOMNode,
  BOMEdge,
  AlternateGroup,
  Supersession,
  Effectivity,
  Installation,
  SupplierLink,
  DocumentReference,
  ForecastData,
  WorkbenchIssue,
  WorkbenchTask,
  WorkbenchDecision,
  ContentBlock,
} from "../../../src/types/mi";

export class MISeedDataGenerator {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || "us-east-1",
      ...(process.env.NODE_ENV === "development" && {
        endpoint: "http://localhost:8000",
        credentials: {
          accessKeyId: "fake",
          secretAccessKey: "fake",
        },
      }),
    });

    this.docClient = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = process.env.MI_DYNAMODB_TABLE || "mi-bom-graph";
  }

  private async generateId(prefix: string): Promise<string> {
    return `${prefix}${Math.random().toString(36).substr(2, 9)}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async batchWrite(items: any[]): Promise<void> {
    // Split into batches of 25 (DynamoDB limit)
    const batches: any[][] = [];
    for (let i = 0; i < items.length; i += 25) {
      batches.push(items.slice(i, i + 25));
    }

    for (const batch of batches) {
      const putRequests = batch.map((item: any) => ({
        PutRequest: { Item: item },
      }));

      await this.docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [this.tableName]: putRequests,
          },
        })
      );
    }
  }

  private async createNode(
    node: Omit<BOMNode, "created_at" | "updated_at">
  ): Promise<BOMNode> {
    const timestamp = new Date().toISOString();
    const fullNode: BOMNode = {
      ...node,
      created_at: timestamp,
      updated_at: timestamp,
    };

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: fullNode,
      })
    );

    return fullNode;
  }

  private async createForecast(forecast: ForecastData): Promise<void> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: forecast,
      })
    );
  }

  private async createIssue(
    issue: Omit<WorkbenchIssue, "created_at" | "updated_at">
  ): Promise<WorkbenchIssue> {
    const timestamp = new Date().toISOString();
    const fullIssue: WorkbenchIssue = {
      ...issue,
      created_at: timestamp,
      updated_at: timestamp,
    };

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: fullIssue,
      })
    );

    return fullIssue;
  }

  async generateB52HDemoData(): Promise<void> {
    console.log("🚀 Starting B-52H demo data generation...");

    try {
      // 1. Create Aircraft Root
      const aircraft = await this.createAircraftNode();

      // 2. Create Engine System
      const engineSystem = await this.createEngineSystem(aircraft.pk);

      // 3. Create Combustion Section
      const combustionSection = await this.createCombustionSection(
        engineSystem.pk
      );

      // 4. Create Critical Component (Combustion Module)
      const combustionModule = await this.createCombustionModule(
        combustionSection.pk
      );

      // 5. Create Sub-components
      await this.createSubComponents(combustionModule.pk);

      // 6. Create Suppliers
      await this.createSuppliers(combustionModule.pk);

      // 7. Create Alternates
      await this.createAlternates(combustionModule.pk);

      // 8. Create Supersession
      await this.createSupersession();

      // 9. Create Tail and Installations
      await this.createTailInstallations(combustionModule.pk);

      // 10. Create Technical Orders
      await this.createTechnicalOrders(combustionModule.pk);

      // 11. Create Forecast Data
      await this.createForecastData();

      // 12. Create Workbench Issue
      await this.createWorkbenchIssue(combustionModule.pk);

      // 13. Create Content Blocks
      await this.createContentBlocks();

      console.log("✅ B-52H demo data generation completed successfully!");
      console.log("");
      console.log("📊 Demo data includes:");
      console.log(
        "   • Aircraft hierarchy (B-52H → TF33 → Combustion Section → Combustion Module)"
      );
      console.log("   • 3 suppliers with performance metrics");
      console.log("   • Alternative parts and supersession chains");
      console.log("   • 3 tail installations with effectivity");
      console.log("   • Technical documentation references");
      console.log("   • Advanced forecast predictions");
      console.log("   • Critical MICAP workbench issue");
      console.log("   • Content blocks for dashboard");
      console.log("");
    } catch (error) {
      console.error("❌ Error generating demo data:", error);
      throw error;
    }
  }

  private async createAircraftNode(): Promise<BOMNode> {
    const aircraft: Omit<BOMNode, "created_at" | "updated_at"> = {
      pk: "NODE#aircraft:B-52H",
      sk: "META",
      type: "META",
      entity: "Aircraft",
      name: "B-52H Stratofortress",
      wbs: "1.0",
      level: 0,
      attrs: {
        designation: "B-52H",
        manufacturer: "Boeing",
        firstFlight: "1961-03-06",
        status: "Active",
        totalProduced: 102,
      },
      version: "bom-2025.08.09",
      valid_from: "2025-01-01",
      is_current: true,
      hash: "sha256:aircraft-b52h-hash",
      riskScore: 0.23,
    };

    return await this.createNode(aircraft);
  }

  private async createEngineSystem(aircraftId: string): Promise<BOMNode> {
    const engine: Omit<BOMNode, "created_at" | "updated_at"> = {
      pk: "NODE#system:TF33-ENGINE",
      sk: "META",
      type: "META",
      entity: "System",
      name: "TF33-P-3/103 Turbofan Engine",
      wbs: "1.1",
      level: 1,
      attrs: {
        designation: "TF33-P-3",
        manufacturer: "Pratt & Whitney",
        thrust: "17000 lbf",
        quantity: 8,
        location: "Wing mounted",
      },
      version: "bom-2025.08.09",
      valid_from: "2025-01-01",
      is_current: true,
      hash: "sha256:tf33-engine-hash",
      riskScore: 0.45,
      gsi1pk: aircraftId,
      gsi1sk: "CHILD#system:TF33-ENGINE",
    };

    const engineNode = await this.createNode(engine);

    // Create edge from aircraft to engine
    const edge: BOMEdge = {
      pk: aircraftId,
      sk: "EDGE#HAS_PART#system:TF33-ENGINE",
      type: "EDGE",
      edge: "HAS_PART",
      parentId: aircraftId,
      childId: engine.pk,
      qtyPerParent: 8,
      valid_from: "2025-01-01",
      is_current: true,
      version: "bom-2025.08.09",
    };

    await this.batchWrite([edge]);
    return engineNode;
  }

  private async createCombustionSection(engineId: string): Promise<BOMNode> {
    const combustion: Omit<BOMNode, "created_at" | "updated_at"> = {
      pk: "NODE#assembly:COMBUSTION-SECTION",
      sk: "META",
      type: "META",
      entity: "Assembly",
      name: "Combustion Section Assembly",
      wbs: "1.1.1",
      level: 2,
      attrs: {
        partNumber: "CS-TF33-001",
        material: "Inconel 718",
        operatingTemp: "2000°F",
        criticalComponent: true,
      },
      version: "bom-2025.08.09",
      valid_from: "2025-01-01",
      is_current: true,
      hash: "sha256:combustion-section-hash",
      riskScore: 0.67,
      gsi1pk: engineId,
      gsi1sk: "CHILD#assembly:COMBUSTION-SECTION",
    };

    const combustionNode = await this.createNode(combustion);

    // Create edge from engine to combustion section
    const edge: BOMEdge = {
      pk: engineId,
      sk: "EDGE#HAS_PART#assembly:COMBUSTION-SECTION",
      type: "EDGE",
      edge: "HAS_PART",
      parentId: engineId,
      childId: combustion.pk,
      qtyPerParent: 1,
      valid_from: "2025-01-01",
      is_current: true,
      version: "bom-2025.08.09",
    };

    await this.batchWrite([edge]);
    return combustionNode;
  }

  private async createCombustionModule(
    combustionSectionId: string
  ): Promise<BOMNode> {
    const module: Omit<BOMNode, "created_at" | "updated_at"> = {
      pk: "NODE#nsn:2840-00-123-4567",
      sk: "META",
      type: "META",
      entity: "Part",
      name: "Combustion Module",
      wbs: "1.1.1.1",
      level: 3,
      attrs: {
        nsn: "2840-00-123-4567",
        partNumber: "CM-TF33-4567",
        manufacturer: "Pratt & Whitney",
        condition: "Serviceable",
        unitOfMeasure: "EA",
        weight: "125 lbs",
        criticalSafetyItem: true,
        flightSafetyPart: true,
      },
      version: "bom-2025.08.09",
      valid_from: "2025-01-01",
      is_current: true,
      hash: "sha256:combustion-module-hash",
      riskScore: 0.86, // Critical risk
      costImpact: 2100000, // $2.1M mission impact
      gsi1pk: combustionSectionId,
      gsi1sk: "CHILD#nsn:2840-00-123-4567",
    };

    const moduleNode = await this.createNode(module);

    // Create edge from combustion section to module
    const edge: BOMEdge = {
      pk: combustionSectionId,
      sk: "EDGE#HAS_PART#nsn:2840-00-123-4567",
      type: "EDGE",
      edge: "HAS_PART",
      parentId: combustionSectionId,
      childId: module.pk,
      qtyPerParent: 1,
      valid_from: "2025-01-01",
      is_current: true,
      version: "bom-2025.08.09",
    };

    await this.batchWrite([edge]);
    return moduleNode;
  }

  private async createSubComponents(moduleId: string): Promise<void> {
    const subComponents = [
      {
        pk: "NODE#nsn:2915-00-456-7890",
        name: "Fuel Nozzle Assembly",
        wbs: "1.1.1.1.1",
        riskScore: 0.74,
        costImpact: 890000,
      },
      {
        pk: "NODE#nsn:2840-00-567-8901",
        name: "Ignition System",
        wbs: "1.1.1.1.2",
        riskScore: 0.52,
        costImpact: 650000,
      },
      {
        pk: "NODE#nsn:4820-00-789-0123",
        name: "Control Valve",
        wbs: "1.1.1.1.3",
        riskScore: 0.68,
        costImpact: 1200000,
      },
    ];

    const nodes = subComponents.map((comp) => ({
      ...comp,
      sk: "META",
      type: "META" as const,
      entity: "Part" as const,
      level: 4,
      attrs: {
        nsn: comp.pk.split(":")[1],
        partNumber: `PN-${comp.pk.split(":")[1]}`,
        manufacturer: "Various",
      },
      version: "bom-2025.08.09",
      valid_from: "2025-01-01",
      is_current: true,
      hash: `sha256:${comp.pk}-hash`,
      gsi1pk: moduleId,
      gsi1sk: `CHILD#${comp.pk}`,
    }));

    const edges = subComponents.map((comp) => ({
      pk: moduleId,
      sk: `EDGE#HAS_PART#${comp.pk}`,
      type: "EDGE" as const,
      edge: "HAS_PART" as const,
      parentId: moduleId,
      childId: comp.pk,
      qtyPerParent: 1,
      valid_from: "2025-01-01",
      is_current: true,
      version: "bom-2025.08.09",
    }));

    await this.batchWrite([...nodes, ...edges]);
  }

  private async createSuppliers(moduleId: string): Promise<void> {
    const suppliers = [
      {
        supplierId: "cage:1AB23",
        name: "Primary Aerospace Corp",
        leadDays: 62,
        otifPct: 0.82,
        escapes12m: 3,
        unitCost: 18420.0,
        status: "problematic",
      },
      {
        supplierId: "cage:7XY89",
        name: "Alternate Manufacturing Inc",
        leadDays: 18,
        otifPct: 0.94,
        escapes12m: 1,
        unitCost: 21183.0,
        status: "recommended",
      },
      {
        supplierId: "cage:2CD45",
        name: "Reliable Parts LLC",
        leadDays: 35,
        otifPct: 0.91,
        escapes12m: 2,
        unitCost: 18850.0,
        status: "backup",
      },
    ];

    const supplierLinks = suppliers.map((supplier) => ({
      pk: moduleId,
      sk: `SUPPLY#SUPPLIER#${supplier.supplierId}`,
      type: "SUPPLY" as const,
      supplierId: supplier.supplierId,
      metrics: {
        leadDays: supplier.leadDays,
        otifPct: supplier.otifPct,
        escapes12m: supplier.escapes12m,
        unitCost: supplier.unitCost,
      },
      valid_from: "2025-06-01",
      is_current: true,
      gsi3pk: supplier.supplierId,
      gsi3sk: `PART#${moduleId}#curr`,
    }));

    await this.batchWrite(supplierLinks);
  }

  private async createAlternates(moduleId: string): Promise<void> {
    const alternateGroup: AlternateGroup = {
      pk: "ALTGROUP#7842",
      sk: `MEMBER#${moduleId}`,
      type: "ALT",
      groupId: "7842",
      memberId: moduleId,
      rank: 1,
      constraints: { form: "=", fit: "±", function: "=" },
      valid_from: "2024-01-01",
      is_current: true,
    };

    const alternateNode: Omit<BOMNode, "created_at" | "updated_at"> = {
      pk: "NODE#nsn:2840-00-987-6543",
      sk: "META",
      type: "META",
      entity: "Part",
      name: "Combustion Module (Alternate)",
      wbs: "1.1.1.1",
      level: 3,
      attrs: {
        nsn: "2840-00-987-6543",
        partNumber: "CM-TF33-ALT-6543",
        manufacturer: "General Electric",
        alternateFor: moduleId,
      },
      version: "bom-2025.08.09",
      valid_from: "2024-01-01",
      is_current: true,
      hash: "sha256:combustion-module-alt-hash",
      riskScore: 0.34,
    };

    const alternateGroupMember: AlternateGroup = {
      pk: "ALTGROUP#7842",
      sk: "MEMBER#nsn:2840-00-987-6543",
      type: "ALT",
      groupId: "7842",
      memberId: "NODE#nsn:2840-00-987-6543",
      rank: 2,
      constraints: { form: "=", fit: "±", function: "=" },
      valid_from: "2024-01-01",
      is_current: true,
    };

    await this.createNode(alternateNode);
    await this.batchWrite([alternateGroup, alternateGroupMember]);
  }

  private async createSupersession(): Promise<void> {
    const oldPart: Omit<BOMNode, "created_at" | "updated_at"> = {
      pk: "NODE#nsn:2840-00-111-2222",
      sk: "META",
      type: "META",
      entity: "Part",
      name: "Combustion Module (Obsolete)",
      wbs: "1.1.1.1",
      level: 3,
      attrs: {
        nsn: "2840-00-111-2222",
        partNumber: "CM-TF33-OLD-2222",
        status: "Obsolete",
      },
      version: "bom-2024.01.01",
      valid_from: "2020-01-01",
      valid_to: "2023-11-01",
      is_current: false,
      hash: "sha256:old-combustion-module-hash",
      riskScore: 0.95,
    };

    const supersession: Supersession = {
      pk: "NODE#nsn:2840-00-111-2222",
      sk: "SUPERSESSION#nsn:2840-00-123-4567",
      type: "SUPERSESSION",
      oldId: "NODE#nsn:2840-00-111-2222",
      newId: "NODE#nsn:2840-00-123-4567",
      reason: "DMSMS",
      valid_from: "2023-11-01",
      is_current: true,
    };

    await this.createNode(oldPart);
    await this.batchWrite([supersession]);
  }

  private async createTailInstallations(moduleId: string): Promise<void> {
    const tails = ["60-0020", "60-0021", "60-0022"];

    const effectivities = tails.map((tail) => ({
      pk: moduleId,
      sk: `EFFECTIVITY#TAIL#${tail}#2024-01-01`,
      type: "EFFECTIVITY" as const,
      scope: "TAIL" as const,
      tail: tail,
      effectiveFrom: "2024-01-01",
      tctoRefs: ["TCTO-1234", "TCTO-5678"],
    }));

    const installations = tails.map((tail) => ({
      pk: `TAIL#${tail}`,
      sk: `INSTALL#${moduleId}#2025-02-11`,
      type: "INSTALL" as const,
      tail: tail,
      partId: moduleId,
      installedOn: "2025-02-11",
      source: "maintenance_record_001",
      gsi2pk: `TAIL#${tail}`,
      gsi2sk: `INSTALL#${moduleId}#2025-02-11`,
    }));

    await this.batchWrite([...effectivities, ...installations]);
  }

  private async createTechnicalOrders(moduleId: string): Promise<void> {
    const documents = [
      {
        pk: "DOC#TO-1234",
        title: "Technical Order 1B-52H-2-70JG-00-1",
        uri: "s3://mi-technical-orders/TO-1234.pdf",
        tags: ["combustion", "inspection", "B-52"],
      },
      {
        pk: "DOC#TO-5678",
        title: "Engine Maintenance Manual TF33-P-3",
        uri: "s3://mi-technical-orders/TO-5678.pdf",
        tags: ["engine", "maintenance", "TF33"],
      },
    ];

    const docMeta = documents.map((doc) => ({
      ...doc,
      sk: "META",
      type: "DOC" as const,
    }));

    const docRefs = documents.map((doc) => ({
      pk: doc.pk,
      sk: `DOCREF#NODE#${moduleId}`,
      type: "DOC" as const,
      nodeId: moduleId,
      section: "Sec 5.2",
      page: 48,
    }));

    await this.batchWrite([...docMeta, ...docRefs]);
  }

  private async createForecastData(): Promise<void> {
    const today = new Date().toISOString().split("T")[0];

    const forecast: ForecastData = {
      pk: "FORECAST#MICAP#tail:60-0020",
      sk: `${today}#model:v1.3`,
      type: "FORECAST",
      scope: "tail",
      id: "60-0020",
      windowDays: 30,
      modelVersion: "v1.3",
      predictions: [
        {
          entityId: "NODE#nsn:2840-00-123-4567",
          score: 0.86,
          daysToFailure: 14,
          confidence: 0.94,
          factors: [
            "High operating hours",
            "Supplier lead time",
            "Critical flight safety",
          ],
        },
        {
          entityId: "NODE#nsn:2915-00-456-7890",
          score: 0.74,
          daysToFailure: 21,
          confidence: 0.88,
          factors: ["Fuel system pressure", "Recent maintenance"],
        },
      ],
      top: [
        { entityId: "NODE#nsn:2840-00-123-4567", score: 0.86 },
        { entityId: "NODE#nsn:2915-00-456-7890", score: 0.74 },
        { entityId: "NODE#nsn:4820-00-789-0123", score: 0.68 },
      ],
    };

    await this.createForecast(forecast);
  }

  private async createWorkbenchIssue(moduleId: string): Promise<void> {
    const issueId = await this.generateId("iss_");

    const issue: Omit<WorkbenchIssue, "created_at" | "updated_at"> = {
      pk: `ISSUE#${issueId}`,
      sk: "META",
      type: "ISSUE",
      title: "Combustion Module MICAP Risk",
      status: "Analyze",
      criticality: "Critical",
      links: {
        nodes: [moduleId],
        tails: ["60-0020"],
        suppliers: ["cage:1AB23"],
      },
      risk: {
        micap30d: 0.86,
        missionImpact: 2100000,
        financialImpact: 2100000,
      },
      streamIds: [
        `micap:/forecast;scope=tail;id=60-0020;window=30;model=v1.3;asof=${
          new Date().toISOString().split("T")[0]
        }`,
      ],
      aiRecommendation:
        "Switch to alternate supplier CAGE:7XY89 with 18-day delivery for 15% cost increase to prevent MICAP.",
    };

    const task: WorkbenchTask = {
      pk: `ISSUE#${issueId}`,
      sk: "TASK#0001",
      type: "TASK",
      taskId: "0001",
      title: "Evaluate alternate suppliers",
      assignee: "SCM_Analyst",
      due: "2025-08-28",
      status: "InProgress",
    };

    const decision: WorkbenchDecision = {
      pk: `ISSUE#${issueId}`,
      sk: "DECISION#G1_SELECT_PATH",
      type: "DECISION",
      gate: "G1_SELECT_PATH",
      decision: "PENDING",
      basis: ["Lead>60d", "No approved alternates", "High readiness impact"],
      effectiveFrom: "2025-08-12",
    };

    await this.createIssue(issue);
    await this.batchWrite([task, decision]);
  }

  private async createContentBlocks(): Promise<void> {
    const contentBlocks = [
      {
        pk: "CONTENT#c_91f",
        sk: "META",
        type: "CONTENT_REF" as const,
        content: {
          type: "chart" as const,
          title: "Top MICAP Risks – Next 30d",
          visual: "bar" as const,
          streamId: `micap:/forecast;scope=tail;id=60-0020;window=30;model=v1.3;asof=${
            new Date().toISOString().split("T")[0]
          }`,
          filters: { aircraft: "B-52H", criticality: "high" },
          insight:
            "86% probability of MICAP within 14 days for combustion module",
        },
      },
      {
        pk: "CONTENT#c_82e",
        sk: "META",
        type: "CONTENT_REF" as const,
        content: {
          type: "table" as const,
          title: "Supplier Risk Matrix",
          visual: "table" as const,
          streamId: "supp:/scorecard;supplierId=cage:1AB23;asof=2025-08-09",
          filters: { metric: "lead_time", threshold: 45 },
          insight:
            "Primary supplier showing 62-day lead time vs industry standard 28 days",
        },
      },
    ];

    await this.batchWrite(contentBlocks);
  }

  async clearAllData(): Promise<void> {
    console.log("WARNING: This would clear all demo data from the table");
    // Implementation would scan and delete all items
    // Not implemented for safety
  }
}

export const miSeedGenerator = new MISeedDataGenerator();
