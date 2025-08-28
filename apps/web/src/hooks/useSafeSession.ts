"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import type { Session } from "next-auth";

interface SafeSessionReturn {
  data: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
  hasProvider: boolean;
}

export function useSafeSession(): SafeSessionReturn {
  const [hasProvider] = useState(true);

  // Always call useSession - React Hooks must be called in the same order
  const { data: session, status } = useSession();
  
  return {
    data: session,
    status,
    hasProvider,
  };
}
