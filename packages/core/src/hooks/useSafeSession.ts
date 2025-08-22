"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import type { Session } from "next-auth";

interface SafeSessionReturn {
  data: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
  hasProvider: boolean;
}

export function useSafeSession(): SafeSessionReturn {
  const [hasProvider, setHasProvider] = useState(true);

  try {
    const { data: session, status } = useSession();
    return {
      data: session,
      status,
      hasProvider: true,
    };
  } catch (error) {
    // No SessionProvider available
    return {
      data: null,
      status: "unauthenticated",
      hasProvider: false,
    };
  }
}
