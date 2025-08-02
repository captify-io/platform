"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      setIsLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      // Validate email (optional step)
      const response = await fetch("/api/auth/validate-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Email validation failed.");
        setIsLoading(false);
        return;
      }

      // Handle sign in with login_hint support using custom header (from old app pattern)
      try {
        // Create a custom request to NextAuth with login_hint in header
        const authUrl = "/api/auth/signin/cognito";
        const csrfResponse = await fetch("/api/auth/csrf");
        const csrfData = await csrfResponse.json();

        const response = await fetch(authUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Login-Hint": email, // Pass login_hint in custom header
          },
          body: new URLSearchParams({
            csrfToken: csrfData.csrfToken,
            callbackUrl: "/",
            json: "true",
          }).toString(),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.url) {
            window.location.href = data.url;
            return;
          }
        }

        // Fallback to regular NextAuth signIn
        await signIn("cognito", { callbackUrl: "/" });
      } catch (err) {
        console.error("Sign in error:", err);
        setError("Failed to initiate sign in. Please try again.");
        setIsLoading(false);
      }
    } catch (outerErr) {
      console.error("Outer sign in error:", outerErr);
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to TITAN</CardTitle>
          <CardDescription>Enter your email to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Validating..." : "Continue"}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600">
            <p>
              We&apos;ll redirect you to our secure login page to complete
              authentication.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
