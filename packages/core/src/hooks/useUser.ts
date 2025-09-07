/**
 * User Hook
 * Provides user registration, profile management, and status checking
 */
"use client";

import { useState, useEffect, useCallback } from "react";
// User is a core-specific type
type User = any;

interface UserStatus {
  isRegistered: boolean;
  status: "active" | "inactive" | "pending" | "suspended" | null;
  isAdmin: boolean;
  user: User | null;
}

interface UseUserReturn {
  user: User | null;
  userStatus: UserStatus | null;
  loading: boolean;
  error: string | null;
  registerUser: (userData: Partial<User>) => Promise<boolean>;
  updateProfile: (profileData: any) => Promise<boolean>;
  checkUserStatus: () => Promise<UserStatus | null>;
  refresh: () => void;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkUserStatus = useCallback(async (): Promise<UserStatus | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/captify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service: "user",
          operation: "checkUserStatus",
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setUserStatus(result.data);
        if (result.data.user) {
          setUser(result.data.user);
        }
        return result.data;
      } else {
        setError(result.error || "Failed to check user status");
        return null;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to check user status";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const registerUser = useCallback(
    async (userData: Partial<User>): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/captify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            service: "user",
            operation: "registerUser",
            data: userData,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setUser(result.data);
          // Update user status after registration
          await checkUserStatus();
          return true;
        } else {
          setError(result.error || "Failed to register user");
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to register user";
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [checkUserStatus]
  );

  const updateProfile = useCallback(
    async (profileData: any): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/captify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            service: "user",
            operation: "updateProfile",
            data: profileData,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setUser(result.data);
          return true;
        } else {
          setError(result.error || "Failed to update profile");
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update profile";
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const refresh = useCallback(() => {
    checkUserStatus();
  }, [checkUserStatus]);

  // Check user status on mount
  useEffect(() => {
    checkUserStatus();
  }, [checkUserStatus]);

  return {
    user,
    userStatus,
    loading,
    error,
    registerUser,
    updateProfile,
    checkUserStatus,
    refresh,
  };
}

/**
 * Hook for admin user management operations
 */
export function useUserAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/captify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service: "user",
          operation: "listUsers",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUsers(result.data);
        return result.data;
      } else {
        setError(result.error || "Failed to list users");
        return [];
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to list users";
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserStatus = useCallback(
    async (
      userId: string,
      status: "active" | "inactive" | "pending" | "suspended"
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/captify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            service: "user",
            operation: "updateUserStatus",
            data: { userId, status },
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Refresh the users list
          await listUsers();
          return true;
        } else {
          setError(result.error || "Failed to update user status");
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update user status";
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [listUsers]
  );

  // Load users on mount
  useEffect(() => {
    listUsers();
  }, [listUsers]);

  return {
    users,
    loading,
    error,
    listUsers,
    updateUserStatus,
    refresh: listUsers,
  };
}
