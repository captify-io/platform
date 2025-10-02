"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

// Disable static generation for this page to prevent SSR issues
export const dynamic = "force-dynamic";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>("");
  const [errorDetails, setErrorDetails] = useState<any>({});

  useEffect(() => {
    const errorType = searchParams.get("error");
    const errorMessage = searchParams.get("error_description");
    const errorCode = searchParams.get("error_code");

    // Collect all search params for debugging
    const allParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      allParams[key] = value;
    });

    setError(errorType || "Unknown error");
    setErrorDetails({
      type: errorType,
      message: errorMessage,
      code: errorCode,
      allParams,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    });

  }, [searchParams]);

  // Redirect to signin with current URL as callback (always set up, but conditionally executed)
  useEffect(() => {
    // Only redirect if not showing configuration error in development
    if (error === "Configuration" && process.env.NODE_ENV === "development") {
      return; // Don't redirect for config errors in dev
    }

    const nextAuthUrl = process.env.NEXT_PUBLIC_NEXTAUTH_URL;
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '/';
    const callbackUrl = encodeURIComponent(currentUrl);

    const signinUrl = nextAuthUrl
      ? `${nextAuthUrl}/api/auth/signin?callbackUrl=${callbackUrl}`
      : `/api/auth/signin?callbackUrl=${callbackUrl}`;

    window.location.href = signinUrl;
  }, [error]);

  // Show detailed error info for Configuration error in development
  if (error === "Configuration" && process.env.NODE_ENV === "development") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-card border rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Authentication Configuration Error
          </h1>
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Error Details:</h2>
              <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                {JSON.stringify(errorDetails, null, 2)}
              </pre>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">Possible Causes:</h2>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>State cookie was missing or corrupted during OAuth callback</li>
                <li>Redirect URI mismatch between Cognito and NextAuth configuration</li>
                <li>CSRF token validation failure</li>
                <li>Session cookie configuration issues</li>
                <li>Browser blocking cookies in development (HTTP vs HTTPS)</li>
              </ul>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">Debug Steps:</h2>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Check browser developer tools for cookie issues</li>
                <li>Verify Cognito redirect URIs include: http://localhost:3000/api/auth/callback/cognito</li>
                <li>Clear browser cookies and try again</li>
                <li>Check server logs for detailed error information</li>
              </ol>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to Sign In...</h1>
        <p className="text-muted-foreground">Please wait while we redirect you to the authentication page.</p>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
