"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import AuthWrapper from "@/components/AuthWrapper";
import { ThemeProvider } from "next-themes";
import { AppsProvider } from "@/context/AppsContext";
import { NavigationProvider } from "@/context/NavigationContext";
import { NavigationLoadingProvider } from "@/context/NavigationLoadingContext";
import { LayoutProvider } from "@/context/LayoutContext";
import { ApplicationProvider } from "@/context/ApplicationContext";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { SmartBreadcrumb } from "@/components/navigation/SmartBreadcrumb";
import { MenuToggle } from "@/components/apps/MenuToggle";
import { TitanLoadingScreen } from "@/components/layout/TitanLoadingScreen";
import { usePathname } from "next/navigation";
import { useAutomaticBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useSession } from "next-auth/react";
import { useApplication } from "@/context/ApplicationContext";
import { useNavigationLoading } from "@/context/NavigationLoadingContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { applicationData } = useApplication();
  const { isLoading, message } = useNavigationLoading();

  // Check if we're on an authentication page or other pages that shouldn't show navigation
  const isAuthPage = pathname?.startsWith("/auth/");
  const isPublicPage = pathname === "/" || pathname?.startsWith("/public/");

  // Don't show navigation on auth pages, public pages, when not authenticated, or while loading
  const shouldShowNavigation =
    !isAuthPage && !isPublicPage && status === "authenticated" && session;

  // Set up automatic breadcrumbs based on current path and application (only when authenticated)
  useAutomaticBreadcrumbs(!!shouldShowNavigation);

  // Extract app ID from pathname for current application context (fallback)
  const appId = pathname?.split("/")[2] || "";

  // Use application data for current application, with fallback to extracted appId
  const currentApplication = applicationData
    ? {
        id: applicationData.id,
        name: applicationData.name,
      }
    : {
        id: appId,
        name: "Application",
      };

  // Show a minimal loading state while checking authentication (but not on auth pages)
  if (status === "loading" && !isAuthPage && !isPublicPage) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {shouldShowNavigation && (
        <>
          {/* Top Navigation */}
          <TopNavigation
            onSearchFocus={() => {}}
            onApplicationMenuClick={() => {}}
            currentApplication={currentApplication}
          />

          {/* Breadcrumb Navigation */}
          <div className="border-b border-border bg-background">
            <div className="py-1 pl-1 flex items-center gap-3">
              <MenuToggle />
              <SmartBreadcrumb />
            </div>
          </div>
        </>
      )}

      {/* Application Content */}
      <div
        className={shouldShowNavigation ? "flex-1 overflow-hidden" : "flex-1"}
      >
        {children}
      </div>
      
      {/* Navigation Loading Screen */}
      <TitanLoadingScreen isVisible={isLoading} message={message} />
    </div>
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AuthWrapper>
              <NavigationProvider>
                <NavigationLoadingProvider>
                  <LayoutProvider>
                    <ApplicationProvider>
                      <AppsProvider>
                        <LayoutContent>{children}</LayoutContent>
                      </AppsProvider>
                    </ApplicationProvider>
                  </LayoutProvider>
                </NavigationLoadingProvider>
              </NavigationProvider>
            </AuthWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
