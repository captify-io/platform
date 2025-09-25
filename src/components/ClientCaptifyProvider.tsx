"use client";

import { ReactNode, useEffect } from "react";
import { CaptifyProvider, FavoritesBar, SignInForm, TopNavigation } from ".";
import { SessionProvider, useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { Session } from "next-auth";

interface ClientCaptifyProviderProps {
  children: ReactNode;
  session: Session | null;
}

function SessionMonitor({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Check for refresh errors in the session
    if (session && (session as any).error === "RefreshAccessTokenError") {
      console.log("🔄 Client detected token refresh error, signing out...");
      signOut({ redirect: false }).then(() => {
        window.location.href = "/signout";
      });
    }
  }, [session]);

  return <>{children}</>;
}

export function ClientCaptifyProvider({
  children,
  session,
}: ClientCaptifyProviderProps) {
  return (
    <SessionProvider session={session}>
      <SessionMonitor>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="captify-theme"
        >
          <CaptifyProvider session={session ?? undefined}>
            {session ? (
              <div className="h-full w-full bg-background flex flex-col">
                <TopNavigation session={session} />
                <FavoritesBar />
                <main className="flex-1 overflow-hidden">{children}</main>
              </div>
            ) : (
              <SignInForm />
            )}
          </CaptifyProvider>
        </ThemeProvider>
      </SessionMonitor>
    </SessionProvider>
  );
}
