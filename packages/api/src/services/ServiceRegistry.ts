/**
 * Service Registry Implementation
 * Dependency injection container for services
 */

import type { ServiceRegistry } from "../types";

export class ServiceRegistryImpl implements ServiceRegistry {
  private services = new Map<string, any>();

  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  get<T>(name: string): T | undefined {
    return this.services.get(name);
  }

  has(name: string): boolean {
    return this.services.has(name);
  }

  list(): string[] {
    return Array.from(this.services.keys());
  }

  clear(): void {
    this.services.clear();
  }
}
