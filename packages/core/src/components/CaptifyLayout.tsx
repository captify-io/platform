"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import SignInForm from "./navigation/SignInForm";
import { TopNavigation } from "./navigation/TopNavigation";
import { useCaptify } from "./CaptifyProvider";

function AuthWrapper({ children }: { children: ReactNode }) {
  const { session, isLoading } = useCaptify();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!session) {
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
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="captify-theme"
    >
      <AuthWrapper>{children}</AuthWrapper>
    </ThemeProvider>
  );
}
