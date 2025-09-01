"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import { CaptifyProvider, useCaptify } from "../context/CaptifyContext";
import { TopNavigation } from "./navigation/TopNavigation";
import { SmartBreadcrumb } from "./navigation/SmartBreadcrumb";
import { SignInForm } from "./SignInForm";
import { ApplicationLauncher } from "./ApplicationLauncher";

interface CaptifyLayoutProps {
  children: React.ReactNode;
}

function AuthenticatedLayoutInner({ children }: { children: React.ReactNode }) {
  const { session, sessionStatus, isAuthenticated } = useCaptify();
  const pathname = usePathname();

  // Define public pages that don't require authentication
  const publicPages = ["/auth/signout", "/auth/error", "/api/auth/signin"];
  const isPublicPage = pathname ? publicPages.includes(pathname) : false;

  // For public pages, render without authentication check
  if (isPublicPage) {
    console.log("📄 Rendering public page:", pathname);
    return <>{children}</>;
  }

  // Show loading while session is being determined
  if (sessionStatus === "loading") {
    console.log("⏳ Session loading...");
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is unauthenticated, show the signin form
  if (sessionStatus === "unauthenticated" || !isAuthenticated) {
    console.log("🔒 User not authenticated, showing signin form");
    return <SignInForm callbackUrl={pathname} />;
  }

  // User is authenticated, show the full app with navigation
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopNavigation applicationLauncher={<ApplicationLauncher />} />
      <SmartBreadcrumb />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

export function CaptifyLayout({ children }: CaptifyLayoutProps) {
  return (
    <div suppressHydrationWarning>
      <CaptifyProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="captify-theme"
        >
          <AuthenticatedLayoutInner>{children}</AuthenticatedLayoutInner>
        </ThemeProvider>
      </CaptifyProvider>
    </div>
  );
}
