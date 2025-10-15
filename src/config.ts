import type { CaptifyLayoutConfig } from "@captify-io/core/components";

/**
 * Platform Configuration
 *
 * Platform provides authentication, AWS service proxy, and core management features.
 * These menu items are available across all applications in the platform.
 */

export const config: CaptifyLayoutConfig = {
  slug: "platform",
  appName: "Platform",
  version: "1.0.0",
  description: "Authentication and service platform",

  // Platform-level management menu items
  menu: [
    // ========================================
    // INSIGHTS - Parent menu with nested items
    // ========================================
    {
      id: "insights",
      label: "Insights",
      icon: "eye",
      href: "/insights",
      order: 1,
      description: "Analytics and platform management",
      isDefault: true,
      children: [
        {
          id: "providers",
          label: "Providers",
          icon: "plug",
          href: "/providers",
          order: 1,
          description: "Manage LLM providers and API keys",
          requiredGroups: ["admin"],
        },
        {
          id: "applications",
          label: "Applications",
          icon: "app-window",
          href: "/applications",
          order: 2,
          description: "Manage applications, properties, and settings",
          requiredGroups: ["admin"],
        },
        {
          id: "spaces",
          label: "Spaces",
          icon: "database",
          href: "/spaces",
          order: 3,
          description: "Manage data spaces with files and knowledge",
        },
      ],
    },

    // ========================================
    // AGENT BUILDER - Create assistants and agents
    // ========================================
    {
      id: "agent-builder",
      label: "Agent Builder",
      icon: "message-square",
      href: "/agent-builder",
      order: 2,
      description: "Create assistants and agents for specific topics and applications",
    },

    // ========================================
    // AGENT WORKFLOWS - Visual workflow builder for AWS Bedrock Agents
    // ========================================
    {
      id: "agent-workflows",
      label: "Agent Workflows",
      icon: "workflow",
      href: "/agent-workflows",
      order: 3,
      description: "Build complex agent workflows with visual builder",
    },
  ],

  // Platform configuration
  platform: {
    url:
      typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "https://www.captify.io",
  },
};

export const { slug, description, menu, appName, version } = config;
export default config;
