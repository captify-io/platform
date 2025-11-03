"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Shield, AlertCircle, Loader2 } from "lucide-react";
import { useAppAccess } from "../hooks/use-app-access";

interface AppAccessGuardProps {
  children: React.ReactNode;
}

/**
 * App Access Guard
 *
 * Uses the useAppAccess hook to check if user has access.
 * Simple logic: Read config.json, if visibility === 'public', show the app.
 */
export function AppAccessGuard({ children }: AppAccessGuardProps) {
  const router = useRouter();
  const { hasAccess, isLoading, appConfig, reason } = useAppAccess();

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-4 text-primary animate-spin" />
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  // If access denied, show error page
  if (!hasAccess) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          {reason === 'app_not_found' ? (
            <>
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-warning" />
              <h1 className="text-2xl font-bold mb-2">App Not Found</h1>
              <p className="text-muted-foreground mb-4">
                The application you're looking for doesn't exist.
              </p>
            </>
          ) : reason === 'no_membership' ? (
            <>
              <Shield className="h-16 w-16 mx-auto mb-4 text-warning" />
              <h1 className="text-2xl font-bold mb-2">Access Required</h1>
              <p className="text-muted-foreground mb-4">
                This app requires membership.
              </p>
              {appConfig && (
                <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                  <p className="font-medium">{appConfig.name}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <Shield className="h-16 w-16 mx-auto mb-4 text-destructive" />
              <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            </>
          )}

          <div className="mt-6">
            <button
              onClick={() => router.push('/core/home')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Access granted
  return <>{children}</>;
}
