"use client";

import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { LogIn, CheckCircle } from "lucide-react";

export default function SignOutPage() {
  const router = useRouter();

  const handleSignIn = () => {
    // Redirect to NextAuth signin page which will handle Cognito
    window.location.href = "/api/auth/signin";
  };

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