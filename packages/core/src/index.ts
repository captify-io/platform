"use client";

// Core types and utilities for Captify SDK - CLIENT-SIDE ONLY
export * from "./types";
export * from "./utils";
export * from "./config";
export * from "./validation";

// Export lib utilities (including cn function and ID generators)
export * from "./lib";

// Export hooks
export * from "./hooks";

// Export components
export * from "./components";

// Export chat functionality with explicit exports to avoid conflicts
export {
  ChatInterface,
  ChatContent,
  ChatHeader,
  ChatFooter,
  ChatSettings,
  ChatHistory,
  ThreadList,
  ThreadPanelHeader,
  ContextPanel,
  ToolsPanel,
  ReasoningPanel,
  ChatLayout,
  ConsoleLayout,
  ResizableChatPanel,
  useThreads,
  useChatBreadcrumbs,
  useChatConsoleBreadcrumbs,
  useChatAuth,
} from "./chat";

export type {
  ChatInterfaceProps,
  ConversationSummary,
  ChatThread,
  ChatAgent,
  ChatApiClient,
  ChatBreadcrumbItem,
  ConsoleBreadcrumbItem,
  NavigationContextType,
  BreadcrumbChatThread,
  Provider,
} from "./chat";

// Export context
export * from "./context";

// Export auth (client-side only)
export * from "./auth";

// Export API client (client-side only)
export * from "./api/client";

// Export AI SDK packages for centralized AI functionality
export { openai, createOpenAI } from "@ai-sdk/openai";
export { anthropic } from "@ai-sdk/anthropic";
export { azure } from "@ai-sdk/azure";
export { google } from "@ai-sdk/google";
export { streamText, generateText, generateObject } from "ai";
export { useChat, type Message } from "@ai-sdk/react";

// Export UI utilities
export { cva, type VariantProps } from "class-variance-authority";

// Export DynamicIcon for centralized icon usage
export { DynamicIcon, type IconName } from "lucide-react/dynamic";

// Export Radix UI components for centralized UI primitives
export * as AlertDialog from "@radix-ui/react-alert-dialog";
export * as Avatar from "@radix-ui/react-avatar";
export * as Dialog from "@radix-ui/react-dialog";
export * as DropdownMenu from "@radix-ui/react-dropdown-menu";
export * as Label from "@radix-ui/react-label";
export * as Progress from "@radix-ui/react-progress";
export * as ScrollArea from "@radix-ui/react-scroll-area";
export * as Select from "@radix-ui/react-select";
export * as Separator from "@radix-ui/react-separator";
export * as Slot from "@radix-ui/react-slot";
export * as Tabs from "@radix-ui/react-tabs";
export * as Tooltip from "@radix-ui/react-tooltip";
