/**
 * Service Registry
 * Dynamically registers and manages service modules
 * This allows the API to remain completely generic
 */

type ServiceModule = {
  services: {
    use: (serviceName: string) =>
      | {
          execute: (
            request: any,
            credentials?: any,
            session?: any
          ) => Promise<any>;
        }
      | undefined;
  };
};

class ServiceRegistry {
  private static instance: ServiceRegistry;
  private registry: Map<string, () => Promise<ServiceModule>> = new Map();

  private constructor() {
    // Register installed packages dynamically
    // Core is always available
    this.registerDynamicPackage("core");
    
    // Register pmbook if it's installed
    this.registerDynamicPackage("pmbook");
    
    // Future packages can be added here when installed
    // this.registerDynamicPackage("rmf");
    // this.registerDynamicPackage("admin");
    // this.registerDynamicPackage("mi");
  }

  /**
   * Dynamically register a package with the correct @captify-io scope
   */
  private registerDynamicPackage(slug: string) {
    this.registerPackage(
      slug,
      () => import(`@captify-io/${slug}/services`) as Promise<ServiceModule>
    );
  }

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Register a package loader
   */
  registerPackage(name: string, loader: () => Promise<ServiceModule>) {
    this.registry.set(name, loader);
  }

  /**
   * Get a service handler from a package
   */
  async getServiceHandler(packageName: string, serviceName: string) {
    // Check if package is registered
    const loader = this.registry.get(packageName);

    if (!loader) {
      // Try dynamic import for unregistered packages
      // This allows for truly dynamic package loading
      try {
        const serviceModule = await import(
          `@captify-io/${packageName}/services`
        );
        return serviceModule.services?.use(serviceName);
      } catch (error) {
        throw new Error(
          `Package @captify-io/${packageName} not found or not installed`
        );
      }
    }

    // Load the registered package
    const serviceModule = await loader();
    return serviceModule.services?.use(serviceName);
  }

  /**
   * List all registered packages
   */
  getRegisteredPackages(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Check if a package is registered
   */
  isPackageRegistered(packageName: string): boolean {
    return this.registry.has(packageName);
  }
}

export const serviceRegistry = ServiceRegistry.getInstance();
