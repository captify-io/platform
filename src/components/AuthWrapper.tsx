"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface AuthWrapperProps {
  children: React.ReactNode;
}

const publicRoutes = ["/auth/signin", "/auth/error"];

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") {
      // Still loading, don't redirect yet
      return;
    }

    const isPublicRoute = publicRoutes.includes(pathname);

    if (!session && !isPublicRoute) {
      // User is not authenticated and trying to access protected route
      router.push("/auth/signin");
      return;
    }

    if (session && isPublicRoute) {
      // User is authenticated but on a public route (like signin)
      router.push("/console");
      return;
    }
  }, [session, status, router, pathname]);

  // Show loading spinner while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-medium">
              <span className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]">
                AFSC
              </span>
              <span className="text-white ml-1">TITAN</span>
            </span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Checking authentication...</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
