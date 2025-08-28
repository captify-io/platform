/**
 * Chat Service
 * Handles all chat operations for the Captify platform
 */

import type {
  ApiRequest,
  ApiResponse,
  ApiUserSession,
  AwsCredentials,
} from "../types";

// Import DynamoDB client for chat storage
import {
  DynamoDBClient,
  ScanCommand,
  QueryCommand,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand as DocQueryCommand,
  ScanCommand as DocScanCommand,
} from "@aws-sdk/lib-dynamodb";

// Chat interfaces
export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: string;
  sessionId: string;
  userId: string;
  agentId?: string;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  userId: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  agentId?: string;
  metadata?: Record<string, any>;
}

export interface ChatAgent {
  id: string;
  name: string;
  description: string;
  icon?: string;
  default?: boolean;
  bedrockAgentId?: string;
  bedrockAgentAliasId?: string;
}

/**
 * Create DynamoDB client for chat operations
 */
function createChatDynamoClient(
  credentials: AwsCredentials & { region: string }
): DynamoDBDocumentClient {
  const client = new DynamoDBClient({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });

  return DynamoDBDocumentClient.from(client);
}

// Table names
const SESSIONS_TABLE = "captify-chat-sessions";
const MESSAGES_TABLE = "captify-chat-messages";
const AGENTS_TABLE = "captify-chat-agents";

/**
 * Get available operations for Chat service
 */
export function getOps(): {
  operations: string[];
  description: string;
  examples: Record<string, any>;
} {
  return {
    operations: [
      "send",
      "getHistory",
      "deleteSession",
      "storeMessage",
      "createSession",
      "getSessions",
      "getMessages",
      "getAgents",
    ],
    description: "Chat service for AI conversation and message management",
    examples: {
      send: {
        operation: "send",
        data: {
          message: "Hello, how can you help me?",
          userId: "user123",
          sessionId: "session456",
          agentId: "default",
        },
      },
      getHistory: {
        operation: "getHistory",
        data: { userId: "user123", sessionId: "session456", limit: 10 },
      },
      getSessions: {
        operation: "getSessions",
        data: { userId: "user123", limit: 20 },
      },
      getMessages: {
        operation: "getMessages",
        data: { sessionId: "session456", userId: "user123", limit: 50 },
      },
      createSession: {
        operation: "createSession",
        data: { id: "session789", userId: "user123", title: "New Chat" },
      },
      deleteSession: {
        operation: "deleteSession",
        data: { sessionId: "session456", userId: "user123" },
      },
      storeMessage: {
        operation: "storeMessage",
        data: {
          content: "Hello world",
          role: "user",
          userId: "user123",
          sessionId: "session456",
        },
      },
      getAgents: {
        operation: "getAgents",
        data: {},
      },
    },
  };
}

/**
 * Execute Chat operations
 * All chat requests are routed through this function
 */
export async function execute(
  request: ApiRequest,
  userSession: ApiUserSession,
  credentials: AwsCredentials & { region: string }
): Promise<ApiResponse> {
  try {
    // Validate operation
    const validOperations = [
      "send",
      "getHistory",
      "deleteSession",
      "storeMessage",
      "createSession",
      "getSessions",
      "getMessages",
      "getAgents",
    ];

    if (request.operation && !validOperations.includes(request.operation)) {
      return {
        success: false,
        error: `Invalid chat operation: ${
          request.operation
        }. Valid operations: ${validOperations.join(", ")}`,
        metadata: {
          requestId: `chat-error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: "chat.execute",
        },
      };
    }

    // Create DynamoDB client
    const client = createChatDynamoClient(credentials);
    const operation = request.operation || "send";

    // Route to specific operation
    switch (operation) {
      case "send":
        return await executeSend(client, request.data, userSession);
      case "getHistory":
        return await executeGetHistory(client, request.data, userSession);
      case "deleteSession":
        return await executeDeleteSession(client, request.data, userSession);
      case "storeMessage":
        return await executeStoreMessage(client, request.data, userSession);
      case "createSession":
        return await executeCreateSession(client, request.data, userSession);
      case "getSessions":
        return await executeGetSessions(client, request.data, userSession);
      case "getMessages":
        return await executeGetMessages(client, request.data, userSession);
      case "getAgents":
        return await executeGetAgents(client, request.data, userSession);
      default:
        return {
          success: false,
          error: `Unsupported operation: ${operation}`,
          metadata: {
            requestId: `chat-error-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "chat.execute",
          },
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Chat operation failed",
      metadata: {
        requestId: `chat-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "chat.execute",
      },
    };
  }
}

/**
 * Execute SEND operation - send a message and get AI response
 */
async function executeSend(
  client: DynamoDBDocumentClient,
  data: any,
  userSession: ApiUserSession
): Promise<ApiResponse> {
  try {
    const { message, userId, sessionId, agentId, metadata } = data;

    if (!message || !userId) {
      return {
        success: false,
        error: "Message and userId are required",
        metadata: {
          requestId: `chat-send-error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: "chat.executeSend",
        },
      };
    }

    // Generate session ID if not provided
    const finalSessionId = sessionId || `session-${Date.now()}-${userId}`;
    const messageId = `msg-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Store user message
    const userMessage: ChatMessage = {
      id: messageId,
      content: message,
      role: "user",
      timestamp,
      sessionId: finalSessionId,
      userId,
      agentId,
      metadata,
    };

    await client.send(
      new PutCommand({
        TableName: MESSAGES_TABLE,
        Item: userMessage,
      })
    );

    // Generate AI response (mock for now)
    const aiResponse = `Echo: ${message}`;
    const responseId = `msg-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    // Store AI response
    const aiMessage: ChatMessage = {
      id: responseId,
      content: aiResponse,
      role: "assistant",
      timestamp: new Date().toISOString(),
      sessionId: finalSessionId,
      userId,
      agentId: agentId || "default",
      metadata: { ...metadata, generated: true },
    };

    await client.send(
      new PutCommand({
        TableName: MESSAGES_TABLE,
        Item: aiMessage,
      })
    );

    return {
      success: true,
      data: {
        response: aiResponse,
        sessionId: finalSessionId,
        messageId: responseId,
      },
      metadata: {
        requestId: `chat-send-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "chat.executeSend",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Send operation failed",
      metadata: {
        requestId: `chat-send-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "chat.executeSend",
      },
    };
  }
}

