/**
 * Component exports for @captify/chat client-side
 */

// Main chat layout component
export { ChatLayout } from "./ChatLayout.js";

// Console layout with full chat functionality
export { ConsoleLayout } from "./ConsoleLayout.js";

// Full featured chat interface
export { ChatInterface } from "./ChatInterface.js";
export type { ChatInterfaceProps } from "./ChatInterface.js";
export { ChatContent } from "./ChatContent.js";
export { ChatHeader } from "./ChatHeader.js";
export { ChatFooter } from "./ChatFooter.js";
export { ChatSettings } from "./ChatSettings.js";

// Thread management components
export { ThreadList } from "./ThreadList.js";
export { ThreadPanelHeader } from "./ThreadPanelHeader.js";

// Panel components
export { ContextPanel } from "./ContextPanel.js";
export { ToolsPanel } from "./ToolsPanel.js";
export { ReasoningPanel } from "./ReasoningPanel.js";

// Chat history component
export { ChatHistory } from "./ChatHistory.js";
export type { ConversationSummary } from "./ChatHistory.js";
