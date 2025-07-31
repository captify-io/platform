import {
  Application,
  ApplicationCategory,
  APPLICATION_CATEGORIES,
} from "@/types/application";
import demoApplicationsRaw from "./demo-applications.json";

/**
 * Validates and transforms raw JSON data into properly typed Application objects
 */
function validateAndTransformApplications(rawData: any[]): Application[] {
  return rawData.map((app: any): Application => {
    // Validate category
    const category = app.metadata.category as ApplicationCategory;
    if (!APPLICATION_CATEGORIES[category]) {
      console.warn(
        `Invalid category ${category} for app ${app.metadata.alias}, defaulting to 'custom'`
      );
      app.metadata.category = "custom";
    }

    // Ensure all required fields are present with defaults
    return {
      metadata: {
        ...app.metadata,
        category: app.metadata.category as ApplicationCategory,
        longDescription:
          app.metadata.longDescription || app.metadata.description,
        tags: app.metadata.tags || [],
      },
      aiAgent: {
        ...app.aiAgent,
        maxTokens: app.aiAgent.maxTokens || 4000,
        temperature: app.aiAgent.temperature || 0.3,
        capabilities: app.aiAgent.capabilities || [],
        knowledgeBases: app.aiAgent.knowledgeBases || [],
        tools: app.aiAgent.tools || [],
      },
      ui: {
        ...app.ui,
        navigation: app.ui.navigation || [],
        widgets: app.ui.widgets || [],
        chatConfig: app.ui.chatConfig
          ? {
              enableFileUpload: app.ui.chatConfig.enableFileUpload || false,
              maxFileSize: app.ui.chatConfig.maxFileSize || 10485760,
              allowedFileTypes: app.ui.chatConfig.allowedFileTypes || [],
              welcomeMessage:
                app.ui.chatConfig.welcomeMessage ||
                "Hello! How can I help you today?",
              placeholderText:
                app.ui.chatConfig.placeholderText || "Type your message...",
              showTypingIndicator:
                app.ui.chatConfig.showTypingIndicator !== false,
              maxMessages: app.ui.chatConfig.maxMessages || 100,
            }
          : undefined,
      },
      usage: {
        totalSessions: app.usage?.totalSessions || 0,
        totalMessages: app.usage?.totalMessages || 0,
        totalUsers: app.usage?.totalUsers || 0,
        averageSessionDuration: app.usage?.averageSessionDuration || 0,
        lastAccessed: app.usage?.lastAccessed || new Date().toISOString(),
        popularFeatures: app.usage?.popularFeatures || [],
        userRatings: {
          average: app.usage?.userRatings?.average || 0,
          count: app.usage?.userRatings?.count || 0,
        },
      },
      permissions: {
        requiredRoles: app.permissions?.requiredRoles || [],
        requiredClearance: app.permissions?.requiredClearance,
        departmentAccess: app.permissions?.departmentAccess,
        userGroups: app.permissions?.userGroups,
        customPermissions: app.permissions?.customPermissions || {},
      },
      demoData: app.demoData
        ? {
            sampleQueries: app.demoData.sampleQueries || [],
            sampleResponses: app.demoData.sampleResponses || [],
            mockData: app.demoData.mockData || {},
            scenarios: app.demoData.scenarios || [],
          }
        : undefined,
    };
  });
}

// Export the validated applications
export const demoApplications: Application[] =
  validateAndTransformApplications(demoApplicationsRaw);

// Export individual application lookup
export function getApplicationByAlias(alias: string): Application | undefined {
  return demoApplications.find((app) => app.metadata.alias === alias);
}

// Export helper functions
export function getApplicationsByCategory(
  category: ApplicationCategory
): Application[] {
  return demoApplications.filter((app) => app.metadata.category === category);
}

export function getApplicationsByStatus(status: string): Application[] {
  return demoApplications.filter((app) => app.metadata.status === status);
}

export function getActiveApplications(): Application[] {
  return demoApplications.filter((app) => app.metadata.status === "active");
}
