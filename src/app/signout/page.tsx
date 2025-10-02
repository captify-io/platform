"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@captify-io/core/components/ui";
import { LogIn, CheckCircle, Loader2 } from "lucide-react";

export default function SignOutPage() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(true);

  // Automatically sign out when the page loads
  useEffect(() => {
    const performSignOut = async () => {
      try {
        await signOut({
          redirect: false,
          callbackUrl: "/signout"
        });
        setIsSigningOut(false);
      } catch (error) {
        setIsSigningOut(false);
      }
    };

    performSignOut();
  }, []);

  const handleSignIn = () => {
    // Redirect to NextAuth signin page which will handle Cognito
    window.location.href = "/api/auth/signin";
  };

  // Show loading state while signing out
  if (isSigningOut) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-8">
          <div className="text-center">
            <div className="mb-6">
              <Loader2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-spin" />
              <h1 className="text-3xl font-bold mb-2">
                Signing you out...
              </h1>
              <p className="text-muted-foreground">
                Please wait while we securely sign you out of all services.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">
              You've been signed out
            </h1>
            <p className="text-muted-foreground">
              You have been successfully signed out of your account and all associated services.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              variant="default"
              onClick={handleSignIn}
              className="w-full"
              size="lg"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In Again
            </Button>

            <p className="text-sm text-muted-foreground">
              Thank you for using the Captify platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}