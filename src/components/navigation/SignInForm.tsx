"use client";

import React from "react";
import { useState } from "../../lib/react-compat";
import { signIn } from "next-auth/react";


interface SignInFormProps {
  callbackUrl?: string;
  error?: string | null;
}

export default function SignInForm({
  callbackUrl = "/",
  error,
}: SignInFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);


  // Handle contact us - redirect to helpdesk module
  const handleContactUs = () => {
    // TODO: Integrate with core module helpdesk
    // For now, we'll use a placeholder action
    alert("Redirecting to helpdesk module...");
    // This should eventually navigate to: /core/helpdesk or similar
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      await signIn("cognito", {
        callbackUrl,
        redirect: true,
      });
    } catch (error) {
      console.error("Signin error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        ></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Main card */}
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-6">
            <h1
              className="text-3xl sm:text-4xl font-black text-white tracking-wide mb-2"
              style={{
                fontFamily: "Inter, system-ui, -apple-system, sans-serif",
              }}
            >
              Captify.io
            </h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-xl backdrop-blur-sm">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-red-400 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-200">
                  {error === "AccessDenied" &&
                    "Access denied. Please contact your administrator."}
                  {error === "Configuration" &&
                    "There is a problem with the server configuration."}
                  {error === "Verification" &&
                    "The verification token has expired or is invalid."}
                  {error &&
                    !["AccessDenied", "Configuration", "Verification"].includes(
                      error
                    ) &&
                    "An error occurred during authentication."}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Authorized Use Warning - Engraved style */}
            <div className="mb-4 p-4 bg-slate-900/80 border border-slate-600/30 rounded-lg shadow-inner">
              <div className="flex items-start">
                <svg
                  className="h-4 w-4 text-amber-500/70 mt-0.5 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <div>
                  <h3 className="text-xs font-semibold text-amber-300/80 mb-1">
                    Authorized Use Only
                  </h3>
                  <p className="text-xs text-slate-400/90 leading-relaxed">
                    U.S. Government system for authorized users only. No
                    expectation of privacy. By accessing this system, you
                    consent to monitoring and agree to these terms.
                  </p>
                </div>
              </div>
            </div>


            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isLoading}
                className="py-3 px-6 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25 focus:ring-blue-500"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    Connecting to Secure Portal...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    Secure Authentication
                  </div>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">
              Need assistance?{" "}
              <button
                onClick={handleContactUs}
                className="text-blue-400 hover:text-blue-300 underline transition-colors"
              >
                Contact Us
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
