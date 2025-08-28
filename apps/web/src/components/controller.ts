/**
 * Universal Manifest Loader
 * Works in both client and server contexts
 */

import { readdir } from "fs/promises";
import { join } from "path";

interface Application {
  slug: string;
  name: string;
  version: string;
  description: string;
  [key: string]: unknown;
}

export async function getManifest(slug: string) {
  try {
    const { captifyManifest } = await import(`@captify/${slug}`);
    return captifyManifest;
  } catch (error) {
    console.warn(`Could not load manifest for @captify/${slug}:`, error);
    return null;
  }
}

async function getKnownSlugs(): Promise<string[]> {
  try {
    const appsDir = join(process.cwd(), "apps");
    const appFolders = await readdir(appsDir);
    return appFolders;
  } catch (error) {
    console.error("Failed to read apps directory:", error);
    return [];
  }
}

// Application Controller object for layout compatibility
export const applicationController = {
  async getApplication(slug: string): Promise<Application | null> {
    try {
      const manifest = await getManifest(slug);
      if (!manifest) return null;

      return {
        slug,
        name: manifest.name || slug,
        version: manifest.version || "1.0.0",
        description: manifest.description || `${slug} application`,
        ...manifest,
      };
    } catch (error) {
      console.warn(`Could not get application ${slug}:`, error);
      return null;
    }
  },

  async getAllApplications(): Promise<Application[]> {
    const applications: Application[] = [];
    const slugs = await getKnownSlugs();
    for (const slug of slugs) {
      const app = await this.getApplication(slug);
      if (app) {
        applications.push(app);
      }
    }
    return applications;
  },
};

export async function findMatchingRoute(requestPath: string, method: string) {
  const slugs = await getKnownSlugs();
  for (const slug of slugs) {
    const manifest = await getManifest(slug);
    if (!manifest?.routes) continue;
    for (const route of manifest.routes) {
      const match = matchRoute(route.path, requestPath);
      if (match && route.handlers[method]) {
        return {
          handler: route.handlers[method],
          params: match.params,
          manifest: slug,
        };
      }
    }
  }
  return null;
}

function matchRoute(
  routePath: string,
  requestPath: string
): { params: Record<string, string> } | null {
  const routeRegex = routePath
    .replace(/\[\.\.\.([^\]]+)\]/g, "(?<$1>.*)")
    .replace(/\[([^\]]+)\]/g, "(?<$1>[^/]+)");

  const regex = new RegExp(`^${routeRegex}$`);
  const match = requestPath.match(regex);

  return match?.groups ? { params: match.groups } : null;
}

export async function getDebugInfo() {
  const manifests: Record<string, unknown>[] = [];
  const slugs = await getKnownSlugs();
  for (const slug of slugs) {
    const manifest = await getManifest(slug);
    if (manifest) manifests.push(manifest);
  }
  return {
    manifestCount: manifests.length,
    manifests: manifests.map((m) =>
      typeof m.slug === "string" ? m.slug : "unknown"
    ),
    knownSlugs: slugs,
  };
}

export async function getApplicationComponent(slug: string) {
  try {
    const packageModule = await import(`@captify/${slug}`);
    return (
      packageModule.default || packageModule[`${slug}App`] || packageModule.App
    );
  } catch (error) {
    console.warn(`Could not load component for @captify/${slug}:`, error);
    return null;
  }
}
