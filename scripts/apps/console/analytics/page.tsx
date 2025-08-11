"use client";

import { AppLayout } from "@/components/apps/AppLayout";
import { useAuth } from "@/hooks/useAuth";

export default function ConsoleAnalytics() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

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
      applicationName="Captify Console - Analytics"
      showChat={true}
      showMenu={true}
    >
      <div className="h-full p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              View detailed analytics and insights for your applications.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Usage Trends</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>API Calls</span>
                  <span className="font-mono">1,234</span>
                </div>
                <div className="flex justify-between">
                  <span>Chat Messages</span>
                  <span className="font-mono">567</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Users</span>
                  <span className="font-mono">89</span>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Performance</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Avg Response Time</span>
                  <span className="font-mono">245ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate</span>
                  <span className="font-mono">99.2%</span>
                </div>
                <div className="flex justify-between">
                  <span>Uptime</span>
                  <span className="font-mono">99.9%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
