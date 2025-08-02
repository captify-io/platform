import {
  Application,
  ApplicationCategory,
  APPLICATION_CATEGORIES,
} from "@/types/application";
import demoApplicationsRaw from "./demo-applications.json";

/**
 * Validates and transforms raw JSON data into properly typed Application objects
 */
function validateAndTransformApplications(rawData: unknown[]): Application[] {
  return rawData.map((app: unknown): Application => {
    const appData = app as Application;

    // Validate category
    const category = appData.metadata.category as ApplicationCategory;
    if (!APPLICATION_CATEGORIES[category]) {
      console.warn(
        `Invalid category ${category} for app ${appData.metadata.alias}, defaulting to 'custom'`
      );
      appData.metadata.category = "custom";
    }

    // Return the application with validated category
    return appData;
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
