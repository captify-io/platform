"use client";

import { ReactNode } from "react";
import {
  CaptifyProvider,
  FavoritesBar,
  SignInForm,
  TopNavigation,
} from "@captify/core/components";
import { SessionProvider } from "next-auth/react";
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
    </SessionProvider>
  );
}
