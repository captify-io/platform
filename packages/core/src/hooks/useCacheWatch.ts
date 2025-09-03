/**
 * Custom hook for watching cache changes
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { captifyCache } from "../lib";
import type { CacheEventType, CacheItem } from "../lib";

/**
 * Hook to watch for cache updates and trigger re-renders
 */
export function useCacheWatch(eventType: CacheEventType) {
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const unsubscribe = captifyCache.on(eventType, () => {
      setLastUpdate(Date.now());
    });

    return unsubscribe;
  }, [eventType]);

  return lastUpdate;
}

/**
 * Hook to watch specifically for applications cache updates
 */
export function useCachedApplications(): {
  applications: CacheItem[];
  isLoading: boolean;
  lastUpdate: number;
} {
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<CacheItem[]>([]);
  const lastUpdate = useCacheWatch("applications-updated");

  useEffect(() => {
    const updateApplications = () => {
      setApplications(captifyCache.getApplications());
    };

    const unsubscribeReady = captifyCache.on("cache-ready", () => {
      setIsLoading(false);
      updateApplications();
    });

    const unsubscribeUpdated = captifyCache.on("applications-updated", () => {
      updateApplications();
    });

    const unsubscribeCleared = captifyCache.on("cache-cleared", () => {
      setIsLoading(true);
      setApplications([]);
    });

    // Check if already ready
    if (captifyCache.isReady()) {
      setIsLoading(false);
      updateApplications();
    }

    return () => {
      unsubscribeReady();
      unsubscribeUpdated();
      unsubscribeCleared();
    };
  }, []);

  return { applications, isLoading, lastUpdate };
}

/**
 * Hook to watch specifically for users cache updates
 */
export function useCachedUsers(): {
  users: CacheItem[];
  isLoading: boolean;
  lastUpdate: number;
} {
  const [isLoading, setIsLoading] = useState(true);
  const lastUpdate = useCacheWatch("users-updated");

  useEffect(() => {
    const unsubscribeReady = captifyCache.on("cache-ready", () => {
      setIsLoading(false);
    });

    const unsubscribeCleared = captifyCache.on("cache-cleared", () => {
      setIsLoading(true);
    });

    // Check if already ready
    if (captifyCache.isReady()) {
      setIsLoading(false);
    }

    return () => {
      unsubscribeReady();
      unsubscribeCleared();
    };
  }, []);

  const users = captifyCache.getUsers();

  return { users, isLoading, lastUpdate };
}

/**
 * Hook to find and watch a specific cached application
 */
export function useCachedApplication(id: string): {
  application: CacheItem | undefined;
  isLoading: boolean;
} {
  const [isLoading, setIsLoading] = useState(true);
  const [application, setApplication] = useState<CacheItem | undefined>(
    undefined
  );
  useCacheWatch("applications-updated"); // Trigger re-render on updates

  useEffect(() => {
    const updateApplication = () => {
      const app = captifyCache.findApplication(id);
      setApplication(app);
    };

    const unsubscribeReady = captifyCache.on("cache-ready", () => {
      setIsLoading(false);
      updateApplication();
    });

    const unsubscribeUpdated = captifyCache.on("applications-updated", () => {
      updateApplication();
    });

    const unsubscribeCleared = captifyCache.on("cache-cleared", () => {
      setIsLoading(true);
      setApplication(undefined);
    });

    // Check if already ready
    if (captifyCache.isReady()) {
      setIsLoading(false);
      updateApplication();
    }

    return () => {
      unsubscribeReady();
      unsubscribeUpdated();
      unsubscribeCleared();
    };
  }, [id]);

  return { application, isLoading };
}
