"use client";

import React from "react";
import { Agent } from "@captify-io/core/components";
import { useCaptify } from "@captify-io/core/hooks";

export default function HomePage() {
  const { session } = useCaptify();

  if (!(session as any)?.user) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Captify</h1>
          <p className="text-muted-foreground">Please log in to continue</p>
        </div>
      </div>
    );
  }

  // Initial settings - can be customized based on user preferences or environment
  const initialSettings = {
    model: "gpt-4o",
    provider: "openai" as const,
    temperature: 0.7,
    maxTokens: 4000,
    systemPrompt:
      "You are a helpful AI assistant for the Captify platform. You can help users with questions about their projects, data analysis, strategic planning, and general business operations.",
  };

  return (
    <Agent
      className="h-full w-full"
      userState={{}}
      config={{}}
      initialSettings={initialSettings}
    />
  );
}
