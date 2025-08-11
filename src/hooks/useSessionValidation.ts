/**
 * React hook for session validation and Identity Pool token management
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";

interface SessionValidationState {
  isValidating: boolean;
  hasCompleteSession: boolean;
  hasUserPoolTokens: boolean;
  hasIdentityPoolTokens: boolean;
  error: string | null;
  lastChecked: Date | null;
}

export function useSessionValidation(
  options: {
    validateOnMount?: boolean;
    autoRefreshIdentityPool?: boolean;
    checkInterval?: number;
  } = {}
) {
  const { isAuthenticated, user } = useAuth();

  const {
    validateOnMount = true,
    checkInterval = 5 * 60 * 1000, // 5 minutes
  } = options;

  const [validationState, setValidationState] =
    useState<SessionValidationState>({
      isValidating: false,
      hasCompleteSession: false,
      hasUserPoolTokens: false,
      hasIdentityPoolTokens: false,
      error: null,
      lastChecked: null,
    });

  const validateSession = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      setValidationState({
        isValidating: false,
        hasCompleteSession: false,
        hasUserPoolTokens: false,
        hasIdentityPoolTokens: false,
        error: "No authenticated session",
        lastChecked: new Date(),
      });
      return;
    }

    setValidationState((prev) => ({
      ...prev,
      isValidating: true,
      error: null,
    }));

    try {
      // Check User Pool tokens (from useAuth)
      const hasUserPoolTokens =
        isAuthenticated && !!user?.accessToken && !!user?.idToken;

      // Simplified session validation - only check User Pool tokens
      const hasCompleteSession = hasUserPoolTokens;

      setValidationState({
        isValidating: false,
        hasCompleteSession,
        hasUserPoolTokens,
        hasIdentityPoolTokens: hasUserPoolTokens, // Simplified to same as user pool tokens
        error: hasCompleteSession
          ? null
          : "Incomplete session - missing required tokens",
        lastChecked: new Date(),
      });
    } catch (error) {
      console.error("Session validation error:", error);
      setValidationState({
        isValidating: false,
        hasCompleteSession: false,
        hasUserPoolTokens: false,
        hasIdentityPoolTokens: false,
        error: `Session validation failed: ${error}`,
        lastChecked: new Date(),
      });
    }
  }, [isAuthenticated, user]);

  const ensureCompleteSession = useCallback(async (): Promise<boolean> => {
    await validateSession();
    return validationState.hasCompleteSession;
  }, [validateSession, validationState.hasCompleteSession]);

  // Initial validation on mount
  useEffect(() => {
    if (validateOnMount && isAuthenticated) {
      validateSession();
    }
  }, [validateOnMount, isAuthenticated, validateSession]);

  // Periodic validation
  useEffect(() => {
    if (checkInterval > 0 && isAuthenticated) {
      const interval = setInterval(validateSession, checkInterval);
      return () => clearInterval(interval);
    }
  }, [checkInterval, isAuthenticated, validateSession]);

  return {
    ...validationState,
    validateSession,
    ensureCompleteSession,
    // Convenience methods
    needsIdentityPoolRefresh:
      validationState.hasUserPoolTokens &&
      !validationState.hasIdentityPoolTokens,
    isFullyAuthenticated:
      validationState.hasCompleteSession && !validationState.isValidating,
  };
}
