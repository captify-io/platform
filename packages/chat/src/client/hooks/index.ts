/**
 * Hook exports for @captify/chat client-side
 */

// Hooks - with prefixed names to avoid conflicts
export { useThreads } from "./useThreads.js";
export { useChatBreadcrumbs } from "./useChatBreadcrumbs.js";
export { useBreadcrumbs as useChatConsoleBreadcrumbs } from "./useBreadcrumbs.js";
export { useAuth as useChatAuth } from "./useAuth.js";

// Types - with prefixed names to avoid conflicts
export type { ChatThread, ChatAgent, ChatApiClient } from "./useThreads.js";
export type { BreadcrumbItem as ChatBreadcrumbItem } from "./useChatBreadcrumbs.js";
export type {
  BreadcrumbItem as ConsoleBreadcrumbItem,
  NavigationContextType,
  ChatThread as BreadcrumbChatThread,
} from "./useBreadcrumbs.js";
