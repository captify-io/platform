/**
 * Lightweight Client-Side Cache System
 * Caches essential data (id, name, order) for core tables
 */

// Cache event types for reactive updates
export type CacheEventType =
  | "applications-updated"
  | "users-updated"
  | "cache-ready"
  | "cache-cleared";

export interface CacheEvent {
  type: CacheEventType;
  data?: any;
}

export type CacheEventListener = (event: CacheEvent) => void;

export interface CacheItem {
  id: string;
  name: string;
  order?: number;
  icon?: string; // For applications
  package?: string; // For applications
}

export interface CacheState {
  users: CacheItem[];
  applications: CacheItem[];
  userState: CacheItem[];
  lastUpdated: number;
  userId: string; // Cache is tied to specific user
}

// Cache configuration
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = "captify-cache";

class CaptifyCache {
  private memoryCache: CacheState | null = null;
  private initialized = false;
  private eventListeners: Map<CacheEventType, Set<CacheEventListener>> =
    new Map();

  /**
   * Subscribe to cache events
   */
  on(eventType: CacheEventType, listener: CacheEventListener): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener);

    return () => {
      this.eventListeners.get(eventType)?.delete(listener);
    };
  }

  /**
   * Emit cache event
   */
  private emit(eventType: CacheEventType, data?: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener({ type: eventType, data });
        } catch (error) {
          console.error("Cache event listener error:", error);
        }
      });
    }
  }

  /**
   * Initialize cache for a specific user
   */
  async initialize(userId: string, apiClient: any): Promise<void> {
    if (this.initialized && this.memoryCache?.userId === userId) {
      return; // Already initialized for this user
    }

    console.log("📦 Initializing cache for user:", userId);

    try {
      // Try to load from sessionStorage first
      const cached = this.loadFromStorage();

      if (cached && cached.userId === userId && !this.isExpired(cached)) {
        this.memoryCache = cached;
        console.log("✅ Cache loaded from storage");
        this.initialized = true;
        return;
      }

      // Cache miss or expired - fetch fresh data
      await this.refreshCache(userId, apiClient);
      this.initialized = true;
      this.emit("cache-ready");
    } catch (error) {
      console.error("❌ Cache initialization failed:", error);
      this.memoryCache = this.createEmptyCache(userId);
      this.initialized = true;
      this.emit("cache-ready");
    }
  }

  /**
   * Refresh cache data from server
   */
  async refreshCache(userId: string, apiClient: any): Promise<void> {
    console.log("🔄 Refreshing cache data...");

    const [users, applications, userState] = await Promise.allSettled([
      this.fetchUsers(apiClient),
      this.fetchApplications(apiClient),
      this.fetchUserState(userId, apiClient),
    ]);

    this.memoryCache = {
      users: users.status === "fulfilled" ? users.value : [],
      applications:
        applications.status === "fulfilled" ? applications.value : [],
      userState: userState.status === "fulfilled" ? userState.value : [],
      lastUpdated: Date.now(),
      userId,
    };

    this.saveToStorage();
    console.log("✅ Cache refreshed successfully");
    this.emit("applications-updated", this.memoryCache.applications);
    this.emit("users-updated", this.memoryCache.users);
  }

  /**
   * Add or update an application in cache
   */
  updateApplication(app: CacheItem): void {
    if (!this.memoryCache) return;

    const index = this.memoryCache.applications.findIndex(
      (a) => a.id === app.id
    );
    if (index >= 0) {
      this.memoryCache.applications[index] = app;
    } else {
      this.memoryCache.applications.push(app);
      this.memoryCache.applications.sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      );
    }

    this.memoryCache.lastUpdated = Date.now();
    this.saveToStorage();
    this.emit("applications-updated", this.memoryCache.applications);
    console.log("📝 Application cache updated:", app.name);
  }

  /**
   * Add or update a user in cache
   */
  updateUser(user: CacheItem): void {
    if (!this.memoryCache) return;

    const index = this.memoryCache.users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      this.memoryCache.users[index] = user;
    } else {
      this.memoryCache.users.push(user);
    }

    this.memoryCache.lastUpdated = Date.now();
    this.saveToStorage();
    this.emit("users-updated", this.memoryCache.users);
    console.log("📝 User cache updated:", user.name);
  }

  /**
   * Remove an item from cache
   */
  removeApplication(id: string): void {
    if (!this.memoryCache) return;

    this.memoryCache.applications = this.memoryCache.applications.filter(
      (a) => a.id !== id
    );
    this.memoryCache.lastUpdated = Date.now();
    this.saveToStorage();
    this.emit("applications-updated", this.memoryCache.applications);
    console.log("🗑️ Application removed from cache:", id);
  }

  /**
   * Remove a user from cache
   */
  removeUser(id: string): void {
    if (!this.memoryCache) return;

    this.memoryCache.users = this.memoryCache.users.filter((u) => u.id !== id);
    this.memoryCache.lastUpdated = Date.now();
    this.saveToStorage();
    this.emit("users-updated", this.memoryCache.users);
    console.log("🗑️ User removed from cache:", id);
  }

  /**
   * Get applications (cached)
   */
  getApplications(): CacheItem[] {
    return this.memoryCache?.applications || [];
  }

  /**
   * Get users (cached)
   */
  getUsers(): CacheItem[] {
    return this.memoryCache?.users || [];
  }

  /**
   * Get user state items (cached)
   */
  getUserState(): CacheItem[] {
    return this.memoryCache?.userState || [];
  }

  /**
   * Find application by ID
   */
  findApplication(id: string): CacheItem | undefined {
    return this.getApplications().find((app) => app.id === id);
  }

  /**
   * Find user by ID
   */
  findUser(id: string): CacheItem | undefined {
    return this.getUsers().find((user) => user.id === id);
  }

  /**
   * Clear cache (logout)
   */
  clear(): void {
    this.memoryCache = null;
    this.initialized = false;
    sessionStorage.removeItem(CACHE_KEY);
    this.emit("cache-cleared");
    console.log("🗑️ Cache cleared");
  }

  /**
   * Check if cache is ready
   */
  isReady(): boolean {
    return this.initialized && this.memoryCache !== null;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    if (!this.memoryCache) return null;

    return {
      users: this.memoryCache.users.length,
      applications: this.memoryCache.applications.length,
      userState: this.memoryCache.userState.length,
      lastUpdated: new Date(this.memoryCache.lastUpdated).toISOString(),
      userId: this.memoryCache.userId,
    };
  }

  // Private methods

  private async fetchUsers(apiClient: any): Promise<CacheItem[]> {
    try {
      const response = await apiClient.run({
        service: "dynamo",
        operation: "scan",
        app: "core",
        table: "User",
        data: {
          ProjectionExpression: "id, #name, #order",
          ExpressionAttributeNames: {
            "#name": "name",
            "#order": "order",
          },
        },
      });

      return (response.Items || []).map((item: any) => ({
        id: item.id,
        name: item.name || item.id,
        order: item.order || 0,
      }));
    } catch (error) {
      console.warn("⚠️ Failed to fetch users for cache:", error);
      return [];
    }
  }

  private async fetchApplications(apiClient: any): Promise<CacheItem[]> {
    try {
      const response = await apiClient.run({
        service: "dynamo",
        operation: "scan",
        app: "core",
        table: "App",
        data: {
          ProjectionExpression: "id, #name, #order, icon, #package",
          ExpressionAttributeNames: {
            "#name": "name",
            "#order": "order",
            "#package": "package",
          },
        },
      });

      return (response.Items || [])
        .map((item: any) => ({
          id: item.id,
          name: item.name || item.id,
          order: item.order || 0,
          icon: item.icon,
          package: item.package,
        }))
        .sort((a: CacheItem, b: CacheItem) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.warn("⚠️ Failed to fetch applications for cache:", error);
      return [];
    }
  }

  private async fetchUserState(
    userId: string,
    apiClient: any
  ): Promise<CacheItem[]> {
    try {
      const response = await apiClient.run({
        service: "dynamo",
        operation: "query",
        app: "core",
        table: "UserState",
        data: {
          IndexName: "userId-index",
          KeyConditionExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": userId,
          },
          ProjectionExpression: "id, #name, #order",
          ExpressionAttributeNames: {
            "#name": "name",
            "#order": "order",
          },
        },
      });

      return (response.Items || []).map((item: any) => ({
        id: item.id,
        name: item.name || item.id,
        order: item.order || 0,
      }));
    } catch (error) {
      console.warn("⚠️ Failed to fetch user state for cache:", error);
      return [];
    }
  }

  private loadFromStorage(): CacheState | null {
    try {
      const stored = sessionStorage.getItem(CACHE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private saveToStorage(): void {
    if (this.memoryCache) {
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(this.memoryCache));
      } catch (error) {
        console.warn("⚠️ Failed to save cache to storage:", error);
      }
    }
  }

  private isExpired(cache: CacheState): boolean {
    return Date.now() - cache.lastUpdated > CACHE_EXPIRY_MS;
  }

  private createEmptyCache(userId: string): CacheState {
    return {
      users: [],
      applications: [],
      userState: [],
      lastUpdated: Date.now(),
      userId,
    };
  }
}

// Export singleton instance
export const captifyCache = new CaptifyCache();
