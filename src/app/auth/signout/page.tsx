"use client";

import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function SignOutPage() {
  const [isSigningOut, setIsSigningOut] = useState(true);
  const [countdown, setCountdown] = useState(5);

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

  useEffect(() => {
    // Start countdown after signing out
    if (!isSigningOut) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            window.location.href = "/auth/signin";
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isSigningOut]);

  if (isSigningOut) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
        {/* Subtle background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-200 mb-2">
            Signing out...
          </h1>
          <p className="text-slate-400">
            Please wait while we securely sign you out.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Subtle background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

      <div className="relative z-10 w-full max-w-xl mx-auto px-6">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex flex-col items-center gap-3">
            {/* Subtle glow container */}
            <div className="relative">
              {/* Soft background glow */}
              <div className="absolute inset-0 blur-2xl opacity-20 bg-gradient-to-r from-indigo-400 via-indigo-500 to-indigo-400 scale-110" />

              {/* Main logo text */}
              <h1
                className="relative text-5xl md:text-6xl font-black tracking-tight select-none px-2"
                style={{
                  letterSpacing: "-0.03em",
                  background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 20%, #cbd5e1 40%, #94a3b8 70%, #64748b 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 2px 8px rgba(99, 102, 241, 0.15))"
                }}
              >
                CAPTIFY
              </h1>
            </div>

            {/* Subtle accent line */}
            <div className="flex items-center gap-2 w-full justify-center">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-indigo-500/40" />
              <div className="h-1 w-1 rounded-full bg-indigo-500/60" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-indigo-500/40" />
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl shadow-black/50">
          <div className="p-8 text-center">
            {/* Success Icon */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 blur-xl opacity-30 bg-green-500 scale-110" />
                <CheckCircle2 className="relative h-16 w-16 text-green-500" />
              </div>
            </div>

            {/* Success Message */}
            <h2 className="text-2xl font-bold text-slate-200 mb-2">
              Successfully Signed Out
            </h2>
            <p className="text-slate-400 mb-4 leading-relaxed">
              Thank you for using Captify Platform. All sessions have been securely terminated.
            </p>

            {/* Countdown */}
            <p className="text-slate-500 text-sm">
              Redirecting to sign in page in <span className="text-indigo-400 font-semibold">{countdown}</span> seconds...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
