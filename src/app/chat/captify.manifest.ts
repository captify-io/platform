/**
 * Chat Package Manifest
 * Declares chat APIs and configuration to the Captify platform
 */

import { chatHandlers } from "./server/handlers";

export const chatManifest = {
  name: "chat",
  version: "1.0.0",
  description: "AI-powered chat interface with conversation management",
  routes: [
    {
      path: "/api/chat",
      method: "POST",
      secure: true,
      description: "Send chat messages",
      handler: chatHandlers.POST,
    },
    {
      path: "/api/chat",
      method: "GET",
      secure: true,
      description: "Retrieve chat messages",
      handler: chatHandlers.GET,
    },
  ],
};

export const manifests = {
  chat: chatManifest,
};