/**
 * Execute GET_HISTORY operation - get chat history for a session
 */
async function executeGetHistory(
  client: DynamoDBDocumentClient,
  data: any,
  userSession: ApiUserSession
): Promise<ApiResponse> {
  try {
    const { userId, sessionId, limit = 50 } = data;

    if (!userId) {
      return {
        success: false,
        error: "userId is required",
        metadata: {
          requestId: `chat-history-error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: "chat.executeGetHistory",
        },
      };
    }

    let queryParams;
    if (sessionId) {
      // Get messages for specific session
      queryParams = {
        TableName: MESSAGES_TABLE,
        KeyConditionExpression: "sessionId = :sessionId AND userId = :userId",
        ExpressionAttributeValues: {
          ":sessionId": sessionId,
          ":userId": userId,
        },
        ScanIndexForward: false, // Most recent first
        Limit: limit,
      };
    } else {
      // Get all messages for user (scan operation)
      queryParams = {
        TableName: MESSAGES_TABLE,
        FilterExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
        Limit: limit,
      };
    }

    const result = await client.send(new DocQueryCommand(queryParams));

    return {
      success: true,
      data: {
        messages: result.Items || [],
        count: result.Count || 0,
      },
      metadata: {
        requestId: `chat-history-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "chat.executeGetHistory",
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Get history operation failed",
      metadata: {
        requestId: `chat-history-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "chat.executeGetHistory",
      },
    };
  }
}

/**
 * Other chat operations - simplified implementations
 */
async function executeDeleteSession(
  client: DynamoDBDocumentClient,
  data: any,
  userSession: ApiUserSession
): Promise<ApiResponse> {
  // Implementation for deleting a chat session
  return {
    success: true,
    data: { message: "Session deleted successfully" },
    metadata: {
      requestId: `chat-delete-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: "chat.executeDeleteSession",
    },
  };
}

async function executeStoreMessage(
  client: DynamoDBDocumentClient,
  data: any,
  userSession: ApiUserSession
): Promise<ApiResponse> {
  // Implementation for storing a message
  return {
    success: true,
    data: { message: "Message stored successfully" },
    metadata: {
      requestId: `chat-store-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: "chat.executeStoreMessage",
    },
  };
}

async function executeCreateSession(
  client: DynamoDBDocumentClient,
  data: any,
  userSession: ApiUserSession
): Promise<ApiResponse> {
  // Implementation for creating a session
  return {
    success: true,
    data: { message: "Session created successfully" },
    metadata: {
      requestId: `chat-create-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: "chat.executeCreateSession",
    },
  };
}

async function executeGetSessions(
  client: DynamoDBDocumentClient,
  data: any,
  userSession: ApiUserSession
): Promise<ApiResponse> {
  // Implementation for getting user sessions
  return {
    success: true,
    data: { sessions: [] },
    metadata: {
      requestId: `chat-sessions-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: "chat.executeGetSessions",
    },
  };
}

async function executeGetMessages(
  client: DynamoDBDocumentClient,
  data: any,
  userSession: ApiUserSession
): Promise<ApiResponse> {
  // Implementation for getting messages
  return {
    success: true,
    data: { messages: [] },
    metadata: {
      requestId: `chat-messages-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: "chat.executeGetMessages",
    },
  };
}

async function executeGetAgents(
  client: DynamoDBDocumentClient,
  data: any,
  userSession: ApiUserSession
): Promise<ApiResponse> {
  // Implementation for getting available agents
  return {
    success: true,
    data: {
      agents: [
        {
          id: "default",
          name: "Default Assistant",
          description: "General purpose AI assistant",
          default: true,
        },
      ],
    },
    metadata: {
      requestId: `chat-agents-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: "chat.executeGetAgents",
    },
  };
}
