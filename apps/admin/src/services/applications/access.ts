/**
 * Application Access Service
 * Handles all application access management operations through the standard service interface
 */

import type { AwsCredentials, ApiUserSession } from "../../types";
import { ApplicationManager } from "./manager";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

interface ApplicationAccessRequest {
  service: string;
  operation: string;
  app?: string;
  schema?: string;
  data?: any;
}

/**
 * Execute application access management operations
 */
export async function execute(
  request: ApplicationAccessRequest,
  credentials?: AwsCredentials,
  session?: ApiUserSession
): Promise<any> {
  const userId = session?.user?.userId || session?.user?.id || session?.user?.email;
  
  // Check if user is admin by looking up in User table
  let isAdmin = false;
  
  if (credentials && userId) {
    try {
      const client = new DynamoDBClient({
        region: "us-east-1",
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
        },
      });
      
      const docClient = DynamoDBDocumentClient.from(client);
      const tableName = `${request.schema || "captify"}-core-User`;
      
      // Try to get user by ID
      let user = null;
      const getCommand = new GetCommand({
        TableName: tableName,
        Key: { id: userId },
      });
      
      const response = await docClient.send(getCommand);
      user = response.Item;
      
      // If not found by ID and we have email, try scanning by email
      if (!user && session?.user?.email) {
        const scanCommand = new ScanCommand({
          TableName: tableName,
          FilterExpression: "email = :email",
          ExpressionAttributeValues: {
            ":email": session.user.email,
          },
        });
        
        const scanResponse = await docClient.send(scanCommand);
        if (scanResponse.Items && scanResponse.Items.length > 0) {
          user = scanResponse.Items[0];
        }
      }
      
      // Check if user has admin role or if email contains admin (fallback)
      isAdmin = user?.roles?.includes("admin") || 
                user?.status === "active" && session?.user?.email?.includes("admin") || 
                false;
    } catch (error) {
      console.error("Error checking admin status:", error);
      // Fallback to email check if database lookup fails
      isAdmin = session?.user?.email?.includes("admin") || false;
    }
  }
  
  // Initialize ApplicationManager
  const appManager = new ApplicationManager(userId, isAdmin);
  
  // Handle different operations
  switch (request.operation) {
    // ===== USER OPERATIONS =====
    case "getInstalledApps":
      const apps = await appManager.getInstalledApps();
      return { success: true, data: apps };
    
    case "getUserApps":
      if (!userId) {
        return { success: false, error: "User ID required" };
      }
      const userApps = await appManager.getUserApps(request.data?.userId || userId);
      return { success: true, data: userApps };
    
    case "requestAccess":
      if (!userId) {
        return { success: false, error: "Authentication required" };
      }
      const accessRequest = await appManager.requestAppAccess(
        userId,
        request.data.appId,
        request.data.justification,
        request.data.requestedRole
      );
      return { success: true, data: accessRequest };
    
    case "getUserAccessProfile":
      if (!userId) {
        return { success: false, error: "User ID required" };
      }
      const profile = await appManager.getUserAccessProfile(
        userId,
        request.data.appId
      );
      if (!profile) {
        return { success: false, error: "No access to this application" };
      }
      return { success: true, data: profile };
    
    // ===== ADMIN OPERATIONS =====
    case "getPendingRequests":
      if (!isAdmin) {
        return { success: false, error: "Admin access required" };
      }
      const pendingRequests = await appManager.getPendingRequests(
        request.data?.appId
      );
      return { success: true, data: pendingRequests };
    
    case "approveRequest":
      if (!isAdmin || !userId) {
        return { success: false, error: "Admin access required" };
      }
      await appManager.approveAccessRequest(
        request.data.requestId,
        userId,
        request.data.roleId,
        request.data.reviewNotes
      );
      return { success: true, message: "Request approved successfully" };
    
    case "rejectRequest":
      if (!isAdmin || !userId) {
        return { success: false, error: "Admin access required" };
      }
      await appManager.rejectAccessRequest(
        request.data.requestId,
        userId,
        request.data.reviewNotes
      );
      return { success: true, message: "Request rejected" };
    
    case "grantAccess":
      if (!isAdmin || !userId) {
        return { success: false, error: "Admin access required" };
      }
      const userApp = await appManager.grantAppAccess(
        request.data.userId,
        request.data.appId,
        request.data.roleId,
        userId
      );
      return { success: true, data: userApp };
    
    case "revokeAccess":
      if (!isAdmin || !userId) {
        return { success: false, error: "Admin access required" };
      }
      await appManager.revokeAppAccess(
        request.data.userId,
        request.data.appId,
        userId
      );
      return { success: true, message: "Access revoked successfully" };
    
    case "getAppAccessSummary":
      if (!isAdmin) {
        return { success: false, error: "Admin access required" };
      }
      const summary = await appManager.getAppAccessSummary(
        request.data.appId
      );
      return { success: true, data: summary };
    
    default:
      return {
        success: false,
        error: `Unknown operation: ${request.operation}`,
      };
  }
}

// Export the service
export const applicationAccessService = {
  execute,
};