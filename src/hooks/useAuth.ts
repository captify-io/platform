"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

interface ExtendedSession {
  accessToken?: string;
  idToken?: string;
  user?: {
    id?: string;
    email?: string;
    name?: string;
    image?: string;
  };
  // AWS Identity Pool credentials
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsSessionToken?: string;
  awsIdentityId?: string;
  awsExpiresAt?: number;
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
  accessToken: string;
  idToken: string;
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
    const updateAuthState = async () => {
      if (status === "loading") {
        setAuthState({
          user: null,
          isLoading: true,
          isAuthenticated: false,
        });
      } else if (status === "authenticated" && session) {
        const extendedSession = session as ExtendedSession;

        // Basic user data from session
        const userData = {
          id: session.user?.email || "unknown",
          email: session.user?.email || "",
          name: session.user?.name || "",
          accessToken: extendedSession.accessToken || "",
          idToken: extendedSession.idToken || "",
        };

        const user: AuthUser = {
          ...userData,
        };

        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        // User is not authenticated
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    updateAuthState();
  }, [session, status]);

  const getToken = useCallback(async (): Promise<string> => {
    if (!authState.isAuthenticated || !authState.user) {
      throw new Error("User not authenticated");
    }

    // Return the access token from the session
    return authState.user.accessToken;
  }, [authState.isAuthenticated, authState.user]);

  return {
    user: authState.user,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    getToken,
    signIn: () => signIn("cognito"),
    signOut,
  };
}
