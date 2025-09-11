export interface AgentSettings {
  model?: string;
  provider?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  tools?: AgentTool[];
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters?: Record<string, any>;
  enabled: boolean;
}

export interface AgentResponse {
  message: AgentMessage;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AgentThread {
  id: string;
  name?: string;
  title?: string;
  messages: AgentMessage[];
  settings: AgentSettings;
  createdAt: number;
  updatedAt: number;
}