"use client";

import { useCaptify } from "@/context/CaptifyContext";
import { useSession } from "next-auth/react";
import React, { useState, useEffect, useCallback } from "react";
import { apiClient } from "../lib/api/client";

interface AwsCredentialsInfo {
  hasCredentials: boolean;
  credentialsExpiry?: string;
  identityPoolId?: string;
  error?: string;
}

export function SessionDebug() {
  const { isAuthenticated } = useCaptify();
  const { data: session, status, update } = useSession();
  const [isClient, setIsClient] = useState(false);
  const [awsCredentials, setAwsCredentials] =
    useState<AwsCredentialsInfo | null>(null);
  const [testingCredentials, setTestingCredentials] = useState(false);
  const [refreshingSession, setRefreshingSession] = useState(false);
  const [refreshingTokens, setRefreshingTokens] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-refresh the UI every 10 seconds to show live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update countdown
      setIsClient(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const testAwsCredentials = useCallback(async () => {
    if (!session) return;

    setTestingCredentials(true);
    try {
      console.log("🧪 Testing AWS credentials...");
      console.log("Session expires at:", session.expires);
      console.log("Current time:", new Date().toISOString());

      // Make a simple API call to test credentials - use Applications table
      const response = await apiClient.run({
        service: "dynamo",
        operation: "scan",
        app: "core",
        table: "App",
        data: { Limit: 1 },
      });

      console.log("AWS credentials test result:", response);

      setAwsCredentials({
        hasCredentials: response.success,
        error: response.success ? undefined : response.error,
      });
    } catch (error) {
      console.error("❌ AWS credentials test error:", error);
      setAwsCredentials({
        hasCredentials: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setTestingCredentials(false);
    }
  }, [session]);

  // Test AWS credentials when session changes
  useEffect(() => {
    if (session && isClient) {
      testAwsCredentials();
    }
  }, [session, isClient, testAwsCredentials]);

  // Get AWS credentials status info
  const getAwsCredentialsInfo = () => {
    // This would ideally call the server to get credential status
    // For now, we'll show what we can determine from the test results
    if (!awsCredentials) return null;

    return {
      hasCredentials: awsCredentials.hasCredentials,
      error: awsCredentials.error,
    };
  };

  const forceSessionRefresh = async () => {
    setRefreshingSession(true);
    try {
      console.log("🔄 Forcing session refresh...");
      await update(); // This triggers NextAuth to refresh the session
      console.log("✅ Session refresh completed");

      // Test credentials after refresh
      setTimeout(() => {
        console.log("🧪 Testing credentials after session refresh...");
        testAwsCredentials();
      }, 1000);
    } catch (error) {
      console.error("❌ Session refresh failed:", error);
    } finally {
      setRefreshingSession(false);
    }
  };

  const manualTokenRefresh = async () => {
    setRefreshingTokens(true);
    try {
      console.log("🔄 Manually refreshing Cognito tokens...");

      const response = await fetch("/api/auth/refresh-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Token refresh failed");
      }

      console.log("✅ Manual token refresh completed:", result);

      // Force NextAuth to update its session with the new tokens
      await update();

      // Test credentials after refresh
      setTimeout(() => {
        console.log("🧪 Testing credentials after manual token refresh...");
        testAwsCredentials();
      }, 1000);
    } catch (error) {
      console.error("❌ Manual token refresh failed:", error);
    } finally {
      setRefreshingTokens(false);
    }
  };

  // Calculate time until session expiry using NextAuth's built-in expires
  const getTokenExpiryInfo = () => {
    if (!session?.expires) return null;

    const expiryTime = new Date(session.expires);

    // Check if the date is valid
    if (isNaN(expiryTime.getTime())) {
      return null;
    }

    const now = new Date();
    const timeUntilExpiry = expiryTime.getTime() - now.getTime();
    const minutesUntilExpiry = Math.floor(timeUntilExpiry / 1000 / 60);
    const secondsUntilExpiry = Math.floor((timeUntilExpiry / 1000) % 60);

    // AWS token expiration info
    const awsTokenExpiresAt = (session as any).awsTokenExpiresAt;
    let awsTokenInfo = null;

    if (awsTokenExpiresAt) {
      const awsExpiryTime = new Date(awsTokenExpiresAt * 1000);
      const awsTimeUntilExpiry = awsExpiryTime.getTime() - now.getTime();
      const awsMinutesUntilExpiry = Math.floor(awsTimeUntilExpiry / 1000 / 60);
      const awsSecondsUntilExpiry = Math.floor(
        (awsTimeUntilExpiry / 1000) % 60
      );

      awsTokenInfo = {
        expiryTime: awsExpiryTime.toLocaleString(),
        minutesUntilExpiry: awsMinutesUntilExpiry,
        secondsUntilExpiry: awsSecondsUntilExpiry,
        isExpired: awsTimeUntilExpiry <= 0,
        isNearExpiry: awsTimeUntilExpiry <= 5 * 60 * 1000, // 5 minutes
        shouldRefreshSoon: awsTimeUntilExpiry <= 60 * 1000, // 1 minute
      };
    }

    // NextAuth typically refreshes sessions automatically, but show when it would happen
    const refreshBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
    const refreshTime = new Date(expiryTime.getTime() - refreshBuffer);
    const timeUntilRefresh = refreshTime.getTime() - now.getTime();
    const minutesUntilRefresh = Math.floor(timeUntilRefresh / 1000 / 60);

    return {
      expiryTime: expiryTime.toLocaleString(),
      refreshTime: refreshTime.toLocaleString(),
      minutesUntilExpiry,
      secondsUntilExpiry,
      minutesUntilRefresh,
      isExpired: timeUntilExpiry <= 0,
      isNearExpiry: timeUntilExpiry <= 5 * 60 * 1000, // 5 minutes
      shouldRefreshSoon: timeUntilRefresh <= 60 * 1000, // 1 minute
      awsTokenInfo,
    };
  };

  // Get Cognito token status
  const getCognitoTokenStatus = () => {
    if (!session)
      return { status: "No Session", isExpired: true, timeUntilExpiry: 0 };

    const awsTokenExpiresAt = (session as any).awsTokenExpiresAt;
    const idToken = (session as any).idToken;
    const accessToken = (session as any).accessToken;

    // Check if tokens exist
    if (!idToken || !accessToken) {
      return { status: "Missing Tokens", isExpired: true, timeUntilExpiry: 0 };
    }

    // Check expiration if available
    if (awsTokenExpiresAt) {
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = awsTokenExpiresAt - now;

      if (timeUntilExpiry <= 0) {
        return { status: "Expired", isExpired: true, timeUntilExpiry: 0 };
      } else if (timeUntilExpiry <= 300) {
        // 5 minutes
        return { status: "Expiring Soon", isExpired: false, timeUntilExpiry };
      } else {
        return { status: "Active", isExpired: false, timeUntilExpiry };
      }
    }

    // If no expiration info but tokens exist
    return {
      status: "Active (No Expiry Info)",
      isExpired: false,
      timeUntilExpiry: null,
    };
  };

  const cognitoTokenStatus = getCognitoTokenStatus();
  const tokenExpiryInfo = getTokenExpiryInfo();

  // Only render on client to avoid hydration issues
  if (!isClient) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Loading Session Debug...
            </h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
      <h2 className="text-lg font-bold mb-4">Session Debug</h2>

      {/* User Info Header */}
      <div className="mb-6 p-3 bg-white dark:bg-gray-700 rounded border">
        <div className="text-sm space-y-1">
          <div>
            <strong>Status:</strong>{" "}
            <span
              className={`font-medium ${
                status === "authenticated" ? "text-green-600" : "text-red-600"
              }`}
            >
              {status}
            </span>
          </div>
          <div>
            <strong>Name:</strong> {session?.user?.name || "N/A"}
          </div>
          <div>
            <strong>Email:</strong> {session?.user?.email || "N/A"}
          </div>
        </div>
      </div>

      {/* Three Session Boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* NextAuth Session Box */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
            NextAuth Session
          </h3>

          <div className="space-y-2 text-sm">
            <div>
              <strong>Status:</strong>
              <span
                className={`ml-1 font-medium ${
                  status === "authenticated" ? "text-green-600" : "text-red-600"
                }`}
              >
                {status === "authenticated" ? "✅ Active" : "❌ Inactive"}
              </span>
            </div>

            {tokenExpiryInfo && (
              <div>
                <strong>Time until expires:</strong>
                <span
                  className={`ml-1 font-medium ${
                    tokenExpiryInfo.isExpired
                      ? "text-red-600"
                      : tokenExpiryInfo.isNearExpiry
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {Math.floor(tokenExpiryInfo.minutesUntilExpiry / 60)}h{" "}
                  {tokenExpiryInfo.minutesUntilExpiry % 60}m{" "}
                  {tokenExpiryInfo.secondsUntilExpiry}s
                </span>
              </div>
            )}

            <div className="mt-3">
              <strong>Raw Data:</strong>
              <pre className="mt-1 text-xs bg-white dark:bg-gray-800 p-2 rounded border overflow-auto max-h-32">
                {session
                  ? JSON.stringify(
                      {
                        expires: session.expires,
                        user: session.user,
                      },
                      null,
                      2
                    )
                  : "No session data"}
              </pre>
            </div>
          </div>
        </div>

        {/* Cognito Tokens Box */}
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-700">
          <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">
            Cognito Tokens
          </h3>

          <div className="space-y-2 text-sm">
            <div>
              <strong>Status:</strong>
              <span
                className={`ml-1 font-medium ${
                  cognitoTokenStatus.status === "Active"
                    ? "text-green-600"
                    : cognitoTokenStatus.status === "Expiring Soon"
                    ? "text-orange-600"
                    : cognitoTokenStatus.isExpired
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                {cognitoTokenStatus.status === "Active"
                  ? "✅ Active"
                  : cognitoTokenStatus.status === "Expiring Soon"
                  ? "⚠️ Expiring Soon"
                  : cognitoTokenStatus.status === "Expired"
                  ? "❌ Expired"
                  : cognitoTokenStatus.status === "Missing Tokens"
                  ? "❌ Missing Tokens"
                  : cognitoTokenStatus.status === "No Session"
                  ? "❌ No Session"
                  : `⚠️ ${cognitoTokenStatus.status}`}
              </span>
            </div>

            <div>
              <strong>Time until expires:</strong>
              <span
                className={`ml-1 font-medium ${
                  cognitoTokenStatus.isExpired
                    ? "text-red-600"
                    : cognitoTokenStatus.status === "Expiring Soon"
                    ? "text-orange-600"
                    : "text-green-600"
                }`}
              >
                {cognitoTokenStatus.timeUntilExpiry !== null &&
                cognitoTokenStatus.timeUntilExpiry !== undefined
                  ? `${Math.floor(
                      cognitoTokenStatus.timeUntilExpiry / 3600
                    )}h ${Math.floor(
                      (cognitoTokenStatus.timeUntilExpiry % 3600) / 60
                    )}m ${cognitoTokenStatus.timeUntilExpiry % 60}s`
                  : "Unknown"}
              </span>
            </div>

            <div className="mt-3">
              <strong>Raw Data:</strong>
              <pre className="mt-1 text-xs bg-white dark:bg-gray-800 p-2 rounded border overflow-auto max-h-32">
                {session
                  ? JSON.stringify(
                      {
                        idToken: (session as any).idToken
                          ? `Present (${(session as any).idToken.substring(
                              0,
                              20
                            )}...)`
                          : "Missing",
                        accessToken: (session as any).accessToken
                          ? `Present (${(session as any).accessToken.substring(
                              0,
                              20
                            )}...)`
                          : "Missing",
                        refreshToken: (session as any).refreshToken
                          ? "Present"
                          : "Missing",
                        awsTokenExpiresAt: (session as any).awsTokenExpiresAt,
                        expiresAtReadable: (session as any).awsTokenExpiresAt
                          ? new Date(
                              (session as any).awsTokenExpiresAt * 1000
                            ).toISOString()
                          : "Unknown",
                      },
                      null,
                      2
                    )
                  : "No token data"}
              </pre>

              {session && !(session as any).refreshToken && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded text-xs">
                  <div className="text-blue-800 dark:text-blue-200 font-medium">
                    ℹ️ No Refresh Token
                  </div>
                  <div className="text-blue-700 dark:text-blue-300 mt-1">
                    This Cognito setup doesn't provide refresh tokens. Tokens
                    will auto-refresh through NextAuth's session management or
                    require re-authentication when expired.
                  </div>
                </div>
              )}
            </div>

            <div className="mt-2">
              <button
                onClick={manualTokenRefresh}
                disabled={refreshingTokens}
                className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
              >
                {refreshingTokens ? "Refreshing..." : "Refresh Tokens"}
              </button>
            </div>
          </div>
        </div>

        {/* Identity Pool Credentials Box */}
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-700">
          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3">
            Identity Pool
          </h3>

          <div className="space-y-2 text-sm">
            <div>
              <strong>Status:</strong>
              <span
                className={`ml-1 font-medium ${
                  awsCredentials
                    ? awsCredentials.hasCredentials
                      ? "text-green-600"
                      : "text-red-600"
                    : "text-gray-500"
                }`}
              >
                {awsCredentials
                  ? awsCredentials.hasCredentials
                    ? "✅ Working"
                    : "❌ Failed"
                  : "⚠️ Not tested"}
              </span>
            </div>

            <div>
              <strong>Time until expires:</strong>
              <span className="ml-1 font-medium text-gray-600">
                Check raw data for expiry info
              </span>
            </div>

            <div className="mt-3">
              <strong>Raw Data:</strong>
              <pre className="mt-1 text-xs bg-white dark:bg-gray-800 p-2 rounded border overflow-auto max-h-32">
                {awsCredentials
                  ? JSON.stringify(
                      {
                        hasCredentials: awsCredentials.hasCredentials,
                        error: awsCredentials.error,
                        credentialsExpiry: awsCredentials.credentialsExpiry,
                        identityPoolId: awsCredentials.identityPoolId,
                      },
                      null,
                      2
                    )
                  : "No credentials tested yet"}
              </pre>
            </div>

            <div className="mt-2 space-x-1">
              <button
                onClick={testAwsCredentials}
                disabled={testingCredentials}
                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {testingCredentials ? "Testing..." : "Test Credentials"}
              </button>
              <button
                onClick={forceSessionRefresh}
                disabled={refreshingSession}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {refreshingSession ? "Refreshing..." : "Force Refresh"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Environment Variables - Simplified */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Configuration</h3>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div>
            NextAuth Duration:{" "}
            {process.env.NEXTAUTH_SESSION_DURATION || "30 days (default)"}
          </div>
          <div>
            Current URL:{" "}
            {typeof window !== "undefined" ? window.location.href : "SSR"}
          </div>
        </div>
      </div>
    </div>
  );
}
