"use client";

/**
 * React hook for managing application access
 * Uses the standard apiClient to communicate with the applicationAccess service
 */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { apiClient } from "../lib/api";
import type { App } from "../types";

// These types should be moved to shared if needed by multiple packages
type AppAccessRequest = any;
type UserAccessProfile = any;

export function useApplicationAccess() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myApps, setMyApps] = useState<App[]>([]);
  const [allApps, setAllApps] = useState<App[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AppAccessRequest[]>([]);

  /**
   * Fetch all installed applications
   */
  const fetchAllApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.run({
        app: "core",
        service: "applicationAccess",
        operation: "getInstalledApps",
      });
      
      if (response.success) {
        setAllApps(response.data || []);
      } else {
        throw new Error(response.error || "Failed to fetch applications");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch user's accessible applications
   */
  const fetchMyApps = useCallback(async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.run({
        app: "core",
        service: "applicationAccess",
        operation: "getUserApps",
      });
      
      if (response.success) {
        setMyApps(response.data || []);
      } else {
        throw new Error(response.error || "Failed to fetch your applications");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [session]);

  /**
   * Fetch user's pending access requests
   */
  const fetchPendingRequests = useCallback(async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // For now, we'll need to implement a user-specific pending requests operation
      // This is a placeholder that returns empty array
      setPendingRequests([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [session]);

  /**
   * Request access to an application
   */
  const requestAccess = useCallback(
    async (
      appId: string,
      justification: string,
      requestedRole?: string,
      autoExpireDays?: number
    ): Promise<boolean> => {
      if (!session?.user?.id || !session?.user?.email) {
        setError("You must be logged in to request access");
        return false;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.run({
          app: "core",
          service: "applicationAccess",
          operation: "requestAccess",
          data: {
            appId,
            justification,
            requestedRole,
            autoExpireDays,
          },
        });
        
        if (response.success) {
          // Refresh pending requests
          await fetchPendingRequests();
          return true;
        } else {
          throw new Error(response.error || "Failed to request access");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [session, fetchPendingRequests]
  );

  /**
   * Get user's access profile for a specific app
   */
  const getAccessProfile = useCallback(
    async (appId: string): Promise<UserAccessProfile | null> => {
      if (!session?.user?.id) return null;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.run<UserAccessProfile>({
          app: "core",
          service: "applicationAccess",
          operation: "getUserAccessProfile",
          data: { appId },
        });
        
        if (response.success) {
          return response.data || null;
        } else if (response.error?.includes("No access")) {
          return null;
        } else {
          throw new Error(response.error || "Failed to fetch access profile");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  /**
   * Check if user has access to an app
   */
  const hasAccess = useCallback(
    (appId: string): boolean => {
      return myApps.some(app => app.id === appId);
    },
    [myApps]
  );

  /**
   * Check if user has a pending request for an app
   */
  const hasPendingRequest = useCallback(
    (appId: string): boolean => {
      return pendingRequests.some(
        req => req.appId === appId && req.status === "pending"
      );
    },
    [pendingRequests]
  );

  // Load data on mount
  useEffect(() => {
    if (session?.user?.id) {
      fetchAllApps();
      fetchMyApps();
      fetchPendingRequests();
    }
  }, [session, fetchAllApps, fetchMyApps, fetchPendingRequests]);

  return {
    // State
    loading,
    error,
    myApps,
    allApps,
    pendingRequests,
    
    // Actions
    requestAccess,
    getAccessProfile,
    
    // Helpers
    hasAccess,
    hasPendingRequest,
    
    // Refresh methods
    refresh: {
      allApps: fetchAllApps,
      myApps: fetchMyApps,
      pendingRequests: fetchPendingRequests,
    },
  };
}

/**
 * Hook for admin functions
 */
export function useApplicationAdmin() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<AppAccessRequest[]>([]);

  /**
   * Fetch all pending access requests (admin)
   */
  const fetchPendingRequests = useCallback(async (appId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.run<AppAccessRequest[]>({
        app: "core",
        service: "applicationAccess",
        operation: "getPendingRequests",
        data: appId ? { appId } : undefined,
      });
      
      if (response.success) {
        setPendingRequests(response.data || []);
      } else {
        throw new Error(response.error || "Failed to fetch pending requests");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Approve an access request
   */
  const approveRequest = useCallback(
    async (
      requestId: string,
      roleId: string,
      reviewNotes?: string
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.run({
          app: "core",
          service: "applicationAccess",
          operation: "approveRequest",
          data: {
            requestId,
            roleId,
            reviewNotes,
          },
        });
        
        if (response.success) {
          // Refresh pending requests
          await fetchPendingRequests();
          return true;
        } else {
          throw new Error(response.error || "Failed to approve request");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchPendingRequests]
  );

  /**
   * Reject an access request
   */
  const rejectRequest = useCallback(
    async (requestId: string, reviewNotes: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.run({
          app: "core",
          service: "applicationAccess",
          operation: "rejectRequest",
          data: {
            requestId,
            reviewNotes,
          },
        });
        
        if (response.success) {
          // Refresh pending requests
          await fetchPendingRequests();
          return true;
        } else {
          throw new Error(response.error || "Failed to reject request");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchPendingRequests]
  );

  /**
   * Grant direct access to a user
   */
  const grantAccess = useCallback(
    async (
      userId: string,
      appId: string,
      roleId: string,
      justification?: string,
      expireDays?: number
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.run({
          app: "core",
          service: "applicationAccess",
          operation: "grantAccess",
          data: {
            userId,
            appId,
            roleId,
            justification,
            expireDays,
          },
        });
        
        if (response.success) {
          return true;
        } else {
          throw new Error(response.error || "Failed to grant access");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Revoke access from a user
   */
  const revokeAccess = useCallback(
    async (userId: string, appId: string, reason?: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.run({
          app: "core",
          service: "applicationAccess",
          operation: "revokeAccess",
          data: {
            userId,
            appId,
            reason,
          },
        });
        
        if (response.success) {
          return true;
        } else {
          throw new Error(response.error || "Failed to revoke access");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get app access summary
   */
  const getAppSummary = useCallback(
    async (appId: string): Promise<any | null> => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.run<any>({
          app: "core",
          service: "applicationAccess",
          operation: "getAppAccessSummary",
          data: { appId },
        });
        
        if (response.success) {
          return response.data || null;
        } else {
          throw new Error(response.error || "Failed to fetch app summary");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load pending requests on mount (if admin)
  useEffect(() => {
    // TODO: Check if user is admin
    if (session?.user?.id) {
      fetchPendingRequests();
    }
  }, [session, fetchPendingRequests]);

  return {
    // State
    loading,
    error,
    pendingRequests,
    
    // Actions
    approveRequest,
    rejectRequest,
    grantAccess,
    revokeAccess,
    getAppSummary,
    
    // Refresh methods
    refresh: {
      pendingRequests: fetchPendingRequests,
    },
  };
}