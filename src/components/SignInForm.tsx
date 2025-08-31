"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";

// Email validation constants (moved outside component to avoid re-creation)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const APPROVED_DOMAINS = [
  ".com",
  ".mil",
  ".gov",
  ".ai",
  ".net",
  ".org",
  ".us",
];

interface SignInFormProps {
  callbackUrl?: string;
  error?: string | null;
}

export function SignInForm({ callbackUrl = "/", error }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [emailSaved, setEmailSaved] = useState(false);

  // Check if email has approved domain extension
  const hasApprovedDomain = useCallback((email: string): boolean => {
    return APPROVED_DOMAINS.some((domain) =>
      email.toLowerCase().endsWith(domain)
    );
  }, []);

  // Comprehensive email validation
  const isEmailValid = useCallback((email: string): boolean => {
    return EMAIL_REGEX.test(email) && hasApprovedDomain(email);
  }, [hasApprovedDomain]);

  // Load email from cookie on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = getCookie("cognito_login_hint");
      if (savedEmail) {
        const decodedEmail = decodeURIComponent(savedEmail);
        setEmail(decodedEmail);
        const isValid = isEmailValid(decodedEmail);
        setEmailValid(isValid);
        setEmailSaved(isValid); // Only mark as saved if still valid
      }
    }
  }, [isEmailValid]);

  // Helper function to get cookie value
  function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
  }

  // Helper function to set cookie
  function setCookie(name: string, value: string, maxAge: number = 300) {
    if (typeof document !== "undefined") {
      document.cookie = `${name}=${encodeURIComponent(
        value
      )}; path=/; max-age=${maxAge}; secure; samesite=strict`;
    }
  }

  // Helper function to delete cookie
  function deleteCookie(name: string) {
    if (typeof document !== "undefined") {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  }

  // Handle email input change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    if (newEmail.trim() === "") {
      setEmailValid(null);
      setEmailSaved(false);
      deleteCookie("cognito_login_hint");
    } else {
      const isValid = isEmailValid(newEmail);
      setEmailValid(isValid);

      if (isValid) {
        // Automatically save valid email to cookie
        setCookie("cognito_login_hint", newEmail);
        setEmailSaved(true);
      } else {
        setEmailSaved(false);
        deleteCookie("cognito_login_hint");
      }
    }
  };

  // Handle clearing email
  const handleClearEmail = () => {
    setEmail("");
    setEmailValid(null);
    setEmailSaved(false);
    deleteCookie("cognito_login_hint");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailSaved || !acknowledged) {
      if (!emailSaved) {
        alert("Please validate your email address first");
      }
      return;
    }

    setIsLoading(true);

    try {
      // Email is already saved in cookie, proceed with Cognito signin
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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Captify Platform Access
          </h1>
          <p className="text-sm text-muted-foreground">
            Secure Government Environment
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">
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
        )}

        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0"
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
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Controlled Government Environment
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                You are accessing a U.S. Government information system. This
                system is for authorized use only. Users have no reasonable
                expectation of privacy regarding any communication or data
                transiting or stored on this information system.
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                By accessing this system, you acknowledge that you understand
                and consent to these terms.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your government email address"
                className="w-full px-3 py-2 pr-20 border border-input bg-background rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                required
                disabled={isLoading}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                {email && (
                  <>
                    {emailSaved ? (
                      <button
                        type="button"
                        onClick={handleClearEmail}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        title="Clear email"
                      >
                        <svg
                          className="h-4 w-4 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    ) : emailValid ? (
                      <svg
                        className="h-4 w-4 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : emailValid === false ? (
                      <svg
                        className="h-4 w-4 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    ) : null}
                  </>
                )}
              </div>
            </div>
            {emailSaved && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                ✓ Email validated and saved
              </p>
            )}
            {emailValid === false && email && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Please enter a valid email with an approved domain (.com, .mil,
                .gov, .ai, .net, .org, .us)
              </p>
            )}
          </div>

          <div className="flex items-start">
            <input
              id="acknowledge"
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 mr-3 h-4 w-4 text-primary focus:ring-primary border-input rounded"
              required
              disabled={isLoading}
            />
            <label htmlFor="acknowledge" className="text-sm text-foreground">
              I acknowledge that I am accessing a controlled government
              environment and agree to the terms stated above.
            </label>
          </div>

          <button
            type="submit"
            disabled={!emailSaved || !acknowledged || isLoading}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                Connecting to Secure Portal...
              </div>
            ) : (
              "Proceed to Secure Authentication"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Need help? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
