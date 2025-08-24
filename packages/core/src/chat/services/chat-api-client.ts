/**
 * Chat API Client Implementation for Chat Package
 * Provides chat-specific API functionality using @captify/core API client
 * Connects directly to DynamoDB tables: captify-chats and captify-agents
 */

import type { ChatThread, ChatAgent, ChatApiClient } from "../hooks/useThreads";
import type { BreadcrumbItem } from "../hooks/useChatBreadcrumbs";
import type { CaptifyClient } from "../../api/client";

/**
 * Chat API Client Implementation
 * Uses the @captify/core CaptifyClient to interact with DynamoDB tables directly
 */
export class ChatApiClientImpl implements ChatApiClient {
  private captifyClient: CaptifyClient;

  constructor(captifyClient: CaptifyClient) {
    this.captifyClient = captifyClient;
  }

  async getThreads(): Promise<{ threads: ChatThread[] }> {
    const response = await this.captifyClient.get({
      table: "captify-chats",
      params: {
        // Get all chat threads for the current user
        // The API client should handle user filtering automatically
        limit: 100,
      },
    });

    if (!response.success) {
      throw new Error(`Failed to get threads: ${response.error}`);
    }

    // Transform DynamoDB items to ChatThread format
    const threads: ChatThread[] = (response.data?.items || []).map(
      (item: any) => ({
        id: item.thread_id || item.id,
        title: item.title || item.thread_title || "Untitled Thread",
        agentId: item.agent_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        isPinned: item.is_pinned || false,
        messageCount: item.message_count || 0,
      })
    );

    return { threads };
  }

  async getAgents(): Promise<{
    agents: ChatAgent[];
    defaultAgentId: string | null;
  }> {
    const response = await this.captifyClient.get({
      table: "captify-agents",
      params: {
        // Get all available agents
        limit: 100,
      },
    });

    if (!response.success) {
      throw new Error(`Failed to get agents: ${response.error}`);
    }

    // Transform DynamoDB items to ChatAgent format
    const agents: ChatAgent[] = (response.data?.items || []).map(
      (item: any) => ({
        id: item.agent_id || item.id,
        name: item.name || item.agent_name,
        description: item.description,
        isDefault: item.is_default || false,
      })
    );

    // Find default agent
    const defaultAgent = agents.find((agent) => agent.isDefault);
    const defaultAgentId = defaultAgent
      ? defaultAgent.id
      : agents.length > 0
      ? agents[0].id
      : null;

    return {
      agents,
      defaultAgentId,
    };
  }

  async createThread(agentId?: string): Promise<{ threadId: string }> {
    const threadId = `thread_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const now = new Date().toISOString();

    const response = await this.captifyClient.post({
      table: "captify-chats",
      item: {
        thread_id: threadId,
        agent_id: agentId,
        title: "New Conversation",
        created_at: now,
        updated_at: now,
        is_pinned: false,
        message_count: 0,
      },
    });

    if (!response.success) {
      throw new Error(`Failed to create thread: ${response.error}`);
    }

    return { threadId };
  }

  async renameThread(threadId: string, title: string): Promise<void> {
    const response = await this.captifyClient.put({
      table: "captify-chats",
      key: {
        thread_id: threadId,
      },
      item: {
        thread_id: threadId,
        title: title,
        updated_at: new Date().toISOString(),
      },
    });

    if (!response.success) {
      throw new Error(`Failed to update thread title: ${response.error}`);
    }
  }

  async deleteThread(threadId: string): Promise<void> {
    const response = await this.captifyClient.delete({
      table: "captify-chats",
      key: {
        thread_id: threadId,
      },
    });

    if (!response.success) {
      throw new Error(`Failed to delete thread: ${response.error}`);
    }
  }

  async pinThread(threadId: string, pinned: boolean): Promise<void> {
    const response = await this.captifyClient.put({
      table: "captify-chats",
      key: {
        thread_id: threadId,
      },
      item: {
        thread_id: threadId,
        is_pinned: pinned,
        updated_at: new Date().toISOString(),
      },
    });

    if (!response.success) {
      throw new Error(`Failed to pin/unpin thread: ${response.error}`);
    }
  }

  // Breadcrumb generation based on thread data
  generateBreadcrumbs(
    threadId?: string,
    threads?: ChatThread[],
    basePath: string = "/chat"
  ): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [{ label: "Chat", href: basePath }];

    if (threadId && threads) {
      const thread = threads.find((t) => t.id === threadId);
      if (thread) {
        breadcrumbs.push({
          label: thread.title || "Untitled Thread",
          href: `${basePath}#thread?id=${threadId}`,
        });
      }
    }

    return breadcrumbs;
  }
}
