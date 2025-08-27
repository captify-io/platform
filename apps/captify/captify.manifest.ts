import { platformHandlers } from "./server/handlers";

export const captifyManifest = {
  slug: "captify",
  name: "Captify Platform",
  version: "1.0.0",
  description: "Platform management and application administration dashboard",

  // Menu configuration for the platform
  menu: {
    label: "Platform",
    icon: "Settings",
    order: 10,
  },

  // API routes this package contributes
  routes: [
    {
      path: "/api/captify/test",
      handlers: platformHandlers.test,
      secure: false,
      description: "Test endpoint for API connectivity",
    },
    {
      path: "/api/captify/applications",
      handlers: platformHandlers.applications,
      secure: true,
      description: "Manage platform applications",
    },
    {
      path: "/api/captify/users",
      handlers: platformHandlers.users,
      secure: true,
      description: "Manage platform users",
    },
    {
      path: "/api/captify/system/config",
      handlers: platformHandlers["system/config"],
      secure: true,
      description: "System configuration management",
    },
    {
      path: "/api/captify/dashboard/stats",
      handlers: platformHandlers["dashboard/stats"],
      secure: true,
      description: "Dashboard statistics and metrics",
    },
  ],

  // Database schema
  schema: {
    tables: [
      {
        name: "Application",
        partitionKey: "applicationId",
        sortKey: "version",
        attributes: {
          applicationId: "string",
          version: "string",
          name: "string",
          description: "string",
          status: "string",
          createdAt: "string",
          updatedAt: "string",
          config: "map",
        },
      },
      {
        name: "User",
        partitionKey: "userId",
        attributes: {
          userId: "string",
          email: "string",
          name: "string",
          role: "string",
          permissions: "stringSet",
          createdAt: "string",
          lastLogin: "string",
        },
      },
      {
        name: "SystemConfig",
        partitionKey: "configKey",
        attributes: {
          configKey: "string",
          value: "map",
          updatedAt: "string",
          updatedBy: "string",
        },
      },
    ],
  },

  // Permissions required
  permissions: [
    "dynamodb:read",
    "dynamodb:write",
    "s3:read",
    "s3:write",
    "platform:admin",
  ],
};
