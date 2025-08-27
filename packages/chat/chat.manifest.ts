import type { ApplicationManifest } from "../../src/core/manifests/auth.manifest";

// Chat service manifest
export const chatManifest: ApplicationManifest = {
  slug: "chat",
  name: "AI Chat Service",
  version: "1.0.0",
  routes: [
    {
      path: "/api/chat/send",
      secure: true,
      roles: ["user", "admin"],
      description: "Send chat message",
    },
    {
      path: "/api/chat/history",
      secure: true,
      roles: ["user", "admin"],
      description: "Get chat history",
    },
    {
      path: "/api/chat/clear",
      secure: true,
      roles: ["user", "admin"],
      description: "Clear chat history",
    },
    {
      path: "/api/chat/settings",
      secure: true,
      roles: ["user", "admin"],
      description: "Chat settings",
    },
    {
      path: "/chat",
      secure: true,
      roles: ["user", "admin"],
      description: "Chat interface",
    },
  ],
};
