/**
 * Chat API Client Implementation for Chat Package
 * Provides chat-specific API functionality following the ChatApiClient interface
 */

import type { ChatThread, ChatAgent, ChatApiClient } from "../hooks/useThreads";
import type { BreadcrumbItem } from "../hooks/useChatBreadcrumbs";

// Types from main app - these will be used by the console implementation
interface CreateThreadRequest {
  agentId?: string;
  title?: string;
}

interface UpdateThreadTitleRequest {
  threadId: string;
  title: string;
}

interface ChatHistoryResponse {
  threads: ChatThread[];
  nextCursor?: string;
}

interface BedrockAgentResponse {
  agents: ChatAgent[];
  defaultAgentId: string;
}

/**
 * Chat API Client Implementation
 * This implementation wraps the main app's API functionality
 */
export class ChatApiClientImpl implements ChatApiClient {
  private baseApiClient: any; // Will be injected from main app

  constructor(apiClient: any) {
    this.baseApiClient = apiClient;
  }

  async getThreads(): Promise<{ threads: ChatThread[] }> {
    const response = await this.baseApiClient.get("/api/chat/history");

    if (!response.success) {
      throw new Error(`Failed to get threads: ${response.error}`);
    }

    return { threads: response.data!.threads };
  }

  async getAgents(): Promise<{
    agents: ChatAgent[];
    defaultAgentId: string | null;
  }> {
    const response = await this.baseApiClient.get("/api/chat/bedrock-agent");

    if (!response.success) {
      throw new Error(`Failed to get agents: ${response.error}`);
    }

    return {
      agents: response.data!.agents,
      defaultAgentId: response.data!.defaultAgentId,
    };
  }

  async createThread(agentId?: string): Promise<{ threadId: string }> {
    const request: CreateThreadRequest = {};
    if (agentId) request.agentId = agentId;

    const response = await this.baseApiClient.post(
      "/api/chat/history",
      request
    );

    if (!response.success) {
      throw new Error(`Failed to create thread: ${response.error}`);
    }

    return { threadId: response.data!.id };
  }

  async renameThread(threadId: string, title: string): Promise<void> {
    const request: UpdateThreadTitleRequest = { threadId, title };

    const response = await this.baseApiClient.patch("/api/chat/title", request);

    if (!response.success) {
      throw new Error(`Failed to update thread title: ${response.error}`);
    }
  }

  async deleteThread(threadId: string): Promise<void> {
    const response = await this.baseApiClient.delete(
      `/api/chat/thread/${threadId}`
    );

    if (!response.success) {
      throw new Error(`Failed to delete thread: ${response.error}`);
    }
  }

  async pinThread(threadId: string, pinned: boolean): Promise<void> {
    const response = await this.baseApiClient.patch(
      `/api/chat/thread/${threadId}/pin`,
      { pinned }
    );

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
