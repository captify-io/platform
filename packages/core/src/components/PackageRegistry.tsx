"use client";

// Static package registry to avoid dynamic imports with variables
const PACKAGE_LOADERS: Record<string, () => Promise<any>> = {
  core: () => import("../app"),
  mi: () => import("@captify/mi/app").catch(() => null),
  // Add new packages here as they're created
};

export function getPackageLoader(packageName: string): (() => Promise<any>) | null {
  return PACKAGE_LOADERS[packageName] || null;
}

export async function loadPackageRegistry(packageName: string) {
  // Prevent execution during SSR/SSG
  if (typeof window === 'undefined') {
    return null;
  }
  
  const packageLoader = getPackageLoader(packageName);
  if (!packageLoader) {
    console.warn(`Package ${packageName} not found in registry`);
    return null;
  }
  
  try {
    const appModule = await packageLoader();
    if (!appModule) {
      console.warn(`Package @captify/${packageName} not available`);
      return null;
    }

    // Get the component and page registries from the app module
    const { pages, components } = appModule;

    if (pages || components) {
      // Return a function that provides the component for specific routes
      return async (routeName: string) => {
        // Try pages first, then components
        const pageLoader = pages?.[routeName as keyof typeof pages] as any;
        if (pageLoader) {
          const loadedModule = await pageLoader();
          return loadedModule.default || loadedModule;
        }

        const componentLoader = components?.[
          routeName as keyof typeof components
        ] as any;
        if (componentLoader) {
          const loadedModule = await componentLoader();
          return loadedModule.default || loadedModule;
        }

        return null;
      };
    } else {
      return null;
    }
  } catch (error) {
    console.warn(`Failed to load package registry for ${packageName}:`, error);
    return null;
  }
}
