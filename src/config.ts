import type { CaptifyLayoutConfig } from "@captify-io/core/components";

/**
 * Captify Ontology Manager Configuration
 *
 * Unified application for managing operational AI ontology—
 * connecting strategy, funding, outcomes, and capabilities.
 *
 * Reference: specification.md for complete menu structure
 */

export const config: CaptifyLayoutConfig = {
  slug: "captify",
  appName: "AI HUB",
  version: "1.0.0",
  description: "Manage AI ontology, strategy, outcomes, and capabilities",

  // Bedrock agent configuration for ontology automation
  agentId: process.env.BEDROCK_AGENT_ID,
  agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID,

  // Menu structure based on specification.md
  // ALL PATHS PREFIXED WITH /captify TO AVOID CONFLICTS
  menu: [
    // ========================================
    // STRATEGY - Define strategy, map outcomes
    // ========================================
    {
      id: "strategy",
      label: "Strategy",
      icon: "target",
      href: "/captify/strategy",
      order: 2,
      description: "Define strategy, map outcomes, and align funding",
      requiredGroups: ["admin", "program-manager"],
      children: [
        {
          id: "strategy-objectives",
          label: "Objectives",
          icon: "map",
          href: "/captify/strategy/objectives",
          order: 1,
          description: "Manage strategic objectives and capability delivery",
        },
        {
          id: "strategy-outcomes",
          label: "Outcomes",
          icon: "flag",
          href: "/captify/strategy/outcomes",
          order: 2,
          description: "Track and evaluate mission/business outcomes",
        },
        {
          id: "strategy-usecases",
          label: "Use Cases",
          icon: "beaker",
          href: "/captify/strategy/usecases",
          order: 3,
          description: "Validation pipeline - experiment and validate new capabilities",
        },
        {
          id: "strategy-capabilities",
          label: "Capabilities",
          icon: "rocket",
          href: "/captify/strategy/capabilities",
          order: 4,
          description: "Delivery pipeline - deploy proven capabilities to production",
        },
      ],
    },

    // ========================================
    // ONTOLOGY - Manage AI Things
    // ========================================
    {
      id: "insights",
      label: "Insights",
      icon: "eye",
      href: "/captify/insights",
      order: 3,
      description: "Quick insights into analytics",
    },

    // ========================================
    // OPERATIONS - Daily delivery and governance
    // ========================================
    {
      id: "operations",
      label: "Operations",
      icon: "clipboard-list",
      href: "/captify/operations",
      order: 4,
      description: "Daily delivery and governance tracking",
      children: [
        {
          id: "operations-program",
          label: "Program",
          icon: "briefcase",
          href: "/captify/program",
          order: 1,
          description: "Cost, schedule, and performance alignment",
          requiredGroups: ["admin", "program-manager"],
        },
        {
          id: "operations-systems",
          label: "Systems",
          icon: "server",
          href: "/captify/operations/systems",
          order: 2,
          description: "System management and monitoring",
        },
        {
          id: "operations-tasks",
          label: "Tasks & Tickets",
          icon: "check-square",
          href: "/captify/operations/tasks",
          order: 3,
          description: "Task management and tickets",
        },
        {
          id: "operations-lifecycle",
          label: "Lifecycle Board",
          icon: "kanban",
          href: "/captify/operations/lifecycle",
          order: 4,
          description: "Kanban view: Ideation → Validation → Prototype → Operational → Continuous → Retired",
        },
        {
          id: "operations-reports",
          label: "Reports",
          icon: "file-bar-chart",
          href: "/captify/operations/reports",
          order: 5,
          description: "Performance reports and evidence",
          requiredGroups: ["admin", "program-manager", "cyber"],
        },
      ],
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
