"use client";

import React, { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import {
  CaptifyProvider,
  CaptifyLayout,
} from "@captify-io/core";
import { config } from "../config";
import { AppAccessGuard } from "../components/app-access-guard";
import "./globals.css";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  // Check if we're on an auth page (signin, signout, error, callback)
  const isAuthPage = typeof window !== "undefined" &&
    (window.location.pathname.startsWith("/auth/") ||
     window.location.pathname.startsWith("/api/auth/"));

  // Handle redirect to sign-in only when session status changes
  // This prevents page reload on every render (e.g., when switching browser tabs)
  useEffect(() => {
    // Skip auth check for auth pages to prevent infinite loop
    if (isAuthPage) {
      return;
    }

    // If no session, session error, or expired tokens, redirect to sign-in
    if (
      status === "unauthenticated" ||
      (!session?.user && status !== "loading") ||
      (session as any)?.error === "RefreshAccessTokenError"
    ) {
      // Clear storage on error
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.location.href = "/api/auth/signin";
    }
  }, [status, session, isAuthPage]);

  // If loading, show nothing (brief flash only)
  if (status === "loading") {
    return null;
  }

  // Skip auth check for auth pages to prevent infinite loop
  if (isAuthPage) {
    return <>{children}</>;
  }

  // If no session, show nothing while redirecting
  if (status === "unauthenticated" || !session?.user) {
    return null;
  }

  // Render with CaptifyLayout and App Access Guard
  return (
    <CaptifyProvider session={session}>
      <CaptifyLayout config={config} session={session}>
        <AppAccessGuard>
          {children}
        </AppAccessGuard>
      </CaptifyLayout>
    </CaptifyProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="h-full m-0 p-0">
        <SessionProvider
          refetchInterval={0}
          refetchOnWindowFocus={false}
          refetchWhenOffline={false}
        >
          <LayoutContent>{children}</LayoutContent>
        </SessionProvider>
      </body>
    </html>
  );
}

// Force dynamic rendering for authentication
export const dynamic = "force-dynamic";
