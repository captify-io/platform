"use client";

import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SignOutPage() {
  const [isSigningOut, setIsSigningOut] = useState(true);

  useEffect(() => {
    // Sign out and clear all sessions
    const performSignOut = async () => {
      try {
        // Clear local/session storage
        if (typeof window !== "undefined") {
          window.localStorage.clear();
          window.sessionStorage.clear();
        }

        // Sign out from NextAuth (this will also call the cleanup endpoint)
        await signOut({
          redirect: false, // Don't redirect, show confirmation page
          callbackUrl: "/auth/signout"
        });

        setIsSigningOut(false);
      } catch (error) {
        console.error("Sign out error:", error);
        setIsSigningOut(false);
      }
    };

    performSignOut();
  }, []);

  if (isSigningOut) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Signing out...
          </h1>
          <p className="text-muted-foreground">
            Please wait while we securely sign you out.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          You&apos;ve been signed out
        </h1>
        <p className="text-muted-foreground mb-4">
          Thank you for using Captify Platform. You have been successfully
          signed out.
        </p>
        <Link
          href="/auth/signin"
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 inline-block"
        >
          Sign In Again
        </Link>
      </div>
    </div>
  );
}
