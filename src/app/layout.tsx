"use client";

import React from "react";
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

  // Skip auth check for auth pages to prevent infinite loop
  if (isAuthPage) {
    return <>{children}</>;
  }

  // If no session or token refresh error, redirect to sign-in
  if (
    status === "unauthenticated" ||
    (!session?.user && status !== "loading") ||
    (session as any)?.error === "RefreshAccessTokenError"
  ) {
    if (typeof window !== "undefined") {
      // Clear storage and sign out properly
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.location.href = "/api/auth/signout?callbackUrl=/api/auth/signin";
    }
    return null;
  }

  // If loading, show nothing (brief flash only)
  if (status === "loading") {
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
