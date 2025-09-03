"use client";
import { SessionProvider, useSession } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { CaptifyProvider } from "@captify/core/context";
import { useEffect, useState } from "react";
import { SignInForm } from "../components/SignInForm";
import "./globals.css";

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <SignInForm callbackUrl="/" />;
  }

  return <>{children}</>;
}

function ClientProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render without ThemeProvider during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <SessionProvider>
        <AuthWrapper>
          <CaptifyProvider>{children}</CaptifyProvider>
        </AuthWrapper>
      </SessionProvider>
    );
  }

  // After component has mounted on client, render with full theme provider
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthWrapper>
          <CaptifyProvider>{children}</CaptifyProvider>
        </AuthWrapper>
      </ThemeProvider>
    </SessionProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Captify</title>
      </head>
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
