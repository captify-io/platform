/**
 * Agent Service - Handles LLM/Agent interactions using AI SDK
 */

import { generateText, streamText, generateObject, streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { bedrock } from '@ai-sdk/amazon-bedrock';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { AwsCredentials, ApiUserSession } from '../types';
import type { ModelMessage } from 'ai';
import type { 
  AgentRequest, 
  AgentThread, 
  AgentSettings, 
  AgentMessage, 
  AgentTool,
  AgentResponse,
  AgentUsage 
} from '../types/agent';

async function execute(
  request: AgentRequest,
  credentials: AwsCredentials,
  session: ApiUserSession
): Promise<AgentResponse> {
  if (!credentials) {
    return { success: false, error: 'AWS credentials required' };
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
  const schema = request.schema || 'captify';
  const userId = session.user.id || session.user.userId;

  try {
    switch (request.operation) {
      case 'createThread': {
        const { title, model = 'gpt-4o', provider = 'openai', settings = {} } = request.data || {};
        
        const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const thread: AgentThread = {
          // Core properties
          id: threadId,
          slug: `thread-${Date.now()}`,
          tenantId: (session as any).tenantId || 'default',
          name: title || 'New Chat',
          app: 'core',
          order: '0',
          fields: {},
          description: `Agent conversation thread`,
          ownerId: userId,
          createdAt: new Date().toISOString(),
          createdBy: userId,
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
          
          // AgentThread-specific properties
          userId,
          title: title || 'New Chat',
          messages: [],
          model,
          provider,
          settings: {
            model,
            provider,
            temperature: 0.7,
            maxTokens: 4000,
            ...settings,
          },
          metadata: {
            tokenUsage: { input: 0, output: 0, total: 0 },
            lastActivity: new Date().toISOString(),
            messageCount: 0,
          },
        };

        await docClient.send(new PutCommand({
          TableName: `${schema}-AgentThread`,
          Item: thread,
        }));

        return { success: true, data: thread };
      }

      case 'getThreads': {
        const { limit = 50 } = request.data || {};

        try {
          console.log(`[Agent Service] Getting threads for user: ${userId}, table: ${schema}-AgentThread`);
          
          const response = await docClient.send(new QueryCommand({
            TableName: `${schema}-AgentThread`,
            IndexName: 'userId-updatedAt-index',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
              ':userId': userId,
            },
            ScanIndexForward: false, // Most recent first
            Limit: limit,
          }));

          console.log(`[Agent Service] Query successful, found ${response.Items?.length || 0} threads`);
          return { success: true, data: response.Items || [] };
        } catch (error) {
          console.error('[Agent Service] Failed to query threads:', error);
          
          // If table doesn't exist, return empty array instead of failing
          if (error instanceof Error && error.name === 'ResourceNotFoundException') {
            console.log(`[Agent Service] Table ${schema}-AgentThread does not exist yet, returning empty array`);
            return { success: true, data: [] };
          }
          
          return { 
            success: false, 
            error: `Failed to query threads: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: error
          };
        }
      }

      case 'getThread': {
        const { threadId } = request.data || {};
        if (!threadId) {
          return { success: false, error: 'Thread ID required' };
        }

        const response = await docClient.send(new QueryCommand({
          TableName: `${schema}-AgentThread`,
          KeyConditionExpression: 'id = :threadId',
          ExpressionAttributeValues: {
            ':threadId': threadId,
          },
        }));

        if (!response.Items || response.Items.length === 0) {
          return { success: false, error: 'Thread not found' };
        }

        const thread = response.Items[0] as AgentThread;
        
        // Verify user owns this thread
        if (thread.userId !== userId) {
          return { success: false, error: 'Access denied' };
        }

        return { success: true, data: thread };
      }

      case 'sendMessage': {
        const { threadId, message, settings } = request.data || {};
        if (!threadId || !message) {
          return { success: false, error: 'Thread ID and message required' };
        }

        // Get thread
        const threadResult = await execute(
          { operation: 'getThread', data: { threadId }, schema: request.schema },
          credentials,
          session
        );

        if (!threadResult.success) {
          return threadResult;
        }

        const thread = threadResult.data as AgentThread;
        const currentSettings = { ...thread.settings, ...settings };

        // Add user message
        const userMessage: AgentMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          threadId,
          role: 'user',
          content: message,
        };

        const messages = [...thread.messages, userMessage];

        // Get AI response
        const model = getModelInstance(currentSettings);
        const result = await generateText({
          model,
          messages: convertToModelMessages(messages),
          temperature: currentSettings.temperature,
          maxOutputTokens: currentSettings.maxTokens,
          system: currentSettings.systemPrompt,
        });

        const assistantMessage: AgentMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          threadId,
          role: 'assistant',
          content: result.text,
          tokenUsage: {
            input: result.usage?.inputTokens || 0,
            output: result.usage?.outputTokens || 0,
          },
        };

        const updatedMessages = [...messages, assistantMessage];

        // Update thread
        const totalTokenUsage = {
          input: thread.metadata.tokenUsage.input + (result.usage?.inputTokens || 0),
          output: thread.metadata.tokenUsage.output + (result.usage?.outputTokens || 0),
          total: thread.metadata.tokenUsage.total + ((result.usage?.inputTokens || 0) + (result.usage?.outputTokens || 0)),
        };

        await docClient.send(new UpdateCommand({
          TableName: `${schema}-AgentThread`,
          Key: { id: threadId },
          UpdateExpression: 'SET messages = :messages, metadata = :metadata, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':messages': updatedMessages,
            ':metadata': {
              ...thread.metadata,
              tokenUsage: totalTokenUsage,
              lastActivity: new Date().toISOString(),
              messageCount: updatedMessages.length,
            },
            ':updatedAt': new Date().toISOString(),
          },
        }));

        return {
          success: true,
          data: {
            thread: { ...thread, messages: updatedMessages },
            message: assistantMessage,
            tokenUsage: totalTokenUsage,
          },
        };
      }

      case 'streamMessage': {
        // This will be handled differently in the API route to support streaming
        return { success: false, error: 'Streaming not supported in this context' };
      }

      case 'deleteThread': {
        const { threadId } = request.data || {};
        if (!threadId) {
          return { success: false, error: 'Thread ID required' };
        }

        // Verify ownership first
        const threadResult = await execute(
          { operation: 'getThread', data: { threadId }, schema: request.schema },
          credentials,
          session
        );

        if (!threadResult.success) {
          return threadResult;
        }

        // Soft delete - mark as deleted
        await docClient.send(new UpdateCommand({
          TableName: `${schema}-AgentThread`,
          Key: { id: threadId },
          UpdateExpression: 'SET #deleted = :deleted, updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#deleted': 'deleted',
          },
          ExpressionAttributeValues: {
            ':deleted': true,
            ':updatedAt': new Date().toISOString(),
          },
        }));

        return { success: true, data: { deleted: true } };
      }

      case 'updateThread': {
        const { threadId, updates } = request.data || {};
        if (!threadId || !updates) {
          return { success: false, error: 'Thread ID and updates required' };
        }

        // Verify ownership first
        const threadResult = await execute(
          { operation: 'getThread', data: { threadId }, schema: request.schema },
          credentials,
          session
        );

        if (!threadResult.success) {
          return threadResult;
        }

        const allowedUpdates = ['title', 'settings'];
        const updateExpression = [];
        const expressionAttributeValues: any = {
          ':updatedAt': new Date().toISOString(),
        };

        for (const [key, value] of Object.entries(updates)) {
          if (allowedUpdates.includes(key)) {
            updateExpression.push(`${key} = :${key}`);
            expressionAttributeValues[`:${key}`] = value;
          }
        }

        if (updateExpression.length === 0) {
          return { success: false, error: 'No valid updates provided' };
        }

        await docClient.send(new UpdateCommand({
          TableName: `${schema}-AgentThread`,
          Key: { id: threadId },
          UpdateExpression: `SET ${updateExpression.join(', ')}, updatedAt = :updatedAt`,
          ExpressionAttributeValues: expressionAttributeValues,
        }));

        return { success: true, data: { updated: true } };
      }

      case 'getTokenUsage': {
        const { period = 'month' } = request.data || {};
        
        try {
          // Get user's token usage for the period
          const startDate = getStartDateForPeriod(period);
          
          const response = await docClient.send(new QueryCommand({
            TableName: `${schema}-AgentThread`,
            IndexName: 'userId-updatedAt-index',
            KeyConditionExpression: 'userId = :userId AND updatedAt >= :startDate',
            ExpressionAttributeValues: {
              ':userId': userId,
              ':startDate': startDate,
            },
          }));

          const threads = response.Items || [];
          const totalUsage = threads.reduce((acc: any, thread: any) => ({
            input: acc.input + (thread.metadata?.tokenUsage?.input || 0),
            output: acc.output + (thread.metadata?.tokenUsage?.output || 0),
            total: acc.total + (thread.metadata?.tokenUsage?.total || 0),
          }), { input: 0, output: 0, total: 0 });

          return {
            success: true,
            data: {
              period,
              usage: totalUsage,
              threadCount: threads.length,
              startDate,
            },
          };
        } catch (error) {
          console.error('[Agent Service] Failed to get token usage:', error);
          
          // If table doesn't exist, return zero usage
          if (error instanceof Error && error.name === 'ResourceNotFoundException') {
            console.log(`[Agent Service] Table ${schema}-AgentThread does not exist yet, returning zero usage`);
            return {
              success: true,
              data: {
                period,
                usage: { input: 0, output: 0, total: 0 },
                threadCount: 0,
                startDate: getStartDateForPeriod(period),
              },
            };
          }
          
          return { 
            success: false, 
            error: `Failed to get token usage: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      }

      default:
        return { success: false, error: `Unknown operation: ${request.operation}` };
    }
  } catch (error) {
    console.error(`Error in agent service ${request.operation}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

function convertToModelMessages(messages: AgentMessage[]): ModelMessage[] {
  return messages.map(message => {
    switch (message.role) {
      case 'system':
        return {
          role: 'system',
          content: message.content,
        } as ModelMessage;
      case 'user':
        return {
          role: 'user',
          content: message.content,
        } as ModelMessage;
      case 'assistant':
        return {
          role: 'assistant',
          content: message.content,
        } as ModelMessage;
      case 'tool':
        return {
          role: 'tool',
          content: [{ 
            type: 'tool-result', 
            toolCallId: message.id,
            toolName: 'unknown',
            output: {
              type: 'text',
              value: message.content
            }
          }],
        } as ModelMessage;
      default:
        throw new Error(`Unknown message role: ${message.role}`);
    }
  });
}

function getModelInstance(settings: AgentSettings) {
  switch (settings.provider) {
    case 'openai':
      return openai(settings.model);
    case 'anthropic':
      return anthropic(settings.model);
    case 'bedrock':
      return bedrock(settings.model);
    default:
      return openai('gpt-4o');
  }
}

function getStartDateForPeriod(period: string): string {
  const now = new Date();
  switch (period) {
    case 'day':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      return weekStart.toISOString();
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    case 'year':
      return new Date(now.getFullYear(), 0, 1).toISOString();
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }
}

export const agent = {
  execute,
};