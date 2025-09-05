"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { SignInForm } from "@captify/core/components";

// Disable static generation for this page to prevent SSR issues
export const dynamic = 'force-dynamic';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const errorType = searchParams.get("error");
    setError(errorType || "Unknown error");
  }, [searchParams]);

  return <SignInForm error={error} callbackUrl="/" />;
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
