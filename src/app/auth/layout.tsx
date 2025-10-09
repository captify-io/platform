"use client";

import { SessionProvider } from "next-auth/react";
import "../globals.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Separate layout for auth pages - no authentication checks
  // This prevents the infinite loop from the root layout's auth check
  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}
