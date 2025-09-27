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

// Export SessionProvider directly for manual setup
export { SessionProvider };

// Enhanced AuthProvider that handles everything
interface AuthProviderProps {
  children: ReactNode;
  appName: string;
  session?: Session | null;
}

export function AuthProvider({ children, appName, session }: AuthProviderProps) {
  return (
    <SessionProvider session={session}>
      <AuthWrapper appName={appName}>{children}</AuthWrapper>
    </SessionProvider>
  );
}

// Internal AuthWrapper component
function AuthWrapper({ children, appName }: { children: ReactNode; appName: string }) {
  const { session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <SignOnPage appName={appName} />;
  }

  return <>{children}</>;
}

// Legacy wrapper for backward compatibility
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