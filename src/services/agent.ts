import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { QueryCommand, PutCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { createDynamoClient } from "./aws/dynamodb";
import { s3 } from "./aws/s3";
import { generateText, streamText, generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import type { CoreMessage } from "ai";
// Local types to avoid conflicts
// import type {
//   AgentMessage,
//   AgentSettings,
//   AgentAttachment,
//   AgentToolCall,
//   CreateThreadInput,
//   SendMessageInput,
//   UpdateThreadInput
// } from "../types/agent";

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
  settings: AgentSettings;
  messages: AgentMessage[];
  createdAt: number;
  updatedAt: number;
  agentId?: string;
  projectId?: string;
  threadType?: string;
  app?: string;
  entityType?: string;
  metadata?: {
    messageCount: number;
    totalTokens: number;
    lastActivity: number;
    lastMessageAt?: number;
    tokenUsage?: {
      total: number;
      input: number;
      output: number;
    };
  };
}

interface AgentMessage {
  id: string;
  threadId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  createdAt?: number;
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  attachments?: AgentAttachment[];
  tools?: AgentToolCall[];
}

interface AgentAttachment {
  id: string;
  type: 'file' | 'image' | 'document';
  name: string;
  url: string;
  size: number;
  mimeType: string;
  s3Key?: string;
  bucket?: string;
}

interface AgentToolCall {
  id: string;
  type: string;
  name: string;
  input: any;
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'error';
}

interface AgentSettings {
  model: string;
  provider: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  tools?: string[];
}

// AI Model mappings
const getAIModel = (provider: string, model: string) => {
  switch (provider) {
    case 'openai':
      return openai(model);
    case 'anthropic':
      return anthropic(model);
    case 'bedrock':
      return bedrock(model);
    default:
      return openai('gpt-4o'); // Default fallback
  }
};

// Convert our messages to AI SDK format
const convertToAIMessages = (messages: AgentMessage[]): CoreMessage[] => {
  return messages.map(msg => ({
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
  }));
};

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
    console.log("🔍 Agent Service - User session:", {
      hasUserId: !!userId,
      userId: userId,
      operation: operation
    });

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
        const threadsTable = `${schema}-${app}-Threads`;
        const command = new QueryCommand({
          TableName: threadsTable,
          IndexName: "userId-updatedAt-index",
          KeyConditionExpression: "userId = :userId AND updatedAt >= :startDate",
          ExpressionAttributeValues: {
            ":userId": userId,
            ":startDate": startDate.getTime(),
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
            startDate: startDate.getTime(),
          },
          metadata: {
            requestId: `agent-usage-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "agent.getTokenUsage",
          },
        };
      }

      case "getThreads": {
        const { agentId, projectId, threadType, limit = 50 } = data;
        const threadsTable = `${schema}-${app}-Threads`;

        let command;

        if (agentId || projectId || threadType) {
          // Use scan with filters for complex filtering
          const filterExpressions = ["userId = :userId"];
          const expressionAttributeValues: any = { ":userId": userId };

          if (agentId) {
            filterExpressions.push("agentId = :agentId");
            expressionAttributeValues[":agentId"] = agentId;
          }

          if (projectId) {
            filterExpressions.push("projectId = :projectId");
            expressionAttributeValues[":projectId"] = projectId;
          }

          if (threadType) {
            filterExpressions.push("threadType = :threadType");
            expressionAttributeValues[":threadType"] = threadType;
          }

          command = new QueryCommand({
            TableName: threadsTable,
            IndexName: "user-index",
            KeyConditionExpression: "userId = :userId",
            FilterExpression: filterExpressions.slice(1).join(" AND "), // Skip userId as it's in KeyCondition
            ExpressionAttributeValues: expressionAttributeValues,
            ScanIndexForward: false, // Most recent first
            Limit: limit,
          });
        } else {
          // Standard query without filters
          command = new QueryCommand({
            TableName: threadsTable,
            IndexName: "user-index",
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
              ":userId": userId,
            },
            ScanIndexForward: false, // Most recent first
            Limit: limit,
          });
        }

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

        const threadsTable = `${schema}-${app}-Threads`;
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
        const { title, model, provider, settings, agentId, projectId, threadType = 'chat' } = data;
        const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();

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
          agentId,
          projectId,
          threadType,
          app: app || 'core',
          entityType: 'thread',
          metadata: {
            messageCount: 0,
            totalTokens: 0,
            lastActivity: now,
            lastMessageAt: now,
            tokenUsage: {
              total: 0,
              input: 0,
              output: 0,
            },
          },
        };

        const threadsTable = `${schema}-${app}-Threads`;

        console.log("🔍 Agent Service - Creating thread:", {
          threadId: threadId,
          userId: userId,
          tableName: threadsTable
        });
        const command = new PutCommand({
          TableName: threadsTable,
          Item: thread,
        });

        try {
          await client.send(command);
          console.log("✅ Thread created successfully:", threadId);
        } catch (dbError) {
          console.error("❌ DynamoDB error creating thread:", dbError);
          return {
            success: false,
            error: `Failed to create thread: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`,
            metadata: {
              requestId: `agent-error-${Date.now()}`,
              timestamp: new Date().toISOString(),
              source: "agent.createThread",
            },
          };
        }

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

        const threadsTable = `${schema}-${app}-Threads`;
        
        // Build update expression
        const updateExpressions: string[] = [];
        const expressionAttributeValues: any = {
          ":updatedAt": Date.now(),
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

        const threadsTable = `${schema}-${app}-Threads`;
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
        const { threadId, message, settings = {}, attachments = [] } = data;

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

        try {
          // Get current thread
          const threadsTable = `${schema}-${app}-Threads`;
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

          const thread = getResult.Items[0] as AgentThread;
          const currentMessages = thread.messages || [];
          const now = Date.now();
          const timestamp = now;

          // Create user message
          const userMessage: AgentMessage = {
            id: `msg_${now}_${Math.random().toString(36).substr(2, 9)}`,
            threadId,
            role: "user",
            content: message,
            timestamp: now,
            createdAt: now,
            attachments: attachments,
          };

          // Prepare messages for AI
          const allMessages = [...currentMessages, userMessage];
          const aiMessages = convertToAIMessages(allMessages);

          // Add system prompt if available
          if (thread.settings?.systemPrompt) {
            aiMessages.unshift({
              role: 'system',
              content: thread.settings.systemPrompt,
            });
          }

          // Get AI model
          const model = getAIModel(
            thread.provider || settings.provider || 'openai',
            thread.model || settings.model || 'gpt-4o'
          );

          // Generate AI response
          const aiResponse = await generateText({
            model,
            messages: aiMessages,
            temperature: thread.settings?.temperature || settings.temperature || 0.7,
          });

          // Create assistant message with proper token usage from AI SDK v5
          const assistantMessage: AgentMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            threadId,
            role: "assistant",
            content: aiResponse.text,
            timestamp: Date.now(),
            createdAt: Date.now(),
            tokenUsage: aiResponse.usage ? {
              input: (aiResponse.usage as any).promptTokens || 0,
              output: (aiResponse.usage as any).completionTokens || 0,
              total: (aiResponse.usage as any).totalTokens || 0,
              promptTokens: (aiResponse.usage as any).promptTokens || 0,
              completionTokens: (aiResponse.usage as any).completionTokens || 0,
              totalTokens: (aiResponse.usage as any).totalTokens || 0,
            } : undefined,
          };

          // Update thread with new messages and token tracking
          const updatedMessages = [...allMessages, assistantMessage];
          const newTokenUsage = assistantMessage.tokenUsage?.total || 0;

          const updatedMetadata = {
            messageCount: updatedMessages.length,
            totalTokens: (thread.metadata?.totalTokens || 0) + newTokenUsage,
            lastActivity: timestamp,
            lastMessageAt: timestamp,
            tokenUsage: {
              total: (thread.metadata?.tokenUsage?.total || 0) + newTokenUsage,
              input: (thread.metadata?.tokenUsage?.input || 0) + (assistantMessage.tokenUsage?.input || 0),
              output: (thread.metadata?.tokenUsage?.output || 0) + (assistantMessage.tokenUsage?.output || 0),
            },
          };

          // Generate title for first message if thread title is "New Chat"
          let updatedTitle = thread.title;
          if (currentMessages.length === 0 && (thread.title === "New Chat" || !thread.title)) {
            try {
              const titleResponse = await generateText({
                model,
                messages: [
                  {
                    role: 'system',
                    content: 'Summarize the user\'s request in 3-5 words for a chat thread title. Be concise and descriptive. Do not use quotes or special characters.'
                  },
                  {
                    role: 'user',
                    content: message
                  }
                ],
                temperature: 0.3,
                maxOutputTokens: 20
              });

              // Clean and truncate the title
              updatedTitle = titleResponse.text
                .replace(/['"]/g, '')
                .trim()
                .slice(0, 50);

              console.log(`Generated title for thread ${threadId}: "${updatedTitle}"`);
            } catch (titleError) {
              console.error('Failed to generate title:', titleError);
              // Keep original title if generation fails
            }
          }

          const updateCommand = new UpdateCommand({
            TableName: threadsTable,
            Key: { id: threadId, userId },
            UpdateExpression: "SET messages = :messages, updatedAt = :updatedAt, metadata = :metadata, title = :title",
            ExpressionAttributeValues: {
              ":messages": updatedMessages,
              ":updatedAt": timestamp,
              ":metadata": updatedMetadata,
              ":title": updatedTitle,
            },
            ReturnValues: "ALL_NEW",
          });

          const updateResult = await client.send(updateCommand);

          return {
            success: true,
            data: {
              thread: updateResult.Attributes,
              tokenUsage: assistantMessage.tokenUsage,
              userMessage,
              assistantMessage,
            },
            metadata: {
              requestId: `agent-send-${Date.now()}`,
              timestamp: new Date().toISOString(),
              source: "agent.sendMessage",
            },
          };
        } catch (error) {
          console.error("AI generation error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to generate AI response",
            metadata: {
              requestId: `agent-error-${Date.now()}`,
              timestamp: new Date().toISOString(),
              source: "agent.sendMessage",
            },
          };
        }
      }

      case "streamMessage": {
        const { threadId, message, settings = {} } = data;

        if (!threadId || !message) {
          return {
            success: false,
            error: "Thread ID and message are required",
            metadata: {
              requestId: `agent-error-${Date.now()}`,
              timestamp: new Date().toISOString(),
              source: "agent.streamMessage",
            },
          };
        }

        try {
          // Get current thread
          const threadsTable = `${schema}-${app}-Threads`;
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
                source: "agent.streamMessage",
              },
            };
          }

          const thread = getResult.Items[0] as AgentThread;
          const currentMessages = thread.messages || [];

          // Create user message
          const userMessage: AgentMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            threadId,
            role: "user",
            content: message,
            timestamp: Date.now(),
            createdAt: Date.now(),
          };

          // Prepare messages for AI
          const allMessages = [...currentMessages, userMessage];
          const aiMessages = convertToAIMessages(allMessages);

          // Add system prompt if available
          if (thread.settings?.systemPrompt) {
            aiMessages.unshift({
              role: 'system',
              content: thread.settings.systemPrompt,
            });
          }

          // Get AI model
          const model = getAIModel(
            thread.provider || settings.provider || 'openai',
            thread.model || settings.model || 'gpt-4o'
          );

          // Generate streaming response
          const streamResult = await streamText({
            model,
            messages: aiMessages,
            temperature: thread.settings?.temperature || settings.temperature || 0.7,
          });

          // Convert to readable stream for response
          const stream = streamResult.toTextStreamResponse();

          return {
            success: true,
            data: {
              stream,
              userMessage,
              threadId,
            },
            metadata: {
              requestId: `agent-stream-${Date.now()}`,
              timestamp: new Date().toISOString(),
              source: "agent.streamMessage",
            },
          };
        } catch (error) {
          console.error("AI streaming error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to stream AI response",
            metadata: {
              requestId: `agent-error-${Date.now()}`,
              timestamp: new Date().toISOString(),
              source: "agent.streamMessage",
            },
          };
        }
      }

      case "uploadFile": {
        const { file, threadId, fileName, contentType } = data;

        if (!file || !fileName) {
          return {
            success: false,
            error: "File data and fileName are required",
            metadata: {
              requestId: `agent-error-${Date.now()}`,
              timestamp: new Date().toISOString(),
              source: "agent.uploadFile",
            },
          };
        }

        try {
          // Generate S3 key
          const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const s3Key = `agent-files/${userId}/${threadId || 'general'}/${fileId}_${fileName}`;
          const bucket = process.env.S3_BUCKET || 'captify-files';

          // Upload to S3
          const s3Result = await s3.execute(
            {
              service: "s3",
              operation: "put",
              data: {
                bucket,
                key: s3Key,
                body: file,
                contentType: contentType || 'application/octet-stream',
                metadata: {
                  userId,
                  threadId: threadId || '',
                  originalName: fileName,
                  uploadedAt: new Date().toISOString(),
                },
              },
            },
            credentials
          );

          // Create attachment record
          const attachment: AgentAttachment = {
            id: fileId,
            type: contentType?.startsWith('image/') ? 'image' : 'file',
            name: fileName,
            url: s3Result.success && s3Result.data ? s3Result.data.location : '',
            size: Buffer.byteLength(file),
            mimeType: contentType || 'application/octet-stream',
            s3Key,
            bucket,
          };

          return {
            success: true,
            data: attachment,
            metadata: {
              requestId: `agent-upload-${Date.now()}`,
              timestamp: new Date().toISOString(),
              source: "agent.uploadFile",
            },
          };
        } catch (error) {
          console.error("File upload error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to upload file",
            metadata: {
              requestId: `agent-error-${Date.now()}`,
              timestamp: new Date().toISOString(),
              source: "agent.uploadFile",
            },
          };
        }
      }

      case "getFile": {
        const { fileId, s3Key } = data;

        if (!fileId && !s3Key) {
          return {
            success: false,
            error: "File ID or S3 key is required",
            metadata: {
              requestId: `agent-error-${Date.now()}`,
              timestamp: new Date().toISOString(),
              source: "agent.getFile",
            },
          };
        }

        try {
          const bucket = process.env.S3_BUCKET || 'captify-files';
          const key = s3Key || `agent-files/${userId}/${fileId}`;

          // Get file from S3
          const fileResult = await s3.execute(
            {
              service: "s3",
              operation: "get",
              data: { bucket, key },
            },
            credentials
          );

          return {
            success: true,
            data: fileResult.success ? fileResult.data : fileResult,
            metadata: {
              requestId: `agent-file-${Date.now()}`,
              timestamp: new Date().toISOString(),
              source: "agent.getFile",
            },
          };
        } catch (error) {
          console.error("File retrieval error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to retrieve file",
            metadata: {
              requestId: `agent-error-${Date.now()}`,
              timestamp: new Date().toISOString(),
              source: "agent.getFile",
            },
          };
        }
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
  version: "1.1.0",
  description: "Agent service for AI chat functionality with real AI integration and file support",
  operations: [
    "getTokenUsage",
    "getThreads",
    "getThread",
    "createThread",
    "updateThread",
    "deleteThread",
    "sendMessage",
    "streamMessage",
    "uploadFile",
    "getFile",
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
    streamMessage: ["threadId", "message"],
    uploadFile: ["file", "fileName"],
    getFile: [], // fileId or s3Key required
    updateSettings: ["settings"],
  },
  features: [
    "Real AI integration with OpenAI, Anthropic, and AWS Bedrock",
    "Streaming responses for real-time chat experience",
    "File upload and management with S3 integration",
    "Message history and token usage tracking",
    "Configurable AI settings per thread",
    "Support for system prompts and custom instructions",
    "Attachment support for files and images",
    "User-level access control and thread isolation",
  ],
};

export const agent = { execute, manifest };