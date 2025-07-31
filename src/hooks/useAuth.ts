"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  accessToken: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const { data: session, status } = useSession();

  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Update auth state based on NextAuth session
  useEffect(() => {
    if (status === "loading") {
      setAuthState({
        user: null,
        isLoading: true,
        isAuthenticated: false,
      });
    } else if (status === "authenticated" && session) {
      const user: AuthUser = {
        id: session.user?.email || "unknown",
        email: session.user?.email || "",
        name: session.user?.name || "",
        accessToken: session.accessToken || "",
      };

      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });
    } else {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, [session, status]);

  const getToken = useCallback(async (): Promise<string> => {
    if (!authState.isAuthenticated || !authState.user) {
      throw new Error("User not authenticated");
    }

    // Return the access token from the session
    return authState.user.accessToken;
  }, [authState.isAuthenticated, authState.user]);

  const login = useCallback(async (email: string, password: string) => {
    // Use NextAuth signIn
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      throw new Error(result.error);
    }
  }, []);

  const logout = useCallback(async () => {
    // Use NextAuth signOut
    await signOut({ redirect: false });
  }, []);

  return {
    ...authState,
    getToken,
    login,
    logout,
  };
}
