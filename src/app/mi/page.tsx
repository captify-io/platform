"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function MIPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [welcomeMessage, setWelcomeMessage] = useState<string>("");

  useEffect(() => {
    if (user) {
      setWelcomeMessage(
        `Welcome to Material Insights! I'm here to help you with fleet readiness analysis and risk assessment.`
      );
    }
  }, [user]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">
            Welcome to Material Insights
          </h2>
          <p className="text-muted-foreground">Please sign in to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Material Insights</h1>
        <p className="text-muted-foreground">
          Advanced fleet readiness and risk analysis platform. Navigate using
          the menu or start a conversation using the chat panel.
        </p>
        {welcomeMessage && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">{welcomeMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
