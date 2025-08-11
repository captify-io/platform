"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/apps/AppLayout";

export default function ConsolePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [welcomeMessage, setWelcomeMessage] = useState<string>("");

  useEffect(() => {
    if (user) {
      setWelcomeMessage(
        `Hello ${
          user.name || user.email || "there"
        }! I'm Captify, your AI assistant. How can I help you today?`
      );
    }
  }, [user]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show authentication prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Welcome to Captify Console</h2>
          <p className="text-muted-foreground">Please sign in to continue</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout
      applicationId="console"
      applicationName="Captify Console"
      showChat={true}
      showMenu={true}
    >
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Captify Console</h1>
          <p className="text-muted-foreground">
            Your AI-powered workspace is ready. Navigate using the menu or start
            a conversation using the chat panel.
          </p>
          {welcomeMessage && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">{welcomeMessage}</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
