"use client";

import React, { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import {
  CaptifyProvider,
  CaptifyLayout,
  useCaptify,
} from "@captify-io/core/components";
import { config } from "../config";
import { usePathname } from "next/navigation";
import "./globals.css";

// Component that calls setPageReady when pathname changes (page navigation complete)
function PageReadyManager({ children }: { children: React.ReactNode }) {
  const { setPageReady } = useCaptify();
  const pathname = usePathname();

  useEffect(() => {
    // Page has rendered, close the loading screen
    setPageReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return <>{children}</>;
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  // Check if we're on an auth page (signin, signout, error, callback)
  const isAuthPage = typeof window !== "undefined" &&
    (window.location.pathname.startsWith("/auth/") ||
     window.location.pathname.startsWith("/api/auth/"));

  // If loading, show nothing (brief flash only)
  if (status === "loading") {
    return null;
  }

  // Skip auth check for auth pages to prevent infinite loop
  if (isAuthPage) {
    return <>{children}</>;
  }

  // If no session, session error, or expired tokens, redirect to sign-in
  if (
    status === "unauthenticated" ||
    !session?.user ||
    (session as any)?.error === "RefreshAccessTokenError"
  ) {
    if (typeof window !== "undefined") {
      // Clear storage on error
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.location.href = "/api/auth/signin";
    }
    return null;
  }

  // Render with CaptifyLayout
  return (
    <CaptifyProvider session={session}>
      <CaptifyLayout config={config} session={session}>
        <PageReadyManager>{children}</PageReadyManager>
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
