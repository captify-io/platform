import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { QueryCommand, PutCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { createDynamoClient } from "./aws/dynamodb";

interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  region: string;
}

interface ApiUserSession {
  user: {
    id: string;
    userId: string;
    email?: string;
    name?: string;
    groups?: string[];
    isAdmin?: boolean;
  };
  idToken: string;
  groups?: string[];
  isAdmin?: boolean;
}

interface AgentThread {
  id: string;
  userId: string;
  title: string;
  model: string;
  provider: string;
  settings: any;
  messages: AgentMessage[];
  createdAt: string;
  updatedAt: string;
}

interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
}

interface AgentSettings {
  model: string;
  provider: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export async function execute(
  request: {
    service: string;
    operation: string;
    schema?: string;
    app?: string;
    data?: any;
  },
  credentials: AwsCredentials,
  session: ApiUserSession
) {
  try {
    const {
      operation,
      schema = "captify",
      app = "core",
      data = {},
    } = request;

    const userId = session.user.userId || session.user.id;
    if (!userId) {
      return {
        success: false,
        error: "User ID not found in session",
        metadata: {
          requestId: `agent-error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: "agent.execute",
        },
      };
    }

    const client = await createDynamoClient(credentials);

    switch (operation) {
      case "getTokenUsage": {
        const { period = "month" } = data;
        
        // Calculate date range based on period
        const now = new Date();
        let startDate: Date;
        
        switch (period) {
          case "day":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        }

        // Query threads for usage data
        const threadsTable = `${schema}-${app}-threads`;
        const command = new QueryCommand({
          TableName: threadsTable,
          IndexName: "userId-updatedAt-index",
          KeyConditionExpression: "userId = :userId AND updatedAt >= :startDate",
          ExpressionAttributeValues: {
            ":userId": userId,
            ":startDate": startDate.toISOString(),
          },
        });

        const result = await client.send(command);
        
        // Calculate token usage from threads
        let totalInput = 0;
        let totalOutput = 0;
        let threadCount = 0;

        if (result.Items) {
          threadCount = result.Items.length;
          for (const thread of result.Items) {
            if (thread.messages) {
              for (const message of thread.messages) {
                if (message.tokenUsage) {
                  totalInput += message.tokenUsage.input || 0;
                  totalOutput += message.tokenUsage.output || 0;
                }
              }
            }
          }
        }

        return {
          success: true,
          data: {
            period,
            usage: {
              input: totalInput,
              output: totalOutput,
              total: totalInput + totalOutput,
            },
            threadCount,
            startDate: startDate.toISOString(),
          },
          metadata: {
            requestId: `agent-usage-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "agent.getTokenUsage",
          },
        };
      }

      case "getThreads": {
        const threadsTable = `${schema}-${app}-threads`;
        const command = new QueryCommand({
          TableName: threadsTable,
          IndexName: "userId-updatedAt-index",
          KeyConditionExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": userId,
          },
          ScanIndexForward: false, // Most recent first
          Limit: data.limit || 50,
        });

        const result = await client.send(command);
        
        return {
          success: true,
          data: result.Items || [],
          metadata: {
            requestId: `agent-threads-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "agent.getThreads",
          },
        };
      }

      case "getThread": {
        const { threadId } = data;
        if (!threadId) {
          return {
            success: false,
            error: "Thread ID is required",
            metadata: {
              requestId: `agent-error-${Date.now()}`,
              timestamp: new Date().toISOString(),
              source: "agent.getThread",
            },
          };
        }

        const threadsTable = `${schema}-${app}-threads`;
        const command = new QueryCommand({
          TableName: threadsTable,
          KeyConditionExpression: "id = :threadId AND userId = :userId",
          ExpressionAttributeValues: {
            ":threadId": threadId,
            ":userId": userId,
          },
        });

        const result = await client.send(command);
        
        if (!result.Items || result.Items.length === 0) {
          return {
            success: false,
            error: "Thread not found",
            metadata: {
              requestId: `agent-error-${Date.now()}`,
              timestamp: new Date().toISOString(),
              source: "agent.getThread",
            },
          };
        }

        return {
          success: true,
          data: result.Items[0],
          metadata: {
            requestId: `agent-thread-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "agent.getThread",
          },
        };
      }

      case "createThread": {
        const { title, model, provider, settings } = data;
        const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        const thread: AgentThread = {
          id: threadId,
          userId,
          title: title || "New Chat",
          model: model || "claude-3-sonnet",
          provider: provider || "anthropic",
          settings: settings || {},
          messages: [],
          createdAt: now,
          updatedAt: now,
        };

        const threadsTable = `${schema}-${app}-threads`;
        const command = new PutCommand({
          TableName: threadsTable,
          Item: thread,
        });

        await client.send(command);

        return {
          success: true,
          data: thread,
          metadata: {
            requestId: `agent-create-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "agent.createThread",
          },
        };
      }

      case "updateThread": {
        const { threadId, updates } = data;
        if (!threadId) {
          return {
            success: false,
            error: "Thread ID is required",
            metadata: {
              requestId: `agent-error-${Date.now()}`,
              timestamp: new Date().toISOString(),
              source: "agent.updateThread",
            },
          };
        }

        const threadsTable = `${schema}-${app}-threads`;
        
        // Build update expression
        const updateExpressions: string[] = [];
        const expressionAttributeValues: any = {
          ":updatedAt": new Date().toISOString(),
        };
        
        updateExpressions.push("updatedAt = :updatedAt");

        Object.keys(updates).forEach((key, index) => {
          const valueKey = `:val${index}`;
          updateExpressions.push(`${key} = ${valueKey}`);
          expressionAttributeValues[valueKey] = updates[key];
        });

        const command = new UpdateCommand({
          TableName: threadsTable,
          Key: { id: threadId, userId },
          UpdateExpression: `SET ${updateExpressions.join(", ")}`,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: "ALL_NEW",
        });

        const result = await client.send(command);

        return {
          success: true,
          data: result.Attributes,
          metadata: {
            requestId: `agent-update-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "agent.updateThread",
          },
        };
      }

      case "deleteThread": {
        const { threadId } = data;
        if (!threadId) {
          return {
            success: false,
            error: "Thread ID is required",
            metadata: {
              requestId: `agent-error-${Date.now()}`,
              timestamp: new Date().toISOString(),
              source: "agent.deleteThread",
            },
          };
        }

        const threadsTable = `${schema}-${app}-threads`;
        const command = new DeleteCommand({
          TableName: threadsTable,
          Key: { id: threadId, userId },
        });

        await client.send(command);

        return {
          success: true,
          data: { message: "Thread deleted successfully" },
          metadata: {
            requestId: `agent-delete-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "agent.deleteThread",
          },
        };
      }

      case "sendMessage": {
        // This is a placeholder - actual AI integration would go here
        const { threadId, message, settings } = data;
        
        if (!threadId || !message) {
          return {
            success: false,
            error: "Thread ID and message are required",
            metadata: {
              requestId: `agent-error-${Date.now()}`,
              timestamp: new Date().toISOString(),
              source: "agent.sendMessage",
            },
          };
        }

        // Mock response for now
        const userMessage: AgentMessage = {
          id: `msg_${Date.now()}_user`,
          role: "user",
          content: message,
          timestamp: new Date().toISOString(),
        };

        const assistantMessage: AgentMessage = {
          id: `msg_${Date.now()}_assistant`,
          role: "assistant",
          content: "This is a mock response. Real AI integration would be implemented here.",
          timestamp: new Date().toISOString(),
          tokenUsage: {
            input: 10,
            output: 15,
            total: 25,
          },
        };

        // Update thread with new messages
        const threadsTable = `${schema}-${app}-threads`;
        const getCommand = new QueryCommand({
          TableName: threadsTable,
          KeyConditionExpression: "id = :threadId AND userId = :userId",
          ExpressionAttributeValues: {
            ":threadId": threadId,
            ":userId": userId,
          },
        });

        const getResult = await client.send(getCommand);
        if (!getResult.Items || getResult.Items.length === 0) {
          return {
            success: false,
            error: "Thread not found",
            metadata: {
              requestId: `agent-error-${Date.now()}`,
              timestamp: new Date().toISOString(),
              source: "agent.sendMessage",
            },
          };
        }

        const thread = getResult.Items[0];
        const updatedMessages = [...(thread.messages || []), userMessage, assistantMessage];

        const updateCommand = new UpdateCommand({
          TableName: threadsTable,
          Key: { id: threadId, userId },
          UpdateExpression: "SET messages = :messages, updatedAt = :updatedAt",
          ExpressionAttributeValues: {
            ":messages": updatedMessages,
            ":updatedAt": new Date().toISOString(),
          },
          ReturnValues: "ALL_NEW",
        });

        const updateResult = await client.send(updateCommand);

        return {
          success: true,
          data: {
            thread: updateResult.Attributes,
            tokenUsage: assistantMessage.tokenUsage,
          },
          metadata: {
            requestId: `agent-send-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "agent.sendMessage",
          },
        };
      }

      case "updateSettings": {
        const { settings } = data;
        
        // Store user settings (could be in a separate table)
        // For now, just return success
        return {
          success: true,
          data: { message: "Settings updated successfully" },
          metadata: {
            requestId: `agent-settings-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "agent.updateSettings",
          },
        };
      }

      default:
        return {
          success: false,
          error: `Unsupported operation: ${operation}`,
          metadata: {
            requestId: `agent-error-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "agent.execute",
          },
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Agent operation failed",
      metadata: {
        requestId: `agent-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "agent.execute",
        error: error instanceof Error ? error.stack : undefined,
      },
    };
  }
}

export const manifest = {
  name: "agent",
  version: "1.0.0",
  description: "Agent service for AI chat functionality",
  operations: [
    "getTokenUsage",
    "getThreads", 
    "getThread",
    "createThread",
    "updateThread",
    "deleteThread",
    "sendMessage",
    "updateSettings"
  ],
  requiredParams: {
    getTokenUsage: [],
    getThreads: [],
    getThread: ["threadId"],
    createThread: ["title"],
    updateThread: ["threadId", "updates"],
    deleteThread: ["threadId"],
    sendMessage: ["threadId", "message"],
    updateSettings: ["settings"],
  },
};

export const agent = { execute, manifest };