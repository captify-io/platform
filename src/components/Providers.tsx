"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { CaptifyProvider, AppLayout } from "@captify/client";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider>
        <CaptifyProvider>
          <AppLayout
            applicationId="captify-platform"
            showMenu={true}
            showChat={true}
          >
            {children}
          </AppLayout>
        </CaptifyProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
