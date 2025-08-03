"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, LogOut } from "lucide-react";

export default function SignOutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    // If user is not authenticated, redirect to home or signin
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
  }, [status, router]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      // Clear any saved email from session storage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("titan-saved-email");
      }

      // Sign out using NextAuth
      await signOut({
        callbackUrl: "/auth/signin",
        redirect: true,
      });
    } catch (error) {
      console.error("Error during sign out:", error);
      setIsSigningOut(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <LogOut className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold">Sign Out</CardTitle>
          <CardDescription>
            Are you sure you want to sign out of TITAN?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {session?.user && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Signed in as:</div>
              <div className="font-medium text-gray-900">
                {session.user.name || session.user.email}
              </div>
              {session.user.email && session.user.name && (
                <div className="text-sm text-gray-600">
                  {session.user.email}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col space-y-3">
            <Button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isSigningOut ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing Out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSigningOut}
              className="w-full"
            >
              Cancel
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>You will be redirected to the sign-in page after signing out.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
