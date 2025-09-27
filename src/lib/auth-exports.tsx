import { SessionProvider, useSession as useNextAuthSession, signIn, signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { ReactNode, createElement } from "react";

// Extended session interface for Captify
export interface CaptifySession extends Session {
  accessToken?: string;
  idToken?: string;
  username?: string;
  groups?: string[];
  captifyStatus?: "approved" | "pending";
}

// Environment detection
const isEmbedded = typeof window !== "undefined" && window.parent !== window;

// Exportable useSession hook with Captify extensions
export function useSession() {
  const { data: session, status, update } = useNextAuthSession();

  return {
    session: session as CaptifySession | null,
    status,
    update,
    isAuthenticated: !!session,
    isLoading: status === "loading",
  };
}

// Exportable SignOnPage component
interface SignOnPageProps {
  appName: string;
  onSignIn?: (session: CaptifySession) => void;
  className?: string;
}

export function SignOnPage({ appName, onSignIn, className }: SignOnPageProps) {
  const { session, status } = useSession();

  // If already authenticated, call onSignIn callback
  if (session && onSignIn) {
    onSignIn(session);
    return null;
  }

  // If embedded in platform, request auth from parent
  if (isEmbedded) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${className || ''}`}>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">
            Please sign in through the platform to access {appName}.
          </p>
          <button
            onClick={() => {
              window.parent.postMessage({
                type: "CAPTIFY_AUTH_REQUEST",
                app: appName
              }, "*");
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Standalone mode - show sign in button
  return (
    <div className={`flex items-center justify-center min-h-screen ${className || ''}`}>
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Welcome to {appName}</h1>
        <p className="text-gray-600 mb-6">
          Sign in to access your account and continue.
        </p>
        {status === "loading" ? (
          <div className="text-center">Loading...</div>
        ) : (
          <button
            onClick={() => signIn("cognito", {
              callbackUrl: window.location.origin
            })}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Sign In with Captify
          </button>
        )}
      </div>
    </div>
  );
}

// Exportable auth functions
export const captifySignIn = async (appName?: string) => {
  if (isEmbedded) {
    window.parent.postMessage({
      type: "CAPTIFY_AUTH_REQUEST",
      app: appName
    }, "*");
    return;
  }

  return await signIn("cognito", {
    callbackUrl: window.location.origin,
  });
};

export const captifySignOut = async () => {
  if (isEmbedded) {
    window.parent.postMessage({
      type: "CAPTIFY_SIGNOUT_REQUEST"
    }, "*");
    return;
  }

  return await signOut({
    callbackUrl: window.location.origin
  });
};

// Exportable SessionProvider wrapper for external apps
interface CaptifyAuthProviderProps {
  children: ReactNode;
  session?: Session | null;
}

export function CaptifyAuthProvider({ children, session }: CaptifyAuthProviderProps) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}