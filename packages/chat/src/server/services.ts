/**
 * Chat Services
 * Helper functions for chat operations
 */

import { CaptifyApi } from "@captify/api";
import type { ApiUserSession } from "@captify/api";

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
  userSession: ApiUserSession,
  sessionId?: string,
  agentId?: string
): Promise<{ response: string; sessionId: string }> {
  try {
    // This would integrate with AWS Bedrock, OpenAI, etc.
    // For now, return a mock response
    const response = `Echo: ${message}`;
    const finalSessionId = sessionId || `session-${Date.now()}`;

    const captifyApi = new CaptifyApi();

    // Store user message
    await captifyApi.request({
      service: "chat",
      operation: "storeMessage",
      data: {
        content: message,
        role: "user",
        userId,
        sessionId: finalSessionId,
        agentId,
      },
      userSession,
    });

    // Store assistant response
    await captifyApi.request({
      service: "chat",
      operation: "storeMessage",
      data: {
        content: response,
        role: "assistant",
        userId,
        sessionId: finalSessionId,
        agentId,
      },
      userSession,
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
  userSession: ApiUserSession,
  agentId?: string,
  title?: string
): Promise<ChatSession> {
  const sessionId = `session-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;

  const session: ChatSession = {
    id: sessionId,
    userId,
    title: title || "New Chat",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    agentId,
  };

  const captifyApi = new CaptifyApi();
  const response = await captifyApi.request({
    service: "chat",
    operation: "createSession",
    data: session,
    userSession,
  });

  if (!response.success) {
    throw new Error(`Failed to create session: ${response.error}`);
  }

  return session;
}

/**
 * Get chat sessions for a user
 */
export async function getUserChatSessions(
  userId: string,
  userSession: ApiUserSession
): Promise<ChatSession[]> {
  const captifyApi = new CaptifyApi();
  const response = await captifyApi.request({
    service: "chat",
    operation: "getSessions",
    data: { userId },
    userSession,
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
  userId: string,
  userSession: ApiUserSession
): Promise<ChatMessage[]> {
  const captifyApi = new CaptifyApi();
  const response = await captifyApi.request({
    service: "chat",
    operation: "getMessages",
    data: { sessionId, userId },
    userSession,
  });

  if (!response.success) {
    throw new Error(`Failed to get messages: ${response.error}`);
  }

  return response.data || [];
}
