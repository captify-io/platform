/**
 * User Service
 * Handles user registration, profile management, and user operations
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { AwsCredentials, ApiUserSession, User } from "../../types";

interface UserServiceRequest {
  service: string;
  operation: string;
  data?: any;
  schema?: string;
  app?: string;
}

/**
 * Execute user management operations
 */
export async function execute(
  request: UserServiceRequest,
  credentials?: AwsCredentials,
  session?: ApiUserSession
): Promise<any> {
  if (!credentials) {
    return { success: false, error: "AWS credentials required" };
  }

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

  try {
    switch (request.operation) {
      case "getCurrentUser": {
        // Get the current user's profile from DynamoDB
        const userId = session?.user?.userId || session?.user?.id || session?.user?.email;
        
        if (!userId) {
          return { success: false, error: "User ID not found in session" };
        }

        // First try to get by userId
        const getCommand = new GetCommand({
          TableName: tableName,
          Key: { id: userId },
        });

        let response = await docClient.send(getCommand);
        
        // If not found by userId, scan by email
        if (!response.Item && session?.user?.email) {
          const scanCommand = new ScanCommand({
            TableName: tableName,
            FilterExpression: "email = :email",
            ExpressionAttributeValues: {
              ":email": session.user.email,
            },
          });
          
          const scanResponse = await docClient.send(scanCommand);
          if (scanResponse.Items && scanResponse.Items.length > 0) {
            response.Item = scanResponse.Items[0];
          }
        }

        if (response.Item) {
          return { 
            success: true, 
            data: response.Item,
            isRegistered: true 
          };
        } else {
          // User is authenticated but not registered in our system
          return { 
            success: true, 
            data: null,
            isRegistered: false,
            message: "User authenticated but not registered"
          };
        }
      }

      case "registerUser": {
        // Register a new user in the system
        const userId = session?.user?.userId || session?.user?.id;
        const email = session?.user?.email;
        
        if (!userId || !email) {
          return { success: false, error: "User ID and email required" };
        }

        // Check if user already exists
        const getCommand = new GetCommand({
          TableName: tableName,
          Key: { id: userId },
        });
        
        const existingUser = await docClient.send(getCommand);
        if (existingUser.Item) {
          return { success: false, error: "User already registered" };
        }

        // Validate tenant ID is provided
        if (!request.data?.tenantId) {
          return { success: false, error: "Tenant ID is required for registration" };
        }

        // Create new user record
        const now = new Date().toISOString();
        const newUser: User = {
          id: userId,
          userId: userId,
          email: email,
          tenantId: request.data.tenantId, // Required tenant assignment
          orgId: request.data?.orgId, // Optional for backward compatibility
          app: "core",
          slug: `user-${userId}`,
          name: request.data?.name || session?.user?.name || email,
          description: `User profile for ${email}`,
          order: "0",
          profile: {
            firstName: request.data?.firstName || "",
            lastName: request.data?.lastName || "",
            title: request.data?.title || "",
            department: request.data?.department || "",
            phone: request.data?.phone || "",
          },
          roles: [],
          groups: [],
          status: "pending", // New users start as pending until approved
          preferences: {
            theme: "auto",
            notifications: {
              email: true,
              inApp: true,
              security: true,
            },
            dashboard: {
              layout: "default",
              widgets: [],
            },
          },
          fields: {},
          ownerId: userId,
          createdAt: now,
          createdBy: userId,
          updatedAt: now,
          updatedBy: userId,
        };

        const putCommand = new PutCommand({
          TableName: tableName,
          Item: newUser,
        });

        await docClient.send(putCommand);
        
        return { 
          success: true, 
          data: newUser,
          message: "User registered successfully. Your account is pending approval."
        };
      }

      case "updateProfile": {
        // Update user profile information
        const userId = session?.user?.userId || session?.user?.id;
        
        if (!userId) {
          return { success: false, error: "User ID required" };
        }

        const updateExpressions: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};

        // Build update expression for profile fields
        if (request.data?.profile) {
          updateExpressions.push("#profile = :profile");
          expressionAttributeNames["#profile"] = "profile";
          expressionAttributeValues[":profile"] = request.data.profile;
        }

        if (request.data?.username) {
          updateExpressions.push("#username = :username");
          expressionAttributeNames["#username"] = "username";
          expressionAttributeValues[":username"] = request.data.username;
        }

        if (request.data?.preferences) {
          updateExpressions.push("#preferences = :preferences");
          expressionAttributeNames["#preferences"] = "preferences";
          expressionAttributeValues[":preferences"] = request.data.preferences;
        }

        // Always update the updatedAt and updatedBy fields
        updateExpressions.push("#updatedAt = :updatedAt");
        updateExpressions.push("#updatedBy = :updatedBy");
        expressionAttributeNames["#updatedAt"] = "updatedAt";
        expressionAttributeNames["#updatedBy"] = "updatedBy";
        expressionAttributeValues[":updatedAt"] = new Date().toISOString();
        expressionAttributeValues[":updatedBy"] = userId;

        const updateCommand = new UpdateCommand({
          TableName: tableName,
          Key: { id: userId },
          UpdateExpression: `SET ${updateExpressions.join(", ")}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: "ALL_NEW",
        });

        const response = await docClient.send(updateCommand);
        
        return { 
          success: true, 
          data: response.Attributes,
          message: "Profile updated successfully"
        };
      }

      case "checkUserStatus": {
        // Check if user exists and their status
        const userId = session?.user?.userId || session?.user?.id;
        const email = session?.user?.email;
        
        if (!userId && !email) {
          return { success: false, error: "User identification required" };
        }

        // Try to find user by ID or email
        let user = null;
        
        if (userId) {
          const getCommand = new GetCommand({
            TableName: tableName,
            Key: { id: userId },
          });
          const response = await docClient.send(getCommand);
          user = response.Item;
        }
        
        if (!user && email) {
          const scanCommand = new ScanCommand({
            TableName: tableName,
            FilterExpression: "email = :email",
            ExpressionAttributeValues: {
              ":email": email,
            },
          });
          const scanResponse = await docClient.send(scanCommand);
          if (scanResponse.Items && scanResponse.Items.length > 0) {
            user = scanResponse.Items[0];
          }
        }

        if (user) {
          return {
            success: true,
            data: {
              isRegistered: true,
              status: user.status,
              isAdmin: user.roles?.includes("admin") || false,
              user: user
            }
          };
        } else {
          return {
            success: true,
            data: {
              isRegistered: false,
              status: null,
              isAdmin: false,
              user: null
            }
          };
        }
      }

      case "listUsers": {
        // Admin operation to list all users
        const isAdmin = session?.user?.email?.includes("admin") || false;
        
        if (!isAdmin) {
          return { success: false, error: "Admin access required" };
        }

        const scanCommand = new ScanCommand({
          TableName: tableName,
        });

        const response = await docClient.send(scanCommand);
        
        return { 
          success: true, 
          data: response.Items || []
        };
      }

      case "updateOwnStatus": {
        // User updates their own status (for registration flow)
        const userId = session?.user?.userId || session?.user?.id;
        const { status } = request.data;
        
        if (!userId) {
          return { success: false, error: "User ID required" };
        }
        
        if (!status || !["unregistered", "registered"].includes(status)) {
          return { success: false, error: "Invalid status. Must be 'unregistered' or 'registered'" };
        }

        const updateCommand = new UpdateCommand({
          TableName: tableName,
          Key: { id: userId },
          UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt, #updatedBy = :updatedBy",
          ExpressionAttributeNames: {
            "#status": "status",
            "#updatedAt": "updatedAt",
            "#updatedBy": "updatedBy",
          },
          ExpressionAttributeValues: {
            ":status": status,
            ":updatedAt": new Date().toISOString(),
            ":updatedBy": userId,
          },
          ReturnValues: "ALL_NEW",
        });

        const response = await docClient.send(updateCommand);
        
        return { 
          success: true, 
          data: response.Attributes,
          message: `Status updated to ${status}`
        };
      }

      case "updateUserStatus": {
        // Admin operation to update any user's status
        const isAdmin = session?.user?.email?.includes("admin") || false;
        
        if (!isAdmin) {
          return { success: false, error: "Admin access required" };
        }

        const { userId: targetUserId, status } = request.data;
        
        if (!targetUserId || !status) {
          return { success: false, error: "User ID and status required" };
        }

        const updateCommand = new UpdateCommand({
          TableName: tableName,
          Key: { id: targetUserId },
          UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt, #updatedBy = :updatedBy",
          ExpressionAttributeNames: {
            "#status": "status",
            "#updatedAt": "updatedAt",
            "#updatedBy": "updatedBy",
          },
          ExpressionAttributeValues: {
            ":status": status,
            ":updatedAt": new Date().toISOString(),
            ":updatedBy": session?.user?.userId || session?.user?.id,
          },
          ReturnValues: "ALL_NEW",
        });

        const response = await docClient.send(updateCommand);
        
        return { 
          success: true, 
          data: response.Attributes,
          message: `User status updated to ${status}`
        };
      }

      default:
        return {
          success: false,
          error: `Unknown operation: ${request.operation}`,
        };
    }
  } catch (error) {
    console.error(`Error in userService.${request.operation}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Export the service
export const userService = {
  execute,
};