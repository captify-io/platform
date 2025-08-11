/**
 * React hook for monitoring authentication token status
 */
import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface ExtendedSession {
  expiresAt?: number;
  user?: {
    email?: string;
  };
}

interface TokenStatus {
  status: "valid" | "expiring-soon" | "expired";
  expiresAt: number;
  timeUntilExpiry: number;
  message: string;
}

// Simple token status checker
function checkTokenStatus(expiresAt: number): TokenStatus {
  const now = Date.now();
  const timeUntilExpiry = expiresAt - now;

  if (timeUntilExpiry <= 0) {
    return {
      status: "expired",
      expiresAt,
      timeUntilExpiry,
      message: "Token has expired",
    };
  }

  if (timeUntilExpiry <= 5 * 60 * 1000) {
    // 5 minutes
    return {
      status: "expiring-soon",
      expiresAt,
      timeUntilExpiry,
      message: "Token expires soon",
    };
  }

  return {
    status: "valid",
    expiresAt,
    timeUntilExpiry,
    message: "Token is valid",
  };
}

export function useAuthMonitor(
  options: {
    showAlerts?: boolean;
    logToConsole?: boolean;
    checkInterval?: number;
    autoSignOut?: boolean;
    monitorIdentityPool?: boolean;
  } = {}
) {
  const { data: session } = useSession() as { data: ExtendedSession | null };
  const router = useRouter();
  const {
    logToConsole = false, // Disabled by default to reduce noise
    checkInterval = 60000, // Increased to 60 seconds to reduce frequency
    autoSignOut = true,
  } = options;

  // Check token status on mount and at intervals with minimal dependencies
  useEffect(() => {
    if (!session?.expiresAt) return;

    const performCheck = async () => {
      const tokenStatus = checkTokenStatus(session.expiresAt!);

      if (logToConsole) {
        console.log(`🔐 Token Status: ${tokenStatus.status}`);
      }

      // Handle expired tokens with auto sign out
      if (tokenStatus.status === "expired" && autoSignOut) {
        console.error("🚨 Token expired - signing out user");
        try {
          await signOut({
            callbackUrl: "/auth/signin",
            redirect: true,
          });
        } catch (error) {
          console.error("Error during sign out:", error);
          router.push("/auth/signin");
        }
      }
    };

    // Initial check
    performCheck();

    // Set up interval checking
    const interval = setInterval(performCheck, checkInterval);
    return () => clearInterval(interval);

    // Minimal stable dependencies to prevent infinite loops
  }, [session?.expiresAt, autoSignOut, logToConsole, checkInterval, router]);

  return {
    session,
  };
}
