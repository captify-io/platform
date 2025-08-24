"use client";

// Main chat layout component
export { ChatLayout } from "./components/ChatLayout";

// Console layout with full chat functionality
export { ConsoleLayout } from "./components/index";

// Full featured chat interface
export { ChatInterface } from "./components/ChatInterface";
export type { ChatInterfaceProps } from "./components/ChatInterface";
export { ChatContent } from "./components/ChatContent";
export { ChatHeader } from "./components/ChatHeader";
export { ChatFooter } from "./components/ChatFooter";
export { ChatSettings } from "./components/ChatSettings";

// Thread management components
export { ThreadList } from "./components/ThreadList";
export { ThreadPanelHeader } from "./components/ThreadPanelHeader";

// Panel components
export { ContextPanel } from "./components/ContextPanel";
export { ToolsPanel } from "./components/ToolsPanel";
export { ReasoningPanel } from "./components/ReasoningPanel";

// Chat history component
export { ChatHistory } from "./components/ChatHistory";
export type { ConversationSummary } from "./components/ChatHistory";

// Resizable chat panel (from core components)
export { ResizableChatPanel } from "../components/ChatLayout";

// Services - Client-side only
export { ChatApiClientImpl } from "./services/chat-api-client";

// Hooks - with prefixed names to avoid conflicts
export { useThreads } from "./hooks/useThreads";
export { useChatBreadcrumbs } from "./hooks/useChatBreadcrumbs";
export { useBreadcrumbs as useChatConsoleBreadcrumbs } from "./hooks/useBreadcrumbs";
export { useAuth as useChatAuth } from "./hooks/useAuth";

// Types - with prefixed names to avoid conflicts
export type { ChatThread, ChatAgent, ChatApiClient } from "./hooks/useThreads";
export type { BreadcrumbItem as ChatBreadcrumbItem } from "./hooks/useChatBreadcrumbs";
export type {
  BreadcrumbItem as ConsoleBreadcrumbItem,
  NavigationContextType,
  ChatThread as BreadcrumbChatThread,
} from "./hooks/useBreadcrumbs";
export type { Provider } from "./components/ChatInterface";

// Additional types
export * from "./types";
