"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { CaptifyProvider } from "../context/CaptifyContext";
import { TopNavigation } from "./navigation/TopNavigation";
import { SmartBreadcrumb } from "./navigation/SmartBreadcrumb";
import { SignInForm } from "./SignInForm";
import NoSSR from "./NoSSR";

interface CaptifyLayoutProps {
  children: React.ReactNode;
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Define public pages that don't require authentication
  const publicPages = ["/auth/signout", "/auth/error", "/api/auth/signin"];
  const isPublicPage = pathname ? publicPages.includes(pathname) : false;

  // For public pages, render without authentication check
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is unauthenticated, show the signin page content directly (no redirect)
  if (status === "unauthenticated") {
    return <SignInForm callbackUrl={pathname} />;
  }

  // User is authenticated, show the full app with navigation
  return (
    <CaptifyProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <TopNavigation />
        <SmartBreadcrumb />
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </CaptifyProvider>
  );
}

export function CaptifyLayout({ children }: CaptifyLayoutProps) {
  return (
    <div suppressHydrationWarning>
      <SessionProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="captify-theme"
        >
          <NoSSR>
            <AuthenticatedLayout>{children}</AuthenticatedLayout>
          </NoSSR>
        </ThemeProvider>
      </SessionProvider>
    </div>
  );
}
