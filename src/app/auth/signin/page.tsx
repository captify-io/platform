"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Shield, Lock } from "lucide-react";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleSignIn = () => {
    // Clear only NextAuth session cookies, preserve CSRF and callback URL cookies needed for OAuth flow
    document.cookie.split(";").forEach((cookie) => {
      const [name] = cookie.split("=");
      const cookieName = name.trim();

      // Only clear session token, not CSRF or callback URL cookies
      if (cookieName.includes('session-token')) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.captify.io`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });

    // Clear storage
    localStorage.clear();
    sessionStorage.clear();

    // Now initiate Cognito signin
    signIn("cognito", { callbackUrl, redirect: true });
  };

  const notices = [
    "All activities may be monitored and recorded",
    "Data transmitted or stored may be intercepted and inspected",
    "System usage logs and audit trails will be maintained",
    "Unauthorized access attempts will be investigated",
    "Data may be seized and disclosed to authorized personnel",
    "No expectation of privacy exists on this system",
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Subtle background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

      <div className="relative z-10 w-full max-w-xl mx-auto px-6">
        {/* Logo */}
        <div className="text-center mb-16">
          <h1 className="text-7xl md:text-8xl font-black tracking-tighter select-none text-slate-200" style={{
            letterSpacing: "-0.05em"
          }}>
            CAPTIFY.IO
          </h1>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl shadow-black/50">
          <div className="p-8">
            {/* Authorization Notice */}
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-4">
                <Shield className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-slate-300 font-semibold text-sm mb-1">AUTHORIZED USE ONLY</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    You are accessing a system provided for authorized use only. By using this system, you consent to the following:
                  </p>
                </div>
              </div>

              <div className="space-y-2 ml-8">
                {notices.map((notice, index) => (
                  <div key={index} className="flex items-start gap-2 text-slate-400">
                    <span className="text-slate-600 text-xs mt-0.5">•</span>
                    <span className="text-xs leading-relaxed">{notice}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sign In Button */}
            <button
              onClick={handleSignIn}
              className="w-full group relative px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-indigo-900/30 hover:shadow-xl hover:shadow-indigo-900/40"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Lock className="h-4 w-4" />
                Sign In
              </span>
            </button>

            {/* Footer Notice */}
            <p className="text-center text-slate-500 text-xs mt-5 leading-relaxed">
              By signing in, you acknowledge and agree to the conditions above
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
