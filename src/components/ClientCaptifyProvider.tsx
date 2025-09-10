"use client";

import { ReactNode } from "react";
import {
  CaptifyProvider,
  FavoritesBar,
  SignInForm,
  TopNavigation,
} from "../components";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { Session } from "next-auth";

interface ClientCaptifyProviderProps {
  children: ReactNode;
  session: Session | null;
}

export function ClientCaptifyProvider({
  children,
  session,
}: ClientCaptifyProviderProps) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="captify-theme"
      >
        <CaptifyProvider session={session ?? undefined}>
          {session ? (
            <div className="h-full w-full bg-background flex flex-col">
              <TopNavigation session={session} />
              <FavoritesBar />
              <main className="flex-1 overflow-hidden">{children}</main>
            </div>
          ) : (
            <SignInForm />
          )}
        </CaptifyProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
