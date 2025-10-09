"use client";

import React, { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import "./globals.css";
import { config } from "@/config";
import type { CaptifyLayoutConfig } from "@captify-io/core/components";

/**
 * Generate hash-to-route mapping from menu configuration
 * This ensures routes are automatically synced with menu changes
 */
function generateHashToRouteMap(config: CaptifyLayoutConfig): Record<string, string> {
  const hashMap: Record<string, string> = {
    'captify-home': '/captify',
  };

  function processMenuItem(item: any) {
    if (item.id && item.href) {
      hashMap[item.id] = item.href;
    }
    if (item.children) {
      item.children.forEach(processMenuItem);
    }
  }

  config.menu?.forEach(processMenuItem);
  return hashMap;
}

interface CaptifyPageLayoutProps {
  children: React.ReactNode;
  params?: Promise<{}>;
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Check if we're on an auth page (signin, signout, error, callback)
  const isAuthPage = typeof window !== "undefined" &&
    (window.location.pathname.startsWith("/auth/") ||
     window.location.pathname.startsWith("/api/auth/"));

  // Backward compatibility: Redirect hash URLs to proper routes
  useEffect(() => {
    if (typeof window === "undefined" || isAuthPage) return;

    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      // Remove the # and convert hash pattern to route
      const hashValue = hash.substring(1);

      // Generate hash-to-route mapping from menu configuration
      // This automatically stays in sync with menu changes in config.ts
      const hashToRoute = generateHashToRouteMap(config);

      const route = hashToRoute[hashValue];
      if (route) {
        // Clear the hash and navigate to the proper route
        window.history.replaceState(null, '', window.location.pathname);
        router.push(route);
      }
    }
  }, [router, isAuthPage]);

  // Redirect to default page if on root captify path without hash
  useEffect(() => {
    if (typeof window === "undefined" || isAuthPage) return;

    // If we're at /captify with no hash and no specific page, redirect to default
    if (pathname === '/captify' && !window.location.hash) {
      router.push('/captify/insights');
    }
  }, [pathname, router, isAuthPage]);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.querySelector('[data-sidebar="sidebar"]');
      const trigger = document.querySelector('[data-sidebar="trigger"]');
      const target = event.target as Node;

      // Check if sidebar is open (not collapsed)
      const isOpen = sidebar?.getAttribute('data-state') !== 'collapsed';

      if (isOpen && sidebar && !sidebar.contains(target) && trigger && !trigger.contains(target)) {
        // Click was outside sidebar and trigger button - close it
        const toggleButton = trigger as HTMLElement;
        toggleButton?.click();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // If loading, show nothing (brief flash only)
  if (status === "loading") {
    return null;
  }

  // Skip auth check for auth pages to prevent infinite loop
  if (isAuthPage) {
    return <>{children}</>;
  }

  // If no session, session error, or expired tokens, redirect to sign-in (check BEFORE capturing session)
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

  // Render children - the captify layout will be added by /captify/layout.tsx
  return <>{children}</>;
}

export default function CaptifyPageLayout({
  children,
  params,
}: CaptifyPageLayoutProps) {
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
