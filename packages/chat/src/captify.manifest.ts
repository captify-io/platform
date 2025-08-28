/**
 * Chat Package Manifest
 * Declares chat APIs and configuration to the Captify platform
 */

import { chatHandlers } from "./server/handlers.js";

export const captifyManifest = {
  slug: "chat",
  name: "Chat",
  version: "1.0.0",
  description: "AI-powered chat interface with conversation management",

  // Menu configuration for the platform
  menu: {
    label: "Chat",
    icon: "MessageSquare",
    order: 10,
  },

  // API routes this package contributes
  routes: [
    {
      path: "/api/chat",
      handlers: chatHandlers,
      secure: true,
      roles: ["user", "admin"],
      description: "Send and retrieve chat messages",
    },
    {
      path: "/api/chat/sessions",
      handlers: {
        GET: chatHandlers.GET,
        POST: async (req: Request) => {
          // Create new session endpoint
          const { userId, agentId, title } = await req.json();
          // Implementation would go here
          return new Response(
            JSON.stringify({ sessionId: `session-${Date.now()}` })
          );
        },
      },
      secure: true,
      roles: ["user", "admin"],
      description: "Manage chat sessions",
    },
  ],

  // Agent configuration
  agent: {
    enabled: true,
    model: "gpt-4o",
    systemPrompt:
      "You are a helpful AI assistant integrated into the Captify platform.",
    capabilities: [
      "text-generation",
      "conversation-memory",
      "context-awareness",
    ],
  },

  // Package dependencies
  dependencies: {
    "@captify/client": "^1.0.0",
  },

  // Client-side exports
  exports: {
    components: ["ChatInterface", "ChatHeader", "ChatMessage", "ChatInput"],
    hooks: ["useChat", "useChatHistory", "useChatSessions"],
  },
};
