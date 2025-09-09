"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { SignInForm } from "@captify-io/core/components";

function AuthWrapper({ children }: { children: ReactNode }) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <SignInForm callbackUrl="/" />;
  }

  return <>{children}</>;
}

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="captify-theme"
      >
        <AuthWrapper>{children}</AuthWrapper>
      </ThemeProvider>
    </SessionProvider>
  );
}
