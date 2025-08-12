/**
 * Console API Client
 * Handles all chat-related API calls with proper authentication via centralized ApiClient
 */

import { ApiClient } from "@/lib/api-client";
import type {
  ChatThread,
  ChatMessage,
  ChatHistoryResponse,
  CreateThreadRequest,
  UpdateThreadTitleRequest,
  ResetThreadRequest,
  SendMessageRequest,
  RunToolRequest,
  UpdateDatasourcesRequest,
  DatasourceResponse,
  BedrockAgentResponse,
  TokenState,
  ToolDescriptor,
} from "@/types/chat";

class ConsoleApiClient {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  // Agents & Threads
  async getAgents(): Promise<BedrockAgentResponse> {
    const response = await this.apiClient.get<BedrockAgentResponse>(
      "/api/chat/bedrock-agent"
    );

    if (!response.success) {
      throw new Error(`Failed to get agents: ${response.error}`);
    }

    return response.data!;
  }

  async getThreads(
    cursor?: string,
    agentId?: string,
    filter?: string
  ): Promise<ChatHistoryResponse> {
    const params = new URLSearchParams();
    if (cursor) params.append("cursor", cursor);
    if (agentId) params.append("agentId", agentId);
    if (filter) params.append("filter", filter);

    const url = `/api/chat/history${params.toString() ? `?${params}` : ""}`;
    const response = await this.apiClient.get<ChatHistoryResponse>(url);

    if (!response.success) {
      throw new Error(`Failed to get threads: ${response.error}`);
    }

    return response.data!;
  }

  async createThread(request: CreateThreadRequest): Promise<ChatThread> {
    const response = await this.apiClient.post<ChatThread>(
      "/api/chat/history",
      request
    );

    if (!response.success) {
      throw new Error(`Failed to create thread: ${response.error}`);
    }

    return response.data!;
  }

  async updateThreadTitle(
    request: UpdateThreadTitleRequest
  ): Promise<{ ok: boolean }> {
    const response = await this.apiClient.patch<{ ok: boolean }>(
      "/api/chat/title",
      request
    );

    if (!response.success) {
      throw new Error(`Failed to update thread title: ${response.error}`);
    }

    return response.data!;
  }

  async resetThread(request: ResetThreadRequest): Promise<{ ok: boolean }> {
    const response = await this.apiClient.post<{ ok: boolean }>(
      "/api/chat/reset",
      request
    );

    if (!response.success) {
      throw new Error(`Failed to reset thread: ${response.error}`);
    }

    return response.data!;
  }

  async deleteThread(threadId: string): Promise<{ ok: boolean }> {
    const response = await this.apiClient.delete<{ ok: boolean }>(
      `/api/chat/thread/${threadId}`
    );

    if (!response.success) {
      throw new Error(`Failed to delete thread: ${response.error}`);
    }

    return response.data!;
  }

  async pinThread(threadId: string, pinned: boolean): Promise<{ ok: boolean }> {
    const response = await this.apiClient.patch<{ ok: boolean }>(
      `/api/chat/thread/${threadId}/pin`,
      { pinned }
    );

    if (!response.success) {
      throw new Error(`Failed to pin/unpin thread: ${response.error}`);
    }

    return response.data!;
  }

  // Messaging (SSE) - Note: SSE will need special handling, for now return Promise
  async sendMessage(request: SendMessageRequest): Promise<Response> {
    // For SSE, we need to use the raw fetch with auth headers
    // TODO: Add SSE support to centralized ApiClient
    const authHeaders = await (
      this.apiClient as unknown as {
        getAuthHeaders(): Promise<Record<string, string>>;
      }
    ).getAuthHeaders();

    const response = await fetch("/api/chat/llm", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return response;
  }

  // Tools
  async getTools(): Promise<ToolDescriptor[]> {
    const response = await this.apiClient.get<ToolDescriptor[]>(
      "/api/chat/tools"
    );

    if (!response.success) {
      throw new Error(`Failed to get tools: ${response.error}`);
    }

    return response.data!;
  }

  async runTool(request: RunToolRequest): Promise<{ ok: boolean }> {
    const response = await this.apiClient.post<{ ok: boolean }>(
      "/api/chat/tools/run",
      request
    );

    if (!response.success) {
      throw new Error(`Failed to run tool: ${response.error}`);
    }

    return response.data!;
  }

  // Datasources
  async getDatasources(): Promise<DatasourceResponse> {
    const response = await this.apiClient.get<DatasourceResponse>(
      "/api/chat/datasource"
    );

    if (!response.success) {
      throw new Error(`Failed to get datasources: ${response.error}`);
    }

    return response.data!;
  }

  async updateDatasources(
    request: UpdateDatasourcesRequest
  ): Promise<{ ok: boolean }> {
    const response = await this.apiClient.post<{ ok: boolean }>(
      "/api/chat/datasource",
      request
    );

    if (!response.success) {
      throw new Error(`Failed to update datasources: ${response.error}`);
    }

    return response.data!;
  }

  // Tokens
  async getTokens(): Promise<TokenState> {
    const response = await this.apiClient.get<TokenState>("/api/chat/tokens");

    if (!response.success) {
      throw new Error(`Failed to get tokens: ${response.error}`);
    }

    return response.data!;
  }

  // Message history for a specific thread
  async getMessages(
    threadId: string,
    cursor?: string,
    limit?: number
  ): Promise<{
    messages: ChatMessage[];
    nextCursor?: string;
  }> {
    const params = new URLSearchParams();
    if (cursor) params.append("cursor", cursor);
    if (limit) params.append("limit", limit.toString());

    const url = `/api/chat/messages/${threadId}${
      params.toString() ? `?${params}` : ""
    }`;
    const response = await this.apiClient.get<{
      messages: ChatMessage[];
      nextCursor?: string;
    }>(url);

    if (!response.success) {
      throw new Error(`Failed to get messages: ${response.error}`);
    }

    return response.data!;
  }
}

// Export singleton instance
export const consoleApiClient = new ConsoleApiClient();
