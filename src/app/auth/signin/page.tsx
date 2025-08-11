"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useTheme } from "next-themes";
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
import { X, Save, Check } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useSavedEmail } from "@/hooks/useSavedEmail";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const { setTheme, theme } = useTheme();
  const {
    savedEmail,
    isLoading: emailLoading,
    saveEmail,
    clearEmail,
  } = useSavedEmail();

  // Set default theme to dark on first load
  useEffect(() => {
    if (!theme) {
      setTheme("dark");
    }
  }, [theme, setTheme]);

  // Set email from saved session when available
  useEffect(() => {
    if (savedEmail && !email) {
      setEmail(savedEmail);
    }
  }, [savedEmail, email]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSaveEmail = async () => {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      // First validate email through the API
      const validateResponse = await fetch("/api/auth/validate-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!validateResponse.ok) {
        const data = await validateResponse.json();
        setError(data.error || "Email validation failed.");
        return;
      }

      // Only save to session after successful validation
      const saved = await saveEmail(email);
      if (saved) {
        setIsEditing(false);
        setError("");
      } else {
        setError("Failed to save email. Please try again.");
      }
    } catch (error) {
      console.error("Email validation/save error:", error);
      setError("An error occurred. Please try again.");
    }
  };

  const handleForgetEmail = () => {
    clearEmail();
    setEmail("");
    setIsEditing(true);
  };

  const handleContinue = async () => {
    setIsLoading(true);
    setError("");

    // Get saved email from cookie or session
    let emailToUse = savedEmail || email;

    // If no email from hook, try to get from cookie directly
    if (!emailToUse) {
      const cookieEmail = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_email="))
        ?.split("=")[1];
      emailToUse = cookieEmail || "";
    }

    if (!emailToUse) {
      setError("No email found. Please save your email first.");
      setIsLoading(false);
      return;
    }

    if (!validateEmail(emailToUse)) {
      setError("Invalid email format.");
      setIsLoading(false);
      return;
    }

    try {
      // Use NextAuth signIn with login_hint parameter
      const result = await signIn("cognito", {
        callbackUrl: "/",
        redirect: false,
        login_hint: emailToUse,
      });

      if (result?.url) {
        // Redirect to the authorization URL
        console.log("Redirecting to:", result.url);
        window.location.href = result.url;
      } else if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        setError("Failed to initiate authentication");
        setIsLoading(false);
      }
    } catch (outerErr) {
      console.error("Outer sign in error:", outerErr);
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  if (emailLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {/* Theme Toggle in top-right corner */}
        <div className="fixed top-4 right-4 z-10">
          <ThemeToggle />
        </div>

        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading your session...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      {/* Theme Toggle in top-right corner */}
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to TITAN</CardTitle>
          <CardDescription>
            {savedEmail
              ? "Ready to continue with your saved email"
              : "Enter your email to continue - we'll remember it for next time"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              {savedEmail && !isEditing ? (
                // Display saved email with X to forget it
                <div className="flex items-center space-x-2">
                  <div className="flex-1 p-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md flex items-center justify-between">
                    <span className="text-sm text-green-800 dark:text-green-200">
                      {savedEmail}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleForgetEmail}
                        className="h-6 w-6 p-0 text-green-600 dark:text-green-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // Show input field for new email or editing
                <div className="flex items-center space-x-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveEmail}
                    className="h-10 w-10 p-0"
                    disabled={!email || !validateEmail(email)}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Continue button - only show if email is saved in session */}
            {savedEmail && !isEditing && (
              <Button
                onClick={handleContinue}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Validating..." : "Continue"}
              </Button>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>
              We&apos;ll redirect you to our secure login page to complete
              authentication.
            </p>
            {savedEmail && (
              <p className="text-xs text-green-600 dark:text-green-400">
                ✓ Your email will be remembered on this device for convenience.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
