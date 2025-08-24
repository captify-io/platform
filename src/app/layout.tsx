"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider, useSession, signIn } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import {
  CaptifyProvider,
  useCaptify,
  FavoritesBar,
  TopNavigation,
  SmartBreadcrumb,
  LoadingScreen,
} from "@captify/core";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Dynamically import components that might cause SSR issues
const DynamicAuthenticatedLayout = dynamic(
  () => Promise.resolve(AuthenticatedLayout),
  { ssr: false }
);

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { currentApp, setSession, appData, isLoading, loadingMessage } =
    useCaptify();

  // Sync session to CaptifyContext
  useEffect(() => {
    if (session) {
      setSession(session);
    }
  }, [session, setSession]);

  // Memoize computed values to prevent unnecessary re-renders
  const isAuthPage = useMemo(
    () => pathname?.startsWith("/api/auth/"),
    [pathname]
  );
  const isPublicPage = useMemo(
    () => pathname === "/" || pathname?.startsWith("/public/"),
    [pathname]
  );
  const shouldShowNavigation = useMemo(
    () => status === "authenticated" && !!session,
    [status, session]
  );

  // Use CaptifyContext currentApp if available, otherwise fallback to appData
  const currentApplication = useMemo(() => {
    if (currentApp) {
      return {
        id: currentApp.id,
        name: currentApp.name,
      };
    }
    if (appData) {
      return {
        id: appData.appId,
        name: appData.name,
      };
    }
    // Extract app ID from pathname as final fallback
    const appId = pathname?.split("/")[2] || "";
    return {
      id: appId,
      name: "Application",
    };
  }, [currentApp, appData, pathname]);

  // Redirect to sign-in page if not authenticated and trying to access protected route
  useEffect(() => {
    if (status === "unauthenticated" && !isAuthPage && !isPublicPage) {
      signIn("cognito", { callbackUrl: pathname });
    }
  }, [status, isAuthPage, isPublicPage, pathname]);

  // Memoize the search focus handler
  const handleSearchFocus = useCallback(() => {
    // TODO: Implement search functionality
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background">
      {shouldShowNavigation && (
        <>
          {/* Top Navigation - Protected Area for Authenticated Users */}
          <TopNavigation
            onSearchFocus={handleSearchFocus}
            currentApplication={currentApplication}
            session={session}
          />

          {/* Favorites Bar */}
          <FavoritesBar currentApplication={currentApplication} />

          {/* Breadcrumb Navigation */}
          <div className="border-b border-border bg-background">
            <div className="py-1 pl-1 flex items-center gap-3">
              <SmartBreadcrumb />
            </div>
          </div>
        </>
      )}

      {/* Application Content */}
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>

      {/* Navigation Loading Screen */}
      <LoadingScreen isLoading={isLoading} message={loadingMessage} />
    </div>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  return <DynamicAuthenticatedLayout>{children}</DynamicAuthenticatedLayout>;
}

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <CaptifyProvider initialSession={session}>
      <LayoutContent>{children}</LayoutContent>
    </CaptifyProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthWrapper>{children}</AuthWrapper>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
