"use client";

import React from "react";
import { Agent } from "../components/agent/agent";
import { useCaptify } from "../components/providers/CaptifyProvider";

export default function HomePage() {
  const { session } = useCaptify();
  
  // Create userState from session - match the UserState interface completely
  const userState = session?.user ? {
    id: `user_${Date.now()}`,
    slug: 'user',
    tenantId: 'default',
    name: session.user.name || 'User',
    app: 'core',
    order: '0',
    fields: {},
    description: 'Agent user',
    ownerId: session.user.id || 'system',
    createdAt: new Date().toISOString(),
    createdBy: session.user.id || 'system',
    updatedAt: new Date().toISOString(),
    updatedBy: session.user.id || 'system',
    // UserState-specific properties
    userId: session.user.id || session.user.email || 'anonymous',
    favoriteApps: [] as string[],
    recentApps: [] as string[],
    preferences: {
      theme: 'system' as const,
      favoriteApps: [] as string[],
      recentApps: [] as string[],
      notifications: {
        email: true,
        inApp: true,
      },
    },
  } : undefined;

  // Initial settings - can be customized based on user preferences or environment
  const initialSettings = {
    model: 'gpt-4o',
    provider: 'openai' as const,
    temperature: 0.7,
    maxTokens: 4000,
    systemPrompt: 'You are a helpful AI assistant for the Captify platform. You can help users with questions about their projects, data analysis, strategic planning, and general business operations.',
  };

  return (
    <div className="h-screen w-full bg-background">
      <Agent 
        userState={userState} 
        initialSettings={initialSettings}
        className="h-full"
      />
    </div>
  );
}