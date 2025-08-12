/**
 * Chat Data Types for Console & Dock Interface
 * Based on the specification for Captify Chat console
 */

// Core chat entities
export interface ChatAgentRef {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  default?: boolean;
}

export type MessageRole = "user" | "assistant" | "system";

export interface Citation {
  label: string;
  href?: string;
  sourceId?: string;
}

export interface ToolRun {
  id: string;
  name: string;
  status: "queued" | "running" | "succeeded" | "failed";
  input?: unknown; // tool-specific types at usage site
  output?: unknown; // tool-specific types at usage site
  outputRef?: string; // optional S3 ref for large payloads
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string; // markdown
  createdAt: string; // ISO
  toolRuns?: ToolRun[];
  citations?: Citation[];
  meta?: Record<string, unknown>;
}

export interface ChatThread {
  id: string;
  agentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  pinned?: boolean;
  datasources?: DatasourceRef[];
}

export type DatasourceKind =
  | "app-kb"
  | "aws"
  | "data-product"
  | "file"
  | "sharepoint";

export interface DatasourceRef {
  id: string;
  kind: DatasourceKind;
  label: string;
  locked?: boolean; // true for app KB
}

export interface ToolDescriptor {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  inputSchema?: Record<string, unknown>; // JSON schema / Zod JSON
}

// Streaming events
export type StreamingEventType =
  | "message_delta"
  | "message_done"
  | "toolrun_update"
  | "notice"
  | "tokens_update";

export interface StreamingEvent<T = unknown> {
  type: StreamingEventType;
  data: T;
}

// Token tracking
export interface TokenWindow {
  period: "daily" | "monthly";
  resetAt: string;
}

export interface TokenState {
  available: number;
  window: TokenWindow;
}

export interface TokensUpdate {
  available: number;
  estimatedNext: number;
  spentDelta?: number;
}

// API request/response types
export interface ChatHistoryResponse {
  threads: ChatThread[];
  nextCursor?: string;
}

export interface CreateThreadRequest {
  agentId: string;
}

export interface UpdateThreadTitleRequest {
  threadId: string;
  title: string;
}

export interface ResetThreadRequest {
  threadId: string;
}

export interface SendMessageRequest {
  threadId: string;
  content: string;
  datasources?: DatasourceRef[];
  attachments?: {
    id: string;
    name: string;
    size: number;
    type: string;
  }[];
}

export interface RunToolRequest {
  threadId: string;
  toolId: string;
  input: Record<string, unknown>;
}

export interface UpdateDatasourcesRequest {
  threadId: string;
  add?: DatasourceRef[];
  remove?: DatasourceRef[];
}

export interface DatasourceResponse {
  locked: DatasourceRef[];
  selectable: DatasourceRef[];
}

export interface BedrockAgentResponse {
  agents: ChatAgentRef[];
  defaultAgentId: string;
}

// Component props interfaces
export interface ChatInterfaceProps {
  mode: "console" | "dock";
  initialThreadId?: string;
  onThreadChange?: (threadId: string) => void;
}

export interface ChatHeaderProps {
  agent: ChatAgentRef;
  agents: ChatAgentRef[];
  title: string;
  tokenEstimate: number;
  tokenAvailable: number;
  onAgentChange: (id: string) => void;
  onRename: (title: string) => void;
  onStop: () => void;
  onRetry: () => void;
  onOpenSettings?: () => void;
}

export interface ComposerProps {
  disabled?: boolean;
  tokenEstimate: number;
  tokenAvailable: number;
  datasources: DatasourceRef[];
  onDatasourcesChange: (next: DatasourceRef[]) => void;
  onSend: (content: string, attachments?: File[]) => void;
}

export interface ThreadListProps {
  threads: ChatThread[];
  activeThreadId?: string;
  onThreadSelect: (threadId: string) => void;
  onThreadCreate: () => void;
  onThreadRename: (threadId: string, title: string) => void;
  onThreadDelete: (threadId: string) => void;
  onThreadPin: (threadId: string, pinned: boolean) => void;
}

export interface RightPaneProps {
  activeTab: "tools" | "context" | "agent";
  onTabChange: (tab: "tools" | "context" | "agent") => void;
  tools: ToolDescriptor[];
  datasources: DatasourceRef[];
  selectedDatasources: DatasourceRef[];
  agent: ChatAgentRef;
  onToolRun: (toolId: string, input: Record<string, unknown>) => void;
  onDatasourcesChange: (datasources: DatasourceRef[]) => void;
}

// Notice/alert types
export interface Notice {
  level: "info" | "warn" | "error";
  text: string;
}

// Utility types for streaming
export type MessageDelta = {
  id: string;
  role: MessageRole;
  chunk: string;
};

export type MessageDone = {
  id: string;
  role: MessageRole;
};
