"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";

export function AutoSignIn() {
  useEffect(() => {
    // Automatically redirect to Cognito signin
    signIn("cognito", {
      callbackUrl: "/",
      redirect: true
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
        <p className="text-white text-lg">Redirecting to secure login...</p>
      </div>
    </div>
  );
}