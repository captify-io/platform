/**
 * Simple auth hook using NextAuth
 */

import { useSession } from "next-auth/react";

export interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();

  return {
    user: session?.user || null,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}
