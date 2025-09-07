import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
// Simple type definitions for service pattern
interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  region: string;
}

interface ApiUserSession {
  user?: any;
}
import type { Contract, CDRL, Invoice, Milestone, ContractMetrics } from "../types/contract";

interface ContractServiceRequest {
  service: string;
  operation: string;
  data?: any;
  schema?: string;
  app?: string;
}

/**
 * Execute contract management operations
 */
export async function execute(
  request: ContractServiceRequest,
  credentials?: AwsCredentials,
  session?: ApiUserSession
): Promise<any> {
  if (!credentials) {
    return { success: false, error: "AWS credentials required" };
  }

  const client = new DynamoDBClient({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });

  const docClient = DynamoDBDocumentClient.from(client);
  const schema = request.schema || "captify";

  try {
    switch (request.operation) {
      case "getActiveContracts": {
        const response = await docClient.send(new QueryCommand({
          TableName: `${schema}-pmbook-Contract`,
          IndexName: "status-index",
          KeyConditionExpression: "#status = :active",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":active": "active",
          },
        }));

        return { success: true, data: response.Items || [] };
      }

      case "getContractDetails": {
        const { contractId } = request.data || {};
        if (!contractId) {
          return { success: false, error: "Contract ID required" };
        }

        // Get contract
        const contractResponse = await docClient.send(new QueryCommand({
          TableName: `${schema}-pmbook-Contract`,
          KeyConditionExpression: "id = :id",
          ExpressionAttributeValues: {
            ":id": contractId,
          },
        }));

        if (!contractResponse.Items || contractResponse.Items.length === 0) {
          return { success: false, error: "Contract not found" };
        }

        const contract = contractResponse.Items[0];

        // Get CDRLs
        const cdrlsResponse = await docClient.send(new QueryCommand({
          TableName: `${schema}-pmbook-CDRL`,
          IndexName: "contract-index",
          KeyConditionExpression: "contractId = :contractId",
          ExpressionAttributeValues: {
            ":contractId": contractId,
          },
        }));

        // Get milestones
        const milestonesResponse = await docClient.send(new QueryCommand({
          TableName: `${schema}-pmbook-Milestone`,
          IndexName: "contract-index",
          KeyConditionExpression: "contractId = :contractId",
          ExpressionAttributeValues: {
            ":contractId": contractId,
          },
        }));

        return {
          success: true,
          data: {
            ...contract,
            cdrls: cdrlsResponse.Items || [],
            milestones: milestonesResponse.Items || [],
          },
        };
      }

      case "calculateBurnRate": {
        const { contractId, period = "month" } = request.data || {};
        if (!contractId) {
          return { success: false, error: "Contract ID required" };
        }

        // Get contract details first
        const contractResult = await execute({
          service: request.service,
          operation: "getContractDetails",
          data: { contractId },
          schema: request.schema,
        }, credentials, session);

        if (!contractResult.success) {
          return contractResult;
        }

        const contract = contractResult.data;
        
        // Get invoices
        const invoicesResponse = await docClient.send(new QueryCommand({
          TableName: `${schema}-pmbook-Invoice`,
          IndexName: "contract-index",
          KeyConditionExpression: "contractId = :contractId",
          ExpressionAttributeValues: {
            ":contractId": contractId,
          },
        }));

        const invoices = invoicesResponse.Items || [];
        const now = new Date();
        const startDate = new Date(contract.startDate);
        const monthsElapsed = (now.getFullYear() - startDate.getFullYear()) * 12 + 
                             (now.getMonth() - startDate.getMonth()) + 1;
        
        const totalBilled = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const monthlyBurn = totalBilled / monthsElapsed;
        const remainingValue = (contract.totalValue || 0) - totalBilled;
        const runwayMonths = remainingValue / monthlyBurn;
        
        return {
          success: true,
          data: {
            contractId,
            totalValue: contract.totalValue || 0,
            totalBilled,
            remainingValue,
            monthlyBurn,
            runwayMonths,
            burnPercentage: (totalBilled / (contract.totalValue || 1)) * 100,
            isOnTrack: Math.abs(totalBilled - ((contract.totalValue || 0) / (contract.durationMonths || 12)) * monthsElapsed) / (contract.totalValue || 1) < 0.15,
          },
        };
      }

      case "generateInvoice": {
        const { contractId, period } = request.data || {};
        if (!contractId || !period) {
          return { success: false, error: "Contract ID and period required" };
        }

        const contractResult = await execute({
          service: request.service,
          operation: "getContractDetails",
          data: { contractId },
          schema: request.schema,
        }, credentials, session);

        if (!contractResult.success) {
          return contractResult;
        }

        const contract = contractResult.data;
        
        const invoice = {
          id: generateInvoiceNumber(contract.number || contract.id, period),
          contractId,
          period,
          laborAmount: 50000, // Would calculate from work items
          odcAmount: 5000,    // Would calculate from expenses
          amount: 55000,
          status: 'draft',
          createdAt: new Date().toISOString(),
          lineItems: [
            { description: "Labor costs", amount: 50000 },
            { description: "ODC costs", amount: 5000 },
          ],
        };

        await docClient.send(new PutCommand({
          TableName: `${schema}-pmbook-Invoice`,
          Item: invoice,
        }));

        return { success: true, data: invoice };
      }

      case "submitCDRL": {
        const { cdrlId, submission } = request.data || {};
        if (!cdrlId || !submission) {
          return { success: false, error: "CDRL ID and submission data required" };
        }

        const cdrlResponse = await docClient.send(new QueryCommand({
          TableName: `${schema}-pmbook-CDRL`,
          KeyConditionExpression: "id = :id",
          ExpressionAttributeValues: {
            ":id": cdrlId,
          },
        }));

        if (!cdrlResponse.Items || cdrlResponse.Items.length === 0) {
          return { success: false, error: "CDRL not found" };
        }
        
        await docClient.send(new UpdateCommand({
          TableName: `${schema}-pmbook-CDRL`,
          Key: { id: cdrlId },
          UpdateExpression: "SET submissions = list_append(if_not_exists(submissions, :empty), :submission), lastSubmission = :date, #status = :status",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":empty": [],
            ":submission": [{
              ...submission,
              submittedAt: new Date().toISOString(),
            }],
            ":date": new Date().toISOString(),
            ":status": "submitted",
          },
        }));

        return { success: true, data: { cdrlId, submitted: true } };
      }

      case "getContractMetrics": {
        const { contractId } = request.data || {};
        if (!contractId) {
          return { success: false, error: "Contract ID required" };
        }

        // Get burn rate
        const burnResult = await execute({
          service: request.service,
          operation: "calculateBurnRate",
          data: { contractId },
          schema: request.schema,
        }, credentials, session);

        if (!burnResult.success) {
          return burnResult;
        }

        const burnRate = burnResult.data;
        
        // Calculate other metrics
        const metrics: ContractMetrics = {
          contractValue: burnRate.totalValue,
          burnRate: burnRate.monthlyBurn,
          runway: burnRate.runwayMonths,
          cdrlCompliance: 85, // Would calculate from actual CDRLs
          milestoneProgress: 60, // Would calculate from actual milestones
          profitMargin: 15, // Would calculate from costs
          riskScore: burnRate.isOnTrack ? 20 : 60,
          customerSatisfaction: 4.2, // Would get from feedback
        };

        return { success: true, data: metrics };
      }

      case "updateMilestoneProgress": {
        const { milestoneId, progress, evidence } = request.data || {};
        if (!milestoneId || progress === undefined) {
          return { success: false, error: "Milestone ID and progress required" };
        }

        await docClient.send(new UpdateCommand({
          TableName: `${schema}-pmbook-Milestone`,
          Key: { id: milestoneId },
          UpdateExpression: "SET progress = :progress, evidence = list_append(if_not_exists(evidence, :empty), :evidence), updatedAt = :now",
          ExpressionAttributeValues: {
            ":progress": progress,
            ":empty": [],
            ":evidence": [evidence || { updatedAt: new Date().toISOString() }],
            ":now": new Date().toISOString(),
          },
        }));

        // Check if milestone is complete
        if (progress >= 100) {
          await docClient.send(new UpdateCommand({
            TableName: `${schema}-pmbook-Milestone`,
            Key: { id: milestoneId },
            UpdateExpression: "SET #status = :completed, completedAt = :now",
            ExpressionAttributeNames: {
              "#status": "status",
            },
            ExpressionAttributeValues: {
              ":completed": "completed",
              ":now": new Date().toISOString(),
            },
          }));
        }

        return { success: true, data: { milestoneId, progress, completed: progress >= 100 } };
      }

      default:
        return {
          success: false,
          error: `Unknown operation: ${request.operation}`,
        };
    }
  } catch (error) {
    console.error(`Error in contractService.${request.operation}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Helper functions
function generateInvoiceNumber(contractNumber: string, period: string): string {
  const periodDate = new Date(period);
  const year = periodDate.getFullYear();
  const month = String(periodDate.getMonth() + 1).padStart(2, '0');
  return `${contractNumber}-${year}${month}-INV`;
}

// Export the service
export const contractService = {
  execute,
};