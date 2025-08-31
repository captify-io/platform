/**
 * Core package menu configuration
 */

export const menu = {
  menuStructure: {
    title: "Core Platform",
    version: "1.0.0",
    sections: [
      {
        id: "policies-sops",
        title: "RMF",
        icon: "Shield",
        type: "section",
        items: [
          {
            id: "policies-overview",
            title: "Policies & SOPs",
            route: "policies",
            icon: "FileText",
            type: "page",
          },
          {
            id: "ssp",
            title: "System Security Plan (SSP)",
            route: "ssp",
            icon: "Shield",
            type: "page",
          },
          {
            id: "poams",
            title: "POA&Ms",
            route: "poams",
            icon: "AlertTriangle",
            type: "page",
          },
          {
            id: "change-requests",
            title: "Change Requests (CR)",
            route: "change-requests",
            icon: "GitBranch",
            type: "page",
          },
          {
            id: "assessments",
            title: "Assessments",
            route: "assessments",
            icon: "CheckCircle",
            type: "page",
          },
          {
            id: "compliance-profiles",
            title: "Compliance Profiles",
            route: "compliance-profiles",
            icon: "Award",
            type: "page",
          },
          {
            id: "reports-exports",
            title: "Reports & Exports",
            route: "reports",
            icon: "Download",
            type: "page",
          },
        ],
      },
      {
        id: "access-management",
        title: "Access Management",
        icon: "Users",
        type: "section",
        items: [
          {
            id: "user-groups",
            title: "User Groups",
            route: "user-groups",
            icon: "UsersIcon",
            type: "page",
          },
          {
            id: "users",
            title: "Users",
            route: "users",
            icon: "User",
            type: "page",
          },
          {
            id: "roles",
            title: "Roles",
            route: "roles",
            icon: "Crown",
            type: "page",
          },
          {
            id: "policies",
            title: "Policies",
            route: "access-policies",
            icon: "Key",
            type: "page",
          },
          {
            id: "identity-pools",
            title: "Identity Pools",
            route: "identity-pools",
            icon: "Database",
            type: "page",
          },
        ],
      },
      {
        id: "service-integrations",
        title: "Service Integrations",
        icon: "Plug",
        type: "section",
        items: [
          {
            id: "dynamodb",
            title: "DynamoDB",
            route: "dynamodb",
            icon: "Database",
            type: "page",
          },
          {
            id: "neptune",
            title: "Neptune",
            route: "neptune",
            icon: "Network",
            type: "page",
          },
          {
            id: "s3",
            title: "S3",
            route: "s3",
            icon: "HardDrive",
            type: "page",
          },
          {
            id: "bedrock",
            title: "Bedrock",
            route: "bedrock",
            icon: "Bot",
            type: "page",
          },
        ],
      },
      {
        id: "platform-settings",
        title: "Platform Settings",
        icon: "Settings",
        type: "page",
        route: "settings",
      },
    ],
  },
  metadata: {
    packageName: "core",
    version: "1.0.0",
    lastUpdated: "2025-08-30T00:00:00Z",
    installer: {
      tableName: "package_configurations",
      partitionKey: "packageName",
      sortKey: "configType",
      configType: "menu",
    },
  },
} as const;

export default menu;
