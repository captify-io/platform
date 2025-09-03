"use client";

import type { ReactNode } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import SignInForm from "./navigation/SignInForm";
import { TopNavigation } from "./navigation/TopNavigation";

function AuthWrapper({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <SignInForm callbackUrl="/" />;
  }

  console.log("🔄 AuthWrapper rendering TopNavigation:", {
    timestamp: new Date().toISOString(),
    hasSession: !!session,
    userId: session?.user?.id,
    pathname: typeof window !== "undefined" ? window.location.pathname : "SSR",
  });

  return (
    <>
      <TopNavigation session={session} />
      {children}
    </>
  );
}

export function CaptifyProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="captify-theme"
      >
        <AuthWrapper>{children}</AuthWrapper>
      </ThemeProvider>
    </SessionProvider>
  );
}
