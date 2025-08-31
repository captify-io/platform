/**
 * Chat Services
 * Helper functions for chat operations
 */

import { apiClient } from "@/lib/api/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/lib/auth-config";

export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
  sessionId: string;
  userId: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  agentId?: string;
}

/**
 * Send message to LLM provider and handle response
 */
export async function processMessage(
  message: string,
  userId: string,
  sessionId?: string,
  agentId?: string
): Promise<{ response: string; sessionId: string }> {
  try {
    const session = (await getServerSession(authOptions as any)) as any;

    if (!session?.user) {
      throw new Error("Authentication required");
    }

    // This would integrate with AWS Bedrock, OpenAI, etc.
    // For now, return a mock response
    const response = `Echo: ${message}`;
    const finalSessionId = sessionId || `session-${Date.now()}`;

    // Store user message
    await apiClient.run({
      service: "dynamo",
      operation: "put",
      app: "chat",
      table: "messages",
      data: {
        values: [
          {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            content: message,
            role: "user",
            userId,
            sessionId: finalSessionId,
            timestamp: new Date().toISOString(),
            agentId,
          },
        ],
      },
    });

    // Store assistant response
    await apiClient.run({
      service: "dynamo",
      operation: "put",
      app: "chat",
      table: "messages",
      data: {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        content: response,
        role: "assistant",
        userId,
        sessionId: finalSessionId,
        timestamp: new Date().toISOString(),
        agentId,
      },
    });

    return {
      response,
      sessionId: finalSessionId,
    };
  } catch (error) {
    console.error("Process message error:", error);
    throw new Error("Failed to process message");
  }
}

/**
 * Create a new chat session
 */
export async function createChatSession(
  userId: string,
  agentId?: string,
  title?: string
): Promise<ChatSession> {
  const session = (await getServerSession(authOptions as any)) as any;

  if (!session?.user) {
    throw new Error("Authentication required");
  }

  const sessionId = `session-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;

  const chatSession: ChatSession = {
    id: sessionId,
    userId,
    title: title || "New Chat",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    agentId,
  };

  const response = await apiClient.run({
    service: "dynamo",
    operation: "put",
    app: "chat",
    table: "sessions",
    data: {
      values: [chatSession],
    },
  });

  if (!response.success) {
    throw new Error(`Failed to create session: ${response.error}`);
  }

  return chatSession;
}

/**
 * Get chat sessions for a user
 */
export async function getUserChatSessions(
  userId: string
): Promise<ChatSession[]> {
  const session = (await getServerSession(authOptions as any)) as any;

  if (!session?.user) {
    throw new Error("Authentication required");
  }

  const response = await apiClient.run({
    service: "dynamo",
    operation: "scan",
    app: "chat",
    table: "sessions",
    data: {
      values: [{ userId: userId }],
    },
  });

  if (!response.success) {
    throw new Error(`Failed to get sessions: ${response.error}`);
  }

  return response.data || [];
}

/**
 * Get messages for a chat session
 */
export async function getSessionMessages(
  sessionId: string,
  userId: string
): Promise<ChatMessage[]> {
  const session = (await getServerSession(authOptions as any)) as any;

  if (!session?.user) {
    throw new Error("Authentication required");
  }

  const response = await apiClient.run({
    service: "dynamo",
    operation: "query",
    app: "chat",
    table: "messages",
    data: {
      index: "sessionId-index",
      values: [{ sessionId: sessionId }],
    },
  });

  if (!response.success) {
    throw new Error(`Failed to get messages: ${response.error}`);
  }

  return response.data || [];
}
