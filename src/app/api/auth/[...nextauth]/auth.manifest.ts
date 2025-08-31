// Lightweight auth-only manifest
import { nextAuthHandlers } from "./auth";

// Auth manifest with only NextAuth handlers - no heavy dependencies
const authManifest = {
  name: "auth",
  version: "1.0.0",
  description: "Authentication API manifest",
  routes: [
    {
      path: "/api/auth/[...nextauth]",
      method: "GET",
      secure: false,
      description: "NextAuth GET handler",
      handler: nextAuthHandlers.GET,
    },
    {
      path: "/api/auth/[...nextauth]",
      method: "POST",
      secure: false,
      description: "NextAuth POST handler",
      handler: nextAuthHandlers.POST,
    },
  ],
};

export const manifests = {
  auth: authManifest,
};
